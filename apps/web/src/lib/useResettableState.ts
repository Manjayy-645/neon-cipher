import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

/** Reset local presentation state on an input change, before committing stale UI. */
export function useResettableState<T>(initialValue: T, resetKey: string | number): [T, Dispatch<SetStateAction<T>>] {
  const [snapshot, setSnapshot] = useState({ key: resetKey, value: initialValue });
  if (snapshot.key !== resetKey) {
    setSnapshot({ key: resetKey, value: initialValue });
  }
  const setValue = useCallback((action: SetStateAction<T>) => {
    setSnapshot((previous) => {
      if (previous.key !== resetKey) return previous;
      const value = typeof action === 'function' ? (action as (value: T) => T)(previous.value) : action;
      return { key: resetKey, value };
    });
  }, [resetKey]);
  return [snapshot.key === resetKey ? snapshot.value : initialValue, setValue];
}
