import { CATEGORIES } from '../../constants/categories'

interface CategoryPickerProps {
  value: string | undefined
  onChange: (cat: string) => void
}

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-500">分类</label>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-colors ${
              value === cat.id
                ? 'bg-blue-50 ring-2 ring-blue-500'
                : 'bg-gray-50 active:bg-gray-100'
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span
              className={`text-xs ${
                value === cat.id ? 'font-medium text-blue-600' : 'text-gray-600'
              }`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
