import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fetchExchangeRates, getCachedRates, isRatesStale, convertAmount, formatAmount } from '../lib/currency'

export function useCurrency() {
  const { exchangeRates, setExchangeRates } = useSettingsStore()

  useEffect(() => {
    const cached = getCachedRates()
    if (cached && !isRatesStale(cached)) {
      setExchangeRates(cached)
      return
    }
    fetchExchangeRates().then(setExchangeRates).catch(() => {
      if (cached) setExchangeRates(cached)
    })
  }, [])

  const convert = (amount: number, from: string, to: string) => {
    if (!exchangeRates) return amount
    return convertAmount(amount, from, to, exchangeRates)
  }

  const format = (amount: number, currency: string) => formatAmount(amount, currency)

  const stale = exchangeRates ? isRatesStale(exchangeRates) : false

  return { exchangeRates, convert, format, stale }
}
