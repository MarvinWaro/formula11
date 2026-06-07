export type TournamentStatus =
    | 'draft'
    | 'registration_open'
    | 'registration_closed'
    | 'in_progress'
    | 'completed';

export type CategoryDivisionValue = 'mens' | 'womens' | 'mixed';

export type SkillLevelValue = 'beginner' | 'novice' | 'intermediate';

export type TournamentCategoryFormatValue =
    | 'round_robin'
    | 'single_elimination'
    | 'round_robin_elimination';

export type SelectOption = {
    value: string;
    label: string;
    description?: string;
};

export type TournamentSummary = {
    id: string;
    name: string;
    slug: string;
    status: TournamentStatus;
    status_label: string;
    categories_count: number;
    creator: string | null;
    organizer_name: string | null;
    venue: string | null;
    venue_lat: number | null;
    venue_lng: number | null;
    description: string | null;
    registration_fee: number | null;
    starts_at: string | null;
    ends_at: string | null;
    registration_deadline: string | null;
};

export type RegisteredTeamPlayer = {
    display_name: string;
    is_captain: boolean;
};

export type RegisteredTeam = {
    id: string;
    display_name: string;
    hei_name: string | null;
    hei_abbreviation: string | null;
    captain_phone: string | null;
    players: RegisteredTeamPlayer[];
};

export type TournamentCategory = {
    id: string;
    name: string;
    slug: string;
    division: CategoryDivisionValue;
    division_label: string;
    skill_level: SkillLevelValue;
    skill_level_label: string;
    format: TournamentCategoryFormatValue;
    format_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    win_by_two: boolean;
    bracket_size: number;
    teams_advancing_per_bracket: number;
    max_teams: number | null;
    registration_fee: number | null;
    registered_teams_count?: number;
    teams?: RegisteredTeam[];
};

export type TournamentDetail = TournamentSummary & {
    registration_code: string;
    categories: TournamentCategory[];
};

export type TournamentPermissions = {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
};

export type CategoryPermissions = {
    canCreateCategory: boolean;
    canEditCategory: boolean;
    canDeleteCategory: boolean;
};
