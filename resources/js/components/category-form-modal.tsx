import { Form } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import TournamentCategoryController from '@/actions/App/Http/Controllers/Admin/TournamentCategoryController';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    CategoryDivisionValue,
    SelectOption,
    SkillLevelValue,
    TournamentCategory,
    TournamentCategoryFormatValue,
    TournamentDetail,
} from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    tournament: TournamentDetail;
    category?: TournamentCategory;
    divisionOptions: SelectOption[];
    skillLevelOptions: SelectOption[];
    formatOptions: SelectOption[];
}>;

export default function CategoryFormModal({
    mode,
    tournament,
    category,
    divisionOptions,
    skillLevelOptions,
    formatOptions,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [division, setDivision] = useState<CategoryDivisionValue>(
        category?.division ?? 'mens',
    );
    const [skillLevel, setSkillLevel] = useState<SkillLevelValue>(
        category?.skill_level ?? 'beginner',
    );
    const [format, setFormat] = useState<TournamentCategoryFormatValue>(
        category?.format ?? 'round_robin_elimination',
    );
    // In edit mode the existing name is "manual" by default — never overwrite.
    const [name, setName] = useState<string>(category?.name ?? '');
    const [nameTouched, setNameTouched] = useState<boolean>(mode === 'edit');

    const autoName = useMemo(() => {
        const skill = skillLevelOptions.find((o) => o.value === skillLevel)
            ?.label;
        const div = divisionOptions
            .find((o) => o.value === division)
            ?.label?.replace(/[''']/g, '');
        return skill && div ? `${skill}'s ${div}` : '';
    }, [skillLevel, division, skillLevelOptions, divisionOptions]);

    // Keep name in sync with the auto-generated suggestion until the user
    // types something custom. Also re-run when the dialog opens so a freshly
    // reset state picks up the suggestion.
    useEffect(() => {
        if (open && !nameTouched && autoName) {
            setName(autoName);
        }
    }, [open, autoName, nameTouched]);

    const usesRoundRobin = format !== 'single_elimination';
    const usesElimination = format !== 'round_robin';

    const action =
        mode === 'edit' && category
            ? TournamentCategoryController.update.form([
                  tournament.slug,
                  category.id,
              ])
            : TournamentCategoryController.store.form(tournament.slug);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setDivision(category?.division ?? 'mens');
                    setSkillLevel(category?.skill_level ?? 'beginner');
                    setFormat(category?.format ?? 'round_robin_elimination');
                    setName(category?.name ?? '');
                    setNameTouched(mode === 'edit');
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="sm:max-w-xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    onSuccess={() => setOpen(false)}
                    transform={(data) => ({
                        ...data,
                        division,
                        skill_level: skillLevel,
                        format,
                        rr_points_to_win: usesRoundRobin
                            ? data.rr_points_to_win
                            : (category?.rr_points_to_win ?? 11),
                        elim_points_to_win: usesElimination
                            ? data.elim_points_to_win
                            : (category?.elim_points_to_win ?? 15),
                    })}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? 'Edit category'
                                        : 'Add category'}
                                </DialogTitle>
                                <DialogDescription>
                                    Define the division, skill level, and
                                    scoring rules for this category.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[70vh] space-y-6 overflow-x-hidden overflow-y-auto pr-1">
                                {/* ─── Classification ─── */}
                                <FormSection title="Classification">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Division"
                                            error={errors.division}
                                        >
                                            <Select
                                                value={division}
                                                onValueChange={(v) =>
                                                    setDivision(
                                                        v as CategoryDivisionValue,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {divisionOptions.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </Field>

                                        <Field
                                            label="Skill level"
                                            error={errors.skill_level}
                                            adornment={
                                                <SkillLevelGuide
                                                    options={skillLevelOptions}
                                                />
                                            }
                                        >
                                            <Select
                                                value={skillLevel}
                                                onValueChange={(v) =>
                                                    setSkillLevel(
                                                        v as SkillLevelValue,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {skillLevelOptions.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                    {skillLevelOptions.find(
                                        (o) => o.value === skillLevel,
                                    )?.description && (
                                        <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                            {
                                                skillLevelOptions.find(
                                                    (o) =>
                                                        o.value === skillLevel,
                                                )?.description
                                            }
                                        </p>
                                    )}
                                </FormSection>

                                {/* ─── Identity ─── */}
                                <FormSection title="Identity">
                                    <Field
                                        label="Name"
                                        htmlFor="category-name"
                                        required
                                        error={errors.name}
                                        hint={
                                            !nameTouched
                                                ? 'Auto-generated from division + skill level. Edit to customise.'
                                                : undefined
                                        }
                                    >
                                        <Input
                                            id="category-name"
                                            name="name"
                                            required
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setNameTouched(true);
                                            }}
                                            placeholder="e.g., Beginner's Mens"
                                        />
                                    </Field>
                                </FormSection>

                                {/* ─── Format & Scoring ─── */}
                                <FormSection title="Format & scoring">
                                    <Field label="Format" error={errors.format}>
                                        <Select
                                            value={format}
                                            onValueChange={(v) =>
                                                setFormat(
                                                    v as TournamentCategoryFormatValue,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formatOptions.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    {(usesRoundRobin || usesElimination) && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {usesRoundRobin && (
                                                <Field
                                                    label="Round-robin points"
                                                    htmlFor="rr-points"
                                                    error={
                                                        errors.rr_points_to_win
                                                    }
                                                >
                                                    <Input
                                                        id="rr-points"
                                                        name="rr_points_to_win"
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        required
                                                        defaultValue={
                                                            category?.rr_points_to_win ??
                                                            11
                                                        }
                                                    />
                                                </Field>
                                            )}
                                            {usesElimination && (
                                                <Field
                                                    label="Elimination points"
                                                    htmlFor="elim-points"
                                                    error={
                                                        errors.elim_points_to_win
                                                    }
                                                >
                                                    <Input
                                                        id="elim-points"
                                                        name="elim_points_to_win"
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        required
                                                        defaultValue={
                                                            category?.elim_points_to_win ??
                                                            15
                                                        }
                                                    />
                                                </Field>
                                            )}
                                        </div>
                                    )}
                                </FormSection>

                                {/* ─── Capacity & Fee ─── */}
                                <FormSection title="Capacity & fee">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Max teams"
                                            htmlFor="max-teams"
                                            error={errors.max_teams}
                                            hint="Leave blank for no cap"
                                        >
                                            <Input
                                                id="max-teams"
                                                name="max_teams"
                                                type="number"
                                                min={2}
                                                max={999}
                                                defaultValue={
                                                    category?.max_teams ?? ''
                                                }
                                                placeholder="No limit"
                                            />
                                        </Field>

                                        <Field
                                            label="Registration fee"
                                            htmlFor="registration-fee"
                                            error={errors.registration_fee}
                                            hint={
                                                mode === 'edit'
                                                    ? 'Leave blank to inherit from tournament default.'
                                                    : tournament.registration_fee
                                                      ? `Pre-filled from tournament default (₱${tournament.registration_fee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}). Edit to override, or clear to inherit.`
                                                      : 'Leave blank for free entry, or set a category-specific fee.'
                                            }
                                        >
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                    ₱
                                                </span>
                                                <Input
                                                    id="registration-fee"
                                                    name="registration_fee"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    defaultValue={
                                                        category?.registration_fee ??
                                                        (mode === 'create'
                                                            ? (tournament.registration_fee ??
                                                              '')
                                                            : '')
                                                    }
                                                    placeholder="0.00"
                                                    className="pl-7"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </FormSection>
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
                                        : 'Add category'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function FormSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>
                <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

function Field({
    label,
    htmlFor,
    required,
    error,
    hint,
    adornment,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    hint?: string;
    adornment?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={htmlFor}>
                    {label}
                    {required && (
                        <span className="text-destructive">{' *'}</span>
                    )}
                </Label>
                {adornment}
            </div>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}

function SkillLevelGuide({ options }: { options: SelectOption[] }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <Info className="h-3 w-3" />
                    Guide
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3 text-sm">
                <h3 className="mb-2 font-semibold">Skill level guide</h3>
                <ul className="space-y-2 text-xs">
                    {options.map((opt) => (
                        <li key={opt.value} className="leading-relaxed">
                            <span className="font-semibold text-foreground">
                                {opt.label}
                            </span>
                            {opt.description && (
                                <span className="text-muted-foreground">
                                    {' — '}
                                    {opt.description}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted-foreground">
                    Roughly aligned with USA Pickleball / DUPR self-rating
                    bands.
                </p>
            </PopoverContent>
        </Popover>
    );
}
