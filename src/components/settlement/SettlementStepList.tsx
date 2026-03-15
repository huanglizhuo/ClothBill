import { formatAmount } from '../../lib/currency'
import type { SettlementTransfer, Member } from '../../types'

interface SettlementStepListProps {
  transfers: SettlementTransfer[]
  members: Member[]
  currency: string
}

export default function SettlementStepList({ transfers, members, currency }: SettlementStepListProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]))

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-base font-medium text-gray-700">所有人已结清!</p>
      </div>
    )
  }

  function renderAvatar(member: Member | undefined) {
    if (!member) return null

    if (member.avatar) {
      return (
        <img
          src={member.avatar}
          alt={member.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      )
    }

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-white">
        {member.name.charAt(0)}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {transfers.map((transfer, index) => {
        const payer = memberMap.get(transfer.from)
        const payee = memberMap.get(transfer.to)

        return (
          <li
            key={index}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
          >
            {/* Payer */}
            <div className="flex flex-col items-center gap-1">
              {renderAvatar(payer)}
              <span className="max-w-[4rem] truncate text-xs text-gray-600">
                {payer?.name ?? '未知'}
              </span>
            </div>

            {/* Arrow + Amount */}
            <div className="flex flex-1 flex-col items-center gap-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {formatAmount(transfer.amount, currency)}
              </span>
              <div className="flex items-center text-gray-400">
                <span className="text-xs">付给</span>
                <svg
                  className="ml-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Payee */}
            <div className="flex flex-col items-center gap-1">
              {renderAvatar(payee)}
              <span className="max-w-[4rem] truncate text-xs text-gray-600">
                {payee?.name ?? '未知'}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
