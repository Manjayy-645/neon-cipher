import { beforeEach, describe, expect, it } from 'vitest';
import { getProfileReturnPath, rememberProfileOrigin } from './profile-navigation';

beforeEach(() => sessionStorage.clear());
describe('profile return navigation', () => {
  it('returns to the actual local entry point', () => {
    rememberProfileOrigin('/market');
    expect(getProfileReturnPath()).toBe('/market');
  });
  it('provides a city fallback for direct loads and rejects external origins', () => {
    expect(getProfileReturnPath()).toBe('/map');
    rememberProfileOrigin('//example.com');
    expect(getProfileReturnPath()).toBe('/map');
    sessionStorage.setItem('nc.profile-return', 'https://example.com');
    expect(getProfileReturnPath()).toBe('/map');
  });
});
