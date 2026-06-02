import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Copy, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PublicRegistrationSuccessTeam } from '@/types';

type Props = {
    tournament: {
        name: string;
        organizer_name: string | null;
        venue: string | null;
    };
    team: PublicRegistrationSuccessTeam;
};

export default function PublicRegistrationSuccess({ tournament, team }: Props) {
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

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title="Registered" />

            <div className="mx-auto max-w-md px-4 py-12">
                <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
                    <div className="mb-4 flex justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h1 className="text-xl font-semibold">Team registered!</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {tournament.organizer_name
                            ? `${tournament.organizer_name} has confirmed your slot.`
                            : 'Your slot is confirmed.'}
                    </p>

                    <div className="my-6 space-y-3 rounded-md bg-muted/50 p-4 text-left text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">
                                Tournament
                            </p>
                            <p className="font-medium">{tournament.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">
                                Team
                            </p>
                            <p className="font-medium">{team.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {team.category_name} · {team.category_division}
                            </p>
                            {team.hei_name && (
                                <p className="text-xs text-muted-foreground">
                                    {team.hei_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">
                                Players
                            </p>
                            <ul className="mt-1 space-y-1">
                                {team.players.map((p) => (
                                    <li
                                        key={p.display_name}
                                        className="flex items-center gap-2"
                                    >
                                        {p.display_name}
                                        <Badge variant="secondary">
                                            {p.is_captain ? 'Player 1' : 'Player 2'}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {inviteUrl && (
                        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-800 dark:bg-blue-950">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                                <Link2 className="h-4 w-4" />
                                {team.players.length > 1
                                    ? 'Link your partner to their account'
                                    : 'Invite your partner'}
                            </div>
                            <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
                                {team.players.length > 1
                                    ? 'Send this link to your partner so they can sign in (or create an account) and see your team\'s matches.'
                                    : 'Share this link with your partner. Once they open it and fill in their details, your team will be complete.'}
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-blue-100 px-2 py-1.5 text-xs dark:bg-blue-900">
                                    {inviteUrl}
                                </code>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={copyInviteLink}
                                    className="shrink-0"
                                >
                                    <Copy className="h-3 w-3" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/">Done</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
