import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { StructuredEventParameters } from "@/types/snowplow"

export interface StructuredEventParametersPanelProps {
  structuredEventParams: StructuredEventParameters
  setStructuredEventParams: (structuredEventParams: StructuredEventParameters) => void
}

export const StructuredEventParametersPanel = ({ structuredEventParams, setStructuredEventParams }: StructuredEventParametersPanelProps) => {
  return <FormSection title="Structured Event Parameters">
    <div className="grid grid-cols-2 gap-4">
      <FormField
        label="Category (se_ca)"
        value={structuredEventParams.se_ca ?? ''}
        onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_ca: v })}
        fieldName="se_ca"
      />
      <FormField
        label="Action (se_ac)"
        value={structuredEventParams.se_ac ?? ''}
        onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_ac: v })}
        fieldName="se_ac"
      />
      <FormField
        label="Label (se_la)"
        value={structuredEventParams.se_la ?? ''}
        onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_la: v })}
        fieldName="se_la"
      />
      <FormField
        label="Property (se_pr)"
        value={structuredEventParams.se_pr ?? ''}
        onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_pr: v })}
        fieldName="se_pr"
      />
      <FormField
        label="Value (se_va)"
        value={structuredEventParams.se_va?.toString() ?? ''}
        onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_va: v ? Number(v) : undefined })}
        type="number"
        fieldName="se_va"
      />
    </div>
  </FormSection>
}