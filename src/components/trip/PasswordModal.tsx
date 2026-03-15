import { useState } from 'react'
import BottomSheet from '../shared/BottomSheet'

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<boolean>
  loading?: boolean
}

export default function PasswordModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setError('')
    setSubmitting(true)
    try {
      const ok = await onSubmit(password)
      if (!ok) {
        setError('密码不正确，请重试')
      } else {
        setPassword('')
        setError('')
      }
    } catch {
      setError('验证失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  const isLoading = loading || submitting

  return (
    <BottomSheet open={open} onClose={handleClose} title="输入密码">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trip-password" className="block text-sm font-medium text-gray-700 mb-1">
            行程密码
          </label>
          <input
            id="trip-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码以编辑"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {error && (
            <p className="mt-1.5 text-sm text-red-500">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !password.trim()}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? '验证中...' : '确认'}
        </button>
      </form>
    </BottomSheet>
  )
}
