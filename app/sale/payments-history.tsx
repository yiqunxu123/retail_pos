/**
 * Payments History - Redirects to unified Sales & Payments History with Payments tab.
 * Kept for backward compatibility (e.g. from Dashboard "Payments History" card).
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function PaymentsHistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: "/sale/sales-history", params: { tab: "payments" } } as any);
  }, [router]);

  return null;
}
