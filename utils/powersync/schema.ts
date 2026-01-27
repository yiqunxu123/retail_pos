import { column, Schema, Table } from '@powersync/react-native'

// Define the todos table schema for PowerSync (test table)
const todos = new Table({
  // Column definitions - PowerSync uses string IDs by default
  text: column.text,
  done: column.integer, // SQLite doesn't have boolean, use 0/1
  created_at: column.text,
  updated_at: column.text,
})

// Export the schema
// Add more tables here as you develop the app
export const AppSchema = new Schema({
  todos,
})

// TypeScript types for the schema
export type Database = (typeof AppSchema)['types']
export type Todo = Database['todos']
