import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { PlatformParameters } from "@/types/snowplow"

export interface PlatformParametersPanelProps {
  platformParams: PlatformParameters
  setPlatformParams: (platformParams: PlatformParameters) => void
}

export const PlatformParametersPanel = ({ platformParams, setPlatformParams }: PlatformParametersPanelProps) => {
  return <FormSection title="Platform Parameters">
    <div className="space-y-4">
      <FormField
        label="Page URL (url)"
        value={platformParams.url ?? ''}
        onChange={(v) => setPlatformParams({ ...platformParams, url: v })}
        fieldName="url"
      />
      <FormField
        label="User Agent (ua)"
        value={platformParams.ua ?? ''}
        onChange={(v) => setPlatformParams({ ...platformParams, ua: v })}
        fieldName="ua"
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Page Title (page)"
          value={platformParams.page ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, page: v })}
          fieldName="page"
        />
        <FormField
          label="Referrer (refr)"
          value={platformParams.refr ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, refr: v })}
          fieldName="refr"
        />
        <FormField
          label="Language (lang)"
          value={platformParams.lang ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, lang: v })}
          fieldName="lang"
        />
        <FormField
          label="Color Depth (cd)"
          value={platformParams.cd?.toString() ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, cd: v ? Number(v) : undefined })}
          type="number"
          fieldName="cd"
        />
        <FormField
          label="Charset (cs)"
          value={platformParams.cs ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, cs: v })}
          fieldName="cs"
        />
        <FormField
          label="Document Size (ds)"
          value={platformParams.ds ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, ds: v })}
          placeholder="1090x1152"
          fieldName="ds"
        />
        <FormField
          label="Viewport (vp)"
          value={platformParams.vp ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, vp: v })}
          placeholder="1105x390"
          fieldName="vp"
        />
        <FormField
          label="Resolution (res)"
          value={platformParams.res ?? ''}
          onChange={(v) => setPlatformParams({ ...platformParams, res: v })}
          placeholder="1280x1024"
          fieldName="res"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={platformParams.cookie ?? false}
            onChange={(e) => setPlatformParams({ ...platformParams, cookie: e.target.checked })}
            className="w-4 h-4"
          />
          Cookies Enabled (cookie)
        </label>
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={platformParams.f_pdf ?? false}
            onChange={(e) => setPlatformParams({ ...platformParams, f_pdf: e.target.checked })}
            className="w-4 h-4"
          />
          PDF Plugin (f_pdf)
        </label>
      </div>
    </div>
  </FormSection>
}