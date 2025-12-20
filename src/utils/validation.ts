import { SchemaField } from '../types/snowplow'

/**
 * Validate a value against a schema field definition
 */
export function validateField(field: SchemaField, value: any): { valid: boolean; error?: string } {
  // Check required fields
  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${field.name} is required` }
  }

  // Skip validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return { valid: true }
  }

  // Validate enum values
  if (field.enum && !field.enum.includes(String(value))) {
    return { valid: false, error: `${field.name} must be one of: ${field.enum.join(', ')}` }
  }

  // Validate type
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `${field.name} must be a string` }
      }
      break
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: `${field.name} must be a number` }
      }
      break
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        return { valid: false, error: `${field.name} must be an integer` }
      }
      break
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${field.name} must be a boolean` }
      }
      break
    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: `${field.name} must be an array` }
      }
      // Validate array items if schema is provided
      if (field.items) {
        for (let i = 0; i < value.length; i++) {
          const itemValidation = validateField(field.items, value[i])
          if (!itemValidation.valid) {
            return { valid: false, error: `${field.name}[${i}]: ${itemValidation.error}` }
          }
        }
      }
      break
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { valid: false, error: `${field.name} must be an object` }
      }
      // Validate nested properties if schema is provided
      if (field.properties) {
        for (const [propName, propField] of Object.entries(field.properties)) {
          const propValidation = validateField(propField, value[propName])
          if (!propValidation.valid) {
            return { valid: false, error: `${field.name}.${propName}: ${propValidation.error}` }
          }
        }
      }
      break
  }

  return { valid: true }
}

/**
 * Validate all fields in a data object against their schema fields
 */
export function validateData(fields: SchemaField[], data: Record<string, any>): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
    const validation = validateField(field, data[field.name])
    if (!validation.valid && validation.error) {
      errors[field.name] = validation.error
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

