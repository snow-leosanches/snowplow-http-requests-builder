import { DynamicFormField } from "@/helpers/DynamicFormField"
import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { SchemaField } from "@/types/snowplow"
import { addToFieldHistory } from "@/utils/fieldHistory"
import { getSchemaUri, IgluSchemaRepr } from "@/utils/igluClient"
import { parseJsonSchema } from "@/utils/schemaParser"
import { Search, X } from "lucide-react"

export interface SelfDescribingEventPanelProps {
  igluBaseUrl: string
  availableSchemas: IgluSchemaRepr[]
  schemaSearchQuery: string
  setSchemaSearchQuery: (query: string) => void
  filteredSchemas: IgluSchemaRepr[]
  showSelfDescribingSchemaDropdown: boolean
  selfDescribingFields: SchemaField[]
  setShowSelfDescribingSchemaDropdown: (show: boolean) => void
  selfDescribingSchema: string
  setSelfDescribingSchema: (schema: string) => void
  selfDescribingSchemaJson: string
  setSelfDescribingSchemaJson: (schema: string) => void
  selfDescribingData: Record<string, any>
  setSelfDescribingData: (data: Record<string, any>) => void
  handleSelfDescribingSchemaSelect: (uri: string) => void
  updateSelfDescribingData: (name: string, value: any) => void
}

export const SelfDescribingEventPanel = (
    { igluBaseUrl, availableSchemas, schemaSearchQuery, setSchemaSearchQuery, 
        showSelfDescribingSchemaDropdown, setShowSelfDescribingSchemaDropdown, 
        selfDescribingSchema, selfDescribingSchemaJson, setSelfDescribingSchema, 
        filteredSchemas, handleSelfDescribingSchemaSelect, setSelfDescribingSchemaJson,
        selfDescribingData, setSelfDescribingData, selfDescribingFields, 
        updateSelfDescribingData
    }: SelfDescribingEventPanelProps
) => {
  return <FormSection title="Self-describing Event">
  <div className="space-y-4">
    {/* Schema Selection from Iglu */}
    {igluBaseUrl && availableSchemas.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Schema from Iglu Catalog
        </label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={schemaSearchQuery}
              onChange={(e) => setSchemaSearchQuery(e.target.value)}
              onFocus={() => setSchemaSearchQuery('')}
              placeholder="Search schemas..."
              className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
            {schemaSearchQuery && (
              <button
                onClick={() => setSchemaSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {schemaSearchQuery && filteredSchemas.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredSchemas.map((schema, idx) => {
                const uri = getSchemaUri(schema)
                if (!uri) return null
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelfDescribingSchemaSelect(uri)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="font-mono text-xs">{uri}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )}
    
    {/* Schema URI with Iglu dropdown */}
    {igluBaseUrl && availableSchemas.length > 0 ? (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Schema URI
        </label>
        <div className="relative">
          <input
            type="text"
            value={selfDescribingSchema}
            onChange={(e) => setSelfDescribingSchema(e.target.value)}
            onFocus={() => setShowSelfDescribingSchemaDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowSelfDescribingSchemaDropdown(false), 200)
              if (selfDescribingSchema.trim() !== '') {
                addToFieldHistory('selfDescribingSchema', selfDescribingSchema)
              }
            }}
            placeholder="iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
          {showSelfDescribingSchemaDropdown && availableSchemas.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2 text-xs text-gray-400 border-b border-slate-700 flex items-center gap-1">
                <Search className="w-3 h-3" />
                Available schemas ({availableSchemas.length})
              </div>
              {availableSchemas.map((schema, idx) => {
                const uri = getSchemaUri(schema)
                if (!uri) return null
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelfDescribingSchemaSelect(uri)
                      setShowSelfDescribingSchemaDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="font-mono text-xs">{uri}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    ) : (
      <FormField
        label="Schema URI"
        value={selfDescribingSchema}
        onChange={(v) => setSelfDescribingSchema(v)}
        placeholder="iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0"
        fieldName="selfDescribingSchema"
      />
    )}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        JSON Schema (for dynamic form generation)
      </label>
      <textarea
        value={selfDescribingSchemaJson}
        onChange={(e) => {
          setSelfDescribingSchemaJson(e.target.value)
          try {
            const schema = JSON.parse(e.target.value)
            const fields = parseJsonSchema(schema)
            // Initialize data with empty values
            const newData: Record<string, any> = {}
            fields.forEach(field => {
              if (!(field.name in selfDescribingData)) {
                newData[field.name] = ''
              }
            })
            setSelfDescribingData({ ...selfDescribingData, ...newData })
          } catch {
            // Invalid JSON, ignore
          }
        }}
        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
        rows={8}
        placeholder='{"properties": {"name": {"type": "string"}, "value": {"type": "number"}}}'
      />
    </div>
    {selfDescribingFields.length > 0 && (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Event Data</label>
        {selfDescribingFields.map((field) => (
          <DynamicFormField
            key={field.name}
            field={field}
            value={selfDescribingData[field.name]}
            onChange={(value) => updateSelfDescribingData(field.name, value)}
          />
        ))}
      </div>
    )}
    {selfDescribingFields.length === 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Event Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(selfDescribingData, null, 2)}
          onChange={(e) => {
            try {
              setSelfDescribingData(JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
          rows={6}
        />
      </div>
    )}
  </div>
</FormSection>
}