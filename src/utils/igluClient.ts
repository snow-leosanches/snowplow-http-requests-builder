/**
 * Iglu Server API Client
 */

export interface IgluSchemaRepr {
  type: 'Canonical' | 'Full' | 'Uri'
  schemaKey?: string
  schema?: {
    schemaMap: string
    metadata: {
      createdAt: string
      updatedAt: string
      isPublic: boolean
    }
    body: any
    supersedingInfo: {
      supersedes: Array<{
        type: 'Full'
        schema: {
          schemaMap: string
        }
      }>
      supersededBy?: {
        type: 'Full'
        schema: {
          schemaMap: string
        }
      }
    }
  }
  self?: {
    name: string
    vendor: string
    format: string
    version: string
  }
}

export interface IgluError {
  message: string
}

/**
 * Parse Iglu URI into components
 * Format: iglu:{vendor}/{name}/{format}/{version}
 */
export function parseIgluUri(uri: string): {
  vendor: string
  name: string
  format: string
  version: string
} | null {
  if (!uri.startsWith('iglu:')) {
    return null
  }

  const parts = uri.substring(5).split('/')
  if (parts.length !== 4) {
    return null
  }

  return {
    vendor: parts[0],
    name: parts[1],
    format: parts[2],
    version: parts[3],
  }
}

/**
 * Build Iglu URI from components
 */
export function buildIgluUri(
  vendor: string,
  name: string,
  format: string,
  version: string
): string {
  return `iglu:${vendor}/${name}/${format}/${version}`
}

/**
 * Fetch a schema from Iglu Server by URI
 */
export async function fetchSchemaByUri(
  baseUrl: string,
  apiKey: string | null,
  uri: string,
  repr: 'Canonical' | 'Meta' | 'Uri' = 'Canonical'
): Promise<IgluSchemaRepr | null> {
  const parsed = parseIgluUri(uri)
  if (!parsed) {
    throw new Error('Invalid Iglu URI format')
  }

  const url = `${baseUrl}/api/schemas/${parsed.vendor}/${parsed.name}/${parsed.format}/${parsed.version}?repr=${repr}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['apikey'] = apiKey
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error: IgluError = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.message || `Failed to fetch schema: ${response.statusText}`)
    }

    const data: IgluSchemaRepr = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error fetching schema')
  }
}

/**
 * List schemas by vendor and name
 */
export async function listSchemas(
  baseUrl: string,
  apiKey: string | null,
  vendor: string,
  name?: string,
  repr: 'Canonical' | 'Meta' | 'Uri' = 'Uri'
): Promise<IgluSchemaRepr[]> {
  let url: string
  if (name) {
    url = `${baseUrl}/api/schemas/${vendor}/${name}?repr=${repr}`
  } else {
    url = `${baseUrl}/api/schemas/${vendor}?repr=${repr}`
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['apikey'] = apiKey
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      const error: IgluError = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.message || `Failed to list schemas: ${response.statusText}`)
    }

    const data: IgluSchemaRepr[] = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error listing schemas')
  }
}

/**
 * Extract JSON Schema body from Iglu schema representation
 */
export function extractSchemaBody(repr: IgluSchemaRepr): any | null {
  if (repr.type === 'Full' && repr.schema?.body) {
    return repr.schema.body
  }
  if (repr.type === 'Canonical' && repr.self) {
    // For canonical representation, we'd need to fetch the full schema
    // For now, return null and let the caller handle it
    return null
  }
  return null
}

/**
 * Get schema URI from representation
 */
export function getSchemaUri(repr: IgluSchemaRepr): string | null {
  if (repr.schemaKey) {
    return repr.schemaKey
  }
  if (repr.type === 'Canonical' && repr.self) {
    return buildIgluUri(
      repr.self.vendor,
      repr.self.name,
      repr.self.format,
      repr.self.version
    )
  }
  if (repr.type === 'Full' && repr.schema?.schemaMap) {
    return repr.schema.schemaMap
  }
  return null
}

