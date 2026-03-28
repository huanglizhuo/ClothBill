import type { ExchangeRates, AverageExchangeRates, Expense } from '../types'

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
  const symbol = symbolMap[currency]
  const formatted = amount.toFixed(decimals)

  // If we have a symbol (e.g. ¥), show "¥123.00 CNY"; otherwise just "123.00 EGP"
  return symbol ? `${symbol}${formatted} ${currency}` : `${formatted} ${currency}`
}

/**
 * Returns true if the cached rates are older than 24 hours.
 */
export function isRatesStale(rates: ExchangeRates): boolean {
  return Date.now() - rates.fetchedAt > STALE_MS
}

/* ── Historical average rates ─────────────────────────── */

/**
 * Extract the min/max date from expenses that use foreign currencies.
 * Returns null if no foreign currency expenses exist.
 */
export function getExpenseDateRange(
  expenses: Expense[],
  settlementCurrency: string
): { from: string; to: string; symbols: string[] } | null {
  const foreignExpenses = expenses.filter((e) => e.currency !== settlementCurrency)
  if (foreignExpenses.length === 0) return null

  const symbols = [...new Set(foreignExpenses.map((e) => e.currency))]
  const dates = foreignExpenses.map((e) => e.date.slice(0, 10)).sort()
  const from = dates[0]
  let to = dates[dates.length - 1]

  // Clamp to today if future
  const today = new Date().toISOString().slice(0, 10)
  if (to > today) to = today
  if (from > today) return null

  return { from, to, symbols }
}

/**
 * Fetch historical average rates via our Cloudflare Pages Function proxy.
 * The server-side function calls CurrencyBeacon and computes the average.
 */
export async function fetchAverageRates(
  settlementCurrency: string,
  from: string,
  to: string,
  symbols: string[]
): Promise<AverageExchangeRates> {
  const symbolsParam = symbols.join(',')
  const cacheKey = `clothbill_hist_${settlementCurrency}_${from}_${to}_${[...symbols].sort().join(',')}`

  // Check cache first (historical data is immutable)
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as AverageExchangeRates
  } catch { /* ignore */ }

  const url = `/api/rates?base=${settlementCurrency}&from=${from}&to=${to}&symbols=${symbolsParam}`
  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    const errorType = body.error ?? 'api_error'
    const err = new Error(body.message ?? `Failed to fetch rates: ${res.status}`)
    ;(err as Error & { code: string }).code = errorType
    throw err
  }

  const json = await res.json() as {
    base: string
    rates: Record<string, number>
    dateRange: { from: string; to: string }
  }

  const result: AverageExchangeRates = {
    base: json.base,
    rates: json.rates,
    dateRange: json.dateRange,
    fetchedAt: Date.now(),
  }

  // Cache permanently
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result))
  } catch { /* ignore */ }

  return result
}
