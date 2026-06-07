import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, Gavel, LayoutGrid, Timer, Trophy } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as scoringIndex } from '@/routes/admin/scoring';
import { index as tournamentsIndex } from '@/routes/admin/tournaments';
import { index as playerTournamentsIndex } from '@/routes/player/tournaments';
import { index as umpireIndex } from '@/routes/umpire';
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage<{ auth: Auth }>();
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug)
        : '/';
    const user = page.props.auth?.user;
    const roleNames = user?.role_names ?? [];
    const isPlayer = roleNames.includes('player');

    // Prefer the explicit computed flag; fall back to role-based inference so
    // a stale prop never wipes the sidebar nav.
    const canManageTournaments =
        user?.can_manage_tournaments === true ||
        roleNames.includes('admin') ||
        roleNames.includes('super_admin') ||
        roleNames.includes('court_owner');
    const canBrowseTournaments =
        !canManageTournaments &&
        (user?.can_browse_tournaments === true || isPlayer);
    const canScore = user?.can_score === true;
    const canUmpire =
        user?.can_umpire_score === true ||
        roleNames.includes('umpire');

    const tournamentChildren: NavItem[] = [];

    if (canManageTournaments) {
        tournamentChildren.push({
            title: 'Overview',
            href: tournamentsIndex().url,
            icon: ClipboardList,
        });
    } else if (canBrowseTournaments) {
        tournamentChildren.push({
            title: 'Overview',
            href: playerTournamentsIndex().url,
            icon: ClipboardList,
        });
    }

    if (canScore) {
        tournamentChildren.push({
            title: 'Scoring',
            href: scoringIndex().url,
            icon: Gavel,
        });
    }

    if (canUmpire) {
        tournamentChildren.push({
            title: 'Umpire',
            href: umpireIndex().url,
            icon: Timer,
        });
    }

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        ...(tournamentChildren.length === 1
            ? [
                  {
                      title: 'Tournaments',
                      href: tournamentChildren[0].href,
                      icon: Trophy,
                  } satisfies NavItem,
              ]
            : tournamentChildren.length > 1
              ? [
                    {
                        title: 'Tournaments',
                        href: tournamentChildren[0].href,
                        icon: Trophy,
                        items: tournamentChildren,
                    } satisfies NavItem,
                ]
              : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
