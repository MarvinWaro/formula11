import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, LayoutGrid, Trophy } from 'lucide-react';
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
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage<{ auth: Auth }>();
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug)
        : '/';
    const canManageTournaments =
        page.props.auth?.user?.can_manage_tournaments === true;
    const canBrowseTournaments =
        page.props.auth?.user?.can_browse_tournaments === true;
    const canScore = page.props.auth?.user?.can_score === true;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        ...(canManageTournaments
            ? [
                  {
                      title: 'Tournaments',
                      href: tournamentsIndex().url,
                      icon: Trophy,
                  } satisfies NavItem,
              ]
            : []),
        ...(!canManageTournaments && canBrowseTournaments
            ? [
                  {
                      title: 'Tournaments',
                      href: playerTournamentsIndex().url,
                      icon: Trophy,
                  } satisfies NavItem,
              ]
            : []),
        ...(canScore
            ? [
                  {
                      title: 'Scoring',
                      href: scoringIndex().url,
                      icon: ClipboardList,
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
