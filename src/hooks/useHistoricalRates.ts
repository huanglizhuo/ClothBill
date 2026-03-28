import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { getExpenseDateRange, fetchAverageRates } from '../lib/currency'
import type { Expense } from '../types'

export type RateErrorType = 'rate_limit' | 'api_error' | null

export function useHistoricalRates(expenses: Expense[], settlementCurrency: string) {
  const { averageExchangeRates, setAverageExchangeRates } = useSettingsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [errorType, setErrorType] = useState<RateErrorType>(null)

  const rangeInfo = useMemo(
    () => getExpenseDateRange(expenses, settlementCurrency),
    [expenses, settlementCurrency]
  )

  useEffect(() => {
    if (!rangeInfo) {
      setAverageExchangeRates(null)
      return
    }

    const { from, to, symbols } = rangeInfo

    // If already loaded for the same range, skip
    if (
      averageExchangeRates &&
      averageExchangeRates.dateRange.from === from &&
      averageExchangeRates.dateRange.to === to &&
      symbols.every((s) => averageExchangeRates.rates[s] != null)
    ) {
      return
    }

    setIsLoading(true)
    setErrorType(null)

    fetchAverageRates(settlementCurrency, from, to, symbols)
      .then((rates) => {
        setAverageExchangeRates(rates)
      })
      .catch((err) => {
        const code = (err as Error & { code?: string }).code
        if (code === 'rate_limit') {
          setErrorType('rate_limit')
        } else {
          setErrorType('api_error')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [rangeInfo, settlementCurrency])

  return {
    averageRates: averageExchangeRates,
    dateRange: rangeInfo ? { from: rangeInfo.from, to: rangeInfo.to } : null,
    isLoading,
    errorType,
  }
}
