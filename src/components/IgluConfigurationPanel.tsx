import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { addToFieldHistory } from "@/utils/fieldHistory"
import { IgluSchemaRepr } from "@/utils/igluClient"
import { Loader2, RefreshCw } from "lucide-react"

export interface IgluConfigurationPanelProps {
  igluBaseUrl: string
  setIgluBaseUrl: (url: string) => void
  igluApiKey: string
  setIgluApiKey: (key: string) => void
  loadingSchemas: boolean
  availableSchemas: IgluSchemaRepr[]
  loadAvailableSchemas: () => void
}

export const IgluConfigurationPanel = ({ igluBaseUrl, setIgluBaseUrl, igluApiKey, setIgluApiKey, loadingSchemas, availableSchemas, loadAvailableSchemas }: IgluConfigurationPanelProps) => {
  return <FormSection title="Iglu Server Configuration (optional)">
  <div className="space-y-4">
    <FormField
      label="Iglu Server Base URL"
      value={igluBaseUrl}
      onChange={(v) => {
        setIgluBaseUrl(v)
        addToFieldHistory('igluBaseUrl', v)
      }}
      placeholder="https://com-myserver-dev.iglu.snplow.net"
      fieldName="igluBaseUrl"
    />
    <FormField
      label="API Key (optional)"
      value={igluApiKey}
      onChange={(v) => {
        setIgluApiKey(v)
        addToFieldHistory('igluApiKey', v)
      }}
      placeholder="Enter your Iglu API key"
      fieldName="igluApiKey"
      type="text"
    />
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        {loadingSchemas && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading schemas...
          </div>
        )}
        {igluBaseUrl && !loadingSchemas && availableSchemas.length > 0 && (
          <div className="text-sm text-green-400">
            Loaded {availableSchemas.length} schemas
          </div>
        )}
        {igluBaseUrl && !loadingSchemas && availableSchemas.length === 0 && (
          <div className="text-sm text-gray-400">
            No schemas loaded. Click Refresh to load schemas.
          </div>
        )}
      </div>
      <button
        onClick={loadAvailableSchemas}
        disabled={!igluBaseUrl || loadingSchemas}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        title={!igluBaseUrl ? 'Enter Iglu Server Base URL first' : 'Refresh schemas from Iglu Server'}
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
}