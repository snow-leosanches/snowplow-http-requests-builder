import { useEffect, useState } from "react"
import { Clock } from 'lucide-react'

import { addToFieldHistory, getFieldHistory } from "@/utils/fieldHistory"

export function FormField({
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