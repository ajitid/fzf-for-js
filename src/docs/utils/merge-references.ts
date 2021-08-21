import type { MutableRefObject } from 'react';

type References<T extends HTMLElement = HTMLElement> =
  | MutableRefObject<unknown>
  | ((element: T | null) => void)
  | undefined
  | null;

/**
 * Utility function that let's you assign multiple references to a 'ref' prop
 * @param refs list of MutableRefObject's and/or callbacks
 */
export function mergeReferences<T extends HTMLElement = HTMLElement>(
  // Suppressing ESLint as the function assigns `MutableRefObject` a value.
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  ...references: References<T>[]
) {
  return (element: T | null) => {
    for (const ref of references) {
      if (!ref) {
        continue;
      }

      if (typeof ref === 'function') {
        ref(element);
      } else {
        ref.current = element;
      }
    }
  };
}

