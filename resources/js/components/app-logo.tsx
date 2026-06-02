import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();

    if (state === 'collapsed') {
        return <img src="/assets/img/logo-circle.png" alt="Logo" className="size-8 object-contain" />;
    }

    return <img src="/assets/img/logo-with-text.png" alt="Logo" className="h-10 w-auto" />;
}
