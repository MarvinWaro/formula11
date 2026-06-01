export type PublicRegistrationTournament = {
    name: string;
    slug: string;
    organizer_name: string | null;
    venue: string | null;
    starts_at: string | null;
    ends_at: string | null;
    status: string;
    registration_open: boolean;
};

export type PublicRegistrationCategory = {
    id: number;
    name: string;
    division_label: string;
    skill_level_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    registration_fee: number | null;
    max_teams: number | null;
    registered_teams: number;
    is_full: boolean;
};

export type PublicRegistrationHei = {
    id: number;
    name: string;
    abbreviation: string | null;
};

export type PublicRegistrationAuthUser = {
    id: number;
    name: string;
    email: string;
};

export type PublicRegistrationProps = {
    tournament: PublicRegistrationTournament;
    registrationCode: string;
    categories: PublicRegistrationCategory[];
    heis: PublicRegistrationHei[];
    auth: { user: PublicRegistrationAuthUser | null };
};

export type PublicRegistrationSuccessTeam = {
    id: number;
    display_name: string;
    category_name: string;
    category_division: string;
    hei_name: string | null;
    players: { display_name: string; is_captain: boolean }[];
};
