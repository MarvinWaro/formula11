import { Form, Head, Link, router } from '@inertiajs/react';
import { AlarmClock, ArrowRight, Building2, Calendar, Link2, MapPin, Trophy, Users } from 'lucide-react';
import type { FormEvent } from 'react';
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
import { formatPeso as formatFee } from '@/lib/money';
import { cn } from '@/lib/utils';
import type {
    PublicRegistrationCategory,
    PublicRegistrationProps,
} from '@/types';

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
    const [mode, setMode] = useState<'pair' | 'solo'>('pair');
    const [passwordPrompt, setPasswordPrompt] = useState<
        null | 'create' | 'signin'
    >(null);

    const selectedCategory: PublicRegistrationCategory | undefined =
        categories.find((c) => c.id.toString() === categoryId);

    const isLoggedIn = auth.user !== null;
    const canRegister =
        tournament.registration_open && openCategories.length > 0;

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title={`Register - ${tournament.name}`} />

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
                                    ` - ${tournament.ends_at}`}
                            </span>
                        )}
                    </div>
                </header>

                <DeadlineBanner
                    deadline={tournament.registration_deadline}
                    isOpen={tournament.registration_open}
                />

                <PartnerInviteCallout />

                {tournament.description && (
                    <section className="mb-6 rounded-lg border bg-background p-4">
                        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            About this tournament
                        </h2>
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
                            dangerouslySetInnerHTML={{
                                __html: tournament.description,
                            }}
                        />
                    </section>
                )}

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
                                        {c.division_label} -{' '}
                                        {c.skill_level_label} - {c.format_label}
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
                            category_id: categoryId,
                            hei_id: heiId === '' ? null : heiId,
                        })}
                        onError={(errors) => {
                            if (errors.needs_signin) {
                                setPasswordPrompt('signin');
                            } else if (errors.needs_password) {
                                setPasswordPrompt('create');
                            }
                        }}
                    >
                        {({ errors, processing }) => (
                            <>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Register your team
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {isLoggedIn
                                            ? `Signed in as ${auth.user?.name}. You will be registered as Player 1.`
                                            : passwordPrompt === 'signin'
                                              ? 'Welcome back! We found your account — enter your password to register this team.'
                                              : passwordPrompt === 'create'
                                                ? 'One more step — create a password to track your team\'s matches.'
                                                : "Fill in your details to register. We'll ask you to set a password to track your team."}
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

                                <div className="grid gap-2">
                                    <Label htmlFor="captain-name">
                                        Player 1 name *
                                    </Label>
                                    <Input
                                        id="captain-name"
                                        name="captain_name"
                                        required
                                        readOnly={isLoggedIn}
                                        defaultValue={auth.user?.name ?? ''}
                                        placeholder="Juan dela Cruz"
                                    />
                                    <InputError message={errors.captain_name} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="captain-email">
                                            Player 1 email *
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
                                            Player 1 phone
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

                                <div className="grid gap-2">
                                    <Label>Partner registration</Label>
                                    <div className="flex gap-3">
                                        <label
                                            className={cn(
                                                'flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                                                mode === 'pair'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-muted/30',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={mode === 'pair'}
                                                onChange={() => setMode('pair')}
                                            />
                                            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">
                                                    Register as a pair
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Add Player 2 details now
                                                </p>
                                            </div>
                                        </label>
                                        <label
                                            className={cn(
                                                'flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                                                mode === 'solo'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-muted/30',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={mode === 'solo'}
                                                onChange={() => setMode('solo')}
                                            />
                                            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">
                                                    Invite my partner later
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Get a shareable link
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="registration_mode"
                                        value={mode}
                                    />
                                </div>

                                {mode === 'pair' ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="partner-name">
                                                Player 2 name *
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
                                        <div className="grid gap-2">
                                            <Label htmlFor="partner-email">
                                                Player 2 email (optional)
                                            </Label>
                                            <Input
                                                id="partner-email"
                                                name="partner_email"
                                                type="email"
                                                placeholder="player2@example.com"
                                            />
                                            <InputError
                                                message={errors.partner_email}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="partner-email-hint">
                                            Partner email (optional)
                                        </Label>
                                        <Input
                                            id="partner-email-hint"
                                            name="partner_email"
                                            type="email"
                                            placeholder="partner@example.com"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            We'll include it in the invite link
                                            for reference.
                                        </p>
                                        <InputError
                                            message={errors.partner_email}
                                        />
                                    </div>
                                )}

                                {!isLoggedIn && passwordPrompt !== null && (
                                    <div className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                                        <Label htmlFor="captain-password">
                                            {passwordPrompt === 'signin'
                                                ? 'Your password *'
                                                : 'Create a password *'}
                                        </Label>
                                        <Input
                                            id="captain-password"
                                            name="captain_password"
                                            type="password"
                                            required
                                            minLength={
                                                passwordPrompt === 'signin'
                                                    ? undefined
                                                    : 8
                                            }
                                            placeholder={
                                                passwordPrompt === 'signin'
                                                    ? 'Enter your existing password'
                                                    : 'Min. 8 characters'
                                            }
                                            autoComplete={
                                                passwordPrompt === 'signin'
                                                    ? 'current-password'
                                                    : 'new-password'
                                            }
                                            autoFocus
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {passwordPrompt === 'signin'
                                                ? "We'll sign you in and register the team under your account."
                                                : "You'll use this to log in and check your team's matches."}
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

function DeadlineBanner({
    deadline,
    isOpen,
}: {
    deadline: string | null;
    isOpen: boolean;
}) {
    if (!deadline) {
        return null;
    }

    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const now = new Date();
    const past = date.getTime() < now.getTime();
    const hoursLeft = Math.max(
        0,
        Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60)),
    );
    const urgent = !past && hoursLeft <= 48;

    const formatted = date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    const tone =
        past || !isOpen
            ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
            : urgent
              ? 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100'
              : 'border-primary/20 bg-primary/5 text-foreground';

    return (
        <div
            className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${tone}`}
        >
            <AlarmClock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
                <p className="font-semibold">
                    {past
                        ? `Registration closed on ${formatted}.`
                        : `Registration closes ${formatted}.`}
                </p>
                {!past && (
                    <p className="mt-0.5 text-xs opacity-90">
                        {urgent
                            ? `Only ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} left to register.`
                            : 'Submit your team before the deadline to secure your slot.'}
                    </p>
                )}
            </div>
        </div>
    );
}

function PartnerInviteCallout() {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const extractToken = (raw: string): string | null => {
        const trimmed = raw.trim();
        if (!trimmed) return null;

        // Accept either a full URL containing /join/{token} or the token alone.
        let candidate = trimmed;
        try {
            const url = new URL(trimmed);
            const match = url.pathname.match(/\/join\/([^/?#]+)/);
            if (match) {
                candidate = match[1];
            }
        } catch {
            // Not a URL — treat the raw string as the token.
        }

        // ULID = 26-char Crockford base32.
        return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(candidate)
            ? candidate.toUpperCase()
            : null;
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const token = extractToken(value);
        if (!token) {
            setError(
                'That link or code doesn\'t look right. Double-check the message your partner shared.',
            );
            return;
        }

        router.visit(`/join/${token}`);
    };

    return (
        <section className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Link2 className="h-4 w-4" />
                </span>
                <div>
                    <h2 className="text-sm font-semibold">
                        Joining as a partner?
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Paste the invite link or code your partner shared, and
                        we'll take you straight to the join page.
                    </p>
                </div>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="https://…/join/XXXX  or the 26-character code"
                    className="flex-1"
                    aria-label="Partner invite link or code"
                    aria-invalid={error !== null}
                />
                <Button type="submit" disabled={value.trim() === ''}>
                    Continue <ArrowRight className="h-4 w-4" />
                </Button>
            </form>
            {error && (
                <p className="mt-2 text-xs text-destructive">{error}</p>
            )}
        </section>
    );
}
