import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  EventType,
  Platform,
  SnowplowRequest,
  SelfDescribingEvent,
  ContextEntity,
} from '../types/snowplow'
import { buildSnowplowUrl, generateUUID } from '../utils/urlBuilder'
import {
  parseJsonSchema,
  validateJsonSchema,
} from '../utils/schemaParser'
import { SchemaField } from '../types/snowplow'
import { Copy, Check, Code, FileJson } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Builder,
})

function Builder() {
  const [collectorUrl, setCollectorUrl] = useState('https://collector.snowplow.io/i')
  const [eventType, setEventType] = useState<EventType>('pv')
  
  // Common parameters
  const [appParams, setAppParams] = useState({
    tna: '',
    aid: '',
    p: 'web' as Platform,
    tv: '',
  })
  
  const [timestampParams, setTimestampParams] = useState({
    dtm: '',
    stm: '',
    ttm: '',
    tz: '',
  })
  
  const [userParams, setUserParams] = useState({
    duid: '',
    tnuid: '',
    uid: '',
    vid: '',
    sid: '',
    ip: '',
  })
  
  const [platformParams, setPlatformParams] = useState({
    url: '',
    ua: '',
    page: '',
    refr: '',
    cookie: false,
    lang: '',
    f_pdf: false,
    cd: '',
    cs: '',
    ds: '',
    vp: '',
    res: '',
    mac: '',
  })
  
  // Event-specific parameters
  const [pagePingParams, setPagePingParams] = useState({
    pp_mix: '',
    pp_max: '',
    pp_miy: '',
    pp_may: '',
  })
  
  const [transactionParams, setTransactionParams] = useState({
    tr_id: '',
    tr_af: '',
    tr_tt: '',
    tr_tx: '',
    tr_sh: '',
    tr_ci: '',
    tr_st: '',
    tr_co: '',
    tr_cu: '',
  })
  
  const [transactionItemParams, setTransactionItemParams] = useState({
    ti_id: '',
    ti_sk: '',
    ti_nm: '',
    ti_ca: '',
    ti_pr: '',
    ti_qu: '',
    ti_cu: '',
  })
  
  const [structuredEventParams, setStructuredEventParams] = useState({
    se_ca: '',
    se_ac: '',
    se_la: '',
    se_pr: '',
    se_va: '',
  })
  
  // Self-describing event
  const [selfDescribingSchema, setSelfDescribingSchema] = useState('')
  const [selfDescribingData, setSelfDescribingData] = useState<Record<string, any>>({})
  const [selfDescribingSchemaJson, setSelfDescribingSchemaJson] = useState('')
  
  // Context entities
  const [contextSchemas, setContextSchemas] = useState<Array<{
    schema: string
    dataJson: string
    data: Record<string, any>
  }>>([])
  
  const [copied, setCopied] = useState(false)

  // Parse JSON schema for self-describing event
  const selfDescribingFields = useMemo(() => {
    if (!selfDescribingSchemaJson) return []
    try {
      const schema = JSON.parse(selfDescribingSchemaJson)
      return parseJsonSchema(schema)
    } catch {
      return []
    }
  }, [selfDescribingSchemaJson])

  // Build the request object
  const request = useMemo((): SnowplowRequest => {
    const req: SnowplowRequest = {
      event: {
        e: eventType,
        eid: generateUUID(),
      },
    }

    // Application parameters
    if (appParams.tna || appParams.aid || appParams.p || appParams.tv) {
      req.application = {}
      if (appParams.tna) req.application.tna = appParams.tna
      if (appParams.aid) req.application.aid = appParams.aid
      if (appParams.p) req.application.p = appParams.p
      if (appParams.tv) req.application.tv = appParams.tv
    }

    // Timestamp parameters
    if (timestampParams.dtm || timestampParams.stm || timestampParams.ttm || timestampParams.tz) {
      req.timestamp = {}
      if (timestampParams.dtm) req.timestamp.dtm = parseInt(timestampParams.dtm) || Date.now()
      if (timestampParams.stm) req.timestamp.stm = parseInt(timestampParams.stm) || Date.now()
      if (timestampParams.ttm) req.timestamp.ttm = parseInt(timestampParams.ttm) || Date.now()
      if (timestampParams.tz) req.timestamp.tz = timestampParams.tz
    }

    // User parameters
    if (Object.values(userParams).some(v => v)) {
      req.user = {}
      if (userParams.duid) req.user.duid = userParams.duid
      if (userParams.tnuid) req.user.tnuid = userParams.tnuid
      if (userParams.uid) req.user.uid = userParams.uid
      if (userParams.vid) req.user.vid = parseInt(userParams.vid) || undefined
      if (userParams.sid) req.user.sid = userParams.sid
      if (userParams.ip) req.user.ip = userParams.ip
    }

    // Platform parameters
    if (Object.values(platformParams).some(v => v !== '' && v !== false)) {
      req.platform = {}
      if (platformParams.url) req.platform.url = platformParams.url
      if (platformParams.ua) req.platform.ua = platformParams.ua
      if (platformParams.page) req.platform.page = platformParams.page
      if (platformParams.refr) req.platform.refr = platformParams.refr
      if (platformParams.cookie) req.platform.cookie = platformParams.cookie
      if (platformParams.lang) req.platform.lang = platformParams.lang
      if (platformParams.f_pdf) req.platform.f_pdf = platformParams.f_pdf
      if (platformParams.cd) req.platform.cd = parseInt(platformParams.cd) || undefined
      if (platformParams.cs) req.platform.cs = platformParams.cs
      if (platformParams.ds) req.platform.ds = platformParams.ds
      if (platformParams.vp) req.platform.vp = platformParams.vp
      if (platformParams.res) req.platform.res = platformParams.res
      if (platformParams.mac) req.platform.mac = platformParams.mac
    }

    // Event-specific parameters
    if (eventType === 'pp') {
      if (Object.values(pagePingParams).some(v => v)) {
        req.pagePing = {}
        if (pagePingParams.pp_mix) req.pagePing.pp_mix = parseInt(pagePingParams.pp_mix) || undefined
        if (pagePingParams.pp_max) req.pagePing.pp_max = parseInt(pagePingParams.pp_max) || undefined
        if (pagePingParams.pp_miy) req.pagePing.pp_miy = parseInt(pagePingParams.pp_miy) || undefined
        if (pagePingParams.pp_may) req.pagePing.pp_may = parseInt(pagePingParams.pp_may) || undefined
      }
    }

    if (eventType === 'tr') {
      if (Object.values(transactionParams).some(v => v)) {
        req.transaction = {}
        if (transactionParams.tr_id) req.transaction.tr_id = transactionParams.tr_id
        if (transactionParams.tr_af) req.transaction.tr_af = transactionParams.tr_af
        if (transactionParams.tr_tt) req.transaction.tr_tt = parseFloat(transactionParams.tr_tt) || undefined
        if (transactionParams.tr_tx) req.transaction.tr_tx = parseFloat(transactionParams.tr_tx) || undefined
        if (transactionParams.tr_sh) req.transaction.tr_sh = parseFloat(transactionParams.tr_sh) || undefined
        if (transactionParams.tr_ci) req.transaction.tr_ci = transactionParams.tr_ci
        if (transactionParams.tr_st) req.transaction.tr_st = transactionParams.tr_st
        if (transactionParams.tr_co) req.transaction.tr_co = transactionParams.tr_co
        if (transactionParams.tr_cu) req.transaction.tr_cu = transactionParams.tr_cu
      }
    }

    if (eventType === 'ti') {
      if (Object.values(transactionItemParams).some(v => v)) {
        req.transactionItem = {}
        if (transactionItemParams.ti_id) req.transactionItem.ti_id = transactionItemParams.ti_id
        if (transactionItemParams.ti_sk) req.transactionItem.ti_sk = transactionItemParams.ti_sk
        if (transactionItemParams.ti_nm) req.transactionItem.ti_nm = transactionItemParams.ti_nm
        if (transactionItemParams.ti_ca) req.transactionItem.ti_ca = transactionItemParams.ti_ca
        if (transactionItemParams.ti_pr) req.transactionItem.ti_pr = parseFloat(transactionItemParams.ti_pr) || undefined
        if (transactionItemParams.ti_qu) req.transactionItem.ti_qu = parseInt(transactionItemParams.ti_qu) || undefined
        if (transactionItemParams.ti_cu) req.transactionItem.ti_cu = transactionItemParams.ti_cu
      }
    }

    if (eventType === 'se') {
      if (Object.values(structuredEventParams).some(v => v)) {
        req.structuredEvent = {}
        if (structuredEventParams.se_ca) req.structuredEvent.se_ca = structuredEventParams.se_ca
        if (structuredEventParams.se_ac) req.structuredEvent.se_ac = structuredEventParams.se_ac
        if (structuredEventParams.se_la) req.structuredEvent.se_la = structuredEventParams.se_la
        if (structuredEventParams.se_pr) req.structuredEvent.se_pr = structuredEventParams.se_pr
        if (structuredEventParams.se_va) req.structuredEvent.se_va = parseFloat(structuredEventParams.se_va) || undefined
      }
    }

    // Self-describing event
    if (eventType === 'ue' && selfDescribingSchema) {
      req.selfDescribingEvent = {
        schema: selfDescribingSchema,
        data: selfDescribingData,
      }
    }

    // Context entities
    const validContexts = contextSchemas
      .filter(ctx => ctx.schema && ctx.dataJson)
      .map(ctx => {
        try {
          return {
            schema: ctx.schema,
            data: JSON.parse(ctx.dataJson),
          } as ContextEntity
        } catch {
          return null
        }
      })
      .filter((ctx): ctx is ContextEntity => ctx !== null)

    if (validContexts.length > 0) {
      req.contexts = validContexts
    }

    return req
  }, [
    eventType,
    appParams,
    timestampParams,
    userParams,
    platformParams,
    pagePingParams,
    transactionParams,
    transactionItemParams,
    structuredEventParams,
    selfDescribingSchema,
    selfDescribingData,
    contextSchemas,
  ])

  const generatedUrl = useMemo(() => {
    try {
      return buildSnowplowUrl(collectorUrl, request)
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }, [collectorUrl, request])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addContextEntity = () => {
    setContextSchemas([...contextSchemas, { schema: '', dataJson: '{}', data: {} }])
  }

  const removeContextEntity = (index: number) => {
    setContextSchemas(contextSchemas.filter((_, i) => i !== index))
  }

  const updateContextEntity = (index: number, field: 'schema' | 'dataJson', value: string) => {
    const updated = [...contextSchemas]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'dataJson') {
      try {
        updated[index].data = JSON.parse(value)
      } catch {
        // Invalid JSON, keep previous data
      }
    }
    setContextSchemas(updated)
  }

  const updateSelfDescribingData = (fieldName: string, value: any) => {
    setSelfDescribingData({ ...selfDescribingData, [fieldName]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Snowplow HTTP Request Builder</h1>
          <p className="text-gray-400">
            Build pixel tracking requests for Snowplow events with support for self-describing events and context entities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Collector URL */}
            <FormSection title="Collector URL">
              <input
                type="text"
                value={collectorUrl}
                onChange={(e) => setCollectorUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="https://collector.snowplow.io/i"
              />
            </FormSection>

            {/* Event Type */}
            <FormSection title="Event Type">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="pv">Page View (pv)</option>
                <option value="pp">Page Ping (pp)</option>
                <option value="tr">Transaction (tr)</option>
                <option value="ti">Transaction Item (ti)</option>
                <option value="se">Structured Event (se)</option>
                <option value="ue">Self-describing Event (ue)</option>
              </select>
            </FormSection>

            {/* Application Parameters */}
            <FormSection title="Application Parameters">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Tracker Namespace (tna)"
                  value={appParams.tna}
                  onChange={(v) => setAppParams({ ...appParams, tna: v })}
                />
                <FormField
                  label="App ID (aid)"
                  value={appParams.aid}
                  onChange={(v) => setAppParams({ ...appParams, aid: v })}
                />
                <FormField
                  label="Platform (p)"
                  value={appParams.p}
                  onChange={(v) => setAppParams({ ...appParams, p: v as Platform })}
                  type="select"
                  options={['web', 'mob', 'pc', 'srv', 'app', 'tv', 'cnsl', 'iot']}
                />
                <FormField
                  label="Tracker Version (tv)"
                  value={appParams.tv}
                  onChange={(v) => setAppParams({ ...appParams, tv: v })}
                />
              </div>
            </FormSection>

            {/* Timestamp Parameters */}
            <FormSection title="Timestamp Parameters">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Device Created (dtm)"
                  value={timestampParams.dtm}
                  onChange={(v) => setTimestampParams({ ...timestampParams, dtm: v })}
                  type="number"
                />
                <FormField
                  label="Device Sent (stm)"
                  value={timestampParams.stm}
                  onChange={(v) => setTimestampParams({ ...timestampParams, stm: v })}
                  type="number"
                />
                <FormField
                  label="True Timestamp (ttm)"
                  value={timestampParams.ttm}
                  onChange={(v) => setTimestampParams({ ...timestampParams, ttm: v })}
                  type="number"
                />
                <FormField
                  label="Timezone (tz)"
                  value={timestampParams.tz}
                  onChange={(v) => setTimestampParams({ ...timestampParams, tz: v })}
                />
              </div>
            </FormSection>

            {/* User Parameters */}
            <FormSection title="User Parameters">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Domain User ID (duid)"
                  value={userParams.duid}
                  onChange={(v) => setUserParams({ ...userParams, duid: v })}
                />
                <FormField
                  label="Network User ID (tnuid)"
                  value={userParams.tnuid}
                  onChange={(v) => setUserParams({ ...userParams, tnuid: v })}
                />
                <FormField
                  label="User ID (uid)"
                  value={userParams.uid}
                  onChange={(v) => setUserParams({ ...userParams, uid: v })}
                />
                <FormField
                  label="Visit Index (vid)"
                  value={userParams.vid}
                  onChange={(v) => setUserParams({ ...userParams, vid: v })}
                  type="number"
                />
                <FormField
                  label="Session ID (sid)"
                  value={userParams.sid}
                  onChange={(v) => setUserParams({ ...userParams, sid: v })}
                />
                <FormField
                  label="IP Address (ip)"
                  value={userParams.ip}
                  onChange={(v) => setUserParams({ ...userParams, ip: v })}
                />
              </div>
            </FormSection>

            {/* Platform Parameters */}
            <FormSection title="Platform Parameters">
              <div className="space-y-4">
                <FormField
                  label="Page URL (url)"
                  value={platformParams.url}
                  onChange={(v) => setPlatformParams({ ...platformParams, url: v })}
                />
                <FormField
                  label="User Agent (ua)"
                  value={platformParams.ua}
                  onChange={(v) => setPlatformParams({ ...platformParams, ua: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Page Title (page)"
                    value={platformParams.page}
                    onChange={(v) => setPlatformParams({ ...platformParams, page: v })}
                  />
                  <FormField
                    label="Referrer (refr)"
                    value={platformParams.refr}
                    onChange={(v) => setPlatformParams({ ...platformParams, refr: v })}
                  />
                  <FormField
                    label="Language (lang)"
                    value={platformParams.lang}
                    onChange={(v) => setPlatformParams({ ...platformParams, lang: v })}
                  />
                  <FormField
                    label="Color Depth (cd)"
                    value={platformParams.cd}
                    onChange={(v) => setPlatformParams({ ...platformParams, cd: v })}
                    type="number"
                  />
                  <FormField
                    label="Charset (cs)"
                    value={platformParams.cs}
                    onChange={(v) => setPlatformParams({ ...platformParams, cs: v })}
                  />
                  <FormField
                    label="Document Size (ds)"
                    value={platformParams.ds}
                    onChange={(v) => setPlatformParams({ ...platformParams, ds: v })}
                    placeholder="1090x1152"
                  />
                  <FormField
                    label="Viewport (vp)"
                    value={platformParams.vp}
                    onChange={(v) => setPlatformParams({ ...platformParams, vp: v })}
                    placeholder="1105x390"
                  />
                  <FormField
                    label="Resolution (res)"
                    value={platformParams.res}
                    onChange={(v) => setPlatformParams({ ...platformParams, res: v })}
                    placeholder="1280x1024"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={platformParams.cookie}
                      onChange={(e) => setPlatformParams({ ...platformParams, cookie: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Cookies Enabled (cookie)
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={platformParams.f_pdf}
                      onChange={(e) => setPlatformParams({ ...platformParams, f_pdf: e.target.checked })}
                      className="w-4 h-4"
                    />
                    PDF Plugin (f_pdf)
                  </label>
                </div>
              </div>
            </FormSection>

            {/* Event-specific Parameters */}
            {eventType === 'pp' && (
              <FormSection title="Page Ping Parameters">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Min X Offset (pp_mix)"
                    value={pagePingParams.pp_mix}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_mix: v })}
                    type="number"
                  />
                  <FormField
                    label="Max X Offset (pp_max)"
                    value={pagePingParams.pp_max}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_max: v })}
                    type="number"
                  />
                  <FormField
                    label="Min Y Offset (pp_miy)"
                    value={pagePingParams.pp_miy}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_miy: v })}
                    type="number"
                  />
                  <FormField
                    label="Max Y Offset (pp_may)"
                    value={pagePingParams.pp_may}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_may: v })}
                    type="number"
                  />
                </div>
              </FormSection>
            )}

            {eventType === 'tr' && (
              <FormSection title="Transaction Parameters">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Order ID (tr_id)"
                    value={transactionParams.tr_id}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_id: v })}
                  />
                  <FormField
                    label="Affiliation (tr_af)"
                    value={transactionParams.tr_af}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_af: v })}
                  />
                  <FormField
                    label="Total (tr_tt)"
                    value={transactionParams.tr_tt}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_tt: v })}
                    type="number"
                  />
                  <FormField
                    label="Tax (tr_tx)"
                    value={transactionParams.tr_tx}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_tx: v })}
                    type="number"
                  />
                  <FormField
                    label="Shipping (tr_sh)"
                    value={transactionParams.tr_sh}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_sh: v })}
                    type="number"
                  />
                  <FormField
                    label="City (tr_ci)"
                    value={transactionParams.tr_ci}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_ci: v })}
                  />
                  <FormField
                    label="State (tr_st)"
                    value={transactionParams.tr_st}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_st: v })}
                  />
                  <FormField
                    label="Country (tr_co)"
                    value={transactionParams.tr_co}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_co: v })}
                  />
                  <FormField
                    label="Currency (tr_cu)"
                    value={transactionParams.tr_cu}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_cu: v })}
                  />
                </div>
              </FormSection>
            )}

            {eventType === 'ti' && (
              <FormSection title="Transaction Item Parameters">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Order ID (ti_id)"
                    value={transactionItemParams.ti_id}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_id: v })}
                  />
                  <FormField
                    label="SKU (ti_sk)"
                    value={transactionItemParams.ti_sk}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_sk: v })}
                  />
                  <FormField
                    label="Name (ti_nm)"
                    value={transactionItemParams.ti_nm}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_nm: v })}
                  />
                  <FormField
                    label="Category (ti_ca)"
                    value={transactionItemParams.ti_ca}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_ca: v })}
                  />
                  <FormField
                    label="Price (ti_pr)"
                    value={transactionItemParams.ti_pr}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_pr: v })}
                    type="number"
                  />
                  <FormField
                    label="Quantity (ti_qu)"
                    value={transactionItemParams.ti_qu}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_qu: v })}
                    type="number"
                  />
                  <FormField
                    label="Currency (ti_cu)"
                    value={transactionItemParams.ti_cu}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_cu: v })}
                  />
                </div>
              </FormSection>
            )}

            {eventType === 'se' && (
              <FormSection title="Structured Event Parameters">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Category (se_ca)"
                    value={structuredEventParams.se_ca}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_ca: v })}
                  />
                  <FormField
                    label="Action (se_ac)"
                    value={structuredEventParams.se_ac}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_ac: v })}
                  />
                  <FormField
                    label="Label (se_la)"
                    value={structuredEventParams.se_la}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_la: v })}
                  />
                  <FormField
                    label="Property (se_pr)"
                    value={structuredEventParams.se_pr}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_pr: v })}
                  />
                  <FormField
                    label="Value (se_va)"
                    value={structuredEventParams.se_va}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_va: v })}
                    type="number"
                  />
                </div>
              </FormSection>
            )}

            {/* Self-describing Event */}
            {eventType === 'ue' && (
              <FormSection title="Self-describing Event">
                <div className="space-y-4">
                  <FormField
                    label="Schema URI"
                    value={selfDescribingSchema}
                    onChange={(v) => setSelfDescribingSchema(v)}
                    placeholder="iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0"
                  />
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
            )}

            {/* Context Entities */}
            <FormSection title="Context Entities">
              <div className="space-y-4">
                {contextSchemas.map((ctx, index) => (
                  <div key={index} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-medium">Context Entity {index + 1}</h4>
                      <button
                        onClick={() => removeContextEntity(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <FormField
                        label="Schema URI"
                        value={ctx.schema}
                        onChange={(v) => updateContextEntity(index, 'schema', v)}
                        placeholder="iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Entity Data (JSON)
                        </label>
                        <textarea
                          value={ctx.dataJson}
                          onChange={(e) => updateContextEntity(index, 'dataJson', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                          rows={4}
                          placeholder='{"id": "123", "name": "Homepage"}'
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addContextEntity}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  Add Context Entity
                </button>
              </div>
            </FormSection>
          </div>

          {/* Right Column - Output */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Code className="w-6 h-6 text-cyan-400" />
                  Generated Request
                </h2>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {generatedUrl}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-slate-900 rounded-lg">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  Request Object (JSON)
                </h3>
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                  {JSON.stringify(request, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
}) {
  if (type === 'select' && options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
      />
    </div>
  )
}

function DynamicFormField({
  field,
  value,
  onChange,
}: {
  field: SchemaField
  value: any
  onChange: (value: any) => void
}) {
  const handleChange = (newValue: string) => {
    let parsedValue: any = newValue
    
    if (field.type === 'number' || field.type === 'integer') {
      parsedValue = newValue === '' ? undefined : parseFloat(newValue)
      if (field.type === 'integer' && parsedValue !== undefined) {
        parsedValue = Math.floor(parsedValue)
      }
    } else if (field.type === 'boolean') {
      parsedValue = newValue === 'true'
    }
    
    onChange(parsedValue)
  }

  if (field.type === 'boolean') {
    return (
      <div>
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4"
          />
          {field.name} {field.required && <span className="text-red-400">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-gray-400 mt-1">{field.description}</p>
        )}
      </div>
    )
  }

  if (field.enum) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {field.name} {field.required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">Select...</option>
          {field.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {field.description && (
          <p className="text-xs text-gray-400 mt-1">{field.description}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {field.name} {field.required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        placeholder={field.description}
      />
      {field.description && (
        <p className="text-xs text-gray-400 mt-1">{field.description}</p>
      )}
    </div>
  )
}
