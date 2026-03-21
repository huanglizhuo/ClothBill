import type { Member } from '../../types'

interface MemberChipProps {
  member: Member
  selected?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export default function MemberChip({
  member,
  selected = false,
  onClick,
  size = 'md',
}: MemberChipProps) {
  const textSize = size === 'sm' ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border ${textSize} font-medium transition-colors active:bg-gray-50 ${
        selected
          ? 'border-primary-600 bg-primary-50 text-primary-600 ring-1 ring-primary-600'
          : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      {member.name}
    </button>
  )
}
