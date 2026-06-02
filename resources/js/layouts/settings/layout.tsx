import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { index as adminHeisIndex } from '@/routes/admin/heis';
import { index as adminRolesIndex } from '@/routes/admin/roles';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as teams } from '@/routes/teams';
import type { Auth, NavItem } from '@/types';

const accountNavItems: NavItem[] = [
    { title: 'Profile', href: edit(), icon: null },
    { title: 'Security', href: editSecurity(), icon: null },
    { title: 'Teams', href: teams(), icon: null },
    { title: 'Appearance', href: editAppearance(), icon: null },
];

const userManagementNavItems: NavItem[] = [
    { title: 'Users', href: adminUsersIndex(), icon: null },
    { title: 'Roles & Permissions', href: adminRolesIndex(), icon: null },
];

const systemNavItems: NavItem[] = [
    { title: 'HEIs', href: adminHeisIndex(), icon: null },
];

type PageProps = { auth: Auth };

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const page = usePage<PageProps>();
    const { auth } = page.props;
    const isAdmin = auth.user?.is_admin === true;
    const isAdminPage =
        page.component.startsWith('settings/users') ||
        page.component.startsWith('settings/roles') ||
        page.component.startsWith('settings/heis');

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-56">
                    <nav
                        className="flex flex-col space-y-4 space-x-0"
                        aria-label="Settings"
                    >
                        <div>
                            <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Account
                            </p>
                            <div className="flex flex-col space-y-1">
                                {accountNavItems.map((item, index) => (
                                    <Button
                                        key={`${toUrl(item.href)}-${index}`}
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn('w-full justify-start', {
                                            'bg-muted': isCurrentOrParentUrl(
                                                item.href,
                                            ),
                                        })}
                                    >
                                        <Link href={item.href}>
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isAdmin && (
                            <>
                                <div>
                                    <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        User Management
                                    </p>
                                    <div className="flex flex-col space-y-1">
                                        {userManagementNavItems.map(
                                            (item, index) => (
                                                <Button
                                                    key={`${toUrl(item.href)}-${index}`}
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                    className={cn(
                                                        'w-full justify-start',
                                                        {
                                                            'bg-muted':
                                                                isCurrentOrParentUrl(
                                                                    item.href,
                                                                ),
                                                        },
                                                    )}
                                                >
                                                    <Link href={item.href}>
                                                        {item.title}
                                                    </Link>
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        System Configuration
                                    </p>
                                    <div className="flex flex-col space-y-1">
                                        {systemNavItems.map((item, index) => (
                                            <Button
                                                key={`${toUrl(item.href)}-${index}`}
                                                size="sm"
                                                variant="ghost"
                                                asChild
                                                className={cn(
                                                    'w-full justify-start',
                                                    {
                                                        'bg-muted':
                                                            isCurrentOrParentUrl(
                                                                item.href,
                                                            ),
                                                    },
                                                )}
                                            >
                                                <Link href={item.href}>
                                                    {item.title}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className={cn('flex-1', !isAdminPage && 'md:max-w-2xl')}>
                    <section
                        className={cn('space-y-12', !isAdminPage && 'max-w-xl')}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
