import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { plainToInstance } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  Length,
  validateOrReject,
} from 'class-validator';
import { Prisma } from '@prisma/client';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddPlayersToMatchDto } from './dto/add-players-to-match.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { CreateOpponentEventDto } from './dto/create-opponent-event.dto';

class SyncDto {
  @IsUUID() batchId: string;
  @IsString() @Length(64, 64) version: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) commands: unknown[];
}
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function validated<T extends object>(
  type: new () => T,
  value: unknown,
): Promise<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BadRequestException('Action invalide.');
  const dto = plainToInstance(type, value);
  try {
    await validateOrReject(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  } catch {
    throw new BadRequestException(
      'Les données de cette action sont invalides.',
    );
  }
  return dto;
}

@Controller('matches/:id/offline')
@UseGuards(JwtAuthGuard)
export class OfflineController {
  constructor(private readonly matches: MatchesService) {}

  private async snapshot(tx: Prisma.TransactionClient, id: string) {
    const match = await tx.match.findUniqueOrThrow({
      where: { id },
      include: {
        matchPlayers: { orderBy: { id: 'asc' } },
        matchEvents: { orderBy: [{ created_at: 'asc' }, { id: 'asc' }] },
        opponentEvents: { orderBy: [{ created_at: 'asc' }, { id: 'asc' }] },
      },
    });
    const players = await tx.player.findMany({
      where: {
        team_id: match.team_id,
        OR: [
          { status: { not: 'RETIRED' } },
          { id: { in: match.matchPlayers.map((p) => p.player_id) } },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        jersey_number: true,
        position: true,
        status: true,
      },
      orderBy: [{ last_name: 'asc' }, { id: 'asc' }],
    });
    const team = await tx.team.findUniqueOrThrow({
      where: { id: match.team_id },
      select: { name: true },
    });
    return {
      version: hash(match),
      match: {
        id: match.id,
        team_id: match.team_id,
        team_name: team.name,
        opponent: match.opponent,
        match_date: match.match_date,
        location: match.location,
        status: match.status,
      },
      // Never copy medical status, contact details or the full player profile to the device.
      players: players.map(({ status, ...player }) => ({
        ...player,
        eligible: status === 'ACTIVE',
      })),
      sheet: match.matchPlayers.map((p) => ({
        player_id: p.player_id,
        presence: p.presence,
        status: p.status,
      })),
      events: match.matchEvents.map((e) => ({
        id: e.id,
        player_id: e.player_id,
        event_type: e.event_type,
        minute: e.minute,
        zone: e.zone,
        body_part: e.body_part,
        related_event_id: e.related_event_id,
        related_player_id: e.related_player_id,
      })),
      opponents: match.opponentEvents.map((e) => ({
        id: e.id,
        event_type: e.event_type,
        minute: e.minute,
        jersey_number: e.jersey_number,
      })),
    };
  }

  @Get()
  prepare(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.matches.withLock(id, async (service, tx) => {
      await service.assertOfflineAccess(id, user.id);
      return this.snapshot(tx, id);
    });
  }

  @Post('sync')
  sync(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() body: SyncDto,
  ) {
    return this.matches.withLock(id, async (service, tx) => {
      await service.assertOfflineAccess(id, user.id);
      const requestHash = hash(body);
      const receipt = await tx.offlineReceipt.findUnique({
        where: { id: body.batchId },
      });
      if (receipt) {
        if (
          receipt.match_id !== id ||
          receipt.user_id !== user.id ||
          receipt.request_hash !== requestHash
        )
          throw new ConflictException('Identifiant d’envoi déjà utilisé.');
        const current = await this.snapshot(tx, id);
        if (
          (receipt.result as { version?: string }).version !== current.version
        )
          throw new ConflictException(
            'Votre envoi est enregistré mais le match a changé depuis. Exportez vos actions restantes avant de résoudre le conflit.',
          );
        return {
          ...current,
          idMap:
            (receipt.result as { idMap?: Record<string, string> }).idMap ?? {},
        };
      }
      const before = await this.snapshot(tx, id);
      if (before.version !== body.version)
        throw new ConflictException(
          'Ce match a été modifié ailleurs. Vos actions restent sur cet appareil. Aucun changement n’a été écrasé.',
        );
      const ids = new Map<string, string>();
      let sequence = 0;
      const recordedAt = Date.now();
      const commandIds = new Set<string>();
      for (const raw of body.commands) {
        if (!raw || typeof raw !== 'object')
          throw new BadRequestException('Action invalide.');
        const command = raw as {
          kind: string;
          id: string;
          data: Record<string, unknown>;
        };
        if (!/^[0-9a-f-]{36}$/i.test(command.id) || commandIds.has(command.id))
          throw new BadRequestException('Identifiant d’action invalide.');
        commandIds.add(command.id);
        if (command.kind === 'sheet') {
          await service.addPlayersToMatch(
            id,
            await validated(AddPlayersToMatchDto, command.data),
            user.id,
          );
        } else if (command.kind === 'status') {
          await service.updateStatus(
            id,
            user.id,
            await validated(UpdateMatchStatusDto, command.data),
          );
        } else if (command.kind === 'event') {
          const data = await validated(CreateMatchEventDto, command.data);
          if (data.related_event_id)
            data.related_event_id =
              ids.get(data.related_event_id) ?? data.related_event_id;
          const state = await tx.match.findUniqueOrThrow({ where: { id } });
          if (state.status !== 'LIVE')
            throw new BadRequestException(
              'Les actions doivent être saisies pendant le match.',
            );
          const result = await service.addEventToMatch(id, data, user.id);
          const eventId = 'event' in result ? result.event.id : result.id;
          await tx.matchEvent.update({
            where: { id: eventId },
            data: { created_at: new Date(recordedAt + sequence++) },
          });
          ids.set(command.id, eventId);
        } else if (command.kind === 'opponent') {
          const state = await tx.match.findUniqueOrThrow({ where: { id } });
          if (state.status !== 'LIVE')
            throw new BadRequestException('Le match doit être en cours.');
          const result = await service.addOpponentEvent(
            id,
            await validated(CreateOpponentEventDto, command.data),
            user.id,
          );
          ids.set(command.id, result.id);
        } else if (
          command.kind === 'deleteEvent' ||
          command.kind === 'deleteOpponent'
        ) {
          const target = String(command.data?.id ?? '');
          if (command.kind === 'deleteEvent')
            await service.removeMatchEvent(
              id,
              ids.get(target) ?? target,
              user.id,
            );
          else
            await service.removeOpponentEvent(
              id,
              ids.get(target) ?? target,
              user.id,
            );
        } else throw new BadRequestException('Action inconnue.');
      }
      const result = await this.snapshot(tx, id);
      await tx.offlineReceipt.create({
        data: {
          id: body.batchId,
          match_id: id,
          user_id: user.id,
          request_hash: requestHash,
          result: { version: result.version, idMap: Object.fromEntries(ids) },
        },
      });
      return { ...result, idMap: Object.fromEntries(ids) };
    });
  }
}

