import { usePathname, useRouter } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * useAppNavigation - 单例模式导航 hook
 *
 * 防止导航栈堆积：
 * 1. 如果已经在目标路径上则跳过导航
 * 2. 先 dismissAll() 回到根页面，再 push 到目标页
 *    确保栈始终只有 [首页] 或 [首页, 目标页] 两层
 * 3. 防抖处理，防止快速连续点击导致多次导航
 *
 * 还提供 safeGoBack：有历史栈时 back()，没有时 fallback 到首页
 */
export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);

  /** 导航到指定路径（单例模式，栈始终保持最多两层） */
  const navigateTo = useCallback(
    (path: string) => {
      // 已在目标页面，跳过
      if (pathname === path) return;
      // 防抖：防止快速连续点击
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (path === "/" || path === "/index") {
        // 回首页：清空栈回到根页面
        if (router.canGoBack()) {
          router.dismissAll();
        } else {
          // 无历史栈（deep link 等场景），用 replace 确保能回首页
          router.replace("/");
        }
      } else {
        // 去其他页面：先回根页面，再 push 目标页
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.push(path as any);
      }

      // 延迟后解锁
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    },
    [pathname, router]
  );

  /** 安全返回：有历史栈时 back()，无历史栈时 fallback 到首页 */
  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  return { navigateTo, safeGoBack, pathname, router };
}
