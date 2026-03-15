import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import * as api from '../lib/api'

export function useAuth() {
  const { isEditable, password, setEditable } = useTripStore()
  const [verifying, setVerifying] = useState(false)

  const verify = async (tripId: string, pwd: string): Promise<boolean> => {
    setVerifying(true)
    try {
      const valid = await api.verifyTripPassword(tripId, pwd)
      if (valid) {
        setEditable(true, pwd)
      }
      return valid
    } finally {
      setVerifying(false)
    }
  }

  const lock = () => setEditable(false)

  return { isEditable, password, verify, lock, verifying }
}
