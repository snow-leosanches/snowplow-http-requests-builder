import { SchemaField } from '../types/snowplow'

/**
 * Parse a JSON Schema and extract field definitions for form generation
 */
export function parseJsonSchema(schema: any): SchemaField[] {
  if (!schema || typeof schema !== 'object') {
    return []
  }

  const fields: SchemaField[] = []

  // Handle schema with properties
  if (schema.properties && typeof schema.properties === 'object') {
    const required = schema.required || []
    
    Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
      if (prop && typeof prop === 'object') {
        const field: SchemaField = {
          name,
          type: prop.type || 'string',
          description: prop.description,
          required: required.includes(name),
          enum: prop.enum,
        }

        // Handle nested objects
        if (prop.type === 'object' && prop.properties) {
          field.properties = {}
          Object.entries(prop.properties).forEach(([nestedName, nestedProp]: [string, any]) => {
            if (nestedProp && typeof nestedProp === 'object') {
              field.properties![nestedName] = {
                name: nestedName,
                type: nestedProp.type || 'string',
                description: nestedProp.description,
                required: (prop.required || []).includes(nestedName),
                enum: nestedProp.enum,
              }
            }
          })
        }

        // Handle arrays
        if (prop.type === 'array' && prop.items) {
          field.items = {
            name: 'item',
            type: prop.items.type || 'string',
            description: prop.items.description,
            enum: prop.items.enum,
          }
        }

        fields.push(field)
      }
    })
  }

  return fields
}

/**
 * Validate JSON schema format
 */
export function validateJsonSchema(schema: any): { valid: boolean; error?: string } {
  if (!schema) {
    return { valid: false, error: 'Schema is empty' }
  }

  if (typeof schema !== 'object') {
    return { valid: false, error: 'Schema must be a JSON object' }
  }

  // Basic validation - check if it looks like a JSON schema
  if (!schema.properties && !schema.$schema) {
    return { valid: false, error: 'Schema must have properties or $schema field' }
  }

  return { valid: true }
}

