import api from "./api";
import type { PlayerStatsPeriod } from "./playerService";

export interface DashboardMatch {
  id: string;
  opponent: string;
  date: string;
  location: "HOME" | "AWAY";
  status: "UPCOMING" | "LIVE" | "FINISHED";
  scored: number;
  conceded: number;
  result: "WIN" | "DRAW" | "LOSS";
  attendance: {
    present: number;
    absent: number;
    uncertain: number;
    unknown: number;
  };
}
export interface DashboardLeader {
  id: string;
  name: string;
  number: number | null;
  archived: boolean;
  value: number;
}
export interface TeamDashboardData {
  meta: {
    team_id: string;
    period: PlayerStatsPeriod;
    from: string | null;
    to: string;
  };
  totals: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
    assists: number;
  };
  attendance: DashboardMatch["attendance"] & {
    recorded: number;
    rate: number | null;
  };
  roster: {
    total: number;
    available: number;
    injured: number;
    suspended: number;
  };
  scorers: DashboardLeader[];
  assisters: DashboardLeader[];
  recent: DashboardMatch[];
  live: DashboardMatch | null;
  next: DashboardMatch | null;
  overdue: number;
}

export const dashboardService = {
  async getTeamDashboard(
    teamId: string,
    period: PlayerStatsPeriod,
  ): Promise<TeamDashboardData> {
    const response = await api.get<TeamDashboardData>(
      `/teams/${teamId}/dashboard`,
      { params: { period }, timeout: 15000 },
    );
    return response.data;
  },
};
