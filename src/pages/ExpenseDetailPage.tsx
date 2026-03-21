import { useParams, useNavigate } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import { CATEGORIES } from '../constants/categories'
import { CURRENCIES } from '../constants/currencies'
import { formatAmount } from '../lib/currency'
import PageHeader from '../components/layout/PageHeader'

export default function ExpenseDetailPage() {
  const { tripId, expenseId } = useParams<{ tripId: string; expenseId: string }>()
  const navigate = useNavigate()
  const { members, expenses, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const expense = expenses.find((e) => e.id === expenseId)

  if (!tripId || !expenseId) return null
  if (!expense) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="账单详情" />
        <p className="px-4 py-12 text-center text-sm text-gray-400">加载中...</p>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === expense.category)
  const currencyInfo = CURRENCIES.find((c) => c.code === expense.currency)
  const symbol = currencyInfo?.symbol ?? expense.currency
  const payer = members.find((m) => m.id === expense.paidBy)

  const splitLabel =
    expense.splitType === 'equal' ? '平均分摊' :
    expense.splitType === 'exact' ? '按金额分摊' : '按比例分摊'

  const handleEdit = () => {
    navigate(`/bill/${tripId}/expense/${expenseId}/edit`)
  }

  const handleDelete = async () => {
    if (!password) return
    if (!window.confirm('确定要删除这笔账单吗？')) return
    try {
      await api.deleteExpense(tripId, password, expenseId)
      await reload()
      navigate(-1)
    } catch {
      // silently handle
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="账单详情" rightAction={lockIcon} />

      <main className="space-y-4 px-4 py-6 pb-8 md:max-w-lg md:mx-auto">
        {/* Amount & description */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
              {category?.icon ?? '📦'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-gray-900">{expense.description || '未命名'}</p>
              {category && <p className="text-xs text-gray-400">{category.name}</p>}
            </div>
          </div>
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-gray-900">
              {symbol}{expense.amount.toFixed(currencyInfo?.decimals ?? 2)}
            </p>
            <p className="mt-1 text-sm text-gray-400">{expense.currency}</p>
          </div>
        </section>

        {/* Info rows */}
        <section className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">付款人</span>
            <span className="text-sm font-medium text-gray-900">{payer?.name ?? '未知'}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">日期</span>
            <span className="text-sm font-medium text-gray-900">{expense.date.slice(0, 10)}</span>
          </div>
          {expense.category === 'accommodation' && expense.checkIn && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500">入住</span>
              <span className="text-sm font-medium text-gray-900">{expense.checkIn}</span>
            </div>
          )}
          {expense.category === 'accommodation' && expense.checkOut && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500">退房</span>
              <span className="text-sm font-medium text-gray-900">{expense.checkOut}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">分摊方式</span>
            <span className="text-sm font-medium text-gray-900">{splitLabel}</span>
          </div>
        </section>

        {/* Split details */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">分摊详情</h3>
          <div className="space-y-2">
            {expense.splits.map((split) => {
              const member = members.find((m) => m.id === split.memberId)
              let shareText = ''
              if (expense.splitType === 'equal') {
                shareText = formatAmount(expense.amount / expense.splits.length, expense.currency)
              } else if (expense.splitType === 'exact') {
                shareText = formatAmount(split.shareAmount ?? 0, expense.currency)
              } else if (expense.splitType === 'percentage') {
                const pct = split.sharePercentage ?? 0
                const amt = (pct / 100) * expense.amount
                shareText = `${pct}% · ${formatAmount(amt, expense.currency)}`
              }
              return (
                <div key={split.memberId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-700">{member?.name ?? '未知'}</span>
                  <span className="text-sm font-medium text-gray-900">{shareText}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Actions */}
        {isEditable && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white active:bg-primary-700"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-medium text-red-600 active:bg-red-100"
            >
              删除
            </button>
          </div>
        )}
      </main>
      {passwordModal}
    </div>
  )
}
