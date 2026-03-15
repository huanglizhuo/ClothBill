import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateTripForm from '../components/trip/CreateTripForm'

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export default function HomePage() {
  const navigate = useNavigate()
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')

  const handleJoin = () => {
    const trimmed = joinInput.trim()
    if (!trimmed) return

    // Try to extract UUID from URL or plain text
    const match = trimmed.match(UUID_RE)
    if (match) {
      navigate(`/trip/${match[0]}`)
      return
    }

    // If the input itself looks like an ID (non-UUID format), try it directly
    if (/^[\w-]{6,}$/.test(trimmed)) {
      navigate(`/trip/${trimmed}`)
      return
    }

    setJoinError('请输入有效的旅行 ID 或链接')
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-12">
      {/* Hero / Logo */}
      <div className="flex flex-col items-center pt-8 pb-10">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white shadow-lg">
          CB
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ClothBill</h1>
        <p className="mt-1 text-sm text-gray-500">朋友旅行分账</p>
      </div>

      {/* Section 1: Create Trip */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">创建新旅行</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <CreateTripForm />
        </div>
      </section>

      {/* Section 2: Join Trip */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">加入已有旅行</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value)
                setJoinError('')
              }}
              placeholder="输入旅行 ID 或链接"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {joinError && <p className="text-sm text-red-500">{joinError}</p>}
            <button
              type="button"
              onClick={handleJoin}
              disabled={!joinInput.trim()}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white active:bg-gray-800 disabled:opacity-50"
            >
              加入旅行
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
