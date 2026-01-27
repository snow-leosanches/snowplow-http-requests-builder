/**
 * Snowplow Data Structures API Client
 */

import { authenticate as authenticateServer, listDataStructures as listDataStructuresServer, fetchSchemaContent as fetchSchemaContentServer } from '../server/snowplowDataStructures'
import type { DataStructure, ListDataStructuresParams } from '../types/snowplowDataStructures'

const ACCESS_TOKEN_KEY = 'snowplow_access_token'
const TOKEN_EXPIRY_KEY = 'snowplow_token_expiry'

/**
 * Get stored access token from localStorage
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  
  if (!token || !expiry) return null
  
  // Check if token is expired (with 5 minute buffer)
  const expiryTime = parseInt(expiry, 10)
  if (Date.now() >= expiryTime - 5 * 60 * 1000) {
    // Token expired or about to expire
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  
  return token
}

/**
 * Store access token in localStorage
 * JWT tokens typically expire in 1 hour, but we'll store expiry as 55 minutes to be safe
 */
export function storeAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  // Store expiry time (55 minutes from now)
  const expiryTime = Date.now() + 55 * 60 * 1000
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

/**
 * Clear stored access token
 */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

/**
 * Authenticate with Snowplow Data Structures API
 * Stores the access token in localStorage
 */
export async function authenticate(
  organizationId: string,
  apiKey: string,
  apiKeyId: string
): Promise<string> {
  const response = await authenticateServer({
    data: { organizationId, apiKey, apiKeyId },
  })
  
  storeAccessToken(response.accessToken)
  return response.accessToken
}

/**
 * List data structures from Snowplow Data Structures API
 * Automatically handles authentication token
 */
export async function listDataStructures(
  organizationId: string,
  apiKey: string,
  apiKeyId: string,
  params?: ListDataStructuresParams
): Promise<DataStructure[]> {
  // Get or refresh access token
  let accessToken = getStoredAccessToken()
  
  if (!accessToken) {
    // Need to authenticate
    accessToken = await authenticate(organizationId, apiKey, apiKeyId)
  }
  
  try {
    return await listDataStructuresServer({
      data: { organizationId, accessToken, params },
    })
  } catch (error) {
    // If authentication failed, try once more with fresh token
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      clearAccessToken()
      accessToken = await authenticate(organizationId, apiKey, apiKeyId)
      return await listDataStructuresServer({
        data: { organizationId, accessToken, params },
      })
    }
    throw error
  }
}

/**
 * Build Iglu URI from data structure
 * Format: iglu:{vendor}/{name}/{format}/{version}
 */
export function buildIgluUriFromDataStructure(
  dataStructure: DataStructure,
  deployment?: DataStructure['deployments'][0]
): string {
  const version = deployment?.version || dataStructure.deployments[0]?.version || '1-0-0'
  return `iglu:${dataStructure.vendor}/${dataStructure.name}/${dataStructure.format}/${version}`
}

/**
 * Get schema URI from data structure
 */
export function getSchemaUriFromDataStructure(
  dataStructure: DataStructure
): string {
  return buildIgluUriFromDataStructure(dataStructure)
}

/**
 * Fetch schema content by hash and version
 */
export async function fetchSchemaContent(
  organizationId: string,
  apiKey: string,
  apiKeyId: string,
  schemaHash: string,
  version: string,
  env?: 'DEV' | 'PROD'
): Promise<any | null> {
  // Get or refresh access token
  let accessToken = getStoredAccessToken()
  
  if (!accessToken) {
    accessToken = await authenticate(organizationId, apiKey, apiKeyId)
  }
  
  try {
    return await fetchSchemaContentServer({
      data: { organizationId, accessToken, schemaHash, version, env },
    })
  } catch (error) {
    // If authentication failed, try once more with fresh token
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      clearAccessToken()
      accessToken = await authenticate(organizationId, apiKey, apiKeyId)
      return await fetchSchemaContentServer({
        data: { organizationId, accessToken, schemaHash, version, env },
      })
    }
    throw error
  }
}
