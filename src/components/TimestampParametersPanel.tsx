import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { TimestampParameters } from "@/types/snowplow"

export interface TimestampParametersPanelProps {
  timestampParams: TimestampParameters
  setTimestampParams: (timestampParams: TimestampParameters) => void
}

export const TimestampParametersPanel = ({ timestampParams, setTimestampParams }: TimestampParametersPanelProps) => {
  return <FormSection title="Timestamp Parameters">
  <div className="grid grid-cols-2 gap-4">
    <FormField
      label="Device Created (dtm)"
      value={timestampParams.dtm?.toString() ?? ''}
      onChange={(v) => setTimestampParams({ ...timestampParams, dtm: v ? Number(v) : undefined })}
      type="number"
      fieldName="dtm"
    />
    <FormField
      label="Device Sent (stm)"
      value={timestampParams.stm?.toString() ?? ''}
      onChange={(v) => setTimestampParams({ ...timestampParams, stm: v ? Number(v) : undefined })}
      type="number"
      fieldName="stm"
    />
    <FormField
      label="True Timestamp (ttm)"
      value={timestampParams.ttm?.toString() ?? ''}
      onChange={(v) => setTimestampParams({ ...timestampParams, ttm: v ? Number(v) : undefined })}
      type="number"
      fieldName="ttm"
    />
    <FormField
      label="Timezone (tz)"
      value={timestampParams.tz ?? ''}
      onChange={(v) => setTimestampParams({ ...timestampParams, tz: v })}
      fieldName="tz"
    />
  </div>
</FormSection>
}