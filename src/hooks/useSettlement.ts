import { useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculatePerCurrencySettlements } from '../lib/settlement'
import { convertAmount } from '../lib/currency'

export function useSettlement() {
  const { members, expenses, trip } = useTripStore()
  const { exchangeRates } = useSettingsStore()

  const settlementCurrency = trip?.settlementCurrency ?? 'CNY'

  const perCurrencySettlements = useMemo(() => {
    if (members.length === 0) return new Map()
    return calculatePerCurrencySettlements(expenses, members)
  }, [expenses, members])

  // Derive overall balances in settlement currency from per-currency balances
  const balances = useMemo(() => {
    const result = new Map<string, number>()
    if (!exchangeRates) return result
    for (const m of members) {
      result.set(m.id, 0)
    }
    for (const [currency, { balances: currBalances }] of perCurrencySettlements) {
      for (const [memberId, amount] of currBalances) {
        const converted = convertAmount(amount, currency, settlementCurrency, exchangeRates)
        result.set(memberId, (result.get(memberId) ?? 0) + converted)
      }
    }
    return result
  }, [perCurrencySettlements, exchangeRates, settlementCurrency, members])

  return { balances, perCurrencySettlements, settlementCurrency }
}
