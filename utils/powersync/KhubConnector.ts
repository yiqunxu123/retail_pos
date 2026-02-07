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

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper to check if JWT token is expired or about to expire
function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    // Decode JWT payload (middle part)
    const parts = token.split('.')
    if (parts.length !== 3) return true
    
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    
    if (!exp) return true
    
    // Check if token expires within buffer time
    const now = Math.floor(Date.now() / 1000)
    const isExpired = exp <= now + bufferSeconds
    
    if (isExpired) {
      console.log(`[PowerSync] Token expired or expiring soon (exp: ${new Date(exp * 1000).toISOString()}, now: ${new Date(now * 1000).toISOString()})`)
    }
    
    return isExpired
  } catch (e) {
    console.warn('[PowerSync] Failed to decode token, treating as expired:', e)
    return true
  }
}

// PowerSync connector for KHUB backend
export class KhubConnector implements PowerSyncBackendConnector {
  private tokenRefreshPromise: Promise<string | null> | null = null

  async fetchCredentials() {
    // Get the current access token from storage
    let token = await getAccessToken()

    // Check if token is missing or expired
    if (!token || isTokenExpired(token)) {
      console.log('[PowerSync] Token missing or expired, attempting refresh...')
      // Try to refresh the token
      try {
        token = await this.refreshToken()
      } catch (e) {
        console.warn('[PowerSync] Token refresh failed, user needs to re-login')
      }
    }

    if (!token) {
      // Return empty credentials - PowerSync will handle gracefully
      console.log('[PowerSync] No token available, sync disabled until login')
      throw new Error('No authentication token available. Please log in.')
    }

    // Double-check the refreshed token is valid
    if (isTokenExpired(token)) {
      console.log('[PowerSync] Refreshed token is still expired, user needs to re-login')
      throw new Error('Authentication token expired. Please log in again.')
    }

    console.log('[PowerSync] Got valid KHUB token for sync')
    return {
      endpoint: POWERSYNC_URL,
      token: token,
    }
  }

  // Refresh token with deduplication (prevent multiple simultaneous refreshes)
  private async refreshToken(): Promise<string | null> {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise
    }

    this.tokenRefreshPromise = (async () => {
      try {
        console.log('[PowerSync] Refreshing token...')
        const refreshed = await refreshAuthToken()
        if (refreshed) {
          const token = await getAccessToken()
          console.log('[PowerSync] Token refreshed successfully')
          return token
        }
        return null
      } finally {
        this.tokenRefreshPromise = null
      }
    })()

    return this.tokenRefreshPromise
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    console.log('[Upload] >>> uploadData called - checking for pending transactions...')
    let totalUploaded = 0
    let consecutiveErrors = 0

    // Loop through ALL pending transactions
    while (true) {
      const transaction = await database.getNextCrudTransaction()
      console.log('[Upload] Got transaction:', transaction ? `${transaction.crud.length} ops` : 'null')

      if (!transaction) {
        if (totalUploaded > 0) {
          console.log(`[Upload] All done! Uploaded ${totalUploaded} transactions`)
        } else {
          console.log('[Upload] No pending transactions to upload')
        }
        return
      }

      console.log(`[Upload] Processing transaction with ${transaction.crud.length} operations`)

      try {
        for (const op of transaction.crud) {
          console.log(`[Upload] Operation: ${op.op} on ${op.table}, id: ${op.id}`)
          await this.applyOperationWithRetry(op)
        }

        // Mark transaction as complete
        await transaction.complete()
        totalUploaded++
        consecutiveErrors = 0 // Reset error counter on success
        console.log(`[Upload] Transaction ${totalUploaded} completed`)
      } catch (error: any) {
        consecutiveErrors++
        console.error(`[Upload] Error (attempt ${consecutiveErrors}):`, error.message)
        
        // If we've had too many consecutive errors, stop trying
        if (consecutiveErrors >= MAX_RETRIES) {
          console.error('[Upload] Too many consecutive errors, stopping upload')
          throw error
        }
        
        // Wait before retrying the transaction
        await delay(RETRY_DELAY_MS * consecutiveErrors)
      }
    }
  }

  // Apply operation with retry logic
  private async applyOperationWithRetry(op: CrudEntry, attempt = 1): Promise<void> {
    try {
      await this.applyOperation(op)
    } catch (error: any) {
      const isAuthError = error.response?.status === 401 || error.response?.status === 403
      const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      
      // Handle auth errors by refreshing token
      if (isAuthError && attempt === 1) {
        console.log('[Upload] Auth error, refreshing token and retrying...')
        await this.refreshToken()
        return this.applyOperationWithRetry(op, attempt + 1)
      }
      
      // Retry on server errors or network issues
      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(`[Upload] Retryable error, attempt ${attempt + 1}/${MAX_RETRIES}...`)
        await delay(RETRY_DELAY_MS * attempt)
        return this.applyOperationWithRetry(op, attempt + 1)
      }
      
      throw error
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
      promotions: '/tenant/api/v1/marketing/promotions',
      promotion_details: '/tenant/api/v1/marketing/promotion-details',
    }

    return endpoints[table] || `/tenant/api/v1/core/${table}`
  }
}
