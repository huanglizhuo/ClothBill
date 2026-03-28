import { useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculatePerCurrencySettlements } from '../lib/settlement'
import { convertAmount } from '../lib/currency'

export function useSettlement() {
  const { members, expenses, trip } = useTripStore()
  const { exchangeRates, averageExchangeRates } = useSettingsStore()

  const settlementCurrency = trip?.settlementCurrency ?? 'CNY'

  const perCurrencySettlements = useMemo(() => {
    if (members.length === 0) return new Map()
    return calculatePerCurrencySettlements(expenses, members)
  }, [expenses, members])

  // Prefer average rates for settlement; fall back to live rates
  const effectiveRates = averageExchangeRates ?? exchangeRates

  // Derive overall balances in settlement currency from per-currency balances
  const balances = useMemo(() => {
    const result = new Map<string, number>()
    if (!effectiveRates) return result
    for (const m of members) {
      result.set(m.id, 0)
    }
    for (const [currency, { balances: currBalances }] of perCurrencySettlements) {
      for (const [memberId, amount] of currBalances) {
        const converted = convertAmount(amount, currency, settlementCurrency, effectiveRates)
        result.set(memberId, (result.get(memberId) ?? 0) + converted)
      }
    }
    return result
  }, [perCurrencySettlements, effectiveRates, settlementCurrency, members])

  return { balances, perCurrencySettlements, settlementCurrency }
}
