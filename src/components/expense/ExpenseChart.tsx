import { formatAmount } from '../../lib/currency'

interface ChartItem {
  label: string
  amount: number
  currency: string
}

interface ExpenseChartProps {
  items: ChartItem[]
}

const BAR_COLORS = [
  'bg-pink-400',
  'bg-yellow-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-blue-400',
  'bg-purple-500',
  'bg-gray-400',
  'bg-rose-400',
  'bg-emerald-500',
  'bg-indigo-400',
]

export default function ExpenseChart({ items }: ExpenseChartProps) {
  if (items.length === 0) return null

  const maxAmount = Math.max(...items.map((d) => d.amount))

  return (
    <div className="flex flex-col items-center">
      {/* Bars area */}
      <div className="flex items-end justify-center gap-2 w-full" style={{ height: 200 }}>
        {items.map((item, i) => {
          const pct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
          const color = BAR_COLORS[i % BAR_COLORS.length]
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
              {/* Amount label above bar */}
              <span className="text-[10px] text-gray-500 mb-1 truncate w-full text-center">
                {formatAmount(item.amount, item.currency)}
              </span>
              {/* Bar */}
              <div
                className={`w-full max-w-12 rounded-t-md ${color} transition-all`}
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex w-full gap-2 mt-2 border-t border-gray-200 pt-2">
        {items.map((item, i) => (
          <div key={i} className="flex-1 min-w-0 text-center">
            <span className="text-[10px] text-gray-500 block truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
