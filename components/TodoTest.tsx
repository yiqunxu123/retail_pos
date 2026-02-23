import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { usePowerSync } from '../utils/powersync/PowerSyncProvider'
import { Setting, TenantUser } from '../utils/powersync/schema'
import { useSyncStream } from '../utils/powersync/useSyncStream'

// Profile Editor Component
const ProfileEditor = () => {
  const { user } = useAuth()
  const { db } = usePowerSync()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Watch current user from PowerSync
  const { data: users } = useSyncStream<TenantUser & { id: string }>(
    `SELECT * FROM tenant_users WHERE id = ?`,
    user?.id ? [user.id] : [],
    { enabled: !!user?.id }
  )

  const currentUser = users[0]

  // Update local state when synced user changes
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || '')
      setLastName(currentUser.last_name || '')
    }
  }, [currentUser])

  const handleSave = async () => {
    if (!user?.id || !db) {
      Alert.alert('Error', 'Not logged in')
      return
    }

    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required')
      return
    }

    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      
      // Update using writeTransaction so PowerSync tracks the change
      // PowerSync will automatically sync to backend when online
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `UPDATE tenant_users SET first_name = ?, last_name = ?, updated_at = ? WHERE id = ?`,
          [firstName.trim(), lastName.trim(), now, user.id]
        )
      })

      console.log('[ProfileEditor] Updated locally - PowerSync will auto-sync when online')
      Alert.alert('Success', 'Profile saved! Will sync automatically when online.')
    } catch (error) {
      console.error('[ProfileEditor] Update error:', error)
      Alert.alert('Error', 'Failed to update profile: ' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Profile Editor</Text>
        <Text className="text-gray-500 text-sm">Loading user data...</Text>
      </View>
    )
  }

  return (
    <View className="bg-white rounded-xl p-4 mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-3">
        Edit Profile (Two-way Sync Test)
      </Text>
      
      <View className="mb-3">
        <Text className="text-xs text-gray-500 mb-1">First Name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          className="bg-gray-100 p-3 rounded-lg text-gray-800"
        />
      </View>
      
      <View className="mb-3">
        <Text className="text-xs text-gray-500 mb-1">Last Name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          className="bg-gray-100 p-3 rounded-lg text-gray-800"
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">
          ID: {user?.id} | Username: {currentUser.username}
        </Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg ${isSaving ? 'bg-gray-400' : 'bg-green-500'}`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">Save & Sync</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// A single setting item component
const SettingItem = ({
  setting,
}: {
  setting: Setting & { id: string }
}) => {
  // Parse JSON value for display
  let displayValue = setting.value || ''
  try {
    if (setting.value) {
      const parsed = JSON.parse(setting.value)
      displayValue = typeof parsed === 'object' 
        ? JSON.stringify(parsed, null, 2).substring(0, 100) + '...'
        : String(parsed)
    }
  } catch {
    // Keep original if not JSON
  }

  return (
    <View className="bg-white p-4 mb-2 rounded-xl">
      <Text className="text-sm font-semibold text-blue-600">{setting.type}</Text>
      {setting.sub_type && (
        <Text className="text-xs text-gray-500">{setting.sub_type}</Text>
      )}
      <Text className="text-xs text-gray-700 mt-1" numberOfLines={2}>
        {displayValue}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">
        Updated: {setting.updated_at}
      </Text>
    </View>
  )
}

// Main Test component
export default function TodoTest() {
  const { db, isConnected, isInitialized, isSyncing, lastSyncTime, reconnect } = usePowerSync()
  const [refreshing, setRefreshing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    settings: 0,
    products: 0,
    categories: 0,
    brands: 0,
    customers: 0,
    stocks: 0,
    tags: 0,
    tenant_users: 0,
  })

  // Use Sync Stream to watch settings
  const {
    data: settings,
    isLoading,
    isStreaming,
    refresh,
  } = useSyncStream<Setting & { id: string }>('SELECT * FROM settings ORDER BY updated_at DESC LIMIT 10')

  // Load stats on mount and refresh
  const loadStats = useCallback(async () => {
    if (!db) return
    
    try {
      const results = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM settings'),
        db.execute('SELECT COUNT(*) as count FROM products'),
        db.execute('SELECT COUNT(*) as count FROM categories'),
        db.execute('SELECT COUNT(*) as count FROM brands'),
        db.execute('SELECT COUNT(*) as count FROM customers'),
        db.execute('SELECT COUNT(*) as count FROM stocks'),
        db.execute('SELECT COUNT(*) as count FROM tags'),
        db.execute('SELECT COUNT(*) as count FROM tenant_users'),
      ])
      
      setStats({
        settings: results[0].rows?._array?.[0]?.count || 0,
        products: results[1].rows?._array?.[0]?.count || 0,
        categories: results[2].rows?._array?.[0]?.count || 0,
        brands: results[3].rows?._array?.[0]?.count || 0,
        customers: results[4].rows?._array?.[0]?.count || 0,
        stocks: results[5].rows?._array?.[0]?.count || 0,
        tags: results[6].rows?._array?.[0]?.count || 0,
        tenant_users: results[7].rows?._array?.[0]?.count || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [db])

  useEffect(() => {
    if (isInitialized) {
      loadStats()
    }
  }, [isInitialized, loadStats])

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    await loadStats()
    setRefreshing(false)
  }, [refresh, loadStats])

  if (!isInitialized) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Initializing PowerSync...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 p-5 bg-gray-100">
      {/* Header */}
      <Text className="text-2xl font-bold text-center text-gray-800 mb-2">
        PowerSync Sync Test
      </Text>
      
      {/* Connection Status */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">
              {isSyncing ? '🔄' : isConnected ? '✅' : '📴'}
            </Text>
            <View>
              <Text className="text-sm font-semibold text-gray-800">
                {isSyncing ? 'Syncing...' : isConnected ? 'Connected' : 'Disconnected'}
              </Text>
              {lastSyncTime && (
                <Text className="text-xs text-gray-500">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row gap-2">
            {!isConnected && (
              <TouchableOpacity 
                onPress={async () => {
                  setSyncError(null)
                  try {
                    await reconnect()
                  } catch (e: any) {
                    setSyncError(e.message)
                  }
                }} 
                className="px-3 py-2 bg-orange-500 rounded-lg"
              >
                <Text className="text-xs text-white font-semibold">Reconnect</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={async () => {
                setSyncError(null)
                try {
                  await reconnect()
                  await loadStats()
                } catch (e: any) {
                  setSyncError(e.message)
                }
              }} 
              disabled={isSyncing}
              className={`px-3 py-2 rounded-lg ${isSyncing ? 'bg-gray-300' : 'bg-blue-500'}`}
            >
              <Text className="text-xs text-white font-semibold">
                {isSyncing ? 'Syncing...' : 'Refresh Sync'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {syncError && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
            <Text className="text-xs text-red-600">{syncError}</Text>
          </View>
        )}
        
        {isStreaming && (
          <View className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
            <Text className="text-xs text-green-600">📡 Streaming live updates...</Text>
          </View>
        )}
      </View>

      {/* Profile Editor - Two-way sync test */}
      <ProfileEditor />

      {/* Clear Pending Transactions Button */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-gray-700">Clear Failed Uploads</Text>
            <Text className="text-xs text-gray-500">Clear pending transactions that can't sync</Text>
          </View>
          <TouchableOpacity 
            onPress={async () => {
              if (!db) return
              setSyncError(null)
              try {
                // Clear all pending CRUD transactions
                await db.execute('DELETE FROM ps_crud')
                await loadStats()
                Alert.alert('Success', 'Cleared pending transactions. Errors should stop now.')
              } catch (e: any) {
                console.error('[Clear] Error:', e)
                setSyncError('Clear failed: ' + e.message)
              }
            }} 
            className="px-4 py-2 rounded-lg bg-red-500"
          >
            <Text className="text-white font-semibold">Clear Queue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Synced Data Count:</Text>
        <View className="flex-row flex-wrap">
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Settings</Text>
            <Text className="text-lg font-bold text-blue-600">{stats.settings}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Products</Text>
            <Text className="text-lg font-bold text-green-600">{stats.products}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Categories</Text>
            <Text className="text-lg font-bold text-purple-600">{stats.categories}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Brands</Text>
            <Text className="text-lg font-bold text-orange-600">{stats.brands}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Customers</Text>
            <Text className="text-lg font-bold text-pink-600">{stats.customers}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Stocks</Text>
            <Text className="text-lg font-bold text-cyan-600">{stats.stocks}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Tags</Text>
            <Text className="text-lg font-bold text-yellow-600">{stats.tags}</Text>
          </View>
          <View className="w-1/4 p-1">
            <Text className="text-xs text-gray-500">Users</Text>
            <Text className="text-lg font-bold text-red-600">{stats.tenant_users}</Text>
          </View>
        </View>
      </View>

      {/* Settings List */}
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        Recent Settings (Live Updates):
      </Text>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="mt-2 text-gray-500">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={settings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SettingItem setting={item} />}
          ListEmptyComponent={
            <View className="bg-yellow-50 p-4 rounded-xl">
              <Text className="text-center text-yellow-700">
                No settings synced yet. Make sure PowerSync is connected.
              </Text>
            </View>
          }
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Footer */}
      <Text className="text-center text-gray-500 text-xs py-2">
        Pull down to refresh • Updates appear in real-time
      </Text>
    </View>
  )
}
