import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useCurrency } from '../hooks/useCurrency'
import { useSettlement } from '../hooks/useSettlement'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import MemberChip from '../components/shared/MemberChip'
import ExpenseItem from '../components/expense/ExpenseItem'

export default function TripDashboardPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trip, members, expenses, isLoading, error, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { format } = useCurrency()
  const { balances, settlementCurrency } = useSettlement()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const [newMemberName, setNewMemberName] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  if (!tripId) return null

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !password) return
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

  // Calculate total expenses
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const primaryCurrency = expenses.length > 0 ? expenses[0].currency : (trip?.settlementCurrency ?? 'CNY')
  const recentExpenses = expenses.slice(0, 3)

  if (isLoading && !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-sm text-red-500">{error}</p>
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
        title={trip?.name ?? '旅行'}
        rightAction={lockIcon}
        onBack={() => navigate('/')}
      />

      <main className="space-y-6 px-4 py-6 pb-20">
        {/* Members section */}
        <section className="pt-4">
          <h2 className="mb-3 text-sm font-medium text-gray-500">成员</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {members.map((member) => (
              <MemberChip key={member.id} member={member} size="sm" />
            ))}
          </div>

          {/* Add member inline form */}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddMember()
                    }}
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
                    onClick={() => {
                      setShowAddMember(false)
                      setNewMemberName('')
                    }}
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

        {/* Quick balance summary */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-500">消费概览</h2>
          <p className="text-2xl font-bold text-gray-900">
            {format(totalAmount, primaryCurrency)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            共 {expenses.length} 笔消费 · {members.length} 位成员
          </p>

          {members.length > 0 && expenses.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {members.map((member) => {
                const balance = balances.get(member.id) ?? 0
                const paidTotal = expenses
                  .filter((e) => e.paidBy === member.id)
                  .reduce((sum, e) => sum + e.amount, 0)
                return (
                  <div key={member.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="truncate text-xs text-gray-500">{member.name}</p>
                    <p className="text-xs text-gray-400">
                      已付 {format(paidTotal, primaryCurrency)}
                    </p>
                    <p className={`text-sm font-medium ${
                      balance > 0.01 ? 'text-green-600' : balance < -0.01 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {balance > 0.01
                        ? `被欠 ${format(balance, settlementCurrency)}`
                        : balance < -0.01
                        ? `欠 ${format(Math.abs(balance), settlementCurrency)}`
                        : '已结清'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent expenses */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">最近消费</h2>
            {expenses.length > 3 && (
              <Link to={`/trip/${tripId}/expenses`} className="text-xs text-primary-600">
                查看全部
              </Link>
            )}
          </div>

          {recentExpenses.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-gray-200 bg-white">
              {recentExpenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} members={members} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center">
              <p className="text-sm text-gray-400">暂无消费记录</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav tripId={tripId} />
      {passwordModal}
    </div>
  )
}
