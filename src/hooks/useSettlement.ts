import { useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculateBalances, simplifyDebts } from '../lib/settlement'
import type { SettlementTransfer } from '../types'

export function useSettlement() {
  const { members, expenses, trip } = useTripStore()
  const { exchangeRates } = useSettingsStore()

  const settlementCurrency = trip?.settlementCurrency ?? 'CNY'

  const balances = useMemo(() => {
    if (!exchangeRates || members.length === 0) return new Map<string, number>()
    return calculateBalances(expenses, members, exchangeRates, settlementCurrency)
  }, [expenses, members, exchangeRates, settlementCurrency])

  const transfers: SettlementTransfer[] = useMemo(() => {
    return simplifyDebts(balances)
  }, [balances])

  return { balances, transfers, settlementCurrency }
}
