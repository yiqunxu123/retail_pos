import { PowerSyncDatabase, SyncStatus } from '@powersync/react-native'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
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

// Create context
interface PowerSyncContextType {
  db: PowerSyncDatabase
  isConnected: boolean
  isInitialized: boolean
  reconnect: () => Promise<void>
}

const PowerSyncContext = createContext<PowerSyncContextType | null>(null)

// Provider component
export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const connectToSync = async () => {
    const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL
    if (!powersyncUrl) {
      console.log('PowerSync URL not configured, running in local-only mode')
      return
    }

    // Check if user is authenticated with KHUB
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      console.log('User not authenticated, skipping PowerSync connection')
      return
    }

    try {
      const connector = new KhubConnector()
      
      // Connect - PowerSync will automatically:
      // 1. Download changes from server
      // 2. Upload pending local changes
      // 3. Continue syncing in both directions
      await powerSyncDb.connect(connector)
      setIsConnected(true)
      console.log('[PowerSync] Connected - auto-sync enabled')

      // Listen for sync status changes
      powerSyncDb.registerListener({
        statusChanged: (status: SyncStatus) => {
          console.log('[Sync] Status:', {
            connected: status.connected,
            downloading: status.dataFlowStatus?.downloading,
            uploading: status.dataFlowStatus?.uploading,
          })
          setIsConnected(status.connected)
        },
      })
    } catch (connectError) {
      console.log('[PowerSync] Connection failed, using local-only mode:', connectError)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize the database (local SQLite)
        await powerSyncDb.init()
        console.log('PowerSync local database initialized')
        setIsInitialized(true)

        // Try to connect if authenticated
        await connectToSync()
      } catch (error) {
        console.error('PowerSync initialization error:', error)
        setIsInitialized(true)
      }
    }

    init()

    return () => {
      powerSyncDb.disconnect()
    }
  }, [])

  // Reconnect function for when user logs in
  const reconnect = async () => {
    if (!isConnected) {
      await connectToSync()
    }
  }

  return (
    <PowerSyncContext.Provider value={{ db: powerSyncDb, isConnected, isInitialized, reconnect }}>
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
