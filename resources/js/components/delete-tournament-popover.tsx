import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import TournamentController from '@/actions/App/Http/Controllers/Admin/TournamentController';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { TournamentSummary } from '@/types';

type Props = PropsWithChildren<{ tournament: TournamentSummary }>;

export default function DeleteTournamentPopover({
    tournament,
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
                            Delete tournament?
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            <strong>{tournament.name}</strong> will be
                            soft-deleted. Categories, teams, and matches will
                            cascade.
                        </p>
                    </div>

                    <Form
                        {...TournamentController.destroy.form(tournament.slug)}
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
