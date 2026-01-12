import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { addToFieldHistory } from "@/utils/fieldHistory"

export interface CollectorInformationPanelProps {
  collectorUrl: string
  setCollectorUrl: (url: string) => void
}

export const CollectorInformationPanel = ({ collectorUrl, setCollectorUrl }: CollectorInformationPanelProps) => {
  return <FormSection title="Collector URL">
    <FormField
      label=""
      value={collectorUrl}
      onChange={(v) => {
        setCollectorUrl(v)
        addToFieldHistory('collectorUrl', v)
      }}
      placeholder="https://collector.snowplow.io/i"
      fieldName="collectorUrl"
    />
  </FormSection>
}