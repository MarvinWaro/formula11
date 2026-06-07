export type PlayerStandingsTeam = {
    id: string;
    display_name: string;
    pool_seed: number | null;
};

export type PlayerStandingsMatch = {
    id: string;
    sequence: number;
    stage: string;
    team_a: { id: string; display_name: string } | null;
    team_b: { id: string; display_name: string } | null;
    score_a: number | null;
    score_b: number | null;
    winner_team_id: string | null;
    played_at: string | null;
};

export type PlayerStandingsRow = {
    rank: number;
    team_id: string;
    display_name: string;
    wins: number;
    losses: number;
    points_for: number;
    points_against: number;
    point_diff: number;
    played: number;
};

export type PlayerStandingsPool = {
    id: string;
    name: string;
    teams: PlayerStandingsTeam[];
    matches: PlayerStandingsMatch[];
    standings: PlayerStandingsRow[];
};

export type PlayerStandingsBracket = {
    semis: PlayerStandingsMatch[];
    bronze: PlayerStandingsMatch | null;
    final: PlayerStandingsMatch | null;
};

export type PlayerTournamentCategory = {
    id: string;
    name: string;
    slug: string;
    division_label: string;
    skill_level: string;
    skill_level_label: string;
    format: string;
    format_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    registration_fee: number | null;
    max_teams: number | null;
    registered_teams: number;
    is_full: boolean;
    pools?: PlayerStandingsPool[];
    bracket?: PlayerStandingsBracket | null;
};

export type PlayerTournamentSummary = {
    id: string;
    name: string;
    slug: string;
    organizer_name: string | null;
    venue: string | null;
    venue_lat: number | null;
    venue_lng: number | null;
    description: string | null;
    registration_fee: number | null;
    starts_at: string | null;
    ends_at: string | null;
    registration_deadline: string | null;
    registration_open?: boolean;
    status?: string;
    status_label?: string;
    categories: PlayerTournamentCategory[];
};

export type PlayerTournamentAuthUser = {
    id: string;
    name: string;
    email: string;
};

export type PlayerTournamentHei = {
    id: string;
    name: string;
    abbreviation: string | null;
};

export type PlayerTournamentIndexProps = {
    tournaments: PlayerTournamentSummary[];
};

export type PlayerExistingTeam = {
    id: string;
    category_id: string;
    category_skill_level: string;
    display_name: string;
    category_name: string;
    hei_name: string | null;
    partner_token: string | null;
    players: {
        display_name: string;
        is_captain: boolean;
        is_placeholder: boolean;
    }[];
};

export type PlayerTournamentShowProps = {
    tournament: PlayerTournamentSummary;
    heis: PlayerTournamentHei[];
    auth: { user: PlayerTournamentAuthUser };
    existingTeams: PlayerExistingTeam[];
};
