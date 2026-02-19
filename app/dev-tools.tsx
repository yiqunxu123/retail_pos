/**
 * Dev Tools - Test data generator page
 *
 * Features:
 * 1. Generate Tab - select table -> edit field defaults -> batch generate N records
 * 2. Browse Tab - select table -> view existing data -> delete row or clear
 * 3. Quick Actions Tab - one-click generate full POS test dataset
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native'
import { PageHeader } from '../components'
import { useClock } from '../contexts/ClockContext'
import { usePowerSync, powerSyncDb } from '../utils/powersync/PowerSyncProvider'
import {
  addPrinterListener,
  getPrinters,
  printToAll,
  printToOne
} from '../utils/PrinterPoolManager'
import {
    DEFAULT_DATASET_COUNTS,
    FullDatasetCounts,
    TABLE_CONFIGS,
    generateFullDataset,
    generateRecord,
    getTableConfig,
} from '../utils/testDataGenerators'

// ============================================================================
// Types
// ============================================================================

type TabKey = 'generate' | 'browse' | 'quick' | 'system'

interface RowData {
  [key: string]: any
}

// ============================================================================
// Main component
// ============================================================================

function resolveTab(input?: string, hasTable?: boolean): TabKey {
  if (input === 'generate' || input === 'browse' || input === 'quick' || input === 'system') return input as TabKey
  return hasTable ? 'browse' : 'generate'
}

function resolveTable(input?: string): string | undefined {
  if (!input) return undefined
  return TABLE_CONFIGS.find((t) => t.name === input)?.name
}

export default function DevToolsScreen() {
  const params = useLocalSearchParams<{ tab?: string; table?: string }>()
  const resolvedTable = resolveTable(params.table)
  const resolvedTab = resolveTab(params.tab, !!resolvedTable)
  const [activeTab, setActiveTab] = useState<TabKey>(resolvedTab)

  useEffect(() => {
    setActiveTab(resolvedTab)
  }, [resolvedTab])

  // Production guard: prevent access even via direct URL
  if (!__DEV__) {
    return (
      <View className="flex-1 bg-[#F7F7F9] items-center justify-center">
        <PageHeader title="Not Available" showBack={false} />
        <Text className="text-gray-400 text-lg">This page is only available in development mode.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Dev Tools" showBack={false} />

      {/* Tab Bar */}
      <View className="flex-row bg-[#F7F7F9] border-b border-gray-200">
        <TabButton
          title="Generate"
          icon="add-circle-outline"
          isActive={activeTab === 'generate'}
          onPress={() => setActiveTab('generate')}
        />
        <TabButton
          title="Browse"
          icon="list-outline"
          isActive={activeTab === 'browse'}
          onPress={() => setActiveTab('browse')}
        />
        <TabButton
          title="Quick Actions"
          icon="flash-outline"
          isActive={activeTab === 'quick'}
          onPress={() => setActiveTab('quick')}
        />
        <TabButton
          title="System"
          icon="settings-outline"
          isActive={activeTab === 'system'}
          onPress={() => setActiveTab('system')}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'generate' && <GenerateTab initialTable={resolvedTable} />}
      {activeTab === 'browse' && <BrowseTab initialTable={resolvedTable} />}
      {activeTab === 'quick' && <QuickActionsTab />}
      {activeTab === 'system' && <SystemTab />}
    </View>
  )
}

// ============================================================================
// Tab Button
// ============================================================================

