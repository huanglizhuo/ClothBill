import type { Member } from '../../types'
import MemberChip from '../shared/MemberChip'

interface PayerSelectorProps {
  members: Member[]
  selectedId: string
  onChange: (id: string) => void
}

export default function PayerSelector({ members, selectedId, onChange }: PayerSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-500">谁付的款</label>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {members.map((member) => (
          <MemberChip
            key={member.id}
            member={member}
            selected={member.id === selectedId}
            onClick={() => onChange(member.id)}
          />
        ))}
      </div>
    </div>
  )
}
