import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import TournamentController from '@/actions/App/Http/Controllers/Admin/TournamentController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import type { TournamentDetail } from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    tournament?: TournamentDetail;
}>;

export default function TournamentFormModal({
    mode,
    tournament,
    children,
}: Props) {
    const [open, setOpen] = useState(false);

    const action =
        mode === 'edit' && tournament
            ? TournamentController.update.form(tournament.slug)
            : TournamentController.store.form();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? 'Edit tournament'
                                        : 'Create new tournament'}
                                </DialogTitle>
                                <DialogDescription>
                                    {mode === 'edit'
                                        ? 'Update the tournament details.'
                                        : 'Define a tournament. Categories are added next.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="tournament-name">
                                    Name
                                    <span className="text-destructive">
                                        {' *'}
                                    </span>
                                </Label>
                                <Input
                                    id="tournament-name"
                                    name="name"
                                    required
                                    defaultValue={tournament?.name ?? ''}
                                    placeholder="e.g., Inter-HEI Pickleball Cup 2026"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-organizer">
                                        Organizer
                                    </Label>
                                    <Input
                                        id="tournament-organizer"
                                        name="organizer_name"
                                        defaultValue={
                                            tournament?.organizer_name ?? ''
                                        }
                                        placeholder="e.g., GenSan Pickleball Center"
                                    />
                                    <InputError
                                        message={errors.organizer_name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-venue">
                                        Venue
                                    </Label>
                                    <Input
                                        id="tournament-venue"
                                        name="venue"
                                        defaultValue={tournament?.venue ?? ''}
                                        placeholder="e.g., Cinco Niñas, Koronadal City"
                                    />
                                    <InputError message={errors.venue} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-starts-at">
                                        Start date
                                    </Label>
                                    <Input
                                        id="tournament-starts-at"
                                        name="starts_at"
                                        type="date"
                                        defaultValue={
                                            tournament?.starts_at ?? ''
                                        }
                                    />
                                    <InputError message={errors.starts_at} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-ends-at">
                                        End date
                                    </Label>
                                    <Input
                                        id="tournament-ends-at"
                                        name="ends_at"
                                        type="date"
                                        defaultValue={tournament?.ends_at ?? ''}
                                    />
                                    <InputError message={errors.ends_at} />
                                </div>
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
                                        : 'Create tournament'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
