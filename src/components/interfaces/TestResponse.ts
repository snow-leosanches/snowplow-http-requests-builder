export interface TestResponse {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: string,
  error?: string
}
