export interface Category {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', icon: '🍜' },
  { id: 'transport', name: '交通', icon: '🚗' },
  { id: 'accommodation', name: '住宿', icon: '🏨' },
  { id: 'shopping', name: '购物', icon: '🛍️' },
  { id: 'attraction', name: '景点', icon: '🎫' },
  { id: 'entertainment', name: '娱乐', icon: '🎮' },
  { id: 'other', name: '其他', icon: '📦' },
]
