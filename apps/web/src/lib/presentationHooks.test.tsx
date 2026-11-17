import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResettableState } from './useResettableState';
import { useClock } from './useClock';

afterEach(() => vi.useRealTimers());
describe('presentation state lifecycle', () => {
  it('resets when the input changes and ignores stale asynchronous updates', () => {
    const { result, rerender } = renderHook(({ key }) => useResettableState('', key), { initialProps: { key: 'first' } });
    const staleUpdate = result.current[1];
    act(() => result.current[1]('typed'));
    expect(result.current[0]).toBe('typed');
    rerender({ key: 'second' });
    expect(result.current[0]).toBe('');
    act(() => staleUpdate('old dialogue'));
    expect(result.current[0]).toBe('');
    act(() => result.current[1]((value) => value + 'new dialogue'));
    expect(result.current[0]).toBe('new dialogue');
  });
  it('samples elapsed time and removes its interval on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { result, unmount } = renderHook(() => useClock(1000));
    expect(result.current).toBe(1000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
