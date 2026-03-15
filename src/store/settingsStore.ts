import { create } from 'zustand'
import type { ExchangeRates } from '../types'

interface SettingsState {
  exchangeRates: ExchangeRates | null
  setExchangeRates: (rates: ExchangeRates) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  exchangeRates: null,
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),
}))
