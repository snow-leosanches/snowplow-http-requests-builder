import { SchemaField } from "@/types/snowplow"

export function DynamicFormField({
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
          className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white focus:outline-none ${error
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
        className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white focus:outline-none ${error
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