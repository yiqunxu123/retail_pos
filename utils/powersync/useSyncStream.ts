import { useCallback, useEffect, useRef, useState } from 'react'
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
  }
) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const enabled = options?.enabled ?? true

  // Subscribe to the stream
  const subscribe = useCallback(async () => {
    if (!enabled) return
    
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsStreaming(true)
    setIsLoading(true)
    setError(null)

    try {
      console.log(`[SyncStream] Subscribing to: ${query}`)
      
      // Stream data changes
      for await (const result of powerSyncDb.watch(query, params, {
        signal: abortController.signal,
      })) {
        const rows = result.rows?._array || []
        console.log(`[SyncStream] Received ${rows.length} rows`)
        setData(rows as T[])
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[SyncStream] Error:', err)
        setError(err)
      }
    } finally {
      setIsStreaming(false)
    }
  }, [query, JSON.stringify(params), enabled])

  // Unsubscribe from the stream
  const unsubscribe = useCallback(() => {
    console.log(`[SyncStream] Unsubscribing from: ${query}`)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [query])

  // Refresh data manually
  const refresh = useCallback(async () => {
    try {
      const result = await powerSyncDb.getAll<T>(query, params)
      setData(result)
    } catch (err: any) {
      setError(err)
    }
  }, [query, JSON.stringify(params)])

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
