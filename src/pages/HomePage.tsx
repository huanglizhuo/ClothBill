import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateTripForm from '../components/trip/CreateTripForm'

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

type Mode = 'landing' | 'create' | 'join'

export default function HomePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('landing')
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')

  const handleJoin = () => {
    const trimmed = joinInput.trim()
    if (!trimmed) return

    const match = trimmed.match(UUID_RE)
    if (match) {
      navigate(`/trip/${match[0]}`)
      return
    }

    if (/^[\w-]{6,}$/.test(trimmed)) {
      navigate(`/trip/${trimmed}`)
      return
    }

    setJoinError('请输入有效的旅行 ID 或链接')
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-12 md:max-w-md md:mx-auto">
      {/* Hero / Logo */}
      <div className="flex flex-col items-center pt-8 pb-10">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white shadow-lg">
          CB
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ClothBill</h1>
        <p className="mt-1 text-sm text-gray-500">朋友旅行分账</p>
      </div>

      {mode === 'landing' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode('join')}
            className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-base font-semibold text-gray-900">加入已有旅行</p>
                <p className="mt-0.5 text-sm text-gray-500">输入旅行 ID 或链接加入</p>
              </div>
              <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('create')}
            className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-base font-semibold text-gray-900">创建新旅行</p>
                <p className="mt-0.5 text-sm text-gray-500">发起一次新的旅行分账</p>
              </div>
              <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {mode === 'join' && (
        <section>
          <button
            type="button"
            onClick={() => { setMode('landing'); setJoinInput(''); setJoinError('') }}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 active:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
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
      )}

      {mode === 'create' && (
        <section>
          <button
            type="button"
            onClick={() => setMode('landing')}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 active:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">创建新旅行</h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <CreateTripForm />
          </div>
        </section>
      )}
    </div>
  )
}
