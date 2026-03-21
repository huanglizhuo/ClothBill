import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import MemberChip from '../components/shared/MemberChip'
import ExpenseItem from '../components/expense/ExpenseItem'
import ExpenseChart from '../components/expense/ExpenseChart'
import EmptyState from '../components/shared/EmptyState'
import { CATEGORIES } from '../constants/categories'
import type { Expense, Member } from '../types'

type GroupBy = 'date' | 'category' | 'payer' | 'member'
type ViewMode = 'list' | 'chart'

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'date', label: '日期' },
  { key: 'category', label: '分类' },
  { key: 'payer', label: '付款人' },
  { key: 'member', label: '账单人' },
]

function getGroupKey(expense: Expense, groupBy: GroupBy): string[] {
  switch (groupBy) {
    case 'date':
      return [expense.date]
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
    const total = exps.reduce((sum, e) => sum + e.amount, 0)
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

  if (groupBy === 'date') {
    groups.sort((a, b) => b.key.localeCompare(a.key))
  } else {
    groups.sort((a, b) => b.total - a.total)
  }

  return groups
}

export default function ExpenseListPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trip, members, expenses, isLoading, error: loadError, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const [groupBy, setGroupBy] = useState<GroupBy>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [newMemberName, setNewMemberName] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const groups = useMemo(
    () => groupExpenses(expenses, groupBy, members),
    [expenses, groupBy, members]
  )

  const chartItems = useMemo(
    () => groups.map((g) => ({ label: g.label, amount: g.total, currency: g.currency })),
    [groups]
  )

  const handleDelete = async (expenseId: string) => {
    if (!tripId || !password) return
    if (!window.confirm('确定要删除这笔账单吗？')) return
    try {
      await api.deleteExpense(tripId, password, expenseId)
      await reload()
    } catch {
      // silently handle
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !password || !tripId) return
    setAddingMember(true)
    try {
      await api.addMember(tripId, password, newMemberName.trim())
      setNewMemberName('')
      setShowAddMember(false)
      await reload()
    } catch {
      // silently handle
    } finally {
      setAddingMember(false)
    }
  }

  if (!tripId) return null

  if (isLoading && !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-sm text-red-500">{loadError}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={trip?.name ?? '账单'}
        rightAction={lockIcon}
        onBack={() => navigate('/')}
      />

      <main className="space-y-6 px-4 py-6 pb-20">
        {/* Members */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-gray-500">成员</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {members.map((member) => (
              <MemberChip key={member.id} member={member} size="sm" />
            ))}
          </div>
          {isEditable && (
            <div className="mt-2">
              {showAddMember ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="输入成员名"
                    autoFocus
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember() }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberName.trim()}
                    className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-50"
                  >
                    {addingMember ? '...' : '添加'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddMember(false); setNewMemberName('') }}
                    className="shrink-0 rounded-lg px-2 py-2 text-sm text-gray-500 active:bg-gray-100"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1 text-sm text-primary-600 active:text-primary-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  添加成员
                </button>
              )}
            </div>
          )}
        </section>


        {/* Group selector + view toggle */}
        <div className="flex items-center justify-between">
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

        {/* Expense list / chart */}
        {expenses.length > 0 ? (
          viewMode === 'chart' ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <ExpenseChart items={chartItems} />
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="px-1 py-2">
                    <span className="text-xs font-semibold text-gray-500">{group.label}</span>
                  </div>
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
            title="暂无账单记录"
            description={undefined}
          />
        )}
      </main>

      <BottomNav tripId={tripId} />
      {passwordModal}
    </div>
  )
}
