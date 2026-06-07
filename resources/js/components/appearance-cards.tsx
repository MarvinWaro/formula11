import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type Option = {
    value: Appearance;
    icon: LucideIcon;
    label: string;
    description: string;
    preview: 'light' | 'dark' | 'system';
};

const options: Option[] = [
    {
        value: 'light',
        icon: Sun,
        label: 'Light',
        description: 'Clean and bright interface for daytime use.',
        preview: 'light',
    },
    {
        value: 'dark',
        icon: Moon,
        label: 'Dark',
        description: 'Easier on the eyes in low-light environments.',
        preview: 'dark',
    },
    {
        value: 'system',
        icon: Monitor,
        label: 'System',
        description: 'Automatically matches your device settings.',
        preview: 'system',
    },
];

export default function AppearanceCards() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
                <OptionCard
                    key={option.value}
                    option={option}
                    selected={appearance === option.value}
                    onSelect={() => updateAppearance(option.value)}
                />
            ))}
        </div>
    );
}

function OptionCard({
    option,
    selected,
    onSelect,
}: {
    option: Option;
    selected: boolean;
    onSelect: () => void;
}) {
    const Icon = option.icon;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                'group relative flex flex-col gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-all hover:border-primary/40 sm:p-5',
                selected
                    ? 'border-primary shadow-sm ring-2 ring-primary/20'
                    : 'border-border',
            )}
        >
            {selected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                </span>
            )}

            <span
                className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border bg-background',
                    selected && 'border-primary/40 text-primary',
                )}
            >
                <Icon className="h-4 w-4" />
            </span>

            <div className="space-y-1">
                <div className="text-sm font-semibold">{option.label}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                </p>
            </div>

            <PreviewMockup variant={option.preview} />
        </button>
    );
}

function PreviewMockup({ variant }: { variant: 'light' | 'dark' | 'system' }) {
    if (variant === 'system') {
        return (
            <div className="grid h-20 grid-cols-2 overflow-hidden rounded-lg border">
                <div className="flex flex-col gap-1.5 bg-white p-2">
                    <div className="h-1.5 w-3/4 rounded-full bg-neutral-300" />
                    <div className="h-1.5 w-1/2 rounded-full bg-neutral-200" />
                    <div className="mt-auto h-1.5 w-2/3 rounded-full bg-neutral-200" />
                </div>
                <div className="flex flex-col gap-1.5 bg-neutral-900 p-2">
                    <div className="h-1.5 w-3/4 rounded-full bg-neutral-600" />
                    <div className="h-1.5 w-1/2 rounded-full bg-neutral-700" />
                    <div className="mt-auto h-1.5 w-2/3 rounded-full bg-neutral-700" />
                </div>
            </div>
        );
    }

    const isLight = variant === 'light';
    return (
        <div
            className={cn(
                'flex h-20 flex-col gap-1.5 overflow-hidden rounded-lg border p-3',
                isLight ? 'bg-white' : 'bg-neutral-900',
            )}
        >
            <div
                className={cn(
                    'h-1.5 w-3/4 rounded-full',
                    isLight ? 'bg-neutral-300' : 'bg-neutral-600',
                )}
            />
            <div
                className={cn(
                    'h-1.5 w-1/2 rounded-full',
                    isLight ? 'bg-neutral-200' : 'bg-neutral-700',
                )}
            />
            <div
                className={cn(
                    'mt-auto h-1.5 w-2/3 rounded-full',
                    isLight ? 'bg-neutral-200' : 'bg-neutral-700',
                )}
            />
        </div>
    );
}
