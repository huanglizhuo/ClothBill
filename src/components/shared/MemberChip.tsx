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
  const avatarSize = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  const nameSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const ringClass = selected
    ? 'ring-2 ring-primary-600 border-primary-600'
    : 'border-gray-200'

  const avatarContent = member.avatar || member.name.charAt(0)
  const isEmoji = member.avatar != null && member.avatar !== ''

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[48px] min-h-[48px] flex-col items-center justify-center gap-1 p-1 rounded-lg active:bg-gray-50"
    >
      <div
        className={`${avatarSize} ${ringClass} flex items-center justify-center rounded-full border bg-gray-100 ${
          isEmoji ? '' : 'font-medium text-gray-600'
        }`}
      >
        {avatarContent}
      </div>
      <span
        className={`${nameSize} max-w-[56px] truncate ${
          selected ? 'font-medium text-primary-600' : 'text-gray-600'
        }`}
      >
        {member.name}
      </span>
    </button>
  )
}
