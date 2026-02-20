import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { powerSyncDb } from './PowerSyncProvider'

/**
 * Sync Stream Hook - Similar to PowerSync Sync Streams (Early Alpha)
 * 
 * Provides on-demand data streaming with:
 * - Dynamic query parameters
 * - Auto-subscribe on mount
 * - Auto-unsubscribe on unmount
 * - Real-time updates via watch()
 */
export function useSyncStream<T>(
  query: string,
  params: any[] = [],
  options?: {
    enabled?: boolean
    keepPreviousData?: boolean
  }
) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const dataRef = useRef<T[]>([])
  const activeStreamKeyRef = useRef<string | null>(null)
  const enabled = options?.enabled ?? true
  const keepPreviousData = options?.keepPreviousData ?? true
  const paramsKey = useMemo(() => JSON.stringify(params), [params])
  const stableParams = useMemo(() => params, [paramsKey])
  const streamKey = useMemo(() => `${query}::${paramsKey}`, [query, paramsKey])

  // Subscribe to the stream
  const subscribe = useCallback(async () => {
    if (!enabled) return

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

    setIsStreaming(true)
    // Keep existing data stable while reconnecting to avoid UI flashing.
    setIsLoading(keepPreviousData ? dataRef.current.length === 0 : true)
    setError(null)

    try {
      // Stream data changes
      for await (const result of powerSyncDb.watch(query, stableParams, {
        signal: abortController.signal,
      })) {
        const rows = result.rows?._array || []
        dataRef.current = rows as T[]
        setData(rows as T[])
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[SyncStream] Error:', err)
        setError(err)
      }
    } finally {
      // Only clear streaming flag for the currently active stream.
      if (activeStreamKeyRef.current === streamKey) {
        activeStreamKeyRef.current = null
      }
      setIsStreaming(false)
    }
  }, [enabled, keepPreviousData, query, stableParams, streamKey])

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
