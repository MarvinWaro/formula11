import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
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
                                        {p.is_captain && (
                                            <Badge variant="secondary">
                                                Captain
                                            </Badge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/">Done</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
