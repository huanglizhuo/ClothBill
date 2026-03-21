import { useState } from 'react'
import { CURRENCIES } from '../../constants/currencies'

interface CurrencyMultiSelectProps {
  selected: string[]
  onChange: (codes: string[]) => void
  disabledCodes?: string[]
}

export default function CurrencyMultiSelect({ selected, onChange, disabledCodes = [] }: CurrencyMultiSelectProps) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? CURRENCIES.filter((c) => {
        const q = search.trim().toLowerCase()
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(q)
      })
    : CURRENCIES

  // Show selected currencies first, then the rest
  const selectedSet = new Set(selected)
  const sorted = [
    ...filtered.filter((c) => selectedSet.has(c.code)),
    ...filtered.filter((c) => !selectedSet.has(c.code)),
  ]

  const toggle = (code: string) => {
    if (disabledCodes.includes(code) && selectedSet.has(code)) return
    if (selectedSet.has(code)) {
      onChange(selected.filter((c) => c !== code))
    } else {
      onChange([...selected, code])
    }
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索货币（代码或名称）"
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
        {sorted.map((c) => {
          const isSelected = selectedSet.has(c.code)
          const isDisabled = disabledCodes.includes(c.code) && isSelected
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => toggle(c.code)}
              disabled={isDisabled}
              className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-500'
              } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:bg-gray-50'}`}
            >
              <span className="block text-sm">{c.symbol}</span>
              <span className="block">{c.code}</span>
            </button>
          )
        })}
        {sorted.length === 0 && (
          <p className="col-span-3 py-4 text-center text-sm text-gray-400">无匹配货币</p>
        )}
      </div>
    </div>
  )
}
