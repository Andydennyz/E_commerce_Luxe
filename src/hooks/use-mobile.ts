import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Checks if the screen is mobile (equivalent to md in tailwind)
 * @returns Whether the screen is mobile
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
