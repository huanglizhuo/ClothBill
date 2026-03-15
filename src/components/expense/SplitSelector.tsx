import type { Member, ExpenseSplit } from '../../types'
import MemberChip from '../shared/MemberChip'

interface SplitSelectorProps {
  members: Member[]
  splits: ExpenseSplit[]
  splitType: 'equal' | 'exact' | 'percentage'
  totalAmount: number
  onSplitsChange: (splits: ExpenseSplit[]) => void
  onSplitTypeChange: (type: 'equal' | 'exact' | 'percentage') => void
}

const SPLIT_TABS: { type: 'equal' | 'exact' | 'percentage'; label: string }[] = [
  { type: 'equal', label: '均分' },
  { type: 'exact', label: '精确' },
  { type: 'percentage', label: '百分比' },
]

export default function SplitSelector({
  members,
  splits,
  splitType,
  totalAmount,
  onSplitsChange,
  onSplitTypeChange,
}: SplitSelectorProps) {
  const selectedIds = new Set(splits.map((s) => s.memberId))

  const toggleMember = (memberId: string) => {
    if (selectedIds.has(memberId)) {
      if (selectedIds.size <= 1) return // keep at least one
      onSplitsChange(splits.filter((s) => s.memberId !== memberId))
    } else {
      onSplitsChange([...splits, { memberId }])
    }
  }

  const updateSplitAmount = (memberId: string, amount: string) => {
    onSplitsChange(
      splits.map((s) =>
        s.memberId === memberId ? { ...s, shareAmount: amount === '' ? undefined : Number(amount) } : s,
      ),
    )
  }

  const updateSplitPercentage = (memberId: string, pct: string) => {
    onSplitsChange(
      splits.map((s) =>
        s.memberId === memberId ? { ...s, sharePercentage: pct === '' ? undefined : Number(pct) } : s,
      ),
    )
  }

  const getMemberName = (memberId: string) => members.find((m) => m.id === memberId)?.name ?? '未知'

  // Validation
  const selectedCount = splits.length
  const equalShare = selectedCount > 0 ? totalAmount / selectedCount : 0

  const exactSum = splits.reduce((sum, s) => sum + (s.shareAmount ?? 0), 0)
  const percentageSum = splits.reduce((sum, s) => sum + (s.sharePercentage ?? 0), 0)

  const showExactWarning = splitType === 'exact' && totalAmount > 0 && Math.abs(exactSum - totalAmount) > 0.01
  const showPercentageWarning = splitType === 'percentage' && Math.abs(percentageSum - 100) > 0.01

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-500">分摊方式</label>

      {/* Split type tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        {SPLIT_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => onSplitTypeChange(tab.type)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              splitType === tab.type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 active:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Member chips - multi-select */}
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <MemberChip
            key={member.id}
            member={member}
            selected={selectedIds.has(member.id)}
            onClick={() => toggleMember(member.id)}
          />
        ))}
      </div>

      {/* Split details */}
      {splitType === 'equal' && selectedCount > 0 && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          每人分摊: <span className="font-medium text-gray-900">{equalShare.toFixed(2)}</span>
        </div>
      )}

      {splitType === 'exact' && (
        <div className="space-y-2">
          {splits.map((split) => (
            <div key={split.memberId} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
              <span className="min-w-[3rem] text-sm font-medium text-gray-700 truncate">
                {getMemberName(split.memberId)}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={split.shareAmount ?? ''}
                onChange={(e) => updateSplitAmount(split.memberId, e.target.value)}
                className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-right text-sm text-gray-900 outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          ))}
          {showExactWarning && (
            <p className="text-xs text-red-500">
              金额总和 {exactSum.toFixed(2)} 与总金额 {totalAmount.toFixed(2)} 不一致
            </p>
          )}
        </div>
      )}

      {splitType === 'percentage' && (
        <div className="space-y-2">
          {splits.map((split) => (
            <div key={split.memberId} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
              <span className="min-w-[3rem] text-sm font-medium text-gray-700 truncate">
                {getMemberName(split.memberId)}
              </span>
              <div className="flex flex-1 items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={split.sharePercentage ?? ''}
                  onChange={(e) => updateSplitPercentage(split.memberId, e.target.value)}
                  className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-right text-sm text-gray-900 outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
          ))}
          {showPercentageWarning && (
            <p className="text-xs text-red-500">
              百分比总和为 {percentageSum.toFixed(1)}%，应为 100%
            </p>
          )}
        </div>
      )}
    </div>
  )
}
