import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { ApplicationParameters, Platform } from "@/types/snowplow"

export interface ApplicationParametersPanelProps {
  appParams: ApplicationParameters
  setAppParams: (appParams: ApplicationParameters) => void
}

export const ApplicationParametersPanel = ({ appParams, setAppParams }: ApplicationParametersPanelProps) => {
  return <FormSection title="Application Parameters">
    <div className="grid grid-cols-2 gap-4">
      <FormField
        label="Tracker Namespace (tna)"
        value={appParams.tna ?? ''}
        onChange={(v) => setAppParams({ ...appParams, tna: v })}
        fieldName="tna"
      />
      <FormField
        label="App ID (aid)"
        value={appParams.aid ?? ''}
        onChange={(v) => setAppParams({ ...appParams, aid: v })}
        fieldName="aid"
      />
      <FormField
        label="Platform (p)"
        value={appParams.p ?? ''}
        onChange={(v) => setAppParams({ ...appParams, p: v as Platform })}
        type="select"
        options={['web', 'mob', 'pc', 'srv', 'app', 'tv', 'cnsl', 'iot']}
        fieldName="p"
      />
      <FormField
        label="Tracker Version (tv)"
        value={appParams.tv ?? ''}
        onChange={(v) => setAppParams({ ...appParams, tv: v })}
        fieldName="tv"
      />
    </div>
  </FormSection>
}