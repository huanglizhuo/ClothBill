import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import * as api from '../lib/api'
import type { Expense, ExpenseSplit } from '../types'
import PageHeader from '../components/layout/PageHeader'
import AmountInput from '../components/expense/AmountInput'
import PayerSelector from '../components/expense/PayerSelector'
import SplitSelector from '../components/expense/SplitSelector'
import CategoryPicker from '../components/expense/CategoryPicker'

export default function AddExpensePage() {
  const { tripId, expenseId } = useParams<{ tripId: string; expenseId?: string }>()
  const navigate = useNavigate()
  const { trip, members, expenses, currencies, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()

  const isEdit = Boolean(expenseId)
  const existingExpense = isEdit
    ? expenses.find((e) => e.id === expenseId)
    : undefined

  // Form state
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(trip?.settlementCurrency ?? 'CNY')
  const [description, setDescription] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState<Expense['splitType']>('equal')
  const [splits, setSplits] = useState<ExpenseSplit[]>([])
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not editable
  useEffect(() => {
    if (trip && !isEditable) {
      navigate(`/bill/${tripId}`, { replace: true })
    }
  }, [trip, isEditable, tripId, navigate])

  // Initialize form when editing
  useEffect(() => {
    if (existingExpense) {
      setAmount(String(existingExpense.amount))
      setCurrency(existingExpense.currency)
      setDescription(existingExpense.description)
      setPaidBy(existingExpense.paidBy)
      setSplitType(existingExpense.splitType)
      setSplits(existingExpense.splits)
      setCategory(existingExpense.category)
      setDate(existingExpense.date.slice(0, 10))
      setCheckIn(existingExpense.checkIn ?? '')
      setCheckOut(existingExpense.checkOut ?? '')
    }
  }, [existingExpense])

  // Set default payer and splits when members load
  useEffect(() => {
    if (members.length > 0 && !paidBy && !isEdit) {
      const lastPayer = expenses.length > 0 ? expenses[0].paidBy : members[0].id
      setPaidBy(lastPayer)
      setSplits(members.map((m) => ({ memberId: m.id })))
    }
  }, [members, expenses, paidBy, isEdit])

  // Set default currency: most recent expense's currency, or trip settlement currency
  useEffect(() => {
    if (!isEdit && trip) {
      const lastCurrency = expenses.length > 0 ? expenses[0].currency : trip.settlementCurrency
      setCurrency(lastCurrency)
    }
  }, [trip, expenses, isEdit])

  const handleSubmit = async () => {
    if (!tripId || !password) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('请输入有效金额')
      return
    }
    if (!paidBy) {
      setError('请选择付款人')
      return
    }
    if (splits.length === 0) {
      setError('请选择至少一位分摊成员')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const ci = category === 'accommodation' && checkIn ? checkIn : undefined
      const co = category === 'accommodation' && checkOut ? checkOut : undefined
      if (isEdit && expenseId) {
        await api.updateExpense(
          tripId, password, expenseId,
          description, numAmount, currency, paidBy,
          splitType, category, date, splits, ci, co
        )
      } else {
        await api.addExpense(
          tripId, password,
          description, numAmount, currency, paidBy,
          splitType, category, date, splits, ci, co
        )
      }
      await reload()
      navigate(`/bill/${tripId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tripId) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={isEdit ? '编辑消费' : '添加消费'} />

      <main className="space-y-6 px-4 py-6 pb-8 md:max-w-lg md:mx-auto">
        {/* Amount */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <AmountInput
            value={amount}
            onChange={setAmount}
            currency={currency}
            onCurrencyChange={setCurrency}
            currencies={currencies.length > 0 ? currencies : undefined}
          />
        </section>

        {/* Description */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="mb-1 block text-sm font-medium text-gray-500">描述</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="消费描述"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </section>

        {/* Payer */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <PayerSelector
            members={members}
            selectedId={paidBy}
            onChange={setPaidBy}
          />
        </section>

        {/* Split */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <SplitSelector
            members={members}
            splits={splits}
            splitType={splitType}
            totalAmount={parseFloat(amount) || 0}
            onSplitsChange={setSplits}
            onSplitTypeChange={setSplitType}
          />
        </section>

        {/* Category */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <CategoryPicker value={category} onChange={setCategory} />
        </section>

        {/* Date */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="mb-1 block text-sm font-medium text-gray-500">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </section>

        {/* Check-in / Check-out for accommodation */}
        {category === 'accommodation' && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
            <label className="block text-sm font-medium text-blue-600">入住 / 退房日期（可选）</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">入住</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">退房</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? '保存中...' : isEdit ? '保存修改' : '添加消费'}
        </button>
      </main>
    </div>
  )
}
