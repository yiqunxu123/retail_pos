import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InteractionManager } from 'react-native'
import { powerSyncDb } from './PowerSyncProvider'

export interface SyncStreamSnapshotStartMeta {
  streamKey: string
  query: string
  params: any[]
  startedAtMs: number
}

export interface SyncStreamSnapshotEndMeta {
  streamKey: string
  query: string
  params: any[]
  startedAtMs: number
  endedAtMs: number
  durationMs: number
  rowCount: number
  success: boolean
  errorMessage?: string
}

interface UseSyncStreamOptions {
  enabled?: boolean
  keepPreviousData?: boolean
  /** Defer initial query until navigation/animation interactions complete. */
  deferInteractions?: boolean
  onSnapshotStart?: (meta: SyncStreamSnapshotStartMeta) => void
  onSnapshotEnd?: (meta: SyncStreamSnapshotEndMeta) => void
}

const getNowMs = () =>
  typeof globalThis !== 'undefined' &&
  globalThis.performance &&
  typeof globalThis.performance.now === 'function'
    ? globalThis.performance.now()
    : Date.now()

const isObjectRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const shallowEqualObjects = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

const rowsShallowEqual = <T>(prev: T[], next: T[]) => {
  if (prev.length !== next.length) return false
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i] as unknown
    const b = next[i] as unknown
    if (a === b) continue
    if (isObjectRecord(a) && isObjectRecord(b)) {
      if (!shallowEqualObjects(a, b)) return false
      continue
    }
    return false
  }
  return true
}

// Module-level query cache: stores the last known result for each stream key.
// On remount, the cached data is returned instantly (0ms) while the live stream reconnects.
const _queryCache = new Map<string, unknown[]>()

/**
 * Sync Stream Hook - Similar to PowerSync Sync Streams (Early Alpha)
 * 
 * Provides on-demand data streaming with:
 * - Dynamic query parameters
 * - Auto-subscribe on mount
 * - Auto-unsubscribe on unmount
 * - Real-time updates via watch()
 * - Optional deferInteractions to wait for navigation animations
 * - Eager query start during render to eliminate useEffect scheduling delay
 * - Module-level cache for instant remount data
 */
