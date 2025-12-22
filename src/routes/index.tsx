import { useState, useMemo, useEffect } from 'react'
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
import { validateField, validateData } from '../utils/validation'
import { getFieldHistory, addToFieldHistory } from '../utils/fieldHistory'
import { SchemaField } from '../types/snowplow'
import { Copy, Check, Code, FileJson, Play, Loader2, AlertCircle, Clock, Search, X, RefreshCw } from 'lucide-react'
import {
  fetchSchemaByUri,
  listSchemas,
  extractSchemaBody,
  getSchemaUri,
  IgluSchemaRepr,
} from '../utils/igluClient'

export const Route = createFileRoute('/')({
  component: Builder,
})

function Builder() {
  const [collectorUrl, setCollectorUrl] = useState('https://collector.snowplow.io/i')
  const [eventType, setEventType] = useState<EventType>('pv')
  
  // Iglu Server configuration
  const [igluBaseUrl, setIgluBaseUrl] = useState('')
  const [igluApiKey, setIgluApiKey] = useState('')
  
  // Schema catalog for dropdowns
  const [availableSchemas, setAvailableSchemas] = useState<IgluSchemaRepr[]>([])
  const [loadingSchemas, setLoadingSchemas] = useState(false)
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('')
  const [contextSchemaSearchQueries, setContextSchemaSearchQueries] = useState<Record<number, string>>({})
  const [showSelfDescribingSchemaDropdown, setShowSelfDescribingSchemaDropdown] = useState(false)
  const [showContextSchemaDropdowns, setShowContextSchemaDropdowns] = useState<Record<number, boolean>>({})
  
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
    schemaJson: string
    dataJson: string
    data: Record<string, any>
    fields: SchemaField[]
    errors: Record<string, string>
  }>>([])
  
  const [copied, setCopied] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResponse, setTestResponse] = useState<{
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: any
    error?: string
  } | null>(null)
  const [fieldHistoryVisible, setFieldHistoryVisible] = useState<Record<string, boolean>>({})

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

  // Generate a stable event ID that only changes when event type changes
  const eventId = useMemo(() => generateUUID(), [eventType])

  // Build the request object
  const request = useMemo((): SnowplowRequest => {
    const req: SnowplowRequest = {
      event: {
        e: eventType,
        eid: eventId,
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
    eventId,
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

  const testRequest = async () => {
    setTestLoading(true)
    setTestResponse(null)
    
    try {
      // Try CORS mode first to get full response details
      const response = await fetch(generatedUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      })
      
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      
      let body: any
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        body = await response.json()
      } else if (contentType && contentType.includes('image/')) {
        // Snowplow typically returns a 1x1 pixel GIF
        body = `Image response (${contentType}) - Snowplow collector received the event successfully`
      } else {
        const text = await response.text()
        body = text || '(empty response)'
      }
      
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
      })
    } catch (error) {
      // If CORS fails, try no-cors mode (request will be sent but response can't be read)
      try {
        await fetch(generatedUrl, {
          method: 'GET',
          mode: 'no-cors',
        })
        
        // With no-cors mode, we can't read the response, but the request was sent
        setTestResponse({
          status: 0,
          statusText: 'Request sent (no-cors mode)',
          body: 'The request was sent successfully, but the response cannot be read due to CORS restrictions. This is normal for Snowplow collectors. Check your Snowplow collector logs or dashboard to verify the event was received.',
        })
      } catch (noCorsError) {
        setTestResponse({
          error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the URL and ensure your Snowplow collector is accessible.`,
        })
      }
    } finally {
      setTestLoading(false)
    }
  }

  const addContextEntity = () => {
    setContextSchemas([...contextSchemas, { 
      schema: '', 
      schemaJson: '',
      dataJson: '{}', 
      data: {},
      fields: [],
      errors: {}
    }])
  }

  const removeContextEntity = (index: number) => {
    setContextSchemas(contextSchemas.filter((_, i) => i !== index))
  }

  const updateContextEntity = (index: number, field: 'schema' | 'schemaJson' | 'dataJson', value: string) => {
    const updated = [...contextSchemas]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'schemaJson') {
      try {
        const schema = JSON.parse(value)
        const fields = parseJsonSchema(schema)
        updated[index].fields = fields
        // Initialize data with empty values for new fields
        const newData: Record<string, any> = { ...updated[index].data }
        fields.forEach(field => {
          if (!(field.name in newData)) {
            newData[field.name] = ''
          }
        })
        updated[index].data = newData
        updated[index].dataJson = JSON.stringify(newData, null, 2)
        // Validate the data
        const validation = validateData(fields, newData)
        updated[index].errors = validation.errors
      } catch {
        // Invalid JSON, keep previous fields
        updated[index].fields = []
      }
    } else if (field === 'dataJson') {
      try {
        const parsed = JSON.parse(value)
        updated[index].data = parsed
        // Validate if we have fields
        if (updated[index].fields.length > 0) {
          const validation = validateData(updated[index].fields, parsed)
          updated[index].errors = validation.errors
        }
      } catch {
        // Invalid JSON, keep previous data
      }
    }
    
    setContextSchemas(updated)
  }

  const updateContextEntityData = (index: number, fieldName: string, value: any) => {
    const updated = [...contextSchemas]
    const newData = { ...updated[index].data, [fieldName]: value }
    updated[index].data = newData
    updated[index].dataJson = JSON.stringify(newData, null, 2)
    
    // Validate the field
    if (updated[index].fields.length > 0) {
      const field = updated[index].fields.find(f => f.name === fieldName)
      if (field) {
        const validation = validateField(field, value)
        if (validation.valid) {
          // Remove error for this field
          const newErrors = { ...updated[index].errors }
          delete newErrors[fieldName]
          updated[index].errors = newErrors
        } else {
          // Add error for this field
          updated[index].errors = {
            ...updated[index].errors,
            [fieldName]: validation.error || 'Invalid value'
          }
        }
      }
    }
    
    setContextSchemas(updated)
  }

  const updateSelfDescribingData = (fieldName: string, value: any) => {
    setSelfDescribingData({ ...selfDescribingData, [fieldName]: value })
  }

  // Load available schemas from Iglu Server
  const loadAvailableSchemas = async () => {
    if (!igluBaseUrl) {
      setAvailableSchemas([])
      return
    }

    setLoadingSchemas(true)
    try {
      // Try to load common vendors - you can customize this
      // Note: This is a simplified approach. For production, you might want to
      // implement a more comprehensive schema discovery mechanism
      const commonVendors = ['com.snowplowanalytics.snowplow', 'com.snowplowanalytics']
      const allSchemas: IgluSchemaRepr[] = []
      const seenUris = new Set<string>()

      for (const vendor of commonVendors) {
        try {
          const schemas = await listSchemas(igluBaseUrl, igluApiKey || null, vendor, undefined, 'Uri')
          schemas.forEach(schema => {
            const uri = getSchemaUri(schema)
            if (uri && !seenUris.has(uri)) {
              seenUris.add(uri)
              allSchemas.push(schema)
            }
          })
        } catch (error) {
          // Continue with other vendors if one fails
          console.warn(`Failed to load schemas for vendor ${vendor}:`, error)
        }
      }

      setAvailableSchemas(allSchemas)
    } catch (error) {
      console.error('Failed to load schemas:', error)
      setAvailableSchemas([])
    } finally {
      setLoadingSchemas(false)
    }
  }

  // Load schemas when Iglu configuration changes
  useEffect(() => {
    if (igluBaseUrl) {
      loadAvailableSchemas()
    } else {
      setAvailableSchemas([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [igluBaseUrl, igluApiKey])

  // Filter schemas based on search query
  const filteredSchemas = useMemo(() => {
    if (!schemaSearchQuery) return availableSchemas
    const query = schemaSearchQuery.toLowerCase()
    return availableSchemas.filter(schema => {
      const uri = getSchemaUri(schema)
      return uri?.toLowerCase().includes(query)
    })
  }, [availableSchemas, schemaSearchQuery])

  // Handle schema selection for self-describing event
  const handleSelfDescribingSchemaSelect = async (schemaUri: string) => {
    if (!igluBaseUrl) return

    setSelfDescribingSchema(schemaUri)
    setSchemaSearchQuery('')

    try {
      const repr = await fetchSchemaByUri(igluBaseUrl, igluApiKey || null, schemaUri, 'Canonical')
      if (repr) {
        const schemaBody = extractSchemaBody(repr)
        if (schemaBody) {
          setSelfDescribingSchemaJson(JSON.stringify(schemaBody, null, 2))
          const fields = parseJsonSchema(schemaBody)
          // Initialize data with empty values
          const newData: Record<string, any> = {}
          fields.forEach(field => {
            newData[field.name] = ''
          })
          setSelfDescribingData(newData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error)
      // Still allow manual entry
    }
  }

  // Handle schema selection for context entity
  const handleContextSchemaSelect = async (index: number, schemaUri: string) => {
    if (!igluBaseUrl) return

    const updated = [...contextSchemas]
    updated[index] = { ...updated[index], schema: schemaUri }
    setContextSchemas(updated)
    setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: '' })

    try {
      const repr = await fetchSchemaByUri(igluBaseUrl, igluApiKey || null, schemaUri, 'Canonical')
      if (repr) {
        const schemaBody = extractSchemaBody(repr)
        if (schemaBody) {
          updated[index].schemaJson = JSON.stringify(schemaBody, null, 2)
          const fields = parseJsonSchema(schemaBody)
          updated[index].fields = fields
          // Initialize data with empty values
          const newData: Record<string, any> = {}
          fields.forEach(field => {
            newData[field.name] = ''
          })
          updated[index].data = newData
          updated[index].dataJson = JSON.stringify(newData, null, 2)
          setContextSchemas(updated)
        }
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error)
      // Still allow manual entry
    }
  }

  // Filter context schemas based on search query
  const getFilteredContextSchemas = (index: number) => {
    const query = contextSchemaSearchQueries[index] || ''
    if (!query) return availableSchemas
    const lowerQuery = query.toLowerCase()
    return availableSchemas.filter(schema => {
      const uri = getSchemaUri(schema)
      return uri?.toLowerCase().includes(lowerQuery)
    })
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
            {/* Iglu Server Configuration */}
            <FormSection title="Iglu Server Configuration (optional)">
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

            {/* Collector URL */}
            <FormSection title="Collector URL">
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
                  fieldName="tna"
                />
                <FormField
                  label="App ID (aid)"
                  value={appParams.aid}
                  onChange={(v) => setAppParams({ ...appParams, aid: v })}
                  fieldName="aid"
                />
                <FormField
                  label="Platform (p)"
                  value={appParams.p}
                  onChange={(v) => setAppParams({ ...appParams, p: v as Platform })}
                  type="select"
                  options={['web', 'mob', 'pc', 'srv', 'app', 'tv', 'cnsl', 'iot']}
                  fieldName="p"
                />
                <FormField
                  label="Tracker Version (tv)"
                  value={appParams.tv}
                  onChange={(v) => setAppParams({ ...appParams, tv: v })}
                  fieldName="tv"
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
                  fieldName="dtm"
                />
                <FormField
                  label="Device Sent (stm)"
                  value={timestampParams.stm}
                  onChange={(v) => setTimestampParams({ ...timestampParams, stm: v })}
                  type="number"
                  fieldName="stm"
                />
                <FormField
                  label="True Timestamp (ttm)"
                  value={timestampParams.ttm}
                  onChange={(v) => setTimestampParams({ ...timestampParams, ttm: v })}
                  type="number"
                  fieldName="ttm"
                />
                <FormField
                  label="Timezone (tz)"
                  value={timestampParams.tz}
                  onChange={(v) => setTimestampParams({ ...timestampParams, tz: v })}
                  fieldName="tz"
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
                  fieldName="duid"
                />
                <FormField
                  label="Network User ID (tnuid)"
                  value={userParams.tnuid}
                  onChange={(v) => setUserParams({ ...userParams, tnuid: v })}
                  fieldName="tnuid"
                />
                <FormField
                  label="User ID (uid)"
                  value={userParams.uid}
                  onChange={(v) => setUserParams({ ...userParams, uid: v })}
                  fieldName="uid"
                />
                <FormField
                  label="Visit Index (vid)"
                  value={userParams.vid}
                  onChange={(v) => setUserParams({ ...userParams, vid: v })}
                  type="number"
                  fieldName="vid"
                />
                <FormField
                  label="Session ID (sid)"
                  value={userParams.sid}
                  onChange={(v) => setUserParams({ ...userParams, sid: v })}
                  fieldName="sid"
                />
                <FormField
                  label="IP Address (ip)"
                  value={userParams.ip}
                  onChange={(v) => setUserParams({ ...userParams, ip: v })}
                  fieldName="ip"
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
                  fieldName="url"
                />
                <FormField
                  label="User Agent (ua)"
                  value={platformParams.ua}
                  onChange={(v) => setPlatformParams({ ...platformParams, ua: v })}
                  fieldName="ua"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Page Title (page)"
                    value={platformParams.page}
                    onChange={(v) => setPlatformParams({ ...platformParams, page: v })}
                    fieldName="page"
                  />
                  <FormField
                    label="Referrer (refr)"
                    value={platformParams.refr}
                    onChange={(v) => setPlatformParams({ ...platformParams, refr: v })}
                    fieldName="refr"
                  />
                  <FormField
                    label="Language (lang)"
                    value={platformParams.lang}
                    onChange={(v) => setPlatformParams({ ...platformParams, lang: v })}
                    fieldName="lang"
                  />
                  <FormField
                    label="Color Depth (cd)"
                    value={platformParams.cd}
                    onChange={(v) => setPlatformParams({ ...platformParams, cd: v })}
                    type="number"
                    fieldName="cd"
                  />
                  <FormField
                    label="Charset (cs)"
                    value={platformParams.cs}
                    onChange={(v) => setPlatformParams({ ...platformParams, cs: v })}
                    fieldName="cs"
                  />
                  <FormField
                    label="Document Size (ds)"
                    value={platformParams.ds}
                    onChange={(v) => setPlatformParams({ ...platformParams, ds: v })}
                    placeholder="1090x1152"
                    fieldName="ds"
                  />
                  <FormField
                    label="Viewport (vp)"
                    value={platformParams.vp}
                    onChange={(v) => setPlatformParams({ ...platformParams, vp: v })}
                    placeholder="1105x390"
                    fieldName="vp"
                  />
                  <FormField
                    label="Resolution (res)"
                    value={platformParams.res}
                    onChange={(v) => setPlatformParams({ ...platformParams, res: v })}
                    placeholder="1280x1024"
                    fieldName="res"
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
                    fieldName="pp_mix"
                  />
                  <FormField
                    label="Max X Offset (pp_max)"
                    value={pagePingParams.pp_max}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_max: v })}
                    type="number"
                    fieldName="pp_max"
                  />
                  <FormField
                    label="Min Y Offset (pp_miy)"
                    value={pagePingParams.pp_miy}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_miy: v })}
                    type="number"
                    fieldName="pp_miy"
                  />
                  <FormField
                    label="Max Y Offset (pp_may)"
                    value={pagePingParams.pp_may}
                    onChange={(v) => setPagePingParams({ ...pagePingParams, pp_may: v })}
                    type="number"
                    fieldName="pp_may"
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
                    fieldName="tr_id"
                  />
                  <FormField
                    label="Affiliation (tr_af)"
                    value={transactionParams.tr_af}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_af: v })}
                    fieldName="tr_af"
                  />
                  <FormField
                    label="Total (tr_tt)"
                    value={transactionParams.tr_tt}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_tt: v })}
                    type="number"
                    fieldName="tr_tt"
                  />
                  <FormField
                    label="Tax (tr_tx)"
                    value={transactionParams.tr_tx}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_tx: v })}
                    type="number"
                    fieldName="tr_tx"
                  />
                  <FormField
                    label="Shipping (tr_sh)"
                    value={transactionParams.tr_sh}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_sh: v })}
                    type="number"
                    fieldName="tr_sh"
                  />
                  <FormField
                    label="City (tr_ci)"
                    value={transactionParams.tr_ci}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_ci: v })}
                    fieldName="tr_ci"
                  />
                  <FormField
                    label="State (tr_st)"
                    value={transactionParams.tr_st}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_st: v })}
                    fieldName="tr_st"
                  />
                  <FormField
                    label="Country (tr_co)"
                    value={transactionParams.tr_co}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_co: v })}
                    fieldName="tr_co"
                  />
                  <FormField
                    label="Currency (tr_cu)"
                    value={transactionParams.tr_cu}
                    onChange={(v) => setTransactionParams({ ...transactionParams, tr_cu: v })}
                    fieldName="tr_cu"
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
                    fieldName="ti_id"
                  />
                  <FormField
                    label="SKU (ti_sk)"
                    value={transactionItemParams.ti_sk}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_sk: v })}
                    fieldName="ti_sk"
                  />
                  <FormField
                    label="Name (ti_nm)"
                    value={transactionItemParams.ti_nm}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_nm: v })}
                    fieldName="ti_nm"
                  />
                  <FormField
                    label="Category (ti_ca)"
                    value={transactionItemParams.ti_ca}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_ca: v })}
                    fieldName="ti_ca"
                  />
                  <FormField
                    label="Price (ti_pr)"
                    value={transactionItemParams.ti_pr}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_pr: v })}
                    type="number"
                    fieldName="ti_pr"
                  />
                  <FormField
                    label="Quantity (ti_qu)"
                    value={transactionItemParams.ti_qu}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_qu: v })}
                    type="number"
                    fieldName="ti_qu"
                  />
                  <FormField
                    label="Currency (ti_cu)"
                    value={transactionItemParams.ti_cu}
                    onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_cu: v })}
                    fieldName="ti_cu"
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
                    fieldName="se_ca"
                  />
                  <FormField
                    label="Action (se_ac)"
                    value={structuredEventParams.se_ac}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_ac: v })}
                    fieldName="se_ac"
                  />
                  <FormField
                    label="Label (se_la)"
                    value={structuredEventParams.se_la}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_la: v })}
                    fieldName="se_la"
                  />
                  <FormField
                    label="Property (se_pr)"
                    value={structuredEventParams.se_pr}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_pr: v })}
                    fieldName="se_pr"
                  />
                  <FormField
                    label="Value (se_va)"
                    value={structuredEventParams.se_va}
                    onChange={(v) => setStructuredEventParams({ ...structuredEventParams, se_va: v })}
                    type="number"
                    fieldName="se_va"
                  />
                </div>
              </FormSection>
            )}

            {/* Self-describing Event */}
            {eventType === 'ue' && (
              <FormSection title="Self-describing Event">
                <div className="space-y-4">
                  {/* Schema Selection from Iglu */}
                  {igluBaseUrl && availableSchemas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Schema from Iglu Catalog
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={schemaSearchQuery}
                            onChange={(e) => setSchemaSearchQuery(e.target.value)}
                            onFocus={() => setSchemaSearchQuery('')}
                            placeholder="Search schemas..."
                            className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                          />
                          {schemaSearchQuery && (
                            <button
                              onClick={() => setSchemaSearchQuery('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {schemaSearchQuery && filteredSchemas.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {filteredSchemas.map((schema, idx) => {
                              const uri = getSchemaUri(schema)
                              if (!uri) return null
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleSelfDescribingSchemaSelect(uri)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                                >
                                  <div className="font-mono text-xs">{uri}</div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Schema URI with Iglu dropdown */}
                  {igluBaseUrl && availableSchemas.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Schema URI
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={selfDescribingSchema}
                          onChange={(e) => setSelfDescribingSchema(e.target.value)}
                          onFocus={() => setShowSelfDescribingSchemaDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowSelfDescribingSchemaDropdown(false), 200)
                            if (selfDescribingSchema.trim() !== '') {
                              addToFieldHistory('selfDescribingSchema', selfDescribingSchema)
                            }
                          }}
                          placeholder="iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0"
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        />
                        {showSelfDescribingSchemaDropdown && availableSchemas.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            <div className="p-2 text-xs text-gray-400 border-b border-slate-700 flex items-center gap-1">
                              <Search className="w-3 h-3" />
                              Available schemas ({availableSchemas.length})
                            </div>
                            {availableSchemas.map((schema, idx) => {
                              const uri = getSchemaUri(schema)
                              if (!uri) return null
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleSelfDescribingSchemaSelect(uri)
                                    setShowSelfDescribingSchemaDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                                >
                                  <div className="font-mono text-xs">{uri}</div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      label="Schema URI"
                      value={selfDescribingSchema}
                      onChange={(v) => setSelfDescribingSchema(v)}
                      placeholder="iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0"
                      fieldName="selfDescribingSchema"
                    />
                  )}
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
                    <div className="space-y-4">
                      {/* Schema Selection from Iglu */}
                      {igluBaseUrl && availableSchemas.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Schema from Iglu Catalog
                          </label>
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                value={contextSchemaSearchQueries[index] || ''}
                                onChange={(e) => setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: e.target.value })}
                                onFocus={() => setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: '' })}
                                placeholder="Search schemas..."
                                className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                              />
                              {contextSchemaSearchQueries[index] && (
                                <button
                                  onClick={() => setContextSchemaSearchQueries({ ...contextSchemaSearchQueries, [index]: '' })}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {contextSchemaSearchQueries[index] && getFilteredContextSchemas(index).length > 0 && (
                              <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {getFilteredContextSchemas(index).map((schema, idx) => {
                                  const uri = getSchemaUri(schema)
                                  if (!uri) return null
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        handleContextSchemaSelect(index, uri)
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                                    >
                                      <div className="font-mono text-xs">{uri}</div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Schema URI with Iglu dropdown */}
                      {igluBaseUrl && availableSchemas.length > 0 ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Schema URI
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={ctx.schema}
                              onChange={(e) => updateContextEntity(index, 'schema', e.target.value)}
                              onFocus={() => setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: true })}
                              onBlur={() => {
                                setTimeout(() => {
                                  setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: false })
                                }, 200)
                                if (ctx.schema.trim() !== '') {
                                  addToFieldHistory(`context_schema_${index}`, ctx.schema)
                                }
                              }}
                              placeholder="iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0"
                              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            />
                            {showContextSchemaDropdowns[index] && availableSchemas.length > 0 && (
                              <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="p-2 text-xs text-gray-400 border-b border-slate-700 flex items-center gap-1">
                                  <Search className="w-3 h-3" />
                                  Available schemas ({availableSchemas.length})
                                </div>
                                {availableSchemas.map((schema, idx) => {
                                  const uri = getSchemaUri(schema)
                                  if (!uri) return null
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        handleContextSchemaSelect(index, uri)
                                        setShowContextSchemaDropdowns({ ...showContextSchemaDropdowns, [index]: false })
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                                    >
                                      <div className="font-mono text-xs">{uri}</div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <FormField
                          label="Schema URI"
                          value={ctx.schema}
                          onChange={(v) => updateContextEntity(index, 'schema', v)}
                          placeholder="iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0"
                          fieldName={`context_schema_${index}`}
                        />
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          JSON Schema (for dynamic form generation)
                        </label>
                        <textarea
                          value={ctx.schemaJson}
                          onChange={(e) => updateContextEntity(index, 'schemaJson', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                          rows={6}
                          placeholder='{"properties": {"id": {"type": "string"}, "name": {"type": "string"}}}'
                        />
                      </div>
                      {ctx.fields.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-300">Entity Data</label>
                          {ctx.fields.map((field) => (
                            <div key={field.name}>
                              <DynamicFormField
                                field={field}
                                value={ctx.data[field.name]}
                                onChange={(value) => updateContextEntityData(index, field.name, value)}
                                error={ctx.errors[field.name]}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {ctx.fields.length === 0 && (
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
                      )}
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
                <div className="flex gap-2">
                  <button
                    onClick={testRequest}
                    disabled={testLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Test
                      </>
                    )}
                  </button>
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

              {/* Test Results Panel */}
              {testResponse && (
                <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    {testResponse.error ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                    Test Response
                  </h3>
                  {testResponse.error ? (
                    <div className="text-red-400 text-sm">
                      <p className="font-medium mb-2">Error:</p>
                      <p>{testResponse.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testResponse.status !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <p className="text-sm text-white">
                            <span className={`font-medium ${
                              testResponse.status >= 200 && testResponse.status < 300 
                                ? 'text-green-400' 
                                : testResponse.status >= 400 
                                ? 'text-red-400' 
                                : 'text-yellow-400'
                            }`}>
                              {testResponse.status}
                            </span>
                            {testResponse.statusText && ` ${testResponse.statusText}`}
                          </p>
                        </div>
                      )}
                      {testResponse.headers && Object.keys(testResponse.headers).length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Headers</p>
                          <pre className="text-xs text-gray-300 font-mono overflow-x-auto bg-slate-800 p-2 rounded">
                            {JSON.stringify(testResponse.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                      {testResponse.body !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Body</p>
                          <pre className="text-xs text-gray-300 font-mono overflow-x-auto bg-slate-800 p-2 rounded max-h-64 overflow-y-auto">
                            {typeof testResponse.body === 'string' 
                              ? testResponse.body 
                              : JSON.stringify(testResponse.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
  fieldName,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
  fieldName?: string
}) {
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load history only on client side
  useEffect(() => {
    if (fieldName && typeof window !== 'undefined') {
      setHistory(getFieldHistory(fieldName))
    }
  }, [fieldName])

  const handleChange = (newValue: string) => {
    onChange(newValue)
  }

  const handleBlur = () => {
    // Save to history only on blur
    if (fieldName && value.trim() !== '') {
      addToFieldHistory(fieldName, value)
    }
    // Delay hiding history to allow clicking on items
    setTimeout(() => setShowHistory(false), 200)
  }

  if (type === 'select' && options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
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
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (history.length > 0) {
              setShowHistory(true)
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        />
        {history.length > 0 && showHistory && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-gray-400 border-b border-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent values
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  handleChange(item)
                  setShowHistory(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DynamicFormField({
  field,
  value,
  onChange,
  error,
}: {
  field: SchemaField
  value: any
  onChange: (value: any) => void
  error?: string
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
          className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white focus:outline-none ${
            error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-slate-700 focus:border-cyan-500'
          }`}
        >
          <option value="">Select...</option>
          {field.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
        {field.description && !error && (
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
        className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white focus:outline-none ${
          error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-slate-700 focus:border-cyan-500'
        }`}
        placeholder={field.description}
      />
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
      {field.description && !error && (
        <p className="text-xs text-gray-400 mt-1">{field.description}</p>
      )}
    </div>
  )
}
