import { Form, Head, Link } from '@inertiajs/react';
import { AlarmClock, Building2, Calendar, CheckCircle2, Link2, MapPin, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import PlayerTournamentController from '@/actions/App/Http/Controllers/Player/TournamentController';
import Heading from '@/components/heading';
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
import { index, show } from '@/routes/player/tournaments';
import type {
    PlayerExistingTeam,
    PlayerTournamentCategory,
    PlayerTournamentShowProps,
} from '@/types';

const scoringText = (category: PlayerTournamentCategory): string => {
    if (category.format === 'round_robin') {
        return `Round robin to ${category.rr_points_to_win}`;
    }

    if (category.format === 'single_elimination') {
        return `Elimination to ${category.elim_points_to_win}`;
    }

    return `RR to ${category.rr_points_to_win}, elimination to ${category.elim_points_to_win}`;
};

const dateRange = (startsAt: string | null, endsAt: string | null): string => {
    if (startsAt && endsAt) {
        return `${startsAt} - ${endsAt}`;
    }

    return startsAt ?? endsAt ?? 'Dates TBA';
};

export default function PlayerTournamentShow({
    tournament,
    heis,
    auth,
    existingTeam,
}: PlayerTournamentShowProps) {
    const openCategories = useMemo(
        () => tournament.categories.filter((category) => !category.is_full),
        [tournament.categories],
    );
    const [categoryId, setCategoryId] = useState<string>(
        openCategories[0]?.id?.toString() ?? '',
    );
    const [heiId, setHeiId] = useState<string>('');
    const [mode, setMode] = useState<'pair' | 'solo'>('pair');
    const selectedCategory = tournament.categories.find(
        (category) => category.id.toString() === categoryId,
    );

    return (
        <>
            <Head title={`Register - ${tournament.name}`} />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            Registration open
                        </div>
                        <Heading
                            title={tournament.name}
                            description="Choose a category and register your doubles team."
                        />
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
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {dateRange(
                                    tournament.starts_at,
                                    tournament.ends_at,
                                )}
                            </span>
                            {tournament.registration_deadline && (
                                <span className="flex items-center gap-1">
                                    <AlarmClock className="h-4 w-4" />
                                    Register by{' '}
                                    {new Date(
                                        tournament.registration_deadline,
                                    ).toLocaleString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={index().url}>Back to tournaments</Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                    <section className="space-y-3">
                        <Heading
                            variant="small"
                            title="Categories"
                            description="Capacity is counted in teams. Each team has two players."
                        />
                        <div className="space-y-3">
                            {tournament.categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-lg border bg-background p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="font-semibold">
                                                {category.name}
                                            </h2>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {category.division_label} -{' '}
                                                {category.skill_level_label} -{' '}
                                                {category.format_label}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                category.is_full
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {category.is_full
                                                ? 'Full'
                                                : `${category.registered_teams}${category.max_teams !== null ? `/${category.max_teams}` : ''} teams`}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                        <div>{scoringText(category)}</div>
                                        <div>
                                            Fee:{' '}
                                            {formatFee(
                                                category.registration_fee,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {existingTeam ? (
                        <RegisteredTeamCard team={existingTeam} />
                    ) : (
                    <Form
                        {...PlayerTournamentController.store.form(
                            tournament.slug,
                        )}
                        className="space-y-5 rounded-lg border bg-background p-5"
                        transform={(data) => ({
                            ...data,
                            category_id: categoryId,
                            hei_id: heiId === '' ? null : heiId,
                            registration_mode: mode,
                        })}
                    >
                        {({ errors, processing }) => (
                            <>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Register your team
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Signed in as {auth.user.name}. You are Player 1.
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pick one" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {openCategories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedCategory && (
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
                                            {heis.map((hei) => (
                                                <SelectItem
                                                    key={hei.id}
                                                    value={hei.id.toString()}
                                                >
                                                    {hei.name}
                                                    {hei.abbreviation
                                                        ? ` (${hei.abbreviation})`
                                                        : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.hei_id} />
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

                                <div className="grid gap-2">
                                    <Label>Partner registration</Label>
                                    <div className="flex gap-2">
                                        <ModeButton
                                            active={mode === 'pair'}
                                            onClick={() => setMode('pair')}
                                            icon={<Users className="h-4 w-4" />}
                                            title="Register as a pair"
                                            subtitle="Add Player 2 now"
                                        />
                                        <ModeButton
                                            active={mode === 'solo'}
                                            onClick={() => setMode('solo')}
                                            icon={<Link2 className="h-4 w-4" />}
                                            title="Invite my partner later"
                                            subtitle="Get a shareable link"
                                        />
                                    </div>
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
                                                placeholder="Player 2 full name"
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
                                            We'll include it in the invite
                                            link for reference.
                                        </p>
                                        <InputError
                                            message={errors.partner_email}
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        openCategories.length === 0
                                    }
                                    className="w-full"
                                >
                                    Submit registration
                                </Button>
                            </>
                        )}
                    </Form>
                    )}
                </div>
            </div>
        </>
    );
}

function RegisteredTeamCard({ team }: { team: PlayerExistingTeam }) {
    const [copied, setCopied] = useState(false);
    const inviteUrl = team.partner_token
        ? `${window.location.origin}/join/${team.partner_token}`
        : null;

    const copyInviteLink = () => {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const placeholderPartner = team.players.find((p) => p.is_placeholder);

    return (
        <div className="space-y-3 rounded-lg border bg-background p-5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">You're registered!</span>
            </div>
            <div className="text-sm text-muted-foreground">
                Category:{' '}
                <span className="font-medium text-foreground">
                    {team.category_name}
                </span>
            </div>
            {team.hei_name && (
                <div className="text-sm text-muted-foreground">
                    Affiliation:{' '}
                    <span className="font-medium text-foreground">
                        {team.hei_name}
                    </span>
                </div>
            )}
            <div className="mt-2 space-y-1">
                {team.players.map((p, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 text-sm"
                    >
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.display_name}</span>
                        <Badge variant="secondary" className="text-xs">
                            {p.is_captain ? 'Player 1' : 'Player 2'}
                        </Badge>
                        {p.is_placeholder && (
                            <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                            >
                                Not yet claimed
                            </Badge>
                        )}
                    </div>
                ))}
            </div>

            {inviteUrl && (
                <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                        <Link2 className="h-4 w-4" />
                        {placeholderPartner
                            ? `Invite ${placeholderPartner.display_name}`
                            : 'Invite your partner'}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                        {placeholderPartner
                            ? "Share this link so they can sign in (or create an account) and link to your team."
                            : 'Share this link so your partner can join the team.'}
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 overflow-hidden rounded bg-background px-2 py-1.5 text-xs whitespace-nowrap text-ellipsis">
                            {inviteUrl}
                        </code>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={copyInviteLink}
                            className="shrink-0"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    icon,
    title,
    subtitle,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-1 items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                active
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/30',
            )}
        >
            <span className="shrink-0 text-muted-foreground">{icon}</span>
            <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">
                    {subtitle}
                </span>
            </span>
        </button>
    );
}

PlayerTournamentShow.layout = (props: {
    tournament: { name: string; slug: string };
}) => ({
    breadcrumbs: [
        { title: 'Tournaments', href: index().url },
        {
            title: props.tournament.name,
            href: show(props.tournament.slug).url,
        },
    ],
});
