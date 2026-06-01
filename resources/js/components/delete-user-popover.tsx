import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { AdminUser } from '@/types';

type Props = PropsWithChildren<{ user: AdminUser }>;

export default function DeleteUserPopover({ user, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold">Delete user?</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            <strong>{user.name}</strong> ({user.email}) will be
                            soft-deleted. They can be restored later.
                        </p>
                    </div>

                    <Form
                        {...UserController.destroy.form(user.id)}
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
