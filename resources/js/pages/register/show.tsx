import { Form, Head, Link } from '@inertiajs/react';
import { Building2, Calendar, MapPin, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import TournamentRegistrationController from '@/actions/App/Http/Controllers/Public/TournamentRegistrationController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    PublicRegistrationCategory,
    PublicRegistrationProps,
} from '@/types';

const formatFee = (fee: number | null): string => {
    if (fee === null || fee === 0) {
        return 'Free';
    }

    return `₱${fee.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default function PublicRegistrationShow({
    tournament,
    registrationCode,
    categories,
    heis,
    auth,
}: PublicRegistrationProps) {
    const openCategories = useMemo(
        () => categories.filter((c) => !c.is_full),
        [categories],
    );

    const [categoryId, setCategoryId] = useState<string>(
        openCategories[0]?.id?.toString() ?? '',
    );
    const [heiId, setHeiId] = useState<string>('');

    const selectedCategory: PublicRegistrationCategory | undefined =
        categories.find((c) => c.id.toString() === categoryId);

    const isLoggedIn = auth.user !== null;
    const canRegister =
        tournament.registration_open && openCategories.length > 0;

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title={`Register · ${tournament.name}`} />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <header className="mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        Tournament registration
                    </div>
                    <h1 className="text-2xl font-bold">{tournament.name}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {tournament.organizer_name && (
                            <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {tournament.organizer_name}
                            </span>
                        )}
                        {tournament.venue && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {tournament.venue}
                            </span>
                        )}
                        {(tournament.starts_at || tournament.ends_at) && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {tournament.starts_at}
                                {tournament.ends_at &&
                                    ` – ${tournament.ends_at}`}
                            </span>
                        )}
                    </div>
                </header>

                {!tournament.registration_open && (
                    <div className="mb-6 rounded-lg border bg-yellow-50 p-4 text-sm text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                        Registration is not currently open for this tournament.
                        Please check back later.
                    </div>
                )}

                <section className="mb-6 space-y-2">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Categories
                    </h2>
                    <div className="space-y-2">
                        {categories.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between rounded-lg border bg-background p-3"
                            >
                                <div>
                                    <div className="font-medium">{c.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.division_label} ·{' '}
                                        {c.skill_level_label} · RR to{' '}
                                        {c.rr_points_to_win}, Finals to{' '}
                                        {c.elim_points_to_win}
                                    </div>
                                </div>
                                <div className="text-right text-sm">
                                    <div className="font-semibold">
                                        {formatFee(c.registration_fee)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.is_full ? (
                                            <Badge variant="outline">
                                                Full
                                            </Badge>
                                        ) : (
                                            `${c.registered_teams}${c.max_teams !== null ? `/${c.max_teams}` : ''} teams`
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {canRegister && (
                    <Form
                        {...TournamentRegistrationController.store.form(
                            registrationCode,
                        )}
                        className="space-y-5 rounded-lg border bg-background p-5"
                        transform={(data) => ({
                            ...data,
                            category_id: Number(categoryId),
                            hei_id: heiId === '' ? null : Number(heiId),
                        })}
                    >
                        {({ errors, processing }) => (
                            <>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Register your team
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {isLoggedIn
                                            ? `Signed in as ${auth.user?.name}.`
                                            : 'New here? An account will be created for the captain so you can come back later.'}
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pick one…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {openCategories.map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={c.id.toString()}
                                                >
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedCategory?.registration_fee !==
                                        null &&
                                        selectedCategory !== undefined && (
                                            <p className="text-xs text-muted-foreground">
                                                Fee:{' '}
                                                {formatFee(
                                                    selectedCategory.registration_fee,
                                                )}
                                            </p>
                                        )}
                                    <InputError message={errors.category_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Affiliation / HEI (optional)</Label>
                                    <Select
                                        value={heiId}
                                        onValueChange={setHeiId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="No affiliation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {heis.map((h) => (
                                                <SelectItem
                                                    key={h.id}
                                                    value={h.id.toString()}
                                                >
                                                    {h.name}
                                                    {h.abbreviation
                                                        ? ` (${h.abbreviation})`
                                                        : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.hei_id} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="captain-name">
                                            Captain name *
                                        </Label>
                                        <Input
                                            id="captain-name"
                                            name="captain_name"
                                            required
                                            readOnly={isLoggedIn}
                                            defaultValue={auth.user?.name ?? ''}
                                            placeholder="Juan dela Cruz"
                                        />
                                        <InputError
                                            message={errors.captain_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="partner-name">
                                            Partner name *
                                        </Label>
                                        <Input
                                            id="partner-name"
                                            name="partner_name"
                                            required
                                            placeholder="Maria Clara"
                                        />
                                        <InputError
                                            message={errors.partner_name}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="captain-email">
                                            Captain email *
                                        </Label>
                                        <Input
                                            id="captain-email"
                                            name="captain_email"
                                            type="email"
                                            required
                                            readOnly={isLoggedIn}
                                            defaultValue={
                                                auth.user?.email ?? ''
                                            }
                                            placeholder="captain@example.com"
                                        />
                                        <InputError
                                            message={errors.captain_email}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="captain-phone">
                                            Captain phone
                                        </Label>
                                        <Input
                                            id="captain-phone"
                                            name="captain_phone"
                                            type="tel"
                                            placeholder="09xx xxx xxxx"
                                        />
                                        <InputError
                                            message={errors.captain_phone}
                                        />
                                    </div>
                                </div>

                                {!isLoggedIn && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="captain-password">
                                            Set a password *
                                        </Label>
                                        <Input
                                            id="captain-password"
                                            name="captain_password"
                                            type="password"
                                            required
                                            minLength={8}
                                            placeholder="Min. 8 characters"
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            You'll use this to log in later and
                                            check your team's matches.
                                        </p>
                                        <InputError
                                            message={errors.captain_password}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                    {!isLoggedIn && (
                                        <Link
                                            href="/login"
                                            className="text-sm underline underline-offset-4"
                                        >
                                            Already have an account? Sign in
                                        </Link>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="ml-auto"
                                    >
                                        Submit registration
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </div>
    );
}
