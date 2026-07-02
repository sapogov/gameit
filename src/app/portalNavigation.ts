export const portalNavigationItems = [
  {
    label: 'Home',
    shortLabel: 'Home',
    route: '/',
    ariaLabel: 'Go to portal home',
  },
  {
    label: 'Library',
    shortLabel: 'Library',
    route: '/library',
    ariaLabel: 'Go to game library',
  },
  {
    label: 'Scores',
    shortLabel: 'Scores',
    route: '/leaderboard',
    ariaLabel: 'Go to scores',
  },
  {
    label: 'Admin',
    shortLabel: 'Admin',
    route: '/admin',
    ariaLabel: 'Go to admin',
  },
] as const;

export type PortalNavigationRoute = (typeof portalNavigationItems)[number]['route'];

export const portalRouteSet = new Set<string>(portalNavigationItems.map((item) => item.route));
