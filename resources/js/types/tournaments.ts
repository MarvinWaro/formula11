export type TournamentStatus =
    | 'draft'
    | 'registration_open'
    | 'registration_closed'
    | 'in_progress'
    | 'completed';

export type CategoryDivisionValue = 'mens' | 'womens' | 'mixed';

export type SkillLevelValue =
    | 'beginner'
    | 'novice'
    | 'intermediate'
    | 'executive';

export type SelectOption = {
    value: string;
    label: string;
};

export type TournamentSummary = {
    id: number;
    name: string;
    slug: string;
    status: TournamentStatus;
    status_label: string;
    categories_count: number;
    creator: string | null;
};

export type TournamentCategory = {
    id: number;
    name: string;
    slug: string;
    division: CategoryDivisionValue;
    division_label: string;
    skill_level: SkillLevelValue;
    skill_level_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    bracket_size: number;
    teams_advancing_per_bracket: number;
    max_teams: number | null;
    registration_fee: number | null;
};

export type TournamentDetail = TournamentSummary & {
    venue: string | null;
    organizer_name: string | null;
    starts_at: string | null;
    ends_at: string | null;
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
