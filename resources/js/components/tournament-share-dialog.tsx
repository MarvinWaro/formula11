import { Check, Copy, Download, Share2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { TournamentDetail } from '@/types';

type Props = PropsWithChildren<{ tournament: TournamentDetail }>;

const QR_RENDER_SIZE = 240;
const QR_DOWNLOAD_SIZE = 1024;

export default function TournamentShareDialog({ tournament, children }: Props) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hasNativeShare] = useState(
        () =>
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function',
    );
    const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const registrationUrl = useMemo(() => {
        if (typeof window === 'undefined') {
            return '';
        }

        return `${window.location.origin}/register/${tournament.registration_code}`;
    }, [tournament.registration_code]);

    const shareTitle = `${tournament.name} — Pickleball registration`;
    const shareText = tournament.organizer_name
        ? `Register your team for ${tournament.name}, hosted by ${tournament.organizer_name}.`
        : `Register your team for ${tournament.name}.`;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(registrationUrl);
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Long-press the URL to copy manually.');
        }
    }, [registrationUrl]);

    const handleDownload = useCallback(() => {
        const canvas = downloadCanvasRef.current;

        if (!canvas) {
            return;
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${tournament.slug}-registration-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR downloaded');
    }, [tournament.slug]);

    const handleNativeShare = useCallback(async () => {
        try {
            await navigator.share({
                title: shareTitle,
                text: shareText,
                url: registrationUrl,
            });
        } catch (err) {
            const isAbort =
                err instanceof DOMException && err.name === 'AbortError';

            if (!isAbort) {
                toast.error('Share failed.');
            }
        }
    }, [shareTitle, shareText, registrationUrl]);

    const isRegistrationOpen = tournament.status === 'registration_open';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share registration</DialogTitle>
                    <DialogDescription>
                        {isRegistrationOpen
                            ? 'Captains scan the QR or open the link to register their team.'
                            : 'Registration is not open yet. Scanners will see a closed page until you open registration.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-lg border bg-white p-4">
                        <QRCodeCanvas
                            value={registrationUrl}
                            size={QR_RENDER_SIZE}
                            level="M"
                            marginSize={2}
                            aria-label="Registration QR code"
                        />
                    </div>

                    <div className="w-full space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Registration URL
                        </p>
                        <p className="rounded-md border bg-muted/30 p-2 font-mono text-xs break-all">
                            {registrationUrl}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Code:{' '}
                            <span className="font-mono">
                                {tournament.registration_code}
                            </span>
                        </p>
                    </div>

                    <div className="flex w-full flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            {copied ? 'Copied' : 'Copy link'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={handleDownload}
                        >
                            <Download className="h-4 w-4" />
                            Download QR
                        </Button>
                        {hasNativeShare && (
                            <Button
                                type="button"
                                size="sm"
                                className="flex-1"
                                onClick={handleNativeShare}
                            >
                                <Share2 className="h-4 w-4" />
                                Share…
                            </Button>
                        )}
                    </div>
                </div>

                {/* Hidden high-resolution canvas used for downloading. */}
                <div aria-hidden className="hidden">
                    <QRCodeCanvas
                        ref={downloadCanvasRef}
                        value={registrationUrl}
                        size={QR_DOWNLOAD_SIZE}
                        level="M"
                        marginSize={4}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
