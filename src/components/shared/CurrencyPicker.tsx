import { useState } from 'react'
import { CURRENCIES } from '../../constants/currencies'

interface CurrencyPickerProps {
  value: string
  onChange: (code: string) => void
  currencies?: string[]
  onClose?: () => void
  /** inline mode renders a <select>, popup mode renders a searchable list overlay */
  inline?: boolean
}

export default function CurrencyPicker({ value, onChange, currencies, onClose, inline }: CurrencyPickerProps) {
  const list = currencies
    ? CURRENCIES.filter((c) => currencies.includes(c.code))
    : CURRENCIES

  // Inline mode: simple <select> for forms like settings/create
  if (inline) {
    return (
      <div className="relative inline-block">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            onClose?.()
          }}
          className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {list.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name} ({c.code})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    )
  }

  // Popup mode: searchable list overlay for AmountInput
  return <CurrencyPopup value={value} list={list} onChange={onChange} onClose={onClose} />
}

function CurrencyPopup({
  value,
  list,
  onChange,
  onClose,
}: {
  value: string
  list: typeof CURRENCIES
  onChange: (code: string) => void
  onClose?: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? list.filter((c) => {
        const q = search.trim().toLowerCase()
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(q)
      })
    : list

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-700">选择币种</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-400 active:bg-gray-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索货币（代码或名称）"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto px-2 pb-4">
          {filtered.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => onChange(c.code)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm active:bg-gray-50 ${
                  c.code === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="w-8 text-center text-base">{c.symbol}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-gray-400">{c.code}</span>
                {c.code === value && (
                  <svg className="h-4 w-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-400">无匹配货币</li>
          )}
        </ul>
      </div>
    </div>
  )
}
