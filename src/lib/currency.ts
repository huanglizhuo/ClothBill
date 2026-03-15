import type { ExchangeRates } from '../types'

const STORAGE_KEY = 'clothbill_exchange_rates'
const STALE_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch live exchange rates from open.er-api.com and cache in localStorage.
 */
export async function fetchExchangeRates(
  base: string = 'USD'
): Promise<ExchangeRates> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.status}`)
  }
  const json = await res.json()
  const rates: ExchangeRates = {
    base: json.base_code ?? base,
    rates: json.rates as Record<string, number>,
    fetchedAt: Date.now(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
  } catch {
    // localStorage may be unavailable; silently ignore
  }
  return rates
}

/**
 * Read cached rates from localStorage (returns null if absent).
 */
export function getCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ExchangeRates
  } catch {
    return null
  }
}

/**
 * Convert an amount between two currencies using the given rates.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount

  // rates are relative to rates.base
  const fromRate = rates.rates[fromCurrency]
  const toRate = rates.rates[toCurrency]
  if (fromRate == null || toRate == null) {
    throw new Error(
      `Missing rate for ${fromRate == null ? fromCurrency : toCurrency}`
    )
  }
  // amount in base = amount / fromRate
  // amount in target = amountInBase * toRate
  return (amount / fromRate) * toRate
}

/**
 * Format a monetary amount with the appropriate currency symbol and decimals.
 * JPY and KRW use 0 decimal places; all others use 2.
 */
export function formatAmount(amount: number, currency: string): string {
  const symbolMap: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    KRW: '₩',
    THB: '฿',
    GBP: '£',
    HKD: 'HK$',
    TWD: 'NT$',
    SGD: 'S$',
    AUD: 'A$',
    CAD: 'C$',
  }

  const zeroDecimalCurrencies = new Set(['JPY', 'KRW'])
  const decimals = zeroDecimalCurrencies.has(currency) ? 0 : 2
  const symbol = symbolMap[currency] ?? currency + ' '

  return `${symbol}${amount.toFixed(decimals)} ${currency}`
}

/**
 * Returns true if the cached rates are older than 24 hours.
 */
export function isRatesStale(rates: ExchangeRates): boolean {
  return Date.now() - rates.fetchedAt > STALE_MS
}
