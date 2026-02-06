/**
 * Dev Tools - 测试数据生成器页面
 *
 * 功能：
 * 1. 生成 Tab - 选择表 -> 编辑字段默认值 -> 批量生成 N 条记录
 * 2. 浏览 Tab - 选择表 -> 查看已有数据 -> 删除单行或清空
 * 3. 快捷操作 Tab - 一键生成完整 POS 测试数据集
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { PageHeader } from '../components'
import { powerSyncDb } from '../utils/powersync/PowerSyncProvider'
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

type TabKey = 'generate' | 'browse' | 'quick'

interface RowData {
  [key: string]: any
}

// ============================================================================
// 主组件
// ============================================================================

export default function DevToolsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('generate')

  // 生产环境拦截：即使通过 URL 直接访问也不会暴露
  if (!__DEV__) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <PageHeader title="Not Available" />
        <Text className="text-gray-400 text-lg">This page is only available in development mode.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PageHeader title="Dev Tools" />

      {/* Tab Bar */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TabButton
          title="生成数据"
          icon="add-circle-outline"
          isActive={activeTab === 'generate'}
          onPress={() => setActiveTab('generate')}
        />
        <TabButton
          title="浏览数据"
          icon="list-outline"
          isActive={activeTab === 'browse'}
          onPress={() => setActiveTab('browse')}
        />
        <TabButton
          title="快捷操作"
          icon="flash-outline"
          isActive={activeTab === 'quick'}
          onPress={() => setActiveTab('quick')}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'generate' && <GenerateTab />}
      {activeTab === 'browse' && <BrowseTab />}
      {activeTab === 'quick' && <QuickActionsTab />}
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
// 表选择器
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
      <Text className="text-gray-600 text-xs font-medium mb-1">选择数据表</Text>
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
// 生成 Tab
// ============================================================================

