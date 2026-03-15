import { useEffect } from 'react'
import { useTripStore } from '../store/tripStore'
import * as api from '../lib/api'

export function useTrip(tripId: string | undefined) {
  const { setTrip, setMembers, setExpenses, setCurrencies, setLoading, setError, trip, members, expenses, currencies, isLoading, error } = useTripStore()

  useEffect(() => {
    if (!tripId) return

    const loadTrip = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tripData, membersData, expensesData, currenciesData] = await Promise.all([
          api.getTrip(tripId),
          api.getMembers(tripId),
          api.getExpenses(tripId),
          api.getTripCurrencies(tripId),
        ])
        setTrip(tripData)
        setMembers(membersData)
        setExpenses(expensesData)
        setCurrencies(currenciesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadTrip()
  }, [tripId])

  const reload = async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const [tripData, membersData, expensesData, currenciesData] = await Promise.all([
        api.getTrip(tripId),
        api.getMembers(tripId),
        api.getExpenses(tripId),
        api.getTripCurrencies(tripId),
      ])
      setTrip(tripData)
      setMembers(membersData)
      setExpenses(expensesData)
      setCurrencies(currenciesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败')
    } finally {
      setLoading(false)
    }
  }

  return { trip, members, expenses, currencies, isLoading, error, reload }
}
