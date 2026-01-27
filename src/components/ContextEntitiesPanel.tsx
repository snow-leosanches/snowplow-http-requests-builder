import { DynamicFormField } from "@/helpers/DynamicFormField"
import { FormSection } from "@/helpers/FormSection"
import { SchemaField } from "@/types/snowplow"
import { addToFieldHistory } from "@/utils/fieldHistory"
import { getSchemaUriFromDataStructure } from "@/utils/snowplowDataStructuresClient"
import type { DataStructure } from "@/types/snowplowDataStructures"
import { Search, X } from "lucide-react"

export interface ContextEntitiesPanelProps {
  contextSchemas: Array<{
    schema: string
    schemaJson: string
    dataJson: string
    data: Record<string, any>
    fields: SchemaField[]
    errors: Record<string, string>
  }>
  setContextSchemas: (contextSchemas: Array<{
    schema: string
    schemaJson: string
    dataJson: string
    data: Record<string, any>
    fields: SchemaField[]
    errors: Record<string, string>
  }>) => void
  removeContextEntity: (index: number) => void
  organizationId: string
  availableSchemas: DataStructure[]
  contextSchemaSearchQueries: Record<number, string>
  setContextSchemaSearchQueries: (contextSchemaSearchQueries: Record<number, string>) => void
  handleContextSchemaSelect: (index: number, uri: string) => void
  updateContextEntity: (index: number, field: string, value: any) => void
  updateContextEntityData: (index: number, fieldName: string, value: any) => void
  addContextEntity: () => void
  showContextSchemaDropdowns: Record<number, boolean>
  setShowContextSchemaDropdowns: (showContextSchemaDropdowns: Record<number, boolean>) => void
}

export const ContextEntitiesPanel = ({
  contextSchemas, removeContextEntity, organizationId, availableSchemas,
  contextSchemaSearchQueries, setContextSchemaSearchQueries,
  handleContextSchemaSelect,
  updateContextEntity, updateContextEntityData, addContextEntity,
  showContextSchemaDropdowns, setShowContextSchemaDropdowns
}: ContextEntitiesPanelProps) => {
  return <FormSection title="Context Entities">
    <div className="space-y-4">
      {contextSchemas.map((ctx, index) => (
        <div key={index} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white font-medium">Context Entity {index + 1}</h4>
            <button
              onClick={() => removeContextEntity(index)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="space-y-4">
            {/* Schema URI with searchable autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Schema URI
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={ctx.schema}
                  onChange={(e) => {
                    updateContextEntity(index, 'schema', e.target.value)
                    // Update search query for filtering
                    setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: e.target.value })
                  }}
                  onFocus={() => {
                    setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: true })
                    // Initialize search query with current schema value for filtering
                    if (!contextSchemaSearchQueries[index]) {
                      setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: ctx.schema })
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: false })
                    }, 200)
                    if (ctx.schema.trim() !== '') {
                      addToFieldHistory(`context_schema_${index}`, ctx.schema)
                    }
                  }}
                  placeholder="Search or type schema URI (e.g., iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0)"
                  className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
                {ctx.schema && (
                  <button
                    onClick={() => {
                      updateContextEntity(index, 'schema', '')
                      setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: '' })
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showContextSchemaDropdowns[index] && organizationId && availableSchemas.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {(() => {
                      const searchQuery = ctx.schema || ''
                      const lowerQuery = searchQuery.toLowerCase()
                      
                      // Filter schemas based on search query
                      const filtered = searchQuery
                        ? availableSchemas.filter(schema => {
                            const uri = getSchemaUriFromDataStructure(schema)
                            if (!uri) return false
                            return uri.toLowerCase().includes(lowerQuery) ||
                              schema.name.toLowerCase().includes(lowerQuery) ||
                              schema.vendor.toLowerCase().includes(lowerQuery) ||
                              (schema.description && schema.description.toLowerCase().includes(lowerQuery))
                          })
                        : availableSchemas.slice(0, 5) // Show first 5 when empty
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="p-3 text-sm text-gray-400 text-center">
                            No schemas found matching "{searchQuery}"
                          </div>
                        )
                      }
                      
                      return (
                        <>
                          <div className="p-2 text-xs text-gray-400 border-b border-slate-700 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            {searchQuery 
                              ? `Found ${filtered.length} schema${filtered.length !== 1 ? 's' : ''}`
                              : `Showing first 5 of ${availableSchemas.length} schemas`
                            }
                          </div>
                          {filtered.map((schema, idx) => {
                            const uri = getSchemaUriFromDataStructure(schema)
                            if (!uri) return null
                            return (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleContextSchemaSelect(index, uri)
                                  setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: false })
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                              >
                                <div className="font-mono text-xs">{uri}</div>
                                {schema.description && (
                                  <div className="text-xs text-gray-400 mt-1">{schema.description}</div>
                                )}
                              </button>
                            )
                          })}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                JSON Schema (for dynamic form generation)
              </label>
              <textarea
                value={ctx.schemaJson}
                onChange={(e) => updateContextEntity(index, 'schemaJson', e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                rows={6}
                placeholder='{"properties": {"id": {"type": "string"}, "name": {"type": "string"}}}'
              />
            </div>
            {ctx.fields.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Entity Data</label>
                {ctx.fields.map((field) => (
                  <div key={field.name}>
                    <DynamicFormField
                      field={field}
                      value={ctx.data[field.name]}
                      onChange={(value) => updateContextEntityData(index, field.name, value)}
                      error={ctx.errors[field.name]}
                    />
                  </div>
                ))}
              </div>
            )}
            {ctx.fields.length === 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entity Data (JSON)
                </label>
                <textarea
                  value={ctx.dataJson}
                  onChange={(e) => updateContextEntity(index, 'dataJson', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  rows={4}
                  placeholder='{"id": "123", "name": "Homepage"}'
                />
              </div>
            )}
          </div>
        </div>
      ))}
      <button
        onClick={addContextEntity}
        className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
      >
        Add Context Entity
      </button>
    </div>
  </FormSection>
}