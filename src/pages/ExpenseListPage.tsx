import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import ExpenseItem from '../components/expense/ExpenseItem'
import ExpenseChart from '../components/expense/ExpenseChart'
import EmptyState from '../components/shared/EmptyState'
import { CATEGORIES } from '../constants/categories'
import { formatAmount } from '../lib/currency'
import type { Expense, Member } from '../types'

type GroupBy = 'date' | 'category' | 'payer' | 'member'
type ViewMode = 'list' | 'chart'

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'date', label: '日期' },
  { key: 'category', label: '分类' },
  { key: 'payer', label: '付款人' },
  { key: 'member', label: '消费人' },
]

function getGroupKey(expense: Expense, groupBy: GroupBy): string[] {
  switch (groupBy) {
    case 'date':
      // Accommodation uses checkIn date
      return [expense.category === 'accommodation' && expense.checkIn ? expense.checkIn : expense.date]
    case 'category':
      return [expense.category ?? 'other']
    case 'payer':
      return [expense.paidBy]
    case 'member':
      return expense.splits.map((s) => s.memberId)
  }
}

function getGroupLabel(key: string, groupBy: GroupBy, members: Member[]): string {
  switch (groupBy) {
    case 'date':
      return key
    case 'category': {
      const cat = CATEGORIES.find((c) => c.id === key)
      return cat ? `${cat.icon} ${cat.name}` : key
    }
    case 'payer':
    case 'member': {
      const m = members.find((m) => m.id === key)
      return m?.name ?? '未知'
    }
  }
}

interface ExpenseGroup {
  key: string
  label: string
  expenses: Expense[]
  total: number
  currency: string
}

function groupExpenses(expenses: Expense[], groupBy: GroupBy, members: Member[]): ExpenseGroup[] {
  const map = new Map<string, Expense[]>()

  for (const expense of expenses) {
    const keys = getGroupKey(expense, groupBy)
    for (const key of keys) {
      const list = map.get(key) ?? []
      list.push(expense)
      map.set(key, list)
    }
  }

  const groups: ExpenseGroup[] = Array.from(map.entries()).map(([key, exps]) => {
    // Sum amounts — if mixed currencies, just sum numerically
    const total = exps.reduce((sum, e) => sum + e.amount, 0)
    // Use the most common currency in the group
    const currencyCount = new Map<string, number>()
    for (const e of exps) {
      currencyCount.set(e.currency, (currencyCount.get(e.currency) ?? 0) + 1)
    }
    const currency = [...currencyCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

    return {
      key,
      label: getGroupLabel(key, groupBy, members),
      expenses: exps,
      total,
      currency,
    }
  })

  // Sort groups
  if (groupBy === 'date') {
    groups.sort((a, b) => b.key.localeCompare(a.key))
  } else {
    groups.sort((a, b) => b.total - a.total)
  }

  return groups
}

export default function ExpenseListPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { members, expenses, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPayer, setFilterPayer] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupBy>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false
      if (filterPayer && e.paidBy !== filterPayer) return false
      return true
    })
  }, [expenses, filterCategory, filterPayer])

  const groups = useMemo(
    () => groupExpenses(filteredExpenses, groupBy, members),
    [filteredExpenses, groupBy, members]
  )

  const chartItems = useMemo(
    () => groups.map((g) => ({ label: g.label, amount: g.total, currency: g.currency })),
    [groups]
  )

  const handleDelete = async (expenseId: string) => {
    if (!tripId || !password) return
    if (!window.confirm('确定要删除这笔消费吗？')) return
    try {
      await api.deleteExpense(tripId, password, expenseId)
      await reload()
    } catch {
      // silently handle
    }
  }

  if (!tripId) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="消费记录" rightAction={lockIcon} />

      <main className="px-4 py-4 pb-20">
        {/* Filter bar */}
        <div className="flex gap-2 py-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterPayer}
            onChange={(e) => setFilterPayer(e.target.value)}
            className="flex-1 appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">全部成员</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Group selector + view toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex gap-1">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setGroupBy(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  groupBy === opt.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
            className="rounded-lg p-1.5 text-gray-400 active:bg-gray-100"
            aria-label={viewMode === 'list' ? '切换图表' : '切换列表'}
          >
            {viewMode === 'list' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Content */}
        {filteredExpenses.length > 0 ? (
          viewMode === 'chart' ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <ExpenseChart items={chartItems} />
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.key}>
                  {/* Group header */}
                  <div className="flex items-center justify-between px-1 py-2">
                    <span className="text-xs font-semibold text-gray-500">{group.label}</span>
                    <span className="text-xs text-gray-400">
                      {group.expenses.length}笔 · {formatAmount(group.total, group.currency)}
                    </span>
                  </div>
                  {/* Group expenses */}
                  <div className="space-y-2">
                    {group.expenses.map((expense) => (
                      <div key={expense.id} className="rounded-xl border border-gray-200 bg-white">
                        <ExpenseItem
                          expense={expense}
                          members={members}
                          editable={isEditable}
                          onDelete={isEditable ? () => handleDelete(expense.id) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <EmptyState
            icon="📋"
            title="暂无消费记录"
            description={filterCategory || filterPayer ? '尝试调整筛选条件' : undefined}
          />
        )}
      </main>

      <BottomNav tripId={tripId} />
      {passwordModal}
    </div>
  )
}
