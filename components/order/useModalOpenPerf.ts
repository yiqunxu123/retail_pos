import { useCallback, useEffect, useRef } from "react";

function nowMs(): number {
  const perf = globalThis.performance;
  if (perf && typeof perf.now === "function") {
    return perf.now();
  }
  return Date.now();
}

export function useModalOpenPerf(modalName: string, visible: boolean) {
  const seqRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const reportedSeqRef = useRef(0);

  const markOpenClick = useCallback(() => {
    seqRef.current += 1;
    const seq = seqRef.current;
    const start = nowMs();
    startRef.current = start;

    console.log(
      `[ModalPerf][${modalName}] open_click seq=${seq} t_ms=${start.toFixed(1)}`
    );
  }, [modalName]);

  useEffect(() => {
    if (!visible) return;
    const seq = seqRef.current;
    if (seq === 0 || reportedSeqRef.current === seq) return;

    const raf = requestAnimationFrame(() => {
      const end = nowMs();
      const start = startRef.current;
      const cost = start == null ? NaN : end - start;
      const costText = Number.isFinite(cost) ? cost.toFixed(1) : "NaN";

      console.log(
        `[ModalPerf][${modalName}] open_visible seq=${seq} cost_ms=${costText}`
      );
      reportedSeqRef.current = seq;
    });

    return () => cancelAnimationFrame(raf);
  }, [modalName, visible]);

  return { markOpenClick };
}
