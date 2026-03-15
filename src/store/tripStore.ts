import { create } from 'zustand'
import type { Trip, Member, Expense } from '../types'

interface TripState {
  trip: Trip | null
  members: Member[]
  expenses: Expense[]
  currencies: string[]
  isEditable: boolean
  password: string | null  // cached password for write operations
  isLoading: boolean
  error: string | null

  setTrip: (trip: Trip | null) => void
  setMembers: (members: Member[]) => void
  setExpenses: (expenses: Expense[]) => void
  setCurrencies: (currencies: string[]) => void
  setEditable: (editable: boolean, password?: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useTripStore = create<TripState>((set) => ({
  trip: null,
  members: [],
  expenses: [],
  currencies: [],
  isEditable: false,
  password: null,
  isLoading: false,
  error: null,

  setTrip: (trip) => set({ trip }),
  setMembers: (members) => set({ members }),
  setExpenses: (expenses) => set({ expenses }),
  setCurrencies: (currencies) => set({ currencies }),
  setEditable: (editable, password) => set({ isEditable: editable, password: password ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ trip: null, members: [], expenses: [], currencies: [], isEditable: false, password: null, isLoading: false, error: null }),
}))
