import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import TournamentCategoryController from '@/actions/App/Http/Controllers/Admin/TournamentCategoryController';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { TournamentCategory, TournamentDetail } from '@/types';

type Props = PropsWithChildren<{
    tournament: TournamentDetail;
    category: TournamentCategory;
}>;

export default function DeleteCategoryPopover({
    tournament,
    category,
    children,
}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold">
                            Delete category?
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Remove <strong>{category.name}</strong>. All teams
                            and matches registered under this category will
                            cascade.
                        </p>
                    </div>

                    <Form
                        {...TournamentCategoryController.destroy.form([
                            tournament.slug,
                            category.id,
                        ])}
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
