import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip, addMember } from '../../lib/api'
import { useTripStore } from '../../store/tripStore'
import CurrencyPicker from '../shared/CurrencyPicker'
import CurrencyMultiSelect from '../shared/CurrencyMultiSelect'

export default function CreateTripForm() {
  const navigate = useNavigate()
  const setEditable = useTripStore((s) => s.setEditable)

  const [name, setName] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currency, setCurrency] = useState('CNY')
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['CNY'])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleCurrencyChange = (code: string) => {
    setCurrency(code)
    // Auto-add settlement currency to selected currencies
    if (!selectedCurrencies.includes(code)) {
      setSelectedCurrencies((prev) => [...prev, code])
    }
  }

  const handleCurrenciesChange = (codes: string[]) => {
    // Ensure settlement currency stays selected
    if (!codes.includes(currency)) {
      codes = [...codes, currency]
    }
    setSelectedCurrencies(codes)
  }

  const addMemberChip = () => {
    const trimmed = memberInput.trim()
    if (!trimmed) return
    if (members.includes(trimmed)) {
      setError('成员已存在')
      return
    }
    setMembers((prev) => [...prev, trimmed])
    setMemberInput('')
    setError('')
  }

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addMemberChip()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('请输入行程名称')
      return
    }
    if (members.length < 2) {
      setError('至少添加两位成员')
      return
    }
    if (!password) {
      setError('请设置密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    setSubmitting(true)
    try {
      const tripId = await createTrip(name.trim(), password, currency, selectedCurrencies)

      // Add all members
      await Promise.all(
        members.map((memberName) => addMember(tripId, password, memberName))
      )

      // Cache password for immediate edit access
      setEditable(true, password)

      navigate(`/trip/${tripId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4">
      {/* Trip name */}
      <div>
        <label htmlFor="trip-name" className="block text-sm font-medium text-gray-700 mb-1">
          行程名称
        </label>
        <input
          id="trip-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：日本旅行"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Members */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          成员
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={handleMemberKeyDown}
            placeholder="输入成员名称"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addMemberChip}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white active:bg-primary-700"
          >
            添加
          </button>
        </div>
        {members.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
              >
                {m}
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary-400 hover:bg-primary-100 hover:text-primary-600"
                  aria-label={`移除${m}`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">
          密码
        </label>
        <input
          id="create-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="设置行程密码"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          确认密码
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再次输入密码"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Settlement currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          结算货币
        </label>
        <CurrencyPicker value={currency} onChange={handleCurrencyChange} currencies={selectedCurrencies} inline />
      </div>

      {/* Trip currencies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          旅行使用的币种
        </label>
        <p className="mb-2 text-xs text-gray-500">选择此次旅行中会用到的货币</p>
        <CurrencyMultiSelect
          selected={selectedCurrencies}
          onChange={handleCurrenciesChange}
          disabledCodes={[currency]}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white active:bg-primary-700 disabled:opacity-50"
      >
        {submitting ? '创建中...' : '创建行程'}
      </button>
    </form>
  )
}
