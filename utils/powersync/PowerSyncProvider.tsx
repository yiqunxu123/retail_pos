import { PowerSyncDatabase, SyncStatus } from '@powersync/react-native'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { AppSchema } from './schema'
import { SupabaseConnector } from './SupabaseConnector'

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
}

const PowerSyncContext = createContext<PowerSyncContextType | null>(null)

// Provider component
export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let connector: SupabaseConnector | null = null

    const init = async () => {
      try {
        // Initialize the database (local SQLite)
        await powerSyncDb.init()
        console.log('PowerSync local database initialized')
        setIsInitialized(true)

        // Try to connect to PowerSync cloud service
        const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL
        if (powersyncUrl) {
          try {
            connector = new SupabaseConnector()
            await powerSyncDb.connect(connector)
            setIsConnected(true)
            console.log('Connected to PowerSync service')

            // Listen for sync status changes
            powerSyncDb.registerListener({
              statusChanged: (status: SyncStatus) => {
                console.log('[Sync] Status changed:', {
                  connected: status.connected,
                  downloading: status.dataFlowStatus?.downloading,
                  uploading: status.dataFlowStatus?.uploading,
                  lastSyncedAt: status.lastSyncedAt,
                })
              },
            })

            // Upload all pending changes on connect
            console.log('[Init] Uploading pending changes...')
            await connector.uploadData(powerSyncDb)
            console.log('[Init] Pending changes uploaded')
          } catch (connectError) {
            console.log('PowerSync connection failed, using local-only mode:', connectError)
          }
        } else {
          console.log('PowerSync URL not configured, running in local-only mode')
        }
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

  return (
    <PowerSyncContext.Provider value={{ db: powerSyncDb, isConnected, isInitialized }}>
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
