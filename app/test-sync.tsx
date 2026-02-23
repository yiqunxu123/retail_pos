import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import TodoTest from '../components/TodoTest'

/**
 * Test Sync Page - For testing PowerSync integration
 */
export default function TestSyncScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      {/* Back Button */}
      <View className="pt-12 px-4 pb-2 bg-[#F7F7F9] border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Text className="text-blue-500 text-lg">← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Todo Test Component */}
      <TodoTest />
    </View>
  )
}
