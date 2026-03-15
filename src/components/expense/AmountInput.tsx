import { useState } from 'react'
import { CURRENCIES } from '../../constants/currencies'
import CurrencyPicker from '../shared/CurrencyPicker'

interface AmountInputProps {
  value: string
  onChange: (val: string) => void
  currency: string
  onCurrencyChange: (code: string) => void
  currencies?: string[]
}

export default function AmountInput({ value, onChange, currency, onCurrencyChange, currencies }: AmountInputProps) {
  const [showPicker, setShowPicker] = useState(false)

  const currencyInfo = CURRENCIES.find((c) => c.code === currency)
  const symbol = currencyInfo?.symbol ?? currency

  return (
    <>
      <div className="flex items-center justify-center gap-2 py-6">
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex h-10 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 active:bg-gray-200"
        >
          <span>{symbol}</span>
          <span className="text-xs text-gray-500">{currency}</span>
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-48 border-none bg-transparent text-center text-4xl font-bold text-gray-900 outline-none placeholder:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>

      {showPicker && (
        <CurrencyPicker
          value={currency}
          onChange={(code) => {
            onCurrencyChange(code)
            setShowPicker(false)
          }}
          currencies={currencies}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
