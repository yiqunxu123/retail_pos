import { useEffect, useRef } from "react";
import {
  RENDER_TRACE_ENABLED,
  RENDER_TRACE_THROTTLE_MS,
  RENDER_TRACE_VERBOSE,
} from "../constants";

type TracedProps = Record<string, unknown>;

interface UseRenderTraceOptions {
  enabled?: boolean;
  throttleMs?: number;
}

declare global {
  var __RENDER_TRACE_ENABLED__: boolean | undefined;
  var __RENDER_TRACE_VERBOSE__: boolean | undefined;
}

function resolveTraceEnabled(localEnabled: boolean | undefined): boolean {
  const globalEnabled =
    typeof globalThis !== "undefined" &&
    typeof globalThis.__RENDER_TRACE_ENABLED__ === "boolean"
      ? globalThis.__RENDER_TRACE_ENABLED__
      : undefined;

  const enabled = globalEnabled ?? RENDER_TRACE_ENABLED;
  return __DEV__ && enabled && localEnabled !== false;
}

function resolveTraceVerbose(): boolean {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.__RENDER_TRACE_VERBOSE__ === "boolean"
  ) {
    return globalThis.__RENDER_TRACE_VERBOSE__;
  }
  return RENDER_TRACE_VERBOSE;
}

function formatTraceValue(value: unknown): unknown {
  if (typeof value === "function") {
    return `[fn:${value.name || "anonymous"}]`;
  }
  if (Array.isArray(value)) {
    return `[array:${value.length}]`;
  }
  if (value && typeof value === "object") {
    return "[object]";
  }
  return value;
}

/**
 * Logs component render count and shallow prop changes.
 * Intended for local performance debugging only.
 */
export function useRenderTrace(
  componentName: string,
  trackedProps: TracedProps,
  options?: UseRenderTraceOptions
) {
  const renderCountRef = useRef(0);
  const previousPropsRef = useRef<TracedProps | null>(null);
  const lastLogAtRef = useRef(0);

  renderCountRef.current += 1;

  useEffect(() => {
    if (!resolveTraceEnabled(options?.enabled)) {
      return;
    }

    const throttleMs = options?.throttleMs ?? RENDER_TRACE_THROTTLE_MS;
    const now = Date.now();
    if (throttleMs > 0 && now - lastLogAtRef.current < throttleMs) {
      return;
    }
    lastLogAtRef.current = now;

    const prev = previousPropsRef.current;
    const next = { ...trackedProps };

    if (!prev) {
      console.log(`[RenderTrace] ${componentName} #${renderCountRef.current} mounted`);
      previousPropsRef.current = next;
      return;
    }

    const changedKeys = Array.from(
      new Set([...Object.keys(prev), ...Object.keys(next)])
    ).filter((key) => !Object.is(prev[key], next[key]));

    if (changedKeys.length === 0) {
      console.log(`[RenderTrace] ${componentName} #${renderCountRef.current} changed: none`);
      previousPropsRef.current = next;
      return;
    }

    if (resolveTraceVerbose()) {
      const verboseDiff = changedKeys.reduce((acc, key) => {
        acc[key] = {
          from: formatTraceValue(prev[key]),
          to: formatTraceValue(next[key]),
        };
        return acc;
      }, {} as Record<string, { from: unknown; to: unknown }>);

      console.log(
        `[RenderTrace] ${componentName} #${renderCountRef.current} changed: ${changedKeys.join(", ")}`,
        verboseDiff
      );
    } else {
      console.log(
        `[RenderTrace] ${componentName} #${renderCountRef.current} changed: ${changedKeys.join(", ")}`
      );
    }

    previousPropsRef.current = next;
  });
}
