import { Form } from '@inertiajs/react';
import { useState } from 'react';
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
    TournamentDetail,
} from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    tournament: TournamentDetail;
    category?: TournamentCategory;
    divisionOptions: SelectOption[];
    skillLevelOptions: SelectOption[];
}>;

export default function CategoryFormModal({
    mode,
    tournament,
    category,
    divisionOptions,
    skillLevelOptions,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [division, setDivision] = useState<CategoryDivisionValue>(
        category?.division ?? 'mens',
    );
    const [skillLevel, setSkillLevel] = useState<SkillLevelValue>(
        category?.skill_level ?? 'beginner',
    );

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
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    onSuccess={() => setOpen(false)}
                    transform={(data) => ({
                        ...data,
                        division,
                        skill_level: skillLevel,
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

                            <div className="grid gap-2">
                                <Label htmlFor="category-name">
                                    Name
                                    <span className="text-destructive">
                                        {' *'}
                                    </span>
                                </Label>
                                <Input
                                    id="category-name"
                                    name="name"
                                    required
                                    defaultValue={category?.name ?? ''}
                                    placeholder="e.g., Beginner's Mens"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Division</Label>
                                    <Select
                                        value={division}
                                        onValueChange={(v) =>
                                            setDivision(
                                                v as CategoryDivisionValue,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisionOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.division} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Skill level</Label>
                                    <Select
                                        value={skillLevel}
                                        onValueChange={(v) =>
                                            setSkillLevel(v as SkillLevelValue)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {skillLevelOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.skill_level} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="rr-points">
                                        Round-robin points to win
                                    </Label>
                                    <Input
                                        id="rr-points"
                                        name="rr_points_to_win"
                                        type="number"
                                        min={1}
                                        max={99}
                                        required
                                        defaultValue={
                                            category?.rr_points_to_win ?? 11
                                        }
                                    />
                                    <InputError
                                        message={errors.rr_points_to_win}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="elim-points">
                                        Elimination points to win
                                    </Label>
                                    <Input
                                        id="elim-points"
                                        name="elim_points_to_win"
                                        type="number"
                                        min={1}
                                        max={99}
                                        required
                                        defaultValue={
                                            category?.elim_points_to_win ?? 15
                                        }
                                    />
                                    <InputError
                                        message={errors.elim_points_to_win}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="bracket-size">
                                        Bracket size
                                    </Label>
                                    <Input
                                        id="bracket-size"
                                        name="bracket_size"
                                        type="number"
                                        min={2}
                                        max={16}
                                        required
                                        defaultValue={
                                            category?.bracket_size ?? 4
                                        }
                                    />
                                    <InputError message={errors.bracket_size} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="advancing">Advancing</Label>
                                    <Input
                                        id="advancing"
                                        name="teams_advancing_per_bracket"
                                        type="number"
                                        min={1}
                                        max={4}
                                        required
                                        defaultValue={
                                            category?.teams_advancing_per_bracket ??
                                            1
                                        }
                                    />
                                    <InputError
                                        message={
                                            errors.teams_advancing_per_bracket
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max-teams">Max teams</Label>
                                    <Input
                                        id="max-teams"
                                        name="max_teams"
                                        type="number"
                                        min={2}
                                        max={999}
                                        defaultValue={category?.max_teams ?? ''}
                                        placeholder="Optional cap"
                                    />
                                    <InputError message={errors.max_teams} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="registration-fee">
                                    Registration fee (₱)
                                </Label>
                                <Input
                                    id="registration-fee"
                                    name="registration_fee"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    defaultValue={
                                        category?.registration_fee ?? ''
                                    }
                                    placeholder="Optional, e.g., 500"
                                />
                                <InputError message={errors.registration_fee} />
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
