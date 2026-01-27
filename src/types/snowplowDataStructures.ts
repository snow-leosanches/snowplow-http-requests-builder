/**
 * Snowplow Data Structures API Types
 */

export interface DataStructure {
  hash: string
  organizationId: string
  vendor: string
  name: string
  format: string
  description: string
  meta: {
    hidden: boolean
    schemaType?: 'entity' | 'event'
    customData: Record<string, any>
  }
  deployments: Array<{
    version: string
    patchLevel: number
    contentHash: string
    env: 'DEV' | 'PROD'
    ts: string
    message: string | null
    initiator: string
  }>
}

export interface AuthTokenResponse {
  accessToken: string
}

export interface ListDataStructuresParams {
  vendor?: string
  name?: string
  format?: string
  from?: number
  size?: number
}
