// Snowplow Event Types
export type EventType = 'pv' | 'pp' | 'tr' | 'ti' | 'se' | 'ue'

// Platform types
export type Platform = 'web' | 'mob' | 'pc' | 'srv' | 'app' | 'tv' | 'cnsl' | 'iot'

// Common Event Parameters
export interface EventParameters {
  e: EventType
  eid?: string
}

// Application Parameters
export interface ApplicationParameters {
  tna?: string // tracker namespace
  aid?: string // app_id
  p?: Platform // platform
  tv?: string // tracker version
}

// Timestamp Parameters
export interface TimestampParameters {
  dtm?: number // device created timestamp
  stm?: number // device sent timestamp
  ttm?: number // true timestamp
  tz?: string // timezone
}

// User Parameters
export interface UserParameters {
  duid?: string // domain userid
  tnuid?: string // network userid override
  uid?: string // user_id
  vid?: number // visit index
  sid?: string // session id
  ip?: string // IP address override
}

// Platform Parameters
export interface PlatformParameters {
  url?: string // page URL
  ua?: string // useragent
  page?: string // page title
  refr?: string // referrer
  cookie?: boolean // cookies enabled
  lang?: string // browser language
  f_pdf?: boolean // PDF plugin
  cd?: number // color depth
  cs?: string // charset
  ds?: string // document size (widthxheight)
  vp?: string // viewport size (widthxheight)
  res?: string // screen resolution (widthxheight)
  mac?: string // MAC address
}

// Page Ping Parameters
export interface PagePingParameters {
  pp_mix?: number // min x offset
  pp_max?: number // max x offset
  pp_miy?: number // min y offset
  pp_may?: number // max y offset
}

// Transaction Parameters
export interface TransactionParameters {
  tr_id?: string // order ID
  tr_af?: string // affiliation
  tr_tt?: number // total
  tr_tx?: number // tax
  tr_sh?: number // shipping
  tr_ci?: string // city
  tr_st?: string // state
  tr_co?: string // country
  tr_cu?: string // currency
}

// Transaction Item Parameters
export interface TransactionItemParameters {
  ti_id?: string // order ID
  ti_sk?: string // SKU
  ti_nm?: string // name
  ti_ca?: string // category
  ti_pr?: number // price
  ti_qu?: number // quantity
  ti_cu?: string // currency
}

// Structured Event Parameters
export interface StructuredEventParameters {
  se_ca?: string // category
  se_ac?: string // action
  se_la?: string // label
  se_pr?: string // property
  se_va?: number // value
}

// Self-describing Event (JSON Schema)
export interface SelfDescribingEvent {
  schema: string // Iglu schema URI
  data: Record<string, any> // event data
}

// Context Entity (JSON Schema)
export interface ContextEntity {
  schema: string // Iglu schema URI
  data: Record<string, any> // entity data
}

// Complete Snowplow Request
export interface SnowplowRequest {
  event: EventParameters
  application?: ApplicationParameters
  timestamp?: TimestampParameters
  user?: UserParameters
  platform?: PlatformParameters
  pagePing?: PagePingParameters
  transaction?: TransactionParameters
  transactionItem?: TransactionItemParameters
  structuredEvent?: StructuredEventParameters
  selfDescribingEvent?: SelfDescribingEvent
  contexts?: ContextEntity[]
}

// JSON Schema Field Definition
export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'
  description?: string
  required?: boolean
  enum?: string[]
  properties?: Record<string, SchemaField>
  items?: SchemaField
}

