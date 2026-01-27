import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { addToFieldHistory } from "@/utils/fieldHistory"
import { DataStructure } from "@/types/snowplowDataStructures"
import { Loader2, RefreshCw } from "lucide-react"

export interface SnowplowConfigurationPanelProps {
  organizationId: string
  setOrganizationId: (id: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  apiKeyId: string
  setApiKeyId: (id: string) => void
  loadingSchemas: boolean
  availableSchemas: DataStructure[]
  loadAvailableSchemas: () => void
}

export const SnowplowConfigurationPanel = ({
  organizationId,
  setOrganizationId,
  apiKey,
  setApiKey,
  apiKeyId,
  setApiKeyId,
  loadingSchemas,
  availableSchemas,
  loadAvailableSchemas,
}: SnowplowConfigurationPanelProps) => {
  return (
    <FormSection title="Snowplow Data Structures Configuration">
      <div className="space-y-4">
        <FormField
          label="Organization ID"
          value={organizationId}
          onChange={(v) => {
            setOrganizationId(v)
            addToFieldHistory('organizationId', v)
          }}
          placeholder="b12539df-a711-42bd-bdfa-175308c55fd5"
          fieldName="organizationId"
        />
        <FormField
          label="API Key"
          value={apiKey}
          onChange={(v) => {
            setApiKey(v)
            addToFieldHistory('apiKey', v)
          }}
          placeholder="Enter your API key"
          fieldName="apiKey"
          type="password"
        />
        <FormField
          label="API Key ID"
          value={apiKeyId}
          onChange={(v) => {
            setApiKeyId(v)
            addToFieldHistory('apiKeyId', v)
          }}
          placeholder="Enter your API key ID"
          fieldName="apiKeyId"
          type="text"
        />
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {loadingSchemas && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading data structures...
              </div>
            )}
            {organizationId && !loadingSchemas && availableSchemas.length > 0 && (
              <div className="text-sm text-green-400">
                Loaded {availableSchemas.length} data structures
              </div>
            )}
            {organizationId && !loadingSchemas && availableSchemas.length === 0 && (
              <div className="text-sm text-gray-400">
                No data structures loaded. Click Refresh to load data structures.
              </div>
            )}
          </div>
          <button
            onClick={loadAvailableSchemas}
            disabled={!organizationId || !apiKey || !apiKeyId || loadingSchemas}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title={
              !organizationId || !apiKey || !apiKeyId
                ? 'Enter Organization ID, API Key, and API Key ID first'
                : 'Refresh data structures from Snowplow'
            }
          >
            {loadingSchemas ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>
    </FormSection>
  )
}
