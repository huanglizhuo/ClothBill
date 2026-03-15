import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripStore } from '../store/tripStore'
import { useLockToggle } from '../hooks/useLockToggle'
import * as api from '../lib/api'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import CurrencyPicker from '../components/shared/CurrencyPicker'
import CurrencyMultiSelect from '../components/shared/CurrencyMultiSelect'

export default function SettingsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trip, members, expenses, currencies, reload } = useTrip(tripId)
  const { isEditable, password } = useTripStore()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!tripId) return null

  // Currencies used in expenses (cannot be removed)
  const usedCurrencies = [...new Set(expenses.map((e) => e.currency))]
  const disabledCurrencyCodes = [...new Set([
    ...(trip ? [trip.settlementCurrency] : []),
    ...usedCurrencies,
  ])]

  const handleCurrencyToggle = async (codes: string[]) => {
    if (!password || !tripId) return
    setError('')
    setSaving(true)
    try {
      // Find added and removed
      const added = codes.filter((c) => !currencies.includes(c))
      const removed = currencies.filter((c) => !codes.includes(c))

      for (const code of added) {
        await api.addTripCurrency(tripId, password, code)
      }
      for (const code of removed) {
        await api.removeTripCurrency(tripId, password, code)
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSettlementChange = async (code: string) => {
    if (!password || !tripId) return
    setError('')
    setSaving(true)
    try {
      await api.updateSettlementCurrency(tripId, password, code)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (memberId: string, name: string) => {
    setEditingMemberId(memberId)
    setEditName(name)
    setError('')
  }

  const cancelEdit = () => {
    setEditingMemberId(null)
    setEditName('')
  }

  const saveEdit = async () => {
    if (!password || !tripId || !editingMemberId) return
    const trimmed = editName.trim()
    if (!trimmed) return
    setError('')
    setSaving(true)
    try {
      await api.updateMember(tripId, password, editingMemberId, trimmed)
      setEditingMemberId(null)
      setEditName('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!password || !tripId) return
    if (!confirm(`确定要删除成员「${name}」吗？`)) return
    setError('')
    setSaving(true)
    try {
      await api.removeMember(tripId, password, memberId)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!password || !tripId) return
    const trimmed = newMemberName.trim()
    if (!trimmed) return
    setError('')
    setSaving(true)
    try {
      await api.addMember(tripId, password, trimmed)
      setNewMemberName('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="设置" rightAction={lockIcon} />

      <main className="space-y-6 px-4 pt-14 pb-8">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Member Management */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">成员管理</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                {editingMemberId === m.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white active:bg-primary-700 disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 active:bg-gray-50"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-900">{m.name}</span>
                    {isEditable && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(m.id, m.name)}
                          className="rounded-lg p-1.5 text-gray-400 active:bg-gray-100"
                          aria-label="编辑"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          disabled={saving}
                          className="rounded-lg p-1.5 text-red-400 active:bg-red-50"
                          aria-label="删除"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {isEditable && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember() } }}
                placeholder="新成员名称"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={saving || !newMemberName.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          )}
        </section>

        {/* Currency Management */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">币种管理</h2>

          {/* Settlement currency */}
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">结算货币</label>
            {isEditable ? (
              <CurrencyPicker
                value={trip?.settlementCurrency ?? 'CNY'}
                onChange={handleSettlementChange}
                currencies={currencies.length > 0 ? currencies : undefined}
                inline
              />
            ) : (
              <span className="text-sm text-gray-700">{trip?.settlementCurrency}</span>
            )}
          </div>

          {/* Trip currencies */}
          <div>
            <label className="mb-2 block text-xs text-gray-500">旅行使用的币种</label>
            {isEditable ? (
              <CurrencyMultiSelect
                selected={currencies}
                onChange={handleCurrencyToggle}
                disabledCodes={disabledCurrencyCodes}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {currencies.map((code) => (
                  <span key={code} className="rounded-lg border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav tripId={tripId} />
      {passwordModal}
    </div>
  )
}
