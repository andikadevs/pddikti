import { useEffect, useState } from 'react'

/**
 * Return `value` after it has stopped changing for `delayMs`. Used to debounce
 * search inputs so a request fires once typing settles, not per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
