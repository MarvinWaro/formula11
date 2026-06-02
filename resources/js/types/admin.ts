export type RoleSummary = {
    name: string;
    label: string;
};

export type AdminUser = {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: RoleSummary[];
};

export type AdminPermissions = {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
};

export type PermissionSummary = {
    name: string;
    label: string;
    description: string | null;
};

export type PermissionGroup = {
    group: string;
    permissions: PermissionSummary[];
};

export type AdminRole = {
    id: string;
    name: string;
    label: string;
    description: string | null;
    is_system: boolean;
    permissions_count: number;
    users_count: number;
    permissions: string[];
};
