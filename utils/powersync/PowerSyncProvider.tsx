import { PowerSyncDatabase, SyncStatus } from '@powersync/react-native'
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { isAuthenticated } from '../api/auth'
import { KhubConnector } from './KhubConnector'
import { AppSchema } from './schema'

// Create the PowerSync database instance
const powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'ititans-powersync.db',
  },
})

// Retry configuration
const RECONNECT_DELAY_MS = 5000 // 5 seconds between reconnect attempts
const MAX_RECONNECT_ATTEMPTS = 3

// Create context
interface PowerSyncContextType {
  db: PowerSyncDatabase
  isConnected: boolean
  isInitialized: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  reconnect: () => Promise<void>
  clearAndResync: () => Promise<void>
}

const PowerSyncContext = createContext<PowerSyncContextType | null>(null)

// Provider component
export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectorRef = useRef<KhubConnector | null>(null)

  // Clear any pending reconnect timeout
  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const connectToSync = useCallback(async (isRetry = false) => {
    const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL
    if (!powersyncUrl) {
      console.log('[PowerSync] URL not configured, running in local-only mode')
      return false
    }

    // Check if user is authenticated with KHUB
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      console.log('[PowerSync] User not authenticated, skipping connection')
      return false
    }

    try {
      // Disconnect first if already connected
      if (powerSyncDb.connected) {
        await powerSyncDb.disconnect()
      }

      // Create a new connector for each connection attempt
      connectorRef.current = new KhubConnector()
      
      console.log(`[PowerSync] Connecting... ${isRetry ? `(retry ${reconnectAttempts.current})` : ''}`)
      
      // Connect - PowerSync will automatically:
      // 1. Download changes from server
      // 2. Upload pending local changes
      // 3. Continue syncing in both directions
      await powerSyncDb.connect(connectorRef.current)
      
      // Note: Don't set isConnected here - wait for statusChanged callback
      // The connect() call initiates connection, but actual connection state
      // is reported via the statusChanged listener
      reconnectAttempts.current = 0 // Reset on successful connection start
      console.log('[PowerSync] Connection initiated - waiting for sync status...')
      
      return true
    } catch (connectError: any) {
      const errorMsg = connectError.message || String(connectError)
      
      // Check for auth-related errors
      if (errorMsg.includes('authentication') || errorMsg.includes('token') || errorMsg.includes('expired') || errorMsg.includes('log in')) {
        console.log('[PowerSync] Auth error - token may be expired, user needs to re-login')
        console.log('[PowerSync] Error details:', errorMsg)
      } else {
        console.log('[PowerSync] Connection failed:', errorMsg)
      }
      setIsConnected(false)
      return false
    }
  }, [])

  // Schedule a reconnection attempt
  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout()
    
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[PowerSync] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`)
      reconnectAttempts.current = 0
      return
    }

    reconnectAttempts.current++
    console.log(`[PowerSync] Scheduling reconnect attempt ${reconnectAttempts.current} in ${RECONNECT_DELAY_MS}ms`)
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      const success = await connectToSync(true)
      if (!success) {
        scheduleReconnect() // Try again
      }
    }, RECONNECT_DELAY_MS)
  }, [connectToSync])

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    clearReconnectTimeout()
    reconnectAttempts.current = 0
    await connectToSync()
  }, [connectToSync])

  // Clear local database and resync from server
  const clearAndResync = useCallback(async () => {
    console.log('[PowerSync] Clearing local database and resyncing...')
    try {
      setIsSyncing(true)
      
      // Disconnect first
      if (powerSyncDb.connected) {
        await powerSyncDb.disconnect()
        console.log('[PowerSync] Disconnected')
      }
      
      // Clear the local database
      await powerSyncDb.disconnectAndClear()
      console.log('[PowerSync] Local database cleared')
      
      // Reinitialize
      await powerSyncDb.init()
      console.log('[PowerSync] Database reinitialized')
      setIsInitialized(true)
      
      // Reconnect to start fresh sync
      reconnectAttempts.current = 0
      await connectToSync()
      console.log('[PowerSync] Clear and resync completed - fresh data will sync automatically')
    } catch (error) {
      console.error('[PowerSync] Clear and resync error:', error)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }, [connectToSync])

  // Trigger a sync (useful after making local changes)
  const triggerSync = useCallback(async () => {
    if (!powerSyncDb.connected) {
      console.log('[PowerSync] Not connected, attempting to reconnect...')
      const success = await connectToSync()
      if (!success) {
        throw new Error('Failed to connect to sync server')
      }
    }
    
    try {
      setIsSyncing(true)
      // Trigger upload of any pending changes
      if (connectorRef.current) {
        await connectorRef.current.uploadData(powerSyncDb)
      }
      setLastSyncTime(new Date())
      console.log('[PowerSync] Manual sync completed')
    } finally {
      setIsSyncing(false)
    }
  }, [connectToSync])

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize the database (local SQLite)
        await powerSyncDb.init()
        console.log('[PowerSync] Local database initialized')
        setIsInitialized(true)

        // Listen for sync status changes
        powerSyncDb.registerListener({
          statusChanged: (status: SyncStatus) => {
            const wasConnected = isConnected
            const nowConnected = status.connected
            
            // Log detailed status for debugging
            console.log('[Sync] Status:', {
              connected: nowConnected,
              downloading: status.dataFlowStatus?.downloading,
              uploading: status.dataFlowStatus?.uploading,
              lastSyncedAt: status.lastSyncedAt,
              hasSynced: status.hasSynced,
            })
            
            // Log any sync errors (using type assertion for extended status)
            const extendedStatus = status as SyncStatus & { downloadError?: Error; uploadError?: Error }
            if (extendedStatus.downloadError) {
              console.error('[Sync] Download error:', extendedStatus.downloadError)
            }
            if (extendedStatus.uploadError) {
              console.error('[Sync] Upload error:', extendedStatus.uploadError)
            }
            
            setIsConnected(nowConnected)
            setIsSyncing(!!status.dataFlowStatus?.downloading || !!status.dataFlowStatus?.uploading)
            
            if (nowConnected) {
              setLastSyncTime(new Date())
              console.log('[PowerSync] Successfully connected and syncing')
            }
            
            // If we just disconnected, try to reconnect
            if (wasConnected && !nowConnected) {
              console.log('[PowerSync] Connection lost, scheduling reconnect...')
              scheduleReconnect()
            }
          },
        })

        // Try to connect if authenticated
        await connectToSync()
      } catch (error) {
        console.error('[PowerSync] Initialization error:', error)
        setIsInitialized(true)
      }
    }

    init()

    // Handle app state changes (reconnect when app comes to foreground)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[PowerSync] App became active, checking connection...')
        if (!powerSyncDb.connected) {
          await connectToSync()
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      clearReconnectTimeout()
      subscription.remove()
      powerSyncDb.disconnect()
    }
  }, [connectToSync, scheduleReconnect])

  return (
    <PowerSyncContext.Provider value={{ 
      db: powerSyncDb, 
      isConnected, 
      isInitialized, 
      isSyncing,
      lastSyncTime,
      reconnect,
      clearAndResync,
    }}>
      {children}
    </PowerSyncContext.Provider>
  )
}

// Hook to access PowerSync
export function usePowerSync() {
  const context = useContext(PowerSyncContext)
  if (!context) {
    throw new Error('usePowerSync must be used within a PowerSyncProvider')
  }
  return context
}

// Export the database instance for direct access if needed
export { powerSyncDb }
