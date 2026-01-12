import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { UserParameters } from "@/types/snowplow"

export interface UserParametersPanelProps {
  userParams: UserParameters
  setUserParams: (userParams: UserParameters) => void
}

export const UserParametersPanel = ({ userParams, setUserParams }: UserParametersPanelProps) => {
  return <FormSection title="User Parameters">
    <div className="grid grid-cols-2 gap-4">
      <FormField
        label="Domain User ID (duid)"
        value={userParams.duid ?? ''}
        onChange={(v) => setUserParams({ ...userParams, duid: v })}
        fieldName="duid"
      />
      <FormField
        label="Network User ID (tnuid)"
        value={userParams.tnuid ?? ''}
        onChange={(v) => setUserParams({ ...userParams, tnuid: v })}
        fieldName="tnuid"
      />
      <FormField
        label="User ID (uid)"
        value={userParams.uid ?? ''}
        onChange={(v) => setUserParams({ ...userParams, uid: v })}
        fieldName="uid"
      />
      <FormField
        label="Visit Index (vid)"
        value={userParams.vid?.toString() ?? ''}
        onChange={(v) => setUserParams({ ...userParams, vid: v ? Number(v) : undefined })}
        type="number"
        fieldName="vid"
      />
      <FormField
        label="Session ID (sid)"
        value={userParams.sid ?? ''}
        onChange={(v) => setUserParams({ ...userParams, sid: v })}
        fieldName="sid"
      />
      <FormField
        label="IP Address (ip)"
        value={userParams.ip ?? ''}
        onChange={(v) => setUserParams({ ...userParams, ip: v })}
        fieldName="ip"
      />
    </div>
  </FormSection>
}