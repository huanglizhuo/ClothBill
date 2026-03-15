import { formatAmount } from '../../lib/currency'
import type { Member } from '../../types'

interface BalanceMatrixProps {
  balances: Map<string, number>
  members: Member[]
  currency: string
}

export default function BalanceMatrix({ balances, members, currency }: BalanceMatrixProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]))

  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from(balances.entries()).map(([memberId, amount]) => {
        const member = memberMap.get(memberId)
        if (!member) return null

        const isPositive = amount > 0
        const isNegative = amount < 0
        const isZero = amount === 0

        return (
          <div
            key={memberId}
            className={`rounded-xl border p-3 ${
              isPositive
                ? 'border-green-200 bg-green-50'
                : isNegative
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-white">
                  {member.name.charAt(0)}
                </div>
              )}
              <span className="truncate text-sm font-medium text-gray-900">
                {member.name}
              </span>
            </div>

            <p
              className={`text-sm font-semibold ${
                isPositive
                  ? 'text-green-600'
                  : isNegative
                    ? 'text-red-600'
                    : 'text-gray-500'
              }`}
            >
              {isPositive
                ? `被欠 ${formatAmount(amount, currency)}`
                : isNegative
                  ? `欠 ${formatAmount(Math.abs(amount), currency)}`
                  : '已结清'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
