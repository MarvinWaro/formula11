import type { TournamentCategoryFormatValue } from './tournaments';

export type ScoringTeam = {
    id: string;
    display_name: string;
    pool_seed: number | null;
};

export type ScoringMatchSide = {
    id: string;
    display_name: string;
};

export type ScoringMatch = {
    id: string;
    sequence: number;
    stage: 'pool' | 'semi' | 'bronze' | 'final';
    team_a: ScoringMatchSide | null;
    team_b: ScoringMatchSide | null;
    score_a: number | null;
    score_b: number | null;
    winner_team_id: string | null;
    played_at: string | null;
};

export type ScoringStanding = {
    team_id: string;
    display_name: string;
    wins: number;
    losses: number;
    played: number;
    points_for: number;
    points_against: number;
    point_diff: number;
    rank: number;
};

export type ScoringPool = {
    id: string;
    name: string;
    teams: ScoringTeam[];
    matches: ScoringMatch[];
    standings: ScoringStanding[];
};

export type ScoringCategoryHeader = {
    id: string;
    name: string;
    division_label: string;
    skill_level_label: string;
    format: TournamentCategoryFormatValue;
    format_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
};

export type ScoringTournamentHeader = {
    id: string;
    name: string;
    slug: string;
};

export type ScoringShowProps = {
    tournament: ScoringTournamentHeader;
    category: ScoringCategoryHeader;
    pools: ScoringPool[];
    unassignedTeams: ScoringTeam[];
    permissions: {
        canManage: boolean;
    };
};

export type ScoringIndexTournament = {
    id: string;
    name: string;
    slug: string;
    status: string;
    status_label: string;
    categories_count: number;
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
};

export type ScoringIndexProps = {
    tournaments: ScoringIndexTournament[];
    permissions: {
        canManage: boolean;
    };
};
