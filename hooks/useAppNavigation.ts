import { usePathname, useRouter } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * useAppNavigation - Singleton-style navigation hook
 *
 * Prevents navigation stack buildup:
 * 1. Skip navigation if already on the target path
 * 2. Call dismissAll() to return to root, then push to target page
 *    so the stack stays at most two levels: [home] or [home, target]
 * 3. Debounced to avoid multiple navigations from rapid clicks
 *
 * Also provides safeGoBack: back() when there is history, fallback to home otherwise
 */
export function useAppNavigation() {
  const router = useRouter();
  const pathname = String(usePathname() || "/");
  const isNavigatingRef = useRef(false);

  /** Navigate to the given path (singleton mode, stack stays at most two levels) */
  const navigateTo = useCallback(
    (path: string) => {
      // Already on target page, skip
      if (pathname === path) return;
      // Debounce: prevent rapid consecutive clicks
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (path === "/" || path === "/index") {
        // Go home: clear stack back to root
        if (router.canGoBack()) {
          router.dismissAll();
        } else {
          // No history (e.g. deep link), use replace to ensure we can get home
          router.replace("/");
        }
      } else {
        // Go to other page: return to root first, then push target
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.push(path as any);
      }

      // Unlock after delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    },
    [pathname, router]
  );

  /** Safe back: back() when there is history, fallback to home otherwise */
  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  return { navigateTo, safeGoBack, pathname, router };
}
