import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import HeiController from '@/actions/App/Http/Controllers/Admin/HeiController';
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
import type { Hei } from '@/types';

type Props = PropsWithChildren<{
    mode: 'create' | 'edit';
    hei?: Hei;
}>;

export default function HeiFormModal({ mode, hei, children }: Props) {
    const [open, setOpen] = useState(false);

    const action =
        mode === 'edit' && hei
            ? HeiController.update.form(hei.id)
            : HeiController.store.form();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <Form
                    key={String(open)}
                    {...action}
                    className="space-y-5"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? 'Edit HEI'
                                        : 'Add new HEI'}
                                </DialogTitle>
                                <DialogDescription>
                                    {mode === 'edit'
                                        ? 'Update the institution details.'
                                        : 'Register a higher education institution.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="hei-name">
                                    Name
                                    <span className="text-destructive">
                                        {' *'}
                                    </span>
                                </Label>
                                <Input
                                    id="hei-name"
                                    name="name"
                                    required
                                    defaultValue={hei?.name ?? ''}
                                    placeholder="e.g., Sultan Kudarat State University"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="hei-abbreviation">
                                    Abbreviation
                                </Label>
                                <Input
                                    id="hei-abbreviation"
                                    name="abbreviation"
                                    defaultValue={hei?.abbreviation ?? ''}
                                    placeholder="e.g., SKSU"
                                />
                                <InputError message={errors.abbreviation} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="hei-region">Region</Label>
                                <Input
                                    id="hei-region"
                                    name="region"
                                    defaultValue={hei?.region ?? ''}
                                    placeholder="e.g., Region XII"
                                />
                                <InputError message={errors.region} />
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
                                        : 'Add HEI'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