export function useSyncStream<T>(
  query: string,
  params: any[] = [],
  options?: UseSyncStreamOptions
) {
  const cacheKey = `${query}::${JSON.stringify(params)}`
  const cached = _queryCache.get(cacheKey) as T[] | undefined

  const [data, setData] = useState<T[]>(() => cached ?? [])
  const [isLoading, setIsLoading] = useState(() => !cached)
  const [error, setError] = useState<Error | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const dataRef = useRef<T[]>(cached ?? [])
  const activeStreamKeyRef = useRef<string | null>(null)
  const initialSnapshotDoneRef = useRef(false)
  const onSnapshotStartRef = useRef<UseSyncStreamOptions['onSnapshotStart']>(undefined)
  const onSnapshotEndRef = useRef<UseSyncStreamOptions['onSnapshotEnd']>(undefined)
  const enabled = options?.enabled ?? true
  const keepPreviousData = options?.keepPreviousData ?? true
  const deferInteractions = options?.deferInteractions ?? false

  // Gate: wait for interactions (navigation animations) to finish before querying.
  const [interactionsReady, setInteractionsReady] = useState(!deferInteractions)
  useEffect(() => {
    if (!deferInteractions) {
      setInteractionsReady(true)
      return
    }
    const handle = InteractionManager.runAfterInteractions(() => {
      setInteractionsReady(true)
    })
    return () => handle.cancel()
  }, []) // only on mount

  const effectiveEnabled = enabled && interactionsReady

  const paramsKey = useMemo(() => JSON.stringify(params), [params])
  const stableParams = useMemo(() => params, [paramsKey])
  const streamKey = useMemo(() => `${query}::${paramsKey}`, [query, paramsKey])


  useEffect(() => {
    onSnapshotStartRef.current = options?.onSnapshotStart
    onSnapshotEndRef.current = options?.onSnapshotEnd
  }, [options?.onSnapshotEnd, options?.onSnapshotStart])

  // ---------------------------------------------------------------------------
  // Eager query: kick off getAll() during render when streamKey changes,
  // so the query is already in-flight by the time useEffect fires subscribe().
  // This eliminates the ~400ms useEffect scheduling delay on pagination.
  // ---------------------------------------------------------------------------
  const eagerQueryRef = useRef<{ key: string; promise: Promise<T[]>; startMs: number } | null>(null)
  const prevEagerKeyRef = useRef<string | null>(null)

  if (effectiveEnabled && streamKey !== prevEagerKeyRef.current) {
    prevEagerKeyRef.current = streamKey
    eagerQueryRef.current = {
      key: streamKey,
      promise: powerSyncDb.getAll<T>(query, stableParams),
      startMs: getNowMs(),
    }
  }

  // Subscribe to the stream
  const subscribe = useCallback(async () => {
    if (!effectiveEnabled) return

    // Guard against redundant resubscribe with an identical stream key.
    if (activeStreamKeyRef.current === streamKey && abortControllerRef.current) {
      return
    }
    
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    activeStreamKeyRef.current = streamKey
    initialSnapshotDoneRef.current = false

    setIsStreaming(true)
    // Keep existing data stable while reconnecting to avoid UI flashing.
    setIsLoading(keepPreviousData ? dataRef.current.length === 0 : true)
    setError(null)

    const snapshotStartMs = eagerQueryRef.current?.key === streamKey
      ? eagerQueryRef.current.startMs
      : getNowMs()
    onSnapshotStartRef.current?.({
      streamKey,
      query,
      params: stableParams,
      startedAtMs: snapshotStartMs,
    })

    try {
      // Use the eagerly-started query if available, otherwise fall back to a new one.
      let initialRows: T[]
      if (eagerQueryRef.current?.key === streamKey) {
        initialRows = await eagerQueryRef.current.promise
        eagerQueryRef.current = null
      } else {
        initialRows = await powerSyncDb.getAll<T>(query, stableParams)
      }

      if (abortController.signal.aborted) {
        return
      }
      dataRef.current = initialRows
      _queryCache.set(streamKey, initialRows)
      setData(initialRows)
      setIsLoading(false)
      initialSnapshotDoneRef.current = true
      const snapshotEndMs = getNowMs()
      onSnapshotEndRef.current?.({
        streamKey,
        query,
        params: stableParams,
        startedAtMs: snapshotStartMs,
        endedAtMs: snapshotEndMs,
        durationMs: snapshotEndMs - snapshotStartMs,
        rowCount: initialRows.length,
        success: true,
      })

      // Stream data changes — skip the first watch result when getAll
      // already provided the initial snapshot to avoid a redundant setState.
      let isFirstWatchResult = true
      for await (const result of powerSyncDb.watch(query, stableParams, {
        signal: abortController.signal,
      })) {
        if (abortController.signal.aborted) {
          break
        }
        const rows = result.rows?._array || []
        if (isFirstWatchResult && initialSnapshotDoneRef.current) {
          isFirstWatchResult = false
          // Skip if row count matches initial snapshot (no change in between).
          if (rows.length === dataRef.current.length) continue
        }
        isFirstWatchResult = false
        // Skip setState if data hasn't actually changed (avoids needless re-renders)
        const prev = dataRef.current
        if (rowsShallowEqual(prev, rows as T[])) {
          continue
        }
        dataRef.current = rows as T[]
        _queryCache.set(streamKey, rows as T[])
        setData(rows as T[])
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[SyncStream] Error:', {
          message: err?.message ? String(err.message) : String(err),
          streamKey,
          query,
          params: stableParams,
        })
        setError(err)
        const snapshotEndMs = getNowMs()
        onSnapshotEndRef.current?.({
          streamKey,
          query,
          params: stableParams,
          startedAtMs: snapshotStartMs,
          endedAtMs: snapshotEndMs,
          durationMs: snapshotEndMs - snapshotStartMs,
          rowCount: 0,
          success: false,
          errorMessage: err?.message ? String(err.message) : String(err),
        })
      }
    } finally {
      // Only clear streaming flag for the currently active stream.
      if (activeStreamKeyRef.current === streamKey) {
        activeStreamKeyRef.current = null
      }
      setIsStreaming(false)
    }
  }, [
    effectiveEnabled,
    keepPreviousData,
    query,
    stableParams,
    streamKey,
  ])

  // Unsubscribe from the stream
  const unsubscribe = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    activeStreamKeyRef.current = null
    setIsStreaming(false)
  }, [])

  // Refresh data manually
  const refresh = useCallback(async () => {
    try {
      const result = await powerSyncDb.getAll<T>(query, stableParams)
      dataRef.current = result
      setData(result)
    } catch (err: any) {
      setError(err)
    }
  }, [query, stableParams])

  // Auto-subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  return {
    data,
    isLoading,
    error,
    isStreaming,
    subscribe,
    unsubscribe,
    refresh,
  }
}

/**
 * Create a typed sync stream for a specific table
 */
export function createSyncStream<T>(tableName: string) {
  return {
    useAll: (orderBy?: string) => {
      const query = orderBy 
        ? `SELECT * FROM ${tableName} ORDER BY ${orderBy}`
        : `SELECT * FROM ${tableName}`
      return useSyncStream<T>(query)
    },
    
    useWhere: (condition: string, params: any[], orderBy?: string) => {
      const query = orderBy
        ? `SELECT * FROM ${tableName} WHERE ${condition} ORDER BY ${orderBy}`
        : `SELECT * FROM ${tableName} WHERE ${condition}`
      return useSyncStream<T>(query, params)
    },
    
    useById: (id: string) => {
      return useSyncStream<T>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      )
    },
  }
}
