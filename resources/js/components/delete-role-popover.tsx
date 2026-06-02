import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import RoleController from '@/actions/App/Http/Controllers/Admin/RoleController';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { AdminRole } from '@/types';

type Props = PropsWithChildren<{ role: AdminRole }>;

export default function DeleteRolePopover({ role, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold">Delete role?</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Remove <strong>{role.label}</strong>.{' '}
                            {role.users_count > 0 && (
                                <>
                                    {role.users_count} user
                                    {role.users_count === 1 ? '' : 's'} will
                                    lose this assignment.{' '}
                                </>
                            )}
                            This cannot be undone.
                        </p>
                    </div>

                    <Form
                        {...RoleController.destroy.form(role.id)}
                        onSuccess={() => setOpen(false)}
                    >
                        {({ processing }) => (
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </PopoverContent>
        </Popover>
    );
}
