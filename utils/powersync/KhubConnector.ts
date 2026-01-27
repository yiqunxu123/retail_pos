import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native'
import { getAccessToken, refreshAuthToken } from '../api/auth'
import khubApi from '../api/khub'

// PowerSync URL from environment
const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL!

// PowerSync connector for KHUB backend
export class KhubConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Get the current access token from storage
    let token = await getAccessToken()

    if (!token) {
      // Try to refresh the token
      const refreshed = await refreshAuthToken()
      if (refreshed) {
        token = await getAccessToken()
      }
    }

    if (!token) {
      throw new Error('No authentication token available. Please log in.')
    }

    console.log('[PowerSync] Got KHUB token for sync')
    return {
      endpoint: POWERSYNC_URL,
      token: token,
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

    // Map table names to KHUB API endpoints
    const endpoint = this.getApiEndpoint(table)

    console.log(`[Upload] Applying ${op.op} to ${table}/${id}:`, data)

    switch (op.op) {
      case UpdateType.PUT:
        // Insert or update via KHUB API
        try {
          await khubApi.put(`${endpoint}/${id}`, {
            ...data,
          })
          console.log(`[Upload] PUT ${endpoint}/${id} success`)
        } catch (error: any) {
          // If PUT fails with 404, try POST for new record
          if (error.response?.status === 404) {
            await khubApi.post(endpoint, {
              id,
              ...data,
            })
            console.log(`[Upload] POST ${endpoint} success (fallback from 404)`)
          } else {
            console.error(`[Upload] PUT ${endpoint}/${id} failed:`, error.response?.data || error.message)
            throw error
          }
        }
        break

      case UpdateType.PATCH:
        // Update existing record - KHUB API uses PATCH for partial updates
        try {
          await khubApi.patch(`${endpoint}/${id}`, data)
          console.log(`[Upload] PATCH ${endpoint}/${id} success`)
        } catch (error: any) {
          console.error(`[Upload] PATCH ${endpoint}/${id} failed:`, error.response?.data || error.message)
          throw error
        }
        break

      case UpdateType.DELETE:
        // Delete record
        try {
          await khubApi.delete(`${endpoint}/${id}`)
          console.log(`[Upload] DELETE ${endpoint}/${id} success`)
        } catch (error: any) {
          console.error(`[Upload] DELETE ${endpoint}/${id} failed:`, error.response?.data || error.message)
          throw error
        }
        break
    }
  }

  // Map PowerSync table names to KHUB API endpoints
  private getApiEndpoint(table: string): string {
    const endpoints: Record<string, string> = {
      products: '/tenant/api/v1/core/products',
      customers: '/tenant/api/v1/core/customers',
      sale_orders: '/tenant/api/v1/core/sale-orders',
      sale_order_details: '/tenant/api/v1/core/sale-order-details',
      categories: '/tenant/api/v1/core/categories',
      brands: '/tenant/api/v1/core/brands',
      stocks: '/tenant/api/v1/core/stocks',
      payments: '/tenant/api/v1/core/payments',
      invoices: '/tenant/api/v1/core/invoices',
      tenant_users: '/tenant/api/v1/core/user',
    }

    return endpoints[table] || `/tenant/api/v1/core/${table}`
  }
}
