import { createServerFn } from '@tanstack/react-start'
import type { AuthTokenResponse, DataStructure, ListDataStructuresParams } from '../types/snowplowDataStructures'

const BASE_URL = 'https://console.snowplowanalytics.com/api/msc/v1'

/**
 * Authenticate with Snowplow Data Structures API
 * Returns JWT access token
 */
export const authenticate = createServerFn({
  method: 'GET',
})
  .inputValidator((data: {
    organizationId: string
    apiKey: string
    apiKeyId: string
  }) => data)
  .handler(async ({ data }) => {
    const { organizationId, apiKey, apiKeyId } = data

    if (!organizationId || !apiKey || !apiKeyId) {
      throw new Error('organizationId, apiKey, and apiKeyId are required')
    }

    const url = `${BASE_URL}/organizations/${organizationId}/credentials/v3/token`

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Key-Id': apiKeyId,
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new Error(error.message || `Failed to authenticate: ${response.statusText}`)
      }

      const tokenData: AuthTokenResponse = await response.json()
      return tokenData
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error during authentication')
    }
  })

/**
 * List data structures from Snowplow Data Structures API
 */
export const listDataStructures = createServerFn({
  method: 'GET',
})
  .inputValidator((data: {
    organizationId: string
    accessToken: string
    params?: ListDataStructuresParams
  }) => data)
  .handler(async ({ data }) => {
    const { organizationId, accessToken, params = {} } = data

    if (!organizationId || !accessToken) {
      throw new Error('organizationId and accessToken are required')
    }

    const queryParams = new URLSearchParams()
    if (params.vendor) queryParams.append('vendor', params.vendor)
    if (params.name) queryParams.append('name', params.name)
    if (params.format) queryParams.append('format', params.format)
    if (params.from !== undefined) queryParams.append('from', params.from.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${BASE_URL}/organizations/${organizationId}/data-structures/v1${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please re-authenticate.')
        }
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new Error(error.message || `Failed to list data structures: ${response.statusText}`)
      }

      const dataStructures: DataStructure[] = await response.json()
      return dataStructures
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error listing data structures')
    }
  })

/**
 * Fetch schema content by hash and version
 */
export const fetchSchemaContent = createServerFn({
  method: 'GET',
})
  .inputValidator((data: {
    organizationId: string
    accessToken: string
    schemaHash: string
    version: string
    env?: 'DEV' | 'PROD'
  }) => data)
  .handler(async ({ data }) => {
    const { organizationId, accessToken, schemaHash, version, env } = data

    if (!organizationId || !accessToken || !schemaHash || !version) {
      throw new Error('organizationId, accessToken, schemaHash, and version are required')
    }

    const queryParams = new URLSearchParams()
    if (env) queryParams.append('env', env)

    const url = `${BASE_URL}/organizations/${organizationId}/data-structures/v1/${schemaHash}/versions/${version}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please re-authenticate.')
        }
        if (response.status === 404) {
          return null
        }
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new Error(error.message || `Failed to fetch schema content: ${response.statusText}`)
      }

      const schemaContent: any = await response.json()
      return schemaContent
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error fetching schema content')
    }
  })
