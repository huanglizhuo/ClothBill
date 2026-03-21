import { useNavigate } from 'react-router-dom'
import type { Expense, Member } from '../../types'
import { CATEGORIES } from '../../constants/categories'
import { CURRENCIES } from '../../constants/currencies'
import { useTripStore } from '../../store/tripStore'

interface ExpenseItemProps {
  expense: Expense
  members: Member[]
  onDelete?: () => void
  editable?: boolean
}

export default function ExpenseItem({ expense, members, onDelete, editable }: ExpenseItemProps) {
  const navigate = useNavigate()
  const { trip } = useTripStore()

  const category = CATEGORIES.find((c) => c.id === expense.category)
  const currencyInfo = CURRENCIES.find((c) => c.code === expense.currency)
  const symbol = currencyInfo?.symbol ?? expense.currency
  const payer = members.find((m) => m.id === expense.paidBy)
  const splitDetail = expense.splits
    .map((s) => {
      const name = members.find((m) => m.id === s.memberId)?.name ?? '未知'
      let share: number
      if (expense.splitType === 'equal') {
        share = expense.amount / expense.splits.length
      } else if (expense.splitType === 'percentage') {
        share = ((s.sharePercentage ?? 0) / 100) * expense.amount
      } else {
        share = s.shareAmount ?? 0
      }
      return `${name} ${share.toFixed(currencyInfo?.decimals ?? 2)}`
    })
    .join(' / ')

  const handleClick = () => {
    if (trip) {
      navigate(`/bill/${trip.id}/expense/${expense.id}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 active:bg-gray-50 cursor-pointer"
    >
      {/* Category icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
        {category?.icon ?? '📦'}
      </div>

      {/* Description, date, payer */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {expense.description || '未命名'}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {expense.date.slice(0, 10)} · {payer?.name ?? '未知'} 付款 · {splitDetail}
        </p>
        {expense.category === 'accommodation' && (expense.checkIn || expense.checkOut) && (
          <p className="mt-0.5 text-xs text-blue-400">
            {expense.checkIn ? `入住 ${expense.checkIn}` : ''}
            {expense.checkIn && expense.checkOut ? ' → ' : ''}
            {expense.checkOut ? `退房 ${expense.checkOut}` : ''}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-900">
          {symbol}{expense.amount.toFixed(currencyInfo?.decimals ?? 2)}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{expense.currency}</p>
      </div>

      {/* Delete button */}
      {editable && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400 active:bg-red-50 active:text-red-600"
          aria-label="删除"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
