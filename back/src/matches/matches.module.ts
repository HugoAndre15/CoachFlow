//remplir module
import { OfflineController } from './offline.controller';
import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController, OfflineController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}