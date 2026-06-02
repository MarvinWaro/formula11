export type PublicRegistrationTournament = {
    name: string;
    slug: string;
    organizer_name: string | null;
    venue: string | null;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    registration_deadline: string | null;
    status: string;
    registration_open: boolean;
};

export type PublicRegistrationCategory = {
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

export type PublicRegistrationHei = {
    id: string;
    name: string;
    abbreviation: string | null;
};

export type PublicRegistrationAuthUser = {
    id: string;
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
    id: string;
    display_name: string;
    category_name: string;
    category_division: string;
    hei_name: string | null;
    partner_token: string | null;
    players: { display_name: string; is_captain: boolean }[];
};

export type PartnerJoinProps = {
    token: string;
    team: {
        display_name: string;
        category_name: string;
        player1_name: string;
        captain_phone: string | null;
        placeholder_name: string | null;
        is_claim: boolean;
    };
    auth: { user: PublicRegistrationAuthUser | null };
};
