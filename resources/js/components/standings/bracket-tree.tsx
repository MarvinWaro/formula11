import { Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BracketMatch = {
    id: string;
    sequence: number;
    stage: string;
    team_a: { id: string; display_name: string } | null;
    team_b: { id: string; display_name: string } | null;
    score_a: number | null;
    score_b: number | null;
    winner_team_id: string | null;
    played_at: string | null;
};

type Props = {
    semis: BracketMatch[];
    bronze: BracketMatch | null;
    final: BracketMatch | null;
};

export function BracketTree({ semis, bronze, final }: Props) {
    const [sf1, sf2] = semis;

    return (
        <div className="space-y-6">
            {/* Knockout: semis → final */}
            <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="space-y-4">
                    <Slot label="Semifinal 1" match={sf1} />
                    <Slot label="Semifinal 2" match={sf2} />
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-2 sm:text-muted-foreground">
                    <span className="text-2xl">→</span>
                </div>
                <Slot
                    label="Championship"
                    match={final}
                    accent="champion"
                    icon={Crown}
                />
            </div>

            {/* 3rd place */}
            {bronze && (
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        <Medal className="h-3.5 w-3.5" />
                        Battle for 3rd place
                    </div>
                    <Slot match={bronze} accent="bronze" />
                </div>
            )}
        </div>
    );
}

function Slot({
    label,
    match,
    accent,
    icon: Icon,
}: {
    label?: string;
    match: BracketMatch | undefined | null;
    accent?: 'champion' | 'bronze';
    icon?: typeof Crown;
}) {
    const teamARow = (
        <SlotRow
            name={match?.team_a?.display_name ?? 'TBD'}
            score={match?.score_a}
            isWinner={
                match?.winner_team_id !== null &&
                match?.winner_team_id === match?.team_a?.id
            }
        />
    );
    const teamBRow = (
        <SlotRow
            name={match?.team_b?.display_name ?? 'TBD'}
            score={match?.score_b}
            isWinner={
                match?.winner_team_id !== null &&
                match?.winner_team_id === match?.team_b?.id
            }
        />
    );

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border bg-card',
                accent === 'champion' && 'border-amber-500/50 bg-amber-500/5',
                accent === 'bronze' && 'border-orange-500/30',
            )}
        >
            {label && (
                <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {label}
                </div>
            )}
            <div className="divide-y">
                {teamARow}
                {teamBRow}
            </div>
        </div>
    );
}

function SlotRow({
    name,
    score,
    isWinner,
}: {
    name: string;
    score: number | null | undefined;
    isWinner: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 text-sm',
                isWinner && 'bg-emerald-500/10 font-semibold',
            )}
        >
            <span className="min-w-0 truncate">{name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
                {score ?? '—'}
            </span>
        </div>
    );
}
