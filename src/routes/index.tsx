import { useState, useMemo, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  EventType,
  Platform,
  SnowplowRequest,
  ContextEntity,
  ApplicationParameters,
  TimestampParameters,
  UserParameters,
  PlatformParameters,
  PagePingParameters,
  TransactionParameters,
  TransactionItemParameters,
  StructuredEventParameters,
} from '../types/snowplow'
import { buildSnowplowUrl, generateUUID } from '../utils/urlBuilder'
import {
  parseJsonSchema,
} from '../utils/schemaParser'
import { validateField, validateData } from '../utils/validation'
import { SchemaField } from '../types/snowplow'

import {
  fetchSchemaByUri,
  listSchemas,
  extractSchemaBody,
  getSchemaUri,
  IgluSchemaRepr,
} from '../utils/igluClient'
import { IgluConfigurationPanel } from '@/components/IgluConfigurationPanel'
import { FormSection } from '@/helpers/FormSection'
import { CollectorInformationPanel } from '@/components/CollectorInformationPanel'
import { ApplicationParametersPanel } from '@/components/ApplicationParametersPanel'
import { TimestampParametersPanel } from '@/components/TimestampParametersPanel'
import { UserParametersPanel } from '@/components/UserParametersPanel'
import { PlatformParametersPanel } from '@/components/PlatformParametersPanel'
import { PagePingParametersPanel } from '@/components/PagePingParametersPanel'
import { TransactionParametersPanel } from '@/components/TransactionParametersPanel'
import { TransactionItemParametersPanel } from '@/components/TransactionItemParametersPanel'
import { StructuredEventParametersPanel } from '@/components/StructuredEventParametersPanel'
import { SelfDescribingEventPanel } from '@/components/SelfDescribingEventPanel'
import { ContextEntitiesPanel } from '@/components/ContextEntitiesPanel'
import { TestResponse } from '@/components/interfaces/TestResponse'
import { OutputPanel } from '@/components/OutputPanel'

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
  const [appParams, setAppParams] = useState<ApplicationParameters>({
    tna: '',
    aid: '',
    p: 'web' as Platform,
    tv: '',
  })
  
  const [timestampParams, setTimestampParams] = useState<TimestampParameters>({})
  
  const [userParams, setUserParams] = useState<UserParameters>({})
  
  const [platformParams, setPlatformParams] = useState<PlatformParameters>({})
  
  // Event-specific parameters
  const [pagePingParams, setPagePingParams] = useState<PagePingParameters>({})
  
  const [transactionParams, setTransactionParams] = useState<TransactionParameters>({})
  
  const [transactionItemParams, setTransactionItemParams] = useState<TransactionItemParameters>({})
  
  const [structuredEventParams, setStructuredEventParams] = useState<StructuredEventParameters>({})
  
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
  const [testResponse, setTestResponse] = useState<TestResponse | null>(null)

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
      if (timestampParams.dtm) req.timestamp.dtm = timestampParams.dtm
      if (timestampParams.stm) req.timestamp.stm = timestampParams.stm
      if (timestampParams.ttm) req.timestamp.ttm = timestampParams.ttm
      if (timestampParams.tz) req.timestamp.tz = timestampParams.tz
    }

    // User parameters
    if (userParams.duid || userParams.tnuid || userParams.uid || userParams.vid || userParams.sid || userParams.ip) {
      req.user = {}
      if (userParams.duid) req.user.duid = userParams.duid
      if (userParams.tnuid) req.user.tnuid = userParams.tnuid
      if (userParams.uid) req.user.uid = userParams.uid
      if (userParams.vid) req.user.vid = userParams.vid
      if (userParams.sid) req.user.sid = userParams.sid
      if (userParams.ip) req.user.ip = userParams.ip
    }

    // Platform parameters
    if (platformParams.url || platformParams.ua || platformParams.page || platformParams.refr || 
        platformParams.cookie || platformParams.lang || platformParams.f_pdf || platformParams.cd || 
        platformParams.cs || platformParams.ds || platformParams.vp || platformParams.res || platformParams.mac) {
      req.platform = {}
      if (platformParams.url) req.platform.url = platformParams.url
      if (platformParams.ua) req.platform.ua = platformParams.ua
      if (platformParams.page) req.platform.page = platformParams.page
      if (platformParams.refr) req.platform.refr = platformParams.refr
      if (platformParams.cookie) req.platform.cookie = platformParams.cookie
      if (platformParams.lang) req.platform.lang = platformParams.lang
      if (platformParams.f_pdf) req.platform.f_pdf = platformParams.f_pdf
      if (platformParams.cd) req.platform.cd = platformParams.cd
      if (platformParams.cs) req.platform.cs = platformParams.cs
      if (platformParams.ds) req.platform.ds = platformParams.ds
      if (platformParams.vp) req.platform.vp = platformParams.vp
      if (platformParams.res) req.platform.res = platformParams.res
      if (platformParams.mac) req.platform.mac = platformParams.mac
    }

    // Event-specific parameters
    if (eventType === 'pp') {
      if (pagePingParams.pp_mix || pagePingParams.pp_max || pagePingParams.pp_miy || pagePingParams.pp_may) {
        req.pagePing = {}
        if (pagePingParams.pp_mix) req.pagePing.pp_mix = pagePingParams.pp_mix
        if (pagePingParams.pp_max) req.pagePing.pp_max = pagePingParams.pp_max
        if (pagePingParams.pp_miy) req.pagePing.pp_miy = pagePingParams.pp_miy
        if (pagePingParams.pp_may) req.pagePing.pp_may = pagePingParams.pp_may
      }
    }

    if (eventType === 'tr') {
      if (transactionParams.tr_id || transactionParams.tr_af || transactionParams.tr_tt || 
          transactionParams.tr_tx || transactionParams.tr_sh || transactionParams.tr_ci || 
          transactionParams.tr_st || transactionParams.tr_co || transactionParams.tr_cu) {
        req.transaction = {}
        if (transactionParams.tr_id) req.transaction.tr_id = transactionParams.tr_id
        if (transactionParams.tr_af) req.transaction.tr_af = transactionParams.tr_af
        if (transactionParams.tr_tt) req.transaction.tr_tt = transactionParams.tr_tt
        if (transactionParams.tr_tx) req.transaction.tr_tx = transactionParams.tr_tx
        if (transactionParams.tr_sh) req.transaction.tr_sh = transactionParams.tr_sh
        if (transactionParams.tr_ci) req.transaction.tr_ci = transactionParams.tr_ci
        if (transactionParams.tr_st) req.transaction.tr_st = transactionParams.tr_st
        if (transactionParams.tr_co) req.transaction.tr_co = transactionParams.tr_co
        if (transactionParams.tr_cu) req.transaction.tr_cu = transactionParams.tr_cu
      }
    }

    if (eventType === 'ti') {
      if (transactionItemParams.ti_id || transactionItemParams.ti_sk || transactionItemParams.ti_nm || 
          transactionItemParams.ti_ca || transactionItemParams.ti_pr || transactionItemParams.ti_qu || 
          transactionItemParams.ti_cu) {
        req.transactionItem = {}
        if (transactionItemParams.ti_id) req.transactionItem.ti_id = transactionItemParams.ti_id
        if (transactionItemParams.ti_sk) req.transactionItem.ti_sk = transactionItemParams.ti_sk
        if (transactionItemParams.ti_nm) req.transactionItem.ti_nm = transactionItemParams.ti_nm
        if (transactionItemParams.ti_ca) req.transactionItem.ti_ca = transactionItemParams.ti_ca
        if (transactionItemParams.ti_pr) req.transactionItem.ti_pr = transactionItemParams.ti_pr
        if (transactionItemParams.ti_qu) req.transactionItem.ti_qu = transactionItemParams.ti_qu
        if (transactionItemParams.ti_cu) req.transactionItem.ti_cu = transactionItemParams.ti_cu
      }
    }

    if (eventType === 'se') {
      if (structuredEventParams.se_ca || structuredEventParams.se_ac || structuredEventParams.se_la || 
          structuredEventParams.se_pr || structuredEventParams.se_va) {
        req.structuredEvent = {}
        if (structuredEventParams.se_ca) req.structuredEvent.se_ca = structuredEventParams.se_ca
        if (structuredEventParams.se_ac) req.structuredEvent.se_ac = structuredEventParams.se_ac
        if (structuredEventParams.se_la) req.structuredEvent.se_la = structuredEventParams.se_la
        if (structuredEventParams.se_pr) req.structuredEvent.se_pr = structuredEventParams.se_pr
        if (structuredEventParams.se_va) req.structuredEvent.se_va = structuredEventParams.se_va
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
            <IgluConfigurationPanel 
              igluBaseUrl={igluBaseUrl} 
              setIgluBaseUrl={setIgluBaseUrl} 
              igluApiKey={igluApiKey} 
              setIgluApiKey={setIgluApiKey} 
              loadingSchemas={loadingSchemas}
              availableSchemas={availableSchemas} 
              loadAvailableSchemas={loadAvailableSchemas}
            />

            {/* Collector URL */}
            <CollectorInformationPanel collectorUrl={collectorUrl} setCollectorUrl={setCollectorUrl} />

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
            <ApplicationParametersPanel appParams={appParams} setAppParams={setAppParams} />

            {/* Timestamp Parameters */}
            <TimestampParametersPanel timestampParams={timestampParams} setTimestampParams={setTimestampParams} />

            {/* User Parameters */}
            <UserParametersPanel userParams={userParams} setUserParams={setUserParams} />

            {/* Platform Parameters */}
            <PlatformParametersPanel
              platformParams={platformParams}
              setPlatformParams={setPlatformParams}
            />

            {/* Event-specific Parameters */}
            {eventType === 'pp' && (
              <PagePingParametersPanel pagePingParams={pagePingParams} setPagePingParams={setPagePingParams} />
            )}

            {eventType === 'tr' && (
              <TransactionParametersPanel transactionParams={transactionParams} setTransactionParams={setTransactionParams} />
            )}

            {eventType === 'ti' && (
              <TransactionItemParametersPanel 
                transactionItemParams={transactionItemParams}
                setTransactionItemParams={setTransactionItemParams}
              />
            )}

            {eventType === 'se' && (
              <StructuredEventParametersPanel
                structuredEventParams={structuredEventParams}
                setStructuredEventParams={setStructuredEventParams}
              />
            )}

            {/* Self-describing Event */}
            {eventType === 'ue' && (
              <SelfDescribingEventPanel
                igluBaseUrl={igluBaseUrl}
                availableSchemas={availableSchemas}
                schemaSearchQuery={schemaSearchQuery}
                setSchemaSearchQuery={setSchemaSearchQuery}
                filteredSchemas={filteredSchemas}
                showSelfDescribingSchemaDropdown={showSelfDescribingSchemaDropdown}
                setShowSelfDescribingSchemaDropdown={setShowSelfDescribingSchemaDropdown}
                selfDescribingFields={selfDescribingFields}
                selfDescribingSchema={selfDescribingSchema}
                setSelfDescribingSchema={setSelfDescribingSchema}
                selfDescribingSchemaJson={selfDescribingSchemaJson}
                setSelfDescribingSchemaJson={setSelfDescribingSchemaJson}
                selfDescribingData={selfDescribingData}
                setSelfDescribingData={setSelfDescribingData}
                handleSelfDescribingSchemaSelect={handleSelfDescribingSchemaSelect}
                updateSelfDescribingData={updateSelfDescribingData}
              />
            )}

            {/* Context Entities */}
            <ContextEntitiesPanel
              contextSchemas={contextSchemas}
              setContextSchemas={setContextSchemas}
              removeContextEntity={removeContextEntity}
              igluBaseUrl={igluBaseUrl}
              availableSchemas={availableSchemas}
              contextSchemaSearchQueries={contextSchemaSearchQueries}
              setContextSchemaSearchQueries={setContextSchemaSearchQueries}
              filteredContextSchemas={availableSchemas}
              getFilteredContextSchemas={getFilteredContextSchemas}
              handleContextSchemaSelect={handleContextSchemaSelect}
              updateContextEntity={(index, field, value) => {
                if (field === 'schema' || field === 'schemaJson' || field === 'dataJson') {
                  updateContextEntity(index, field, value)
                }
              }}
              updateContextEntityData={updateContextEntityData}
              addContextEntity={addContextEntity}
              showContextSchemaDropdowns={showContextSchemaDropdowns}
              setShowContextSchemaDropdowns={setShowContextSchemaDropdowns}
            />
          </div>

          {/* Right Column - Output */}
          <OutputPanel 
            generatedUrl={generatedUrl} 
            request={request} 
            testResponse={testResponse} 
            testLoading={testLoading} 
            testRequest={testRequest} 
            copyToClipboard={copyToClipboard} 
            copied={copied} 
          />
        </div>
      </div>
    </div>
  )
}
