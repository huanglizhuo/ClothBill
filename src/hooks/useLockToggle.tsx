import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import * as api from '../lib/api'
import PasswordModal from '../components/trip/PasswordModal'

export function useLockToggle(tripId: string | undefined) {
  const { isEditable, setEditable } = useTripStore()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handlePasswordSubmit = async (pw: string): Promise<boolean> => {
    if (!tripId) return false
    const ok = await api.verifyTripPassword(tripId, pw)
    if (ok) {
      setEditable(true, pw)
      setShowPasswordModal(false)
    }
    return ok
  }

  const handleToggleLock = () => {
    if (isEditable) {
      setEditable(false)
    } else {
      setShowPasswordModal(true)
    }
  }

  const lockIcon = isEditable ? (
    <button type="button" onClick={handleToggleLock} className="rounded-lg p-1 active:bg-gray-100" aria-label="锁定">
      <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </button>
  ) : (
    <button type="button" onClick={handleToggleLock} className="rounded-lg p-1 active:bg-gray-100" aria-label="解锁">
      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 019.9-1" />
      </svg>
    </button>
  )

  const passwordModal = (
    <PasswordModal
      open={showPasswordModal}
      onClose={() => setShowPasswordModal(false)}
      onSubmit={handlePasswordSubmit}
    />
  )

  return { lockIcon, passwordModal }
}
