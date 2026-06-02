export type PlayerTournamentCategory = {
    id: string;
    name: string;
    division_label: string;
    skill_level_label: string;
    format: string;
    format_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    registration_fee: number | null;
    max_teams: number | null;
    registered_teams: number;
    is_full: boolean;
};

export type PlayerTournamentSummary = {
    id: string;
    name: string;
    slug: string;
    organizer_name: string | null;
    venue: string | null;
    starts_at: string | null;
    ends_at: string | null;
    registration_deadline: string | null;
    registration_open?: boolean;
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
    existingTeam: PlayerExistingTeam | null;
};
