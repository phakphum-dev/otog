import { useCallback, useRef } from 'react'

/**
 * A simple clone of `experimental_useEffectEvent` \
 * Note that this is not exactly the same as `experimental_useEffectEvent` \
 * Don't put the callback in the useEffect dependency array as react suggests here \
 * https://react.dev/learn/separating-events-from-effects#declaring-an-effect-event
 * */
// eslint-disable-next-line @typescript-eslint/ban-types
export function useEffectEvent<T extends Function>(func: T): T {
  const ref = useRef<T>(func)
  ref.current = func
  return useCallback((...args: any) => ref.current(...args), []) as unknown as T
}
