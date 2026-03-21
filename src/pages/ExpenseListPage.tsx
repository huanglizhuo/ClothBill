import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import ExpenseItem from '../components/expense/ExpenseItem'
import EmptyState from '../components/shared/EmptyState'
import { CATEGORIES } from '../constants/categories'

export default function ExpenseListPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { members, expenses, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPayer, setFilterPayer] = useState<string>('')

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false
      if (filterPayer && e.paidBy !== filterPayer) return false
      return true
    })
  }, [expenses, filterCategory, filterPayer])

  const handleDelete = async (expenseId: string) => {
    if (!tripId || !password) return
    const confirmed = window.confirm('确定要删除这笔消费吗？')
    if (!confirmed) return

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
        <div className="flex gap-2 py-4">
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

        {/* Expense list */}
        {filteredExpenses.length > 0 ? (
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
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
