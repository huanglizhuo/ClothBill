interface Env {
  CURRENCYBEACON_API_KEY: string
}

interface CurrencyBeaconResponse {
  meta: { code: number }
  response: { date: string; base: string }
  rates: Record<string, number>
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const base = url.searchParams.get('base')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const symbols = url.searchParams.get('symbols')

  if (!base || !from || !to || !symbols) {
    return Response.json(
      { error: 'missing_params', message: 'Required: base, from, to, symbols' },
      { status: 400 }
    )
  }

  const apiKey = context.env.CURRENCYBEACON_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'config_error', message: 'API key not configured' },
      { status: 500 }
    )
  }

  // Generate date list between from and to
  const dates = generateDateRange(from, to)
  const today = new Date().toISOString().slice(0, 10)
  const validDates = dates.filter((d) => d <= today)

  if (validDates.length === 0) {
    return Response.json(
      { error: 'invalid_range', message: 'No valid dates in range' },
      { status: 400 }
    )
  }

  try {
    // Fetch rates for each date (parallel, batched to avoid overwhelming the API)
    const BATCH_SIZE = 5
    const allResults: CurrencyBeaconResponse[] = []

    for (let i = 0; i < validDates.length; i += BATCH_SIZE) {
      const batch = validDates.slice(i, i + BATCH_SIZE)
      const promises = batch.map((date) =>
        fetchDayRate(apiKey, base, date, symbols)
      )
      const results = await Promise.all(promises)

      for (const result of results) {
        if (result.error) {
          if (result.status === 429) {
            return Response.json(
              { error: 'rate_limit', message: 'CurrencyBeacon rate limit exceeded' },
              { status: 429 }
            )
          }
          // Skip individual failures, continue with others
          continue
        }
        if (result.data) {
          allResults.push(result.data)
        }
      }
    }

    if (allResults.length === 0) {
      return Response.json(
        { error: 'api_error', message: 'Failed to fetch any rates' },
        { status: 502 }
      )
    }

    // Compute average rates
    const symbolList = symbols.split(',')
    const avgRates: Record<string, number> = {}

    for (const sym of symbolList) {
      let sum = 0
      let count = 0
      for (const result of allResults) {
        const val = result.rates[sym]
        if (val != null && val > 0) {
          sum += val
          count++
        }
      }
      avgRates[sym] = count > 0 ? sum / count : 0
    }
    avgRates[base] = 1

    return Response.json({
      base,
      rates: avgRates,
      dateRange: { from: validDates[0], to: validDates[validDates.length - 1] },
      daysUsed: allResults.length,
    })
  } catch (err) {
    return Response.json(
      { error: 'api_error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 502 }
    )
  }
}

async function fetchDayRate(
  apiKey: string,
  base: string,
  date: string,
  symbols: string
): Promise<{ data?: CurrencyBeaconResponse; error?: boolean; status?: number }> {
  try {
    const url = `https://api.currencybeacon.com/v1/historical?api_key=${apiKey}&base=${base}&date=${date}&symbols=${symbols}`
    const res = await fetch(url)

    if (!res.ok) {
      return { error: true, status: res.status }
    }

    const data = (await res.json()) as CurrencyBeaconResponse
    return { data }
  } catch {
    return { error: true }
  }
}

function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = []
  const current = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}