function GenerateTab() {
  const [selectedTable, setSelectedTable] = useState(TABLE_CONFIGS[0].name)
  const [batchCount, setBatchCount] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({})

  const config = getTableConfig(selectedTable)

  // 切换表时重置覆盖值
  useEffect(() => {
    setFieldOverrides({})
    setMessage('')
  }, [selectedTable])

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

        // 应用用户的覆盖值
        for (const [key, val] of Object.entries(fieldOverrides)) {
          if (val.trim() === '') continue
          const colDef = config.columns.find((c) => c.name === key)
          if (!colDef) continue
          if (colDef.type === 'integer') {
            record[key] = parseInt(val, 10) || 0
          } else if (colDef.type === 'real') {
            record[key] = parseFloat(val) || 0
          } else {
            // 字符串类型支持 {i} 占位符
            record[key] = val.replace(/\{i\}/g, String(i))
          }
        }

        // 构建 INSERT SQL
        const cols = Object.keys(record)
        const placeholders = cols.map(() => '?').join(', ')
        const values = cols.map((c) => record[c])
        const sql = `INSERT INTO ${selectedTable} (${cols.join(', ')}) VALUES (${placeholders})`

        await powerSyncDb.execute(sql, values)
        inserted++
      }

      setMessage(`成功插入 ${inserted} 条 ${config.label} 记录`)
    } catch (err: any) {
      setMessage(`错误: ${err.message}`)
      console.error('[DevTools] Generate error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTable, batchCount, fieldOverrides, config])

  if (!config) return null

  return (
    <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
      <TableSelector selectedTable={selectedTable} onSelect={setSelectedTable} />

      {/* 批量数量 */}
      <View className="flex-row items-center gap-3 mb-4">
        <Text className="text-gray-600 text-sm font-medium">批量数量:</Text>
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
          <Text className="text-white font-medium">生成</Text>
        </TouchableOpacity>
      </View>

      {/* 消息提示 */}
      {message !== '' && (
        <View
          className={`rounded-lg p-3 mb-4 ${
            message.startsWith('错误') ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <Text
            className={`text-sm ${
              message.startsWith('错误') ? 'text-red-700' : 'text-green-700'
            }`}
          >
            {message}
          </Text>
        </View>
      )}

      {/* 字段编辑 */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <Text className="text-gray-700 font-semibold">
            字段配置 (留空使用默认值, 字符串支持 {'{i}'} 占位符)
          </Text>
        </View>

        {config.columns.map((col) => {
          // 预览默认值
          const previewValue = col.defaultValue(1)
          const previewStr =
            previewValue === null ? 'null' : String(previewValue)

          return (
            <View
              key={col.name}
              className="flex-row items-center px-4 py-2.5 border-b border-gray-100"
            >
              {/* 列名和类型 */}
              <View className="flex-1">
                <Text className="text-gray-800 text-sm font-medium">
                  {col.label}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {col.name} ({col.type})
                </Text>
              </View>

              {/* 输入框 */}
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

      {/* 底部留白 */}
      <View className="h-20" />
    </ScrollView>
  )
}

// ============================================================================
// 浏览 Tab
// ============================================================================

function BrowseTab() {
  const [selectedTable, setSelectedTable] = useState(TABLE_CONFIGS[0].name)
  const [rows, setRows] = useState<RowData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  // 编辑弹窗状态
  const [editingRow, setEditingRow] = useState<RowData | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  // 列选择
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const config = getTableConfig(selectedTable)

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setMessage('')
    try {
      const result = await powerSyncDb.getAll<RowData>(
        `SELECT * FROM ${selectedTable} ORDER BY created_at DESC LIMIT 200`
      )
      setRows(result)
      setMessage(`共 ${result.length} 条记录`)
    } catch (err: any) {
      // 有些表没有 created_at 列
      try {
        const result = await powerSyncDb.getAll<RowData>(
          `SELECT * FROM ${selectedTable} LIMIT 200`
        )
        setRows(result)
        setMessage(`共 ${result.length} 条记录`)
      } catch (err2: any) {
        setMessage(`错误: ${err2.message}`)
        setRows([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedTable])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开编辑弹窗
  const handleEditRow = useCallback(
    (row: RowData) => {
      setEditingRow(row)
      // 将当前行数据转为字符串用于编辑
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

  // 保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingRow || !config) return
    setIsSaving(true)

    try {
      // 构建 UPDATE SET 子句
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

      // 更新本地行数据
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

      setMessage('修改已保存')
      setEditingRow(null)
    } catch (err: any) {
      Alert.alert('保存失败', err.message)
    } finally {
      setIsSaving(false)
    }
  }, [editingRow, editValues, config, selectedTable])

  // 删除单条记录
  const handleDeleteRow = useCallback(
    async (id: string) => {
      Alert.alert('确认删除', `删除 ID: ${id.slice(0, 8)}... ?`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await powerSyncDb.execute(
                `DELETE FROM ${selectedTable} WHERE id = ?`,
                [id]
              )
              setRows((prev) => prev.filter((r) => r.id !== id))
              setMessage(`已删除, 剩余 ${rows.length - 1} 条`)
            } catch (err: any) {
              Alert.alert('错误', err.message)
            }
          },
        },
      ])
    },
    [selectedTable, rows.length]
  )

  // 清空表
  const handleClearTable = useCallback(() => {
    Alert.alert(
      '清空数据表',
      `确定要删除 ${config?.label || selectedTable} 的全部数据吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await powerSyncDb.execute(`DELETE FROM ${selectedTable}`)
              setRows([])
              setMessage('已清空')
            } catch (err: any) {
              Alert.alert('错误', err.message)
            }
          },
        },
      ]
    )
  }, [selectedTable, config])

  // 切换表时重置列选择为默认前 4 列
  useEffect(() => {
    if (config) {
      setSelectedColumns(['id', ...config.columns.slice(0, 4).map((c) => c.name)])
    } else {
      setSelectedColumns(['id'])
    }
  }, [selectedTable]) // eslint-disable-line react-hooks/exhaustive-deps

  // 切换列选中状态
  const toggleColumn = useCallback((colName: string) => {
    setSelectedColumns((prev) => {
      if (colName === 'id') return prev // id 始终显示
      if (prev.includes(colName)) {
        return prev.filter((c) => c !== colName)
      }
      return [...prev, colName]
    })
  }, [])

  // 全选 / 全不选
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
        {/* 编辑按钮 */}
        <TouchableOpacity
          onPress={() => handleEditRow(item)}
          className="px-2 py-1"
        >
          <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>
        {/* 删除按钮 */}
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

  // 编辑弹窗
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
            {/* 弹窗标题 */}
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 bg-gray-50">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pencil" size={18} color="#3b82f6" />
                <Text className="text-lg font-semibold text-gray-800">
                  编辑记录
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingRow(null)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* ID (只读) */}
            <View className="px-5 pt-4 pb-2">
              <Text className="text-gray-400 text-xs">ID (只读)</Text>
              <Text className="text-gray-500 text-sm font-mono">
                {editingRow.id}
              </Text>
            </View>

            {/* 字段编辑列表 */}
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
              {/* 底部留白给键盘 */}
              <View className="h-4" />
            </ScrollView>

            {/* 底部按钮 */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setEditingRow(null)}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">取消</Text>
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
                  <Text className="text-white font-medium">保存修改</Text>
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

      {/* 操作栏 */}
      <View className="flex-row items-center gap-3 mb-3">
        <TouchableOpacity
          onPress={loadData}
          className="flex-row items-center gap-1 bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text className="text-white font-medium text-sm">刷新</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClearTable}
          className="flex-row items-center gap-1 bg-red-500 px-4 py-2 rounded-lg"
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text className="text-white font-medium text-sm">清空表</Text>
        </TouchableOpacity>
        {message !== '' && (
          <Text className="text-gray-500 text-sm ml-2">{message}</Text>
        )}
        {isLoading && <ActivityIndicator size="small" color="#3b82f6" />}
      </View>

      {/* 列选择 */}
      {config && (
        <View className="flex-row flex-wrap items-center gap-1.5 mb-3">
          <TouchableOpacity onPress={selectAllColumns} className="mr-1">
            <Text className="text-blue-500 text-xs font-medium">全选</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAllColumns} className="mr-2">
            <Text className="text-gray-400 text-xs font-medium">重置</Text>
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

      {/* 表头 */}
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
        {/* 操作列占位 */}
        <View className="w-16" />
      </View>

      {/* 数据行 */}
      <FlatList
        data={rows}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderRow}
        className="flex-1 bg-white rounded-b-lg border border-gray-200"
        ListEmptyComponent={
          <View className="items-center py-10">
            <Ionicons name="document-outline" size={36} color="#d1d5db" />
            <Text className="text-gray-400 mt-2">暂无数据</Text>
          </View>
        }
      />

      {/* 编辑弹窗 */}
      {renderEditModal()}
    </View>
  )
}

