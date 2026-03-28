import { create } from 'zustand'
import type { ExchangeRates, AverageExchangeRates } from '../types'

interface SettingsState {
  exchangeRates: ExchangeRates | null
  averageExchangeRates: AverageExchangeRates | null
  setExchangeRates: (rates: ExchangeRates) => void
  setAverageExchangeRates: (rates: AverageExchangeRates | null) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  exchangeRates: null,
  averageExchangeRates: null,
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),
  setAverageExchangeRates: (averageExchangeRates) => set({ averageExchangeRates }),
}))
