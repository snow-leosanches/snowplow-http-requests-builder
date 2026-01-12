import { SnowplowRequest } from "@/types/snowplow"
import { TestResponse } from "./interfaces/TestResponse"
import { AlertCircle, Check, Code, Copy, FileJson, Loader2, Play } from "lucide-react"

export interface OutputPanelProps {
  generatedUrl: string
  request: SnowplowRequest
  testResponse: TestResponse | null
  testLoading: boolean
  testRequest: () => void
  copyToClipboard: () => void
  copied: boolean
}

export const OutputPanel = ({ generatedUrl, request, testResponse, testLoading, testRequest, copyToClipboard, copied }: OutputPanelProps) => {
  return <div className="lg:sticky lg:top-6 h-fit">
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
}