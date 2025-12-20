import { SnowplowRequest } from '../types/snowplow'

/**
 * Build a Snowplow HTTP request URL from the request object
 */
export function buildSnowplowUrl(
  collectorUrl: string,
  request: SnowplowRequest
): string {
  const params = new URLSearchParams()

  // Event parameters (required)
  params.append('e', request.event.e)
  if (request.event.eid) {
    params.append('eid', request.event.eid)
  }

  // Application parameters
  if (request.application) {
    if (request.application.tna) params.append('tna', request.application.tna)
    if (request.application.aid) params.append('aid', request.application.aid)
    if (request.application.p) params.append('p', request.application.p)
    if (request.application.tv) params.append('tv', request.application.tv)
  }

  // Timestamp parameters
  if (request.timestamp) {
    if (request.timestamp.dtm) params.append('dtm', String(request.timestamp.dtm))
    if (request.timestamp.stm) params.append('stm', String(request.timestamp.stm))
    if (request.timestamp.ttm) params.append('ttm', String(request.timestamp.ttm))
    if (request.timestamp.tz) params.append('tz', request.timestamp.tz)
  }

  // User parameters
  if (request.user) {
    if (request.user.duid) params.append('duid', request.user.duid)
    if (request.user.tnuid) params.append('tnuid', request.user.tnuid)
    if (request.user.uid) params.append('uid', request.user.uid)
    if (request.user.vid) params.append('vid', String(request.user.vid))
    if (request.user.sid) params.append('sid', request.user.sid)
    if (request.user.ip) params.append('ip', request.user.ip)
  }

  // Platform parameters
  if (request.platform) {
    if (request.platform.url) params.append('url', request.platform.url)
    if (request.platform.ua) params.append('ua', request.platform.ua)
    if (request.platform.page) params.append('page', request.platform.page)
    if (request.platform.refr) params.append('refr', request.platform.refr)
    if (request.platform.cookie !== undefined) params.append('cookie', request.platform.cookie ? '1' : '0')
    if (request.platform.lang) params.append('lang', request.platform.lang)
    if (request.platform.f_pdf !== undefined) params.append('f_pdf', request.platform.f_pdf ? '1' : '0')
    if (request.platform.cd) params.append('cd', String(request.platform.cd))
    if (request.platform.cs) params.append('cs', request.platform.cs)
    if (request.platform.ds) params.append('ds', request.platform.ds)
    if (request.platform.vp) params.append('vp', request.platform.vp)
    if (request.platform.res) params.append('res', request.platform.res)
    if (request.platform.mac) params.append('mac', request.platform.mac)
  }

  // Page ping parameters
  if (request.pagePing) {
    if (request.pagePing.pp_mix !== undefined) params.append('pp_mix', String(request.pagePing.pp_mix))
    if (request.pagePing.pp_max !== undefined) params.append('pp_max', String(request.pagePing.pp_max))
    if (request.pagePing.pp_miy !== undefined) params.append('pp_miy', String(request.pagePing.pp_miy))
    if (request.pagePing.pp_may !== undefined) params.append('pp_may', String(request.pagePing.pp_may))
  }

  // Transaction parameters
  if (request.transaction) {
    if (request.transaction.tr_id) params.append('tr_id', request.transaction.tr_id)
    if (request.transaction.tr_af) params.append('tr_af', request.transaction.tr_af)
    if (request.transaction.tr_tt !== undefined) params.append('tr_tt', String(request.transaction.tr_tt))
    if (request.transaction.tr_tx !== undefined) params.append('tr_tx', String(request.transaction.tr_tx))
    if (request.transaction.tr_sh !== undefined) params.append('tr_sh', String(request.transaction.tr_sh))
    if (request.transaction.tr_ci) params.append('tr_ci', request.transaction.tr_ci)
    if (request.transaction.tr_st) params.append('tr_st', request.transaction.tr_st)
    if (request.transaction.tr_co) params.append('tr_co', request.transaction.tr_co)
    if (request.transaction.tr_cu) params.append('tr_cu', request.transaction.tr_cu)
  }

  // Transaction item parameters
  if (request.transactionItem) {
    if (request.transactionItem.ti_id) params.append('ti_id', request.transactionItem.ti_id)
    if (request.transactionItem.ti_sk) params.append('ti_sk', request.transactionItem.ti_sk)
    if (request.transactionItem.ti_nm) params.append('ti_nm', request.transactionItem.ti_nm)
    if (request.transactionItem.ti_ca) params.append('ti_ca', request.transactionItem.ti_ca)
    if (request.transactionItem.ti_pr !== undefined) params.append('ti_pr', String(request.transactionItem.ti_pr))
    if (request.transactionItem.ti_qu !== undefined) params.append('ti_qu', String(request.transactionItem.ti_qu))
    if (request.transactionItem.ti_cu) params.append('ti_cu', request.transactionItem.ti_cu)
  }

  // Structured event parameters
  if (request.structuredEvent) {
    if (request.structuredEvent.se_ca) params.append('se_ca', request.structuredEvent.se_ca)
    if (request.structuredEvent.se_ac) params.append('se_ac', request.structuredEvent.se_ac)
    if (request.structuredEvent.se_la) params.append('se_la', request.structuredEvent.se_la)
    if (request.structuredEvent.se_pr) params.append('se_pr', request.structuredEvent.se_pr)
    if (request.structuredEvent.se_va !== undefined) params.append('se_va', String(request.structuredEvent.se_va))
  }

  // Self-describing event (ue_px)
  if (request.selfDescribingEvent && request.selfDescribingEvent.schema) {
    try {
      const uePr = {
        schema: request.selfDescribingEvent.schema,
        data: request.selfDescribingEvent.data,
      }
      const jsonString = JSON.stringify(uePr)
      // Base64 encode the JSON string
      params.append('ue_px', btoa(jsonString))
    } catch (error) {
      console.error('Error encoding self-describing event:', error)
    }
  }

  // Context entities (cx)
  if (request.contexts && request.contexts.length > 0) {
    try {
      const contexts = request.contexts
        .filter(ctx => ctx.schema && ctx.data)
        .map((ctx) => ({
          schema: ctx.schema,
          data: ctx.data,
        }))
      if (contexts.length > 0) {
        const jsonString = JSON.stringify(contexts)
        // Base64 encode the JSON string
        params.append('cx', btoa(jsonString))
      }
    } catch (error) {
      console.error('Error encoding context entities:', error)
    }
  }

  // Build final URL
  const separator = collectorUrl.includes('?') ? '&' : '?'
  return `${collectorUrl}${separator}${params.toString()}`
}

/**
 * Generate a UUID v4 (simple implementation)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

