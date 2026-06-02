import { Form } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import RoleController from '@/actions/App/Http/Controllers/Admin/RoleController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminRole, PermissionGroup } from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    role?: AdminRole;
    permissionGroups: PermissionGroup[];
}>;

export default function RoleFormModal({
    mode,
    role,
    permissionGroups,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);

    const totalPermissions = useMemo(
        () =>
            permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0),
        [permissionGroups],
    );

    const togglePermission = (name: string) => {
        setSelected((prev) =>
            prev.includes(name)
                ? prev.filter((n) => n !== name)
                : [...prev, name],
        );
    };

    const toggleGroup = (group: PermissionGroup) => {
        const names = group.permissions.map((p) => p.name);
        const allSelected = names.every((n) => selected.includes(n));

        setSelected((prev) =>
            allSelected
                ? prev.filter((n) => !names.includes(n))
                : [...new Set([...prev, ...names])],
        );
    };

    const groupCounts = (group: PermissionGroup) => {
        const selectedInGroup = group.permissions.filter((p) =>
            selected.includes(p.name),
        ).length;

        return `${selectedInGroup}/${group.permissions.length}`;
    };

    const isSystem = role?.is_system ?? false;
    const isSuperAdmin = role?.name === 'super_admin';

    const action =
        mode === 'edit' && role
            ? RoleController.update.form(role.id)
            : RoleController.store.form();

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setSelected(role?.permissions ?? []);
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-6"
                    onSuccess={() => setOpen(false)}
                    transform={(data) => ({
                        ...data,
                        permissions: isSuperAdmin
                            ? (role?.permissions ?? [])
                            : selected,
                    })}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? `Edit role: ${role?.label}`
                                        : 'Create new role'}
                                </DialogTitle>
                                <DialogDescription>
                                    {mode === 'edit'
                                        ? 'Adjust role details and the permissions it grants.'
                                        : 'Add a new role and choose which permissions it grants.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="role-label">
                                        Role name
                                        <span className="text-destructive">
                                            {' *'}
                                        </span>
                                    </Label>
                                    <Input
                                        id="role-label"
                                        name="label"
                                        required
                                        defaultValue={role?.label ?? ''}
                                        placeholder="e.g., Tournament Director"
                                    />
                                    <InputError message={errors.label} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role-name">
                                        Identifier
                                        <span className="text-destructive">
                                            {' *'}
                                        </span>
                                    </Label>
                                    <Input
                                        id="role-name"
                                        name="name"
                                        required
                                        readOnly={isSystem}
                                        defaultValue={role?.name ?? ''}
                                        placeholder="e.g., tournament_director"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role-description">
                                    Description
                                </Label>
                                <Input
                                    id="role-description"
                                    name="description"
                                    defaultValue={role?.description ?? ''}
                                    placeholder="Brief description..."
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        <h3 className="text-sm font-semibold">
                                            Permissions
                                        </h3>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {isSuperAdmin
                                            ? `${totalPermissions} of ${totalPermissions} (locked)`
                                            : `${selected.length} of ${totalPermissions} selected`}
                                    </span>
                                </div>

                                {isSuperAdmin && (
                                    <p className="mb-3 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                                        The Super Admin role always has every
                                        permission. This list is locked.
                                    </p>
                                )}

                                <div className="space-y-4">
                                    {permissionGroups.map((group) => {
                                        const groupNames =
                                            group.permissions.map(
                                                (p) => p.name,
                                            );
                                        const groupAllSelected =
                                            groupNames.every((n) =>
                                                selected.includes(n),
                                            );

                                        return (
                                            <div
                                                key={group.group}
                                                className="rounded-md border p-3"
                                            >
                                                <label className="mb-2 flex items-center justify-between text-sm font-medium">
                                                    <span className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={
                                                                groupAllSelected
                                                            }
                                                            disabled={
                                                                isSuperAdmin
                                                            }
                                                            onCheckedChange={() =>
                                                                toggleGroup(
                                                                    group,
                                                                )
                                                            }
                                                        />
                                                        {group.group}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {groupCounts(group)}
                                                    </span>
                                                </label>

                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {group.permissions.map(
                                                        (perm) => (
                                                            <label
                                                                key={perm.name}
                                                                className="flex items-start gap-2 rounded p-1 text-sm hover:bg-muted/30"
                                                            >
                                                                <Checkbox
                                                                    className="mt-0.5"
                                                                    checked={selected.includes(
                                                                        perm.name,
                                                                    )}
                                                                    disabled={
                                                                        isSuperAdmin
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        togglePermission(
                                                                            perm.name,
                                                                        )
                                                                    }
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>
                                                                        {
                                                                            perm.label
                                                                        }
                                                                    </span>
                                                                    {perm.description && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {
                                                                                perm.description
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.permissions} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" type="button">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {mode === 'edit'
                                        ? 'Save changes'
                                        : 'Create role'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
