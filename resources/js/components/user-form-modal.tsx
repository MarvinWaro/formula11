import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
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
import type { AdminUser, RoleSummary } from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    user?: AdminUser;
    availableRoles: RoleSummary[];
}>;

export default function UserFormModal({
    mode,
    user,
    availableRoles,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(
        user?.roles.map((r) => r.name) ?? [],
    );

    const toggleRole = (name: string) => {
        setSelectedRoles((prev) =>
            prev.includes(name)
                ? prev.filter((r) => r !== name)
                : [...prev, name],
        );
    };

    const action =
        mode === 'edit' && user
            ? UserController.update.form(user.id)
            : UserController.store.form();

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setSelectedRoles(user?.roles.map((r) => r.name) ?? []);
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    onSuccess={() => setOpen(false)}
                    transform={(data) => ({ ...data, roles: selectedRoles })}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? 'Edit user'
                                        : 'Create new user'}
                                </DialogTitle>
                                <DialogDescription>
                                    {mode === 'edit'
                                        ? 'Update the user details and role assignments.'
                                        : 'Add a new user and assign them one or more roles.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="user-name">Name</Label>
                                <Input
                                    id="user-name"
                                    name="name"
                                    required
                                    defaultValue={user?.name ?? ''}
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="user-email">Email</Label>
                                <Input
                                    id="user-email"
                                    name="email"
                                    type="email"
                                    required
                                    defaultValue={user?.email ?? ''}
                                    placeholder="user@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="user-password">
                                    Password
                                    {mode === 'edit' && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            (leave blank to keep current)
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id="user-password"
                                    name="password"
                                    type="password"
                                    required={mode === 'create'}
                                    minLength={8}
                                    autoComplete="new-password"
                                    placeholder="Minimum 8 characters"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Roles</Label>
                                <div className="grid gap-2 rounded-md border p-3">
                                    {availableRoles.map((role) => (
                                        <label
                                            key={role.name}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedRoles.includes(
                                                    role.name,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRole(role.name)
                                                }
                                            />
                                            <span>{role.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.roles} />
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
                                        : 'Create user'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
