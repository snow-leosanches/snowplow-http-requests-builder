import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { PagePingParameters } from "@/types/snowplow"

export interface PagePingParametersPanelProps {
  pagePingParams: PagePingParameters
  setPagePingParams: (pagePingParams: PagePingParameters) => void
}

export const PagePingParametersPanel = ({ pagePingParams, setPagePingParams }: PagePingParametersPanelProps) => {
  return <FormSection title="Page Ping Parameters">
  <div className="grid grid-cols-2 gap-4">
    <FormField
      label="Min X Offset (pp_mix)"
      value={pagePingParams.pp_mix?.toString() ?? ''}
      onChange={(v) => setPagePingParams({ ...pagePingParams, pp_mix: v ? Number(v) : undefined })}
      type="number"
      fieldName="pp_mix"
    />
    <FormField
      label="Max X Offset (pp_max)"
      value={pagePingParams.pp_max?.toString() ?? ''}
      onChange={(v) => setPagePingParams({ ...pagePingParams, pp_max: v ? Number(v) : undefined })}
      type="number"
      fieldName="pp_max"
    />
    <FormField
      label="Min Y Offset (pp_miy)"
      value={pagePingParams.pp_miy?.toString() ?? ''}
      onChange={(v) => setPagePingParams({ ...pagePingParams, pp_miy: v ? Number(v) : undefined })}
      type="number"
      fieldName="pp_miy"
    />
    <FormField
      label="Max Y Offset (pp_may)"
      value={pagePingParams.pp_may?.toString() ?? ''}
      onChange={(v) => setPagePingParams({ ...pagePingParams, pp_may: v ? Number(v) : undefined })}
      type="number"
      fieldName="pp_may"
    />
  </div>
</FormSection>
}