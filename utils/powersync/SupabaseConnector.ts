import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL!

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// PowerSync connector for Supabase
export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Get the current session
    let {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, sign in anonymously to get a proper JWT token
    if (!session) {
      console.log('No session, signing in anonymously...')
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign in failed:', error)
        throw error
      }
      session = data.session
    }

    if (!session) {
      throw new Error('Failed to get session')
    }

    console.log('Got session token')
    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    let totalUploaded = 0

    // Loop through ALL pending transactions
    while (true) {
      const transaction = await database.getNextCrudTransaction()

      if (!transaction) {
        if (totalUploaded > 0) {
          console.log(`[Upload] All done! Uploaded ${totalUploaded} transactions`)
        } else {
          console.log('[Upload] No pending transactions')
        }
        return
      }

      console.log(`[Upload] Processing transaction with ${transaction.crud.length} operations`)

      try {
        for (const op of transaction.crud) {
          console.log(`[Upload] Operation: ${op.op} on ${op.table}, id: ${op.id}`)
          await this.applyOperation(op)
        }

        // Mark transaction as complete
        await transaction.complete()
        totalUploaded++
        console.log(`[Upload] Transaction ${totalUploaded} completed`)
      } catch (error) {
        console.error('[Upload] Error:', error)
        throw error
      }
    }
  }

  private async applyOperation(op: CrudEntry): Promise<void> {
    const table = op.table
    const id = op.id
    const data = op.opData

    switch (op.op) {
      case UpdateType.PUT:
        // Insert or update
        const { error: upsertError } = await supabase
          .from(table)
          .upsert({
            id,
            ...data,
            updated_at: new Date().toISOString(),
          })

        if (upsertError) throw upsertError
        break

      case UpdateType.PATCH:
        // Update existing record
        const { error: updateError } = await supabase
          .from(table)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (updateError) throw updateError
        break

      case UpdateType.DELETE:
        // Delete record
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
        break
    }
  }
}
