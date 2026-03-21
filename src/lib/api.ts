import { supabase } from './supabase'
import type { Trip, Member, Expense, ExpenseSplit } from '../types'

// ── Trips ───────────────────────────────────────────────

export async function createTrip(
  name: string,
  password: string,
  settlementCurrency: string,
  currencies?: string[]
): Promise<string> {
  const { data, error } = await supabase.rpc('create_trip', {
    p_name: name,
    p_password: password,
    p_settlement_currency: settlementCurrency,
    p_currencies: currencies ?? null,
  })
  if (error) throw error
  return data as string
}

export async function verifyTripPassword(
  tripId: string,
  password: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_trip_password', {
    p_trip_id: tripId,
    p_password: password,
  })
  if (error) throw error
  return data as boolean
}

export async function getTrip(tripId: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()
  if (error) throw error
  return {
    id: data.id,
    name: data.name,
    settlementCurrency: data.settlement_currency,
    currencies: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ── Members ─────────────────────────────────────────────

export async function getMembers(tripId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    avatar: row.avatar ?? undefined,
  }))
}

export async function addMember(
  tripId: string,
  password: string,
  name: string,
  avatar?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('add_member', {
    p_trip_id: tripId,
    p_password: password,
    p_name: name,
    p_avatar: avatar ?? null,
  })
  if (error) throw error
  return data as string
}

// ── Expenses ────────────────────────────────────────────

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('trip_id', tripId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    paidBy: row.paid_by,
    splitType: row.split_type as Expense['splitType'],
    category: row.category ?? undefined,
    date: row.date,
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    splits: (row.expense_splits ?? []).map(
      (s: Record<string, unknown>): ExpenseSplit => ({
        memberId: s.member_id as string,
        shareAmount: s.share_amount != null ? Number(s.share_amount) : undefined,
        sharePercentage:
          s.share_percentage != null ? Number(s.share_percentage) : undefined,
      })
    ),
  }))
}

export async function addExpense(
  tripId: string,
  password: string,
  description: string,
  amount: number,
  currency: string,
  paidBy: string,
  splitType: Expense['splitType'],
  category: string | undefined,
  date: string,
  splits: ExpenseSplit[],
  checkIn?: string,
  checkOut?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('add_expense', {
    p_trip_id: tripId,
    p_password: password,
    p_description: description,
    p_amount: amount,
    p_currency: currency,
    p_paid_by: paidBy,
    p_split_type: splitType,
    p_category: category ?? null,
    p_date: date,
    p_check_in: checkIn ?? null,
    p_check_out: checkOut ?? null,
    p_splits: splits.map((s) => ({
      member_id: s.memberId,
      share_amount: s.shareAmount ?? null,
      share_percentage: s.sharePercentage ?? null,
    })),
  })
  if (error) throw error
  return data as string
}

export async function updateExpense(
  tripId: string,
  password: string,
  expenseId: string,
  description: string,
  amount: number,
  currency: string,
  paidBy: string,
  splitType: Expense['splitType'],
  category: string | undefined,
  date: string,
  splits: ExpenseSplit[],
  checkIn?: string,
  checkOut?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_expense', {
    p_trip_id: tripId,
    p_password: password,
    p_expense_id: expenseId,
    p_description: description,
    p_amount: amount,
    p_currency: currency,
    p_paid_by: paidBy,
    p_split_type: splitType,
    p_category: category ?? null,
    p_date: date,
    p_check_in: checkIn ?? null,
    p_check_out: checkOut ?? null,
    p_splits: splits.map((s) => ({
      member_id: s.memberId,
      share_amount: s.shareAmount ?? null,
      share_percentage: s.sharePercentage ?? null,
    })),
  })
  if (error) throw error
}

export async function deleteExpense(
  tripId: string,
  password: string,
  expenseId: string
): Promise<void> {
  const { error } = await supabase.rpc('delete_expense', {
    p_trip_id: tripId,
    p_password: password,
    p_expense_id: expenseId,
  })
  if (error) throw error
}

// ── Trip Currencies ────────────────────────────────────────

export async function getTripCurrencies(tripId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('trip_currencies')
    .select('currency_code')
    .eq('trip_id', tripId)
  if (error) throw error
  return (data ?? []).map((row) => row.currency_code)
}

export async function addTripCurrency(
  tripId: string,
  password: string,
  currencyCode: string
): Promise<void> {
  const { error } = await supabase.rpc('add_trip_currency', {
    p_trip_id: tripId,
    p_password: password,
    p_currency_code: currencyCode,
  })
  if (error) throw error
}

export async function removeTripCurrency(
  tripId: string,
  password: string,
  currencyCode: string
): Promise<void> {
  const { error } = await supabase.rpc('remove_trip_currency', {
    p_trip_id: tripId,
    p_password: password,
    p_currency_code: currencyCode,
  })
  if (error) throw error
}

export async function updateSettlementCurrency(
  tripId: string,
  password: string,
  currencyCode: string
): Promise<void> {
  const { error } = await supabase.rpc('update_settlement_currency', {
    p_trip_id: tripId,
    p_password: password,
    p_currency_code: currencyCode,
  })
  if (error) throw error
}

// ── Member Management ──────────────────────────────────────

export async function updateMember(
  tripId: string,
  password: string,
  memberId: string,
  name: string
): Promise<void> {
  const { error } = await supabase.rpc('update_member', {
    p_trip_id: tripId,
    p_password: password,
    p_member_id: memberId,
    p_name: name,
  })
  if (error) throw error
}

export async function deleteTrip(
  tripId: string,
  password: string
): Promise<void> {
  const { error } = await supabase.rpc('delete_trip', {
    p_trip_id: tripId,
    p_password: password,
  })
  if (error) throw error
}

export async function removeMember(
  tripId: string,
  password: string,
  memberId: string
): Promise<void> {
  const { error } = await supabase.rpc('remove_member', {
    p_trip_id: tripId,
    p_password: password,
    p_member_id: memberId,
  })
  if (error) throw error
}
