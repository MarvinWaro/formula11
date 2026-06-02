import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import HeiController from '@/actions/App/Http/Controllers/Admin/HeiController';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { Hei } from '@/types';

type Props = PropsWithChildren<{ hei: Hei }>;

export default function DeleteHeiPopover({ hei, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold">Delete HEI?</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Remove <strong>{hei.name}</strong> from the
                            registry. Teams already linked to this HEI will not
                            be affected.
                        </p>
                    </div>

                    <Form
                        {...HeiController.destroy.form(hei.id)}
                        onSuccess={() => setOpen(false)}
                    >
                        {({ processing }) => (
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </PopoverContent>
        </Popover>
    );
}
