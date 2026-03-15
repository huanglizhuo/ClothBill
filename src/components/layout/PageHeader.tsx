import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  rightAction?: ReactNode
  onBack?: () => void
}

export default function PageHeader({ title, rightAction, onBack }: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex h-14 items-center border-b border-gray-200 bg-white px-4">
      <button
        type="button"
        onClick={handleBack}
        className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-gray-100"
        aria-label="返回"
      >
        <svg
          className="h-5 w-5 text-gray-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate">
        {title}
      </h1>

      <div className="flex h-10 w-10 items-center justify-center">
        {rightAction ?? null}
      </div>
    </header>
  )
}
