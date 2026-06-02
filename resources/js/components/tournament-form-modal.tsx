import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import TournamentController from '@/actions/App/Http/Controllers/Admin/TournamentController';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
import VenueAutocomplete from '@/components/venue-autocomplete';
import VenueMapPreview from '@/components/venue-map-preview';
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
import { cn } from '@/lib/utils';
import type { TournamentSummary } from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    tournament?: TournamentSummary;
}>;

type FeeMode = 'free' | 'paid';

const initialFeeMode = (tournament?: TournamentSummary): FeeMode =>
    tournament?.registration_fee && tournament.registration_fee > 0
        ? 'paid'
        : 'free';

export default function TournamentFormModal({
    mode,
    tournament,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        tournament?.venue_lat !== null &&
            tournament?.venue_lat !== undefined &&
            tournament?.venue_lng !== null &&
            tournament?.venue_lng !== undefined
            ? { lat: tournament.venue_lat, lng: tournament.venue_lng }
            : null,
    );
    const [feeMode, setFeeMode] = useState<FeeMode>(initialFeeMode(tournament));
    const [description, setDescription] = useState<string>(
        tournament?.description ?? '',
    );

    const action =
        mode === 'edit' && tournament
            ? TournamentController.update.form(tournament.slug)
            : TournamentController.store.form();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="sm:max-w-2xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    transform={(data) => ({
                        ...data,
                        description,
                        registration_fee:
                            feeMode === 'free' ? null : data.registration_fee,
                    })}
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

                            <div className="max-h-[70vh] space-y-5 overflow-x-hidden overflow-y-auto pr-1">
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

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="tournament-starts-at">
                                            Start date &amp; time
                                        </Label>
                                        <Input
                                            id="tournament-starts-at"
                                            name="starts_at"
                                            type="datetime-local"
                                            defaultValue={
                                                tournament?.starts_at?.slice(
                                                    0,
                                                    16,
                                                ) ?? ''
                                            }
                                        />
                                        <InputError
                                            message={errors.starts_at}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tournament-ends-at">
                                            End date &amp; time
                                        </Label>
                                        <Input
                                            id="tournament-ends-at"
                                            name="ends_at"
                                            type="datetime-local"
                                            defaultValue={
                                                tournament?.ends_at?.slice(
                                                    0,
                                                    16,
                                                ) ?? ''
                                            }
                                        />
                                        <InputError message={errors.ends_at} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-deadline">
                                        Registration deadline
                                    </Label>
                                    <Input
                                        id="tournament-deadline"
                                        name="registration_deadline"
                                        type="datetime-local"
                                        defaultValue={
                                            tournament?.registration_deadline?.slice(
                                                0,
                                                16,
                                            ) ?? ''
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Public users see this and can no longer
                                        register past this time. Leave blank
                                        for no automatic cut-off. You can
                                        extend it any time.
                                    </p>
                                    <InputError
                                        message={errors.registration_deadline}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tournament-venue">
                                        Venue
                                    </Label>
                                    <VenueAutocomplete
                                        name="venue"
                                        latName="venue_lat"
                                        lngName="venue_lng"
                                        defaultValue={tournament?.venue ?? ''}
                                        defaultLat={tournament?.venue_lat ?? null}
                                        defaultLng={tournament?.venue_lng ?? null}
                                        placeholder="Search a place in the Philippines…"
                                        onCoordsChange={setCoords}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Pick from the suggestions to drop a map
                                        pin.
                                    </p>
                                    <InputError message={errors.venue} />
                                </div>

                                {coords && (
                                    <VenueMapPreview
                                        lat={coords.lat}
                                        lng={coords.lng}
                                    />
                                )}

                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <RichTextEditor
                                        value={description}
                                        onChange={setDescription}
                                        placeholder="Format, prizes, rules, contact details…"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Default registration fee</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Used when a category does not set its
                                        own fee. Leave as Free for invite-only
                                        events.
                                    </p>
                                    <div className="flex gap-2">
                                        <FeeModeButton
                                            active={feeMode === 'free'}
                                            onClick={() => setFeeMode('free')}
                                            label="Free entry"
                                        />
                                        <FeeModeButton
                                            active={feeMode === 'paid'}
                                            onClick={() => setFeeMode('paid')}
                                            label="Paid entry"
                                        />
                                    </div>
                                    {feeMode === 'paid' && (
                                        <div className="mt-1 grid gap-2">
                                            <Label htmlFor="tournament-fee">
                                                Fee per team
                                            </Label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                    ₱
                                                </span>
                                                <Input
                                                    id="tournament-fee"
                                                    name="registration_fee"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    defaultValue={
                                                        tournament?.registration_fee ??
                                                        ''
                                                    }
                                                    placeholder="0.00"
                                                    className="pl-7"
                                                />
                                            </div>
                                            <InputError
                                                message={
                                                    errors.registration_fee
                                                }
                                            />
                                        </div>
                                    )}
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

function FeeModeButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/30',
            )}
        >
            {label}
        </button>
    );
}
