const HISTORY_KEY_PREFIX = 'snowplow_field_history_'
const MAX_HISTORY_ITEMS = 5

/**
 * Get history for a specific field
 */
export function getFieldHistory(fieldName: string): string[] {
  try {
    const key = `${HISTORY_KEY_PREFIX}${fieldName}`
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Error reading field history:', error)
  }
  return []
}

/**
 * Add a value to field history
 */
export function addToFieldHistory(fieldName: string, value: string): void {
  if (!value || value.trim() === '') {
    return
  }

  try {
    const key = `${HISTORY_KEY_PREFIX}${fieldName}`
    const currentHistory = getFieldHistory(fieldName)
    
    // Remove the value if it already exists (to avoid duplicates)
    const filtered = currentHistory.filter(v => v !== value)
    
    // Add to the beginning and limit to MAX_HISTORY_ITEMS
    const newHistory = [value, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(key, JSON.stringify(newHistory))
  } catch (error) {
    console.error('Error saving field history:', error)
  }
}

/**
 * Clear history for a specific field
 */
export function clearFieldHistory(fieldName: string): void {
  try {
    const key = `${HISTORY_KEY_PREFIX}${fieldName}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing field history:', error)
  }
}

/**
 * Clear all field history
 */
export function clearAllFieldHistory(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(HISTORY_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing all field history:', error)
  }
}

