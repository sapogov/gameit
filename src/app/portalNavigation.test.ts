import { describe, expect, it } from 'vitest';
import { portalNavigationItems } from './portalNavigation';

describe('portal navigation', () => {
  it('exposes only the supported portal routes', () => {
    expect(portalNavigationItems.map((item) => item.label)).toEqual(['Home', 'Library', 'Scores', 'Admin']);
    expect(portalNavigationItems.map((item) => item.route)).toEqual(['/', '/library', '/leaderboard', '/admin']);
  });

  it('keeps store and community hidden until real scope exists', () => {
    const labels = portalNavigationItems.map((item) => item.label.toLowerCase());

    expect(labels).not.toContain('store');
    expect(labels).not.toContain('community');
  });
});