// ============================================================================
// 快捷操作 Tab
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

  // 一键生成完整数据集
  const handleGenerateFullDataset = useCallback(async () => {
    setIsRunning(true)
    setLogs([])
    addLog('开始生成完整测试数据集...')

    try {
      const dataset = generateFullDataset(counts)

      for (const [tableName, records] of dataset) {
        if (records.length === 0) continue

        addLog(`正在插入 ${records.length} 条 ${tableName} 记录...`)

        for (const record of records) {
          const cols = Object.keys(record)
          const placeholders = cols.map(() => '?').join(', ')
          const values = cols.map((c) => record[c])
          const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`

          try {
            await powerSyncDb.execute(sql, values)
          } catch (err: any) {
            addLog(`  [警告] ${tableName} 插入失败: ${err.message}`)
          }
        }

        addLog(`  ${tableName} 完成 (${records.length} 条)`)
      }

      addLog('全部完成! 数据将通过 PowerSync 自动同步到后端。')
    } catch (err: any) {
      addLog(`错误: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }, [counts])

  // 一键清空所有表
  const handleClearAll = useCallback(() => {
    Alert.alert(
      '清空所有数据',
      '确定要清空所有 PowerSync 数据表吗？此操作不可恢复！',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空全部',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(true)
            setLogs([])
            addLog('开始清空所有数据表...')

            for (const table of TABLE_CONFIGS) {
              try {
                await powerSyncDb.execute(`DELETE FROM ${table.name}`)
                addLog(`  ${table.name} 已清空`)
              } catch (err: any) {
                addLog(`  [警告] ${table.name}: ${err.message}`)
              }
            }

            addLog('全部清空完成!')
            setIsRunning(false)
          },
        },
      ]
    )
  }, [])

  // 快速统计各表行数
  const handleCountAll = useCallback(async () => {
    setLogs([])
    addLog('统计各表行数...')

    for (const table of TABLE_CONFIGS) {
      try {
        const result = await powerSyncDb.getAll<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM ${table.name}`
        )
        const cnt = result[0]?.cnt ?? 0
        addLog(`  ${table.label}: ${cnt} 条`)
      } catch (err: any) {
        addLog(`  ${table.label}: 错误 - ${err.message}`)
      }
    }

    addLog('统计完成')
  }, [])

  return (
    <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
      {/* 数量配置 */}
      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <View className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-row items-center gap-2">
          <MaterialCommunityIcons name="tune-variant" size={18} color="#6b7280" />
          <Text className="text-gray-700 font-semibold">生成数量配置</Text>
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

      {/* 快捷按钮 */}
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
              一键生成完整 POS 数据集
            </Text>
            <Text className="text-blue-100 text-xs">
              分类 + 品牌 + 产品 + 客户 + 订单 + 支付，自动关联外键
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
            <Text className="text-white font-medium">统计所有表</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAll}
            disabled={isRunning}
            className="flex-1 flex-row items-center justify-center gap-2 bg-red-500 p-3 rounded-xl"
          >
            <Ionicons name="nuclear" size={18} color="white" />
            <Text className="text-white font-medium">清空所有表</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 日志输出 */}
      {logs.length > 0 && (
        <View className="bg-gray-900 rounded-xl overflow-hidden mb-4">
          <View className="px-4 py-2 bg-gray-800 flex-row items-center justify-between">
            <Text className="text-gray-300 text-xs font-mono">Output Log</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text className="text-gray-400 text-xs">清除</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="p-3 max-h-80">
            {logs.map((log, i) => (
              <Text
                key={i}
                className={`text-xs font-mono leading-5 ${
                  log.includes('错误') || log.includes('警告')
                    ? 'text-yellow-400'
                    : log.includes('完成')
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

      {/* 底部留白 */}
      <View className="h-20" />
    </ScrollView>
  )
}