function TabButton({
  title,
  icon,
  isActive,
  onPress,
}: {
  title: string
  icon: string
  isActive: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-3 gap-2 ${
        isActive ? 'border-b-2 border-blue-500' : ''
      }`}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={isActive ? '#3b82f6' : '#9ca3af'}
      />
      <Text
        className={`text-sm font-medium ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
}

// ============================================================================
// Table selector
// ============================================================================

function TableSelector({
  selectedTable,
  onSelect,
}: {
  selectedTable: string
  onSelect: (name: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const current = TABLE_CONFIGS.find((t) => t.name === selectedTable)

  return (
    <View className="mb-4">
      <Text className="text-gray-600 text-xs font-medium mb-1">Select Table</Text>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
      >
        <Text className="text-gray-800 font-medium">
          {current?.label || selectedTable}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#6b7280"
        />
      </TouchableOpacity>

      {isOpen && (
        <View className="bg-white border border-gray-200 rounded-lg mt-1 max-h-64 overflow-hidden">
          <ScrollView nestedScrollEnabled>
            {TABLE_CONFIGS.map((table) => (
              <TouchableOpacity
                key={table.name}
                onPress={() => {
                  onSelect(table.name)
                  setIsOpen(false)
                }}
                className={`px-4 py-3 border-b border-gray-100 ${
                  table.name === selectedTable ? 'bg-blue-50' : ''
                }`}
              >
                <Text
                  className={`text-sm ${
                    table.name === selectedTable
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {table.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// Generate Tab
// ============================================================================

function GenerateTab({ initialTable }: { initialTable?: string }) {
  const [selectedTable, setSelectedTable] = useState(initialTable || TABLE_CONFIGS[0].name)
  const [batchCount, setBatchCount] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({})

  const config = getTableConfig(selectedTable)

  // Reset overrides when switching tables
  useEffect(() => {
    setFieldOverrides({})
    setMessage('')
  }, [selectedTable])

  useEffect(() => {
    if (initialTable && initialTable !== selectedTable) {
      setSelectedTable(initialTable)
    }
  }, [initialTable, selectedTable])

  const handleGenerate = useCallback(async () => {
    if (!config) return
    const count = parseInt(batchCount, 10) || 1
    setIsGenerating(true)
    setMessage('')

    try {
      let inserted = 0
      for (let i = 1; i <= count; i++) {
        const record = generateRecord(selectedTable, i)
        if (!record) continue

        // Apply user overrides
        for (const [key, val] of Object.entries(fieldOverrides)) {
          if (val.trim() === '') continue
          const colDef = config.columns.find((c) => c.name === key)
          if (!colDef) continue
          if (colDef.type === 'integer') {
            record[key] = parseInt(val, 10) || 0
          } else if (colDef.type === 'real') {
            record[key] = parseFloat(val) || 0
          } else {
            // String type supports {i} placeholder
            record[key] = val.replace(/\{i\}/g, String(i))
          }
        }

        // Build INSERT SQL
        const cols = Object.keys(record)
        const placeholders = cols.map(() => '?').join(', ')
        const values = cols.map((c) => record[c])
        const sql = `INSERT INTO ${selectedTable} (${cols.join(', ')}) VALUES (${placeholders})`

        await powerSyncDb.execute(sql, values)
        inserted++
      }

      setMessage(`Successfully inserted ${inserted} ${config.label} records`)
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
      console.error('[DevTools] Generate error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTable, batchCount, fieldOverrides, config])

  if (!config) return null

  return (
    <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
      <TableSelector selectedTable={selectedTable} onSelect={setSelectedTable} />

      {/* Batch count */}
      <View className="flex-row items-center gap-3 mb-4">
        <Text className="text-gray-600 text-sm font-medium">Batch Count:</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 w-20 text-center text-base"
          keyboardType="number-pad"
          value={batchCount}
          onChangeText={setBatchCount}
        />
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isGenerating}
          className={`flex-row items-center gap-2 px-5 py-2.5 rounded-lg ${
            isGenerating ? 'bg-gray-400' : 'bg-blue-500'
          }`}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="add-circle" size={18} color="white" />
          )}
          <Text className="text-white font-medium">Generate</Text>
        </TouchableOpacity>
      </View>

      {/* Message hint */}
      {message !== '' && (
        <View
          className={`rounded-lg p-3 mb-4 ${
            message.startsWith('Error') ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <Text
            className={`text-sm ${
              message.startsWith('Error') ? 'text-red-700' : 'text-green-700'
            }`}
          >
            {message}
          </Text>
        </View>
      )}

      {/* Field config */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <Text className="text-gray-700 font-semibold">
            Field Config (leave empty for defaults, strings support {'{i}'} placeholder)
          </Text>
        </View>

        {config.columns.map((col) => {
          // Preview default value
          const previewValue = col.defaultValue(1)
          const previewStr =
            previewValue === null ? 'null' : String(previewValue)

          return (
            <View
              key={col.name}
              className="flex-row items-center px-4 py-2.5 border-b border-gray-100"
            >
              {/* Column name and type */}
              <View className="flex-1">
                <Text className="text-gray-800 text-sm font-medium">
                  {col.label}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {col.name} ({col.type})
                </Text>
              </View>

              {/* Input field */}
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 ml-3"
                placeholder={previewStr}
                placeholderTextColor="#9ca3af"
                value={fieldOverrides[col.name] || ''}
                onChangeText={(text) =>
                  setFieldOverrides((prev) => ({ ...prev, [col.name]: text }))
                }
                keyboardType={
                  col.type === 'integer' || col.type === 'real'
                    ? 'numeric'
                    : 'default'
                }
              />
            </View>
          )
        })}
      </View>

      {/* Bottom padding */}
      <View className="h-20" />
    </ScrollView>
  )
}

// ============================================================================
// Browse Tab
// ============================================================================

function BrowseTab({ initialTable }: { initialTable?: string }) {
  const [selectedTable, setSelectedTable] = useState(initialTable || TABLE_CONFIGS[0].name)
  const [rows, setRows] = useState<RowData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  // Edit modal state
  const [editingRow, setEditingRow] = useState<RowData | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  // Column selection
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const config = getTableConfig(selectedTable)

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setMessage('')
    try {
      const result = await powerSyncDb.getAll<RowData>(
        `SELECT * FROM ${selectedTable} ORDER BY created_at DESC LIMIT 200`
      )
      setRows(result)
      setMessage(`${result.length} records`)
    } catch (err: any) {
      // Some tables don't have a created_at column
      try {
        const result = await powerSyncDb.getAll<RowData>(
          `SELECT * FROM ${selectedTable} LIMIT 200`
        )
        setRows(result)
        setMessage(`${result.length} records`)
      } catch (err2: any) {
        setMessage(`Error: ${err2.message}`)
        setRows([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedTable])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (initialTable && initialTable !== selectedTable) {
      setSelectedTable(initialTable)
    }
  }, [initialTable, selectedTable])

  // Open edit modal
  const handleEditRow = useCallback(
    (row: RowData) => {
      setEditingRow(row)
      // Convert current row data to strings for editing
      const values: Record<string, string> = {}
      if (config) {
        for (const col of config.columns) {
          const val = row[col.name]
          values[col.name] = val === null || val === undefined ? '' : String(val)
        }
      }
      setEditValues(values)
    },
    [config]
  )

  // Save edits
  const handleSaveEdit = useCallback(async () => {
    if (!editingRow || !config) return
    setIsSaving(true)

    try {
      // Build UPDATE SET clause
      const setClauses: string[] = []
      const values: any[] = []

      for (const col of config.columns) {
        const rawVal = editValues[col.name]
        let parsedVal: any

        if (rawVal === '' || rawVal === undefined) {
          parsedVal = null
        } else if (col.type === 'integer') {
          parsedVal = parseInt(rawVal, 10)
          if (isNaN(parsedVal)) parsedVal = null
        } else if (col.type === 'real') {
          parsedVal = parseFloat(rawVal)
          if (isNaN(parsedVal)) parsedVal = null
        } else {
          parsedVal = rawVal
        }

        setClauses.push(`${col.name} = ?`)
        values.push(parsedVal)
      }

      values.push(editingRow.id)
      const sql = `UPDATE ${selectedTable} SET ${setClauses.join(', ')} WHERE id = ?`
      await powerSyncDb.execute(sql, values)

      // Update local row data
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== editingRow.id) return r
          const updated = { ...r }
          for (const col of config.columns) {
            const rawVal = editValues[col.name]
            if (rawVal === '' || rawVal === undefined) {
              updated[col.name] = null
            } else if (col.type === 'integer') {
              updated[col.name] = parseInt(rawVal, 10) || null
            } else if (col.type === 'real') {
              updated[col.name] = parseFloat(rawVal) || null
            } else {
              updated[col.name] = rawVal
            }
          }
          return updated
        })
      )

      setMessage('Changes saved')
      setEditingRow(null)
    } catch (err: any) {
      Alert.alert('Save Failed', err.message)
    } finally {
      setIsSaving(false)
    }
  }, [editingRow, editValues, config, selectedTable])

  // Delete single record
  const handleDeleteRow = useCallback(
    async (id: string) => {
      Alert.alert('Confirm Delete', `Delete ID: ${id.slice(0, 8)}... ?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await powerSyncDb.execute(
                `DELETE FROM ${selectedTable} WHERE id = ?`,
                [id]
              )
              setRows((prev) => prev.filter((r) => r.id !== id))
              setMessage(`Deleted, ${rows.length - 1} remaining`)
            } catch (err: any) {
              Alert.alert('Error', err.message)
            }
          },
        },
      ])
    },
    [selectedTable, rows.length]
  )

  // Clear table
  const handleClearTable = useCallback(() => {
    Alert.alert(
      'Clear Table',
      `Are you sure you want to delete all data from ${config?.label || selectedTable}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await powerSyncDb.execute(`DELETE FROM ${selectedTable}`)
              setRows([])
              setMessage('Cleared')
            } catch (err: any) {
              Alert.alert('Error', err.message)
            }
          },
        },
      ]
    )
  }, [selectedTable, config])

  // Reset column selection to default first 4 columns when switching tables
  useEffect(() => {
    if (config) {
      setSelectedColumns(['id', ...config.columns.slice(0, 4).map((c) => c.name)])
    } else {
      setSelectedColumns(['id'])
    }
  }, [selectedTable]) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle column selection
  const toggleColumn = useCallback((colName: string) => {
    setSelectedColumns((prev) => {
      if (colName === 'id') return prev // id is always visible
      if (prev.includes(colName)) {
        return prev.filter((c) => c !== colName)
      }
      return [...prev, colName]
    })
  }, [])

  // Select all / deselect all
  const selectAllColumns = useCallback(() => {
    if (!config) return
    setSelectedColumns(['id', ...config.columns.map((c) => c.name)])
  }, [config])

  const deselectAllColumns = useCallback(() => {
    setSelectedColumns(['id'])
  }, [])

  const displayColumns = selectedColumns

  const renderRow = useCallback(
    ({ item }: { item: RowData }) => (
      <View className="flex-row items-center bg-white border-b border-gray-100 px-3 py-2">
        {displayColumns.map((col) => (
          <View key={col} className="flex-1 px-1">
            <Text className="text-xs text-gray-700" numberOfLines={1}>
              {item[col] === null || item[col] === undefined
                ? '-'
                : col === 'id'
                ? String(item[col]).slice(0, 8) + '...'
                : String(item[col]).length > 20
                ? String(item[col]).slice(0, 20) + '...'
                : String(item[col])}
            </Text>
          </View>
        ))}
        {/* Edit button */}
        <TouchableOpacity
          onPress={() => handleEditRow(item)}
          className="px-2 py-1"
        >
          <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>
        {/* Delete button */}
        <TouchableOpacity
          onPress={() => handleDeleteRow(item.id)}
          className="px-2 py-1"
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    ),
    [displayColumns, handleDeleteRow, handleEditRow]
  )

  // Edit modal
  const renderEditModal = () => {
    if (!editingRow || !config) return null

    return (
      <Modal
        visible={!!editingRow}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRow(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setEditingRow(null)}
        >
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ width: 520, maxHeight: '85%' }}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal title */}
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 bg-gray-50">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pencil" size={18} color="#3b82f6" />
                <Text className="text-lg font-semibold text-gray-800">
                  Edit Record
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingRow(null)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* ID (read-only) */}
            <View className="px-5 pt-4 pb-2">
              <Text className="text-gray-400 text-xs">ID (read-only)</Text>
              <Text className="text-gray-500 text-sm font-mono">
                {editingRow.id}
              </Text>
            </View>

            {/* Field edit list */}
            <ScrollView className="px-5 pb-4" keyboardShouldPersistTaps="handled">
              {config.columns.map((col) => (
                <View key={col.name} className="mb-3">
                  <Text className="text-gray-600 text-xs font-medium mb-1">
                    {col.label}
                    <Text className="text-gray-400"> ({col.name}, {col.type})</Text>
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
                    value={editValues[col.name] || ''}
                    onChangeText={(text) =>
                      setEditValues((prev) => ({ ...prev, [col.name]: text }))
                    }
                    placeholder="null"
                    placeholderTextColor="#d1d5db"
                    keyboardType={
                      col.type === 'integer' || col.type === 'real'
                        ? 'numeric'
                        : 'default'
                    }
                  />
                </View>
              ))}
              {/* Bottom padding for keyboard */}
              <View className="h-4" />
            </ScrollView>

            {/* Bottom buttons */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setEditingRow(null)}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isSaving}
                className={`flex-1 rounded-xl py-3 items-center ${
                  isSaving ? 'bg-gray-400' : 'bg-blue-500'
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    )
  }

  return (
    <View className="flex-1 p-4">
      <TableSelector selectedTable={selectedTable} onSelect={setSelectedTable} />

      {/* Action bar */}
      <View className="flex-row items-center gap-3 mb-3">
        <TouchableOpacity
          onPress={loadData}
          className="flex-row items-center gap-1 bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text className="text-white font-medium text-sm">Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClearTable}
          className="flex-row items-center gap-1 bg-red-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text className="text-white font-medium text-sm">Clear Table</Text>
        </TouchableOpacity>
        {message !== '' && (
          <Text className="text-gray-500 text-sm ml-2">{message}</Text>
        )}
        {isLoading && <ActivityIndicator size="small" color="#3b82f6" />}
      </View>

      {/* Column selection */}
      {config && (
        <View className="flex-row flex-wrap items-center gap-1.5 mb-3">
          <TouchableOpacity onPress={selectAllColumns} className="mr-1">
            <Text className="text-blue-500 text-xs font-medium">All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAllColumns} className="mr-2">
            <Text className="text-gray-400 text-xs font-medium">Reset</Text>
          </TouchableOpacity>
          <View className="bg-blue-100 rounded px-2 py-1">
            <Text className="text-blue-700 text-xs">id</Text>
          </View>
          {config.columns.map((col) => {
            const isOn = selectedColumns.includes(col.name)
            return (
              <TouchableOpacity
                key={col.name}
                onPress={() => toggleColumn(col.name)}
                className={`rounded px-2 py-1 ${isOn ? 'bg-blue-500' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs ${isOn ? 'text-white' : 'text-gray-500'}`}>
                  {col.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Table header */}
      <View className="flex-row bg-gray-100 rounded-t-lg px-3 py-2">
        {displayColumns.map((col) => {
          const colDef = config?.columns.find((c) => c.name === col)
          return (
            <View key={col} className="flex-1 px-1">
              <Text className="text-xs text-gray-500 font-semibold" numberOfLines={1}>
                {colDef?.label || col}
              </Text>
            </View>
          )
        })}
        {/* Action column placeholder */}
        <View className="w-16" />
      </View>

      {/* Data rows */}
      <FlatList
        data={rows}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderRow}
        className="flex-1 bg-white rounded-b-lg border border-gray-200"
        ListEmptyComponent={
          <View className="items-center py-10">
            <Ionicons name="document-outline" size={36} color="#d1d5db" />
            <Text className="text-gray-400 mt-2">No data</Text>
          </View>
        }
      />

      {/* Edit modal */}
      {renderEditModal()}
    </View>
  )
}

// ============================================================================
// Quick Actions Tab
// ============================================================================

function QuickActionsTab() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [counts, setCounts] = useState<FullDatasetCounts>({
    ...DEFAULT_DATASET_COUNTS,
  })

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // One-click generate full dataset
  const handleGenerateFullDataset = useCallback(async () => {
    setIsRunning(true)
    setLogs([])
    addLog('Starting full test dataset generation...')

    try {
      const dataset = generateFullDataset(counts)

      for (const [tableName, records] of dataset) {
        if (records.length === 0) continue

        addLog(`Inserting ${records.length} ${tableName} records...`)

        for (const record of records) {
          const cols = Object.keys(record)
          const placeholders = cols.map(() => '?').join(', ')
          const values = cols.map((c) => record[c])
          const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`

          try {
            await powerSyncDb.execute(sql, values)
          } catch (err: any) {
            addLog(`  [Warning] ${tableName} insert failed: ${err.message}`)
          }
        }

        addLog(`  ${tableName} done (${records.length} records)`)
      }

      addLog('All done! Data will auto-sync to backend via PowerSync.')
    } catch (err: any) {
      addLog(`Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }, [counts])

  // One-click clear all tables
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all PowerSync tables? This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(true)
            setLogs([])
            addLog('Clearing all tables...')

            for (const table of TABLE_CONFIGS) {
              try {
                await powerSyncDb.execute(`DELETE FROM ${table.name}`)
                addLog(`  ${table.name} cleared`)
              } catch (err: any) {
                addLog(`  [Warning] ${table.name}: ${err.message}`)
              }
            }

            addLog('All tables cleared!')
            setIsRunning(false)
          },
        },
      ]
    )
  }, [])

  // Quick count rows per table
  const handleCountAll = useCallback(async () => {
    setLogs([])
    addLog('Counting rows per table...')

    for (const table of TABLE_CONFIGS) {
      try {
        const result = await powerSyncDb.getAll<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM ${table.name}`
        )
        const cnt = result[0]?.cnt ?? 0
        addLog(`  ${table.label}: ${cnt} rows`)
      } catch (err: any) {
        addLog(`  ${table.label}: Error - ${err.message}`)
      }
    }

    addLog('Count complete')
  }, [])

  return (
    <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
      {/* Quantity config */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-row items-center gap-2">
          <MaterialCommunityIcons name="tune-variant" size={18} color="#6b7280" />
          <Text className="text-gray-700 font-semibold">Generation Quantity Config</Text>
        </View>

        <View className="p-4">
          <View className="flex-row flex-wrap gap-3">
            {(
              Object.keys(counts) as Array<keyof FullDatasetCounts>
            ).map((key) => (
              <View key={key} className="w-[30%] mb-2">
                <Text className="text-gray-600 text-xs mb-1">{key}</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center"
                  keyboardType="number-pad"
                  value={String(counts[key])}
                  onChangeText={(text) =>
                    setCounts((prev) => ({
                      ...prev,
                      [key]: parseInt(text, 10) || 0,
                    }))
                  }
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick action buttons */}
      <View className="gap-3 mb-4">
        <TouchableOpacity
          onPress={handleGenerateFullDataset}
          disabled={isRunning}
          className={`flex-row items-center gap-3 p-4 rounded-xl ${
            isRunning ? 'bg-gray-400' : 'bg-blue-500'
          }`}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="rocket" size={22} color="white" />
          )}
          <View className="flex-1">
            <Text className="text-white font-bold text-base">
              One-click Generate Full POS Dataset
            </Text>
            <Text className="text-blue-100 text-xs">
              Categories + Brands + Products + Customers + Orders + Payments, auto-linked foreign keys
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleCountAll}
            disabled={isRunning}
            className="flex-1 flex-row items-center justify-center gap-2 bg-purple-500 p-3 rounded-xl"
          >
            <Ionicons name="stats-chart" size={18} color="white" />
            <Text className="text-white font-medium">Count All Tables</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAll}
            disabled={isRunning}
            className="flex-1 flex-row items-center justify-center gap-2 bg-red-500 p-3 rounded-xl"
          >
            <Ionicons name="nuclear" size={18} color="white" />
            <Text className="text-white font-medium">Clear All Tables</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log output */}
      {logs.length > 0 && (
        <View className="bg-gray-900 rounded-xl overflow-hidden mb-4">
          <View className="px-4 py-2 bg-gray-800 flex-row items-center justify-between">
            <Text className="text-gray-300 text-xs font-mono">Output Log</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text className="text-gray-400 text-xs">Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="p-3 max-h-80">
            {logs.map((log, i) => (
              <Text
                key={i}
                className={`text-xs font-mono leading-5 ${
                  log.includes('Error') || log.includes('Warning')
                    ? 'text-yellow-400'
                    : log.includes('done') || log.includes('complete')
                    ? 'text-green-400'
                    : 'text-gray-300'
                }`}
              >
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom padding */}
      <View className="h-20" />
    </ScrollView>
  )
}

// ============================================================================
// System Tab
// ============================================================================

function SystemTab() {
  const router = useRouter()
  const { clearAndResync, isConnected, isSyncing } = usePowerSync()
  const { isClockedIn, clockIn, selectedPosLine } = useClock()
  const [printerList, setPrinterList] = useState<{ id: string; name: string }[]>([])

  // Sync printer list
  useEffect(() => {
    const updatePrinters = () => {
      const currentPrinters = getPrinters().filter(p => p.enabled)
      setPrinterList(currentPrinters.map(p => ({ id: p.id, name: p.name })))
    }
    
    updatePrinters()
    const unsubscribe = addPrinterListener((event) => {
      if (['printer_added', 'printer_removed', 'printer_status_changed'].includes(event.type)) {
        updatePrinters()
      }
      if (event.type === 'job_failed') {
        Alert.alert("Print Error", `Failed to print: ${event.data?.error || 'Unknown error'}`)
      }
    })
    return () => unsubscribe()
  }, [])

  const buildTestReceipt = (): string => {
    const now = new Date().toLocaleString()
    return `
      <C>K-HUB POS TEST</C>
      <C>--------------------------------</C>
      <L>Date: ${now}</L>
      <L>Mode: Development</L>
      <L>Status: Online</L>
      <C>--------------------------------</C>
      <L>Item 1             $10.00</L>
      <L>Item 2             $20.00</L>
      <C>--------------------------------</C>
      <R>TOTAL: $30.00</R>
      <C>--------------------------------</C>
      <C>THANK YOU</C>
      <BR/><BR/><CUT/>
    `
  }

  const handleTestPrint = async (printerIndex?: number | 'all') => {
    try {
      if (!isClockedIn) {
        clockIn("TEST-001", selectedPosLine || 1)
      }

      if (printerList.length === 0) {
        ToastAndroid.show(`❌ No available printers`, ToastAndroid.LONG)
        return
      }

      const receipt = buildTestReceipt()

      if (printerIndex === 'all') {
        ToastAndroid.show(`⏳ Printing to all...`, ToastAndroid.SHORT)
        const result = await printToAll(receipt)
        if (result.success) {
          ToastAndroid.show(`✅ All successful`, ToastAndroid.LONG)
        } else {
          ToastAndroid.show(`❌ Some prints failed`, ToastAndroid.LONG)
        }
      } else if (typeof printerIndex === 'number') {
        const targetPrinter = printerList[printerIndex]
        if (!targetPrinter) return
        
        ToastAndroid.show(`⏳ Printing to ${targetPrinter.name}...`, ToastAndroid.SHORT)
        const result = await printToOne(targetPrinter.id, receipt)
        if (result.success) {
          ToastAndroid.show(`✅ ${targetPrinter.name} success`, ToastAndroid.LONG)
        } else {
          ToastAndroid.show(`❌ ${targetPrinter.name} failed`, ToastAndroid.LONG)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* PowerSync Section */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-row items-center gap-2">
          <Ionicons name="sync" size={18} color="#6b7280" />
          <Text className="text-gray-700 font-semibold">Data Sync & PowerSync</Text>
        </View>
        
        <View className="p-4 gap-4">
          <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-lg">
            <View>
              <Text className="text-gray-700 font-medium">Sync Status</Text>
              <Text className={isConnected ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                {isConnected ? "Connected (Online)" : "Disconnected (Offline)"}
              </Text>
            </View>
            {isSyncing && <ActivityIndicator size="small" color="#3b82f6" />}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/test-sync")}
            className="flex-row items-center justify-center gap-2 bg-blue-500 p-4 rounded-xl"
          >
            <Ionicons name="analytics" size={20} color="white" />
            <Text className="text-white font-bold">Open Sync Monitor (Test Sync)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "🔄 Reset & Resync",
                "This will clear the local database and re-download everything. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Reset", style: "destructive", onPress: clearAndResync }
                ]
              )
            }}
            className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 p-3 rounded-xl"
          >
            <Ionicons name="refresh" size={18} color="#ef4444" />
            <Text className="text-red-600 font-medium">Force Clear & Resync Database</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Printer Section */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-row items-center gap-2">
          <Ionicons name="print" size={18} color="#6b7280" />
          <Text className="text-gray-700 font-semibold">Printer Testing</Text>
        </View>
        
        <View className="p-4 gap-3">
          {printerList.length === 0 ? (
            <View className="items-center py-4">
              <Text className="text-gray-400 italic">No printers configured</Text>
              <TouchableOpacity 
                onPress={() => router.push("/settings")}
                className="mt-2"
              >
                <Text className="text-blue-500 font-medium">Go to Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap gap-2">
                {printerList.map((printer, index) => (
                  <TouchableOpacity
                    key={printer.id}
                    onPress={() => handleTestPrint(index)}
                    className="flex-1 min-w-[45%] bg-purple-50 border border-purple-100 p-3 rounded-lg flex-row items-center gap-2"
                  >
                    <Ionicons name="print" size={16} color="#8b5cf6" />
                    <Text className="text-purple-700 font-medium" numberOfLines={1}>
                      {printer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => handleTestPrint('all')}
                className="flex-row items-center justify-center gap-2 bg-purple-500 p-3 rounded-lg mt-1"
              >
                <Ionicons name="copy" size={18} color="white" />
                <Text className="text-white font-bold">Test All Printers (Parallel)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View className="h-20" />
    </ScrollView>
  )
}
