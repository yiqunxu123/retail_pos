import { usePowerSync, powerSyncDb } from '../utils/powersync/PowerSyncProvider'
import { Todo } from '../utils/powersync/schema'
import { useSyncStream } from '../utils/powersync/useSyncStream'
import { SupabaseConnector } from '../utils/powersync/SupabaseConnector'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// Generate UUID for new todos
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// A single todo component
const TodoItem = ({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo & { id: string }
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) => {
  const isDone = todo.done === 1

  return (
    <View className={`flex-row items-center p-4 mb-2 rounded-xl ${isDone ? 'bg-green-50' : 'bg-white'}`}>
      <TouchableOpacity onPress={() => onToggle(todo.id)} className="flex-1">
        <Text className={`text-base ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {isDone ? '✅' : '🟠'} {todo.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(todo.id)} className="p-2">
        <Text>🗑️</Text>
      </TouchableOpacity>
    </View>
  )
}

// Main TodoTest component
export default function TodoTest() {
  const { db, isConnected, isInitialized } = usePowerSync()
  const [newTodoText, setNewTodoText] = useState('')

  // Use Sync Stream to watch todos
  const {
    data: todos,
    isLoading,
    isStreaming,
    refresh,
  } = useSyncStream<Todo & { id: string }>('SELECT * FROM todos ORDER BY created_at DESC')

  // Trigger upload manually
  const triggerUpload = useCallback(async () => {
    try {
      const connector = new SupabaseConnector()
      console.log('[TodoTest] Triggering upload...')
      await connector.uploadData(powerSyncDb)
    } catch (error) {
      console.error('[TodoTest] Upload error:', error)
    }
  }, [])

  // Add a new todo
  const handleAddTodo = useCallback(async () => {
    if (!newTodoText.trim()) return

    try {
      const id = generateUUID()
      const now = new Date().toISOString()

      await db.execute(
        'INSERT INTO todos (id, text, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [id, newTodoText.trim(), 0, now, now]
      )
      console.log('[TodoTest] Added todo:', id)
      setNewTodoText('')
      
      // Trigger upload after write
      await triggerUpload()
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }, [db, newTodoText, triggerUpload])

  // Toggle todo done status
  const handleToggleTodo = useCallback(
    async (id: string) => {
      try {
        const todo = todos.find((t) => t.id === id)
        if (!todo) return

        const newDone = todo.done === 1 ? 0 : 1
        const now = new Date().toISOString()

        await db.execute('UPDATE todos SET done = ?, updated_at = ? WHERE id = ?', [
          newDone,
          now,
          id,
        ])
        console.log('[TodoTest] Toggled todo:', id)
        await triggerUpload()
      } catch (error) {
        console.error('Failed to toggle todo:', error)
      }
    },
    [db, todos, triggerUpload]
  )

  // Delete a todo
  const handleDeleteTodo = useCallback(
    async (id: string) => {
      try {
        await db.execute('DELETE FROM todos WHERE id = ?', [id])
        console.log('[TodoTest] Deleted todo:', id)
        await triggerUpload()
      } catch (error) {
        console.error('Failed to delete todo:', error)
      }
    },
    [db, triggerUpload]
  )

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
        PowerSync Test
      </Text>
      
      {/* Status */}
      <View className="flex-row justify-center items-center mb-4">
        <Text className="text-sm">
          {isStreaming ? '📡' : isConnected ? '📡' : '📴'}
        </Text>
        <Text className="text-sm text-gray-600 ml-2">
          {isStreaming ? 'Streaming' : isConnected ? 'Connected' : 'Offline'}
        </Text>
        <TouchableOpacity onPress={refresh} className="ml-4 px-3 py-1 bg-gray-200 rounded-xl">
          <Text className="text-xs">🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Add Todo Input */}
      <View className="flex-row mb-4">
        <TextInput
          value={newTodoText}
          onChangeText={setNewTodoText}
          placeholder="Add a new todo..."
          className="flex-1 bg-white p-4 rounded-xl mr-2"
          onSubmitEditing={handleAddTodo}
          returnKeyType="done"
        />
        <TouchableOpacity 
          onPress={handleAddTodo}
          className="bg-blue-500 px-6 justify-center rounded-xl"
        >
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Todo List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="mt-2 text-gray-500">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem 
              todo={item} 
              onToggle={handleToggleTodo} 
              onDelete={handleDeleteTodo} 
            />
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-10">
              No todos yet. Add one above!
            </Text>
          }
          className="flex-1"
        />
      )}

      {/* Footer */}
      <Text className="text-center text-gray-500 text-sm py-2">
        {todos.length} todo{todos.length !== 1 ? 's' : ''}
      </Text>
    </View>
  )
}
