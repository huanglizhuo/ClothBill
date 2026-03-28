import type { Expense, Member, SettlementTransfer } from '../types'

/**
 * Resolve the shares for a single expense in its own currency.
 */
function resolveShares(
  expense: Expense,
  amount: number
): Map<string, number> {
  const shares = new Map<string, number>()

  switch (expense.splitType) {
    case 'equal': {
      const count = expense.splits.length
      if (count === 0) break
      const each = amount / count
      for (const s of expense.splits) {
        shares.set(s.memberId, each)
      }
      break
    }
    case 'exact': {
      const totalOriginal = expense.splits.reduce(
        (sum, s) => sum + (s.shareAmount ?? 0),
        0
      )
      if (totalOriginal === 0) break
      for (const s of expense.splits) {
        const ratio = (s.shareAmount ?? 0) / totalOriginal
        shares.set(s.memberId, ratio * amount)
      }
      break
    }
    case 'percentage': {
      for (const s of expense.splits) {
        const pct = (s.sharePercentage ?? 0) / 100
        shares.set(s.memberId, pct * amount)
      }
      break
    }
  }

  return shares
}

/**
 * Simplify debts using a greedy algorithm.
 */
export function simplifyDebts(
  balances: Map<string, number>
): SettlementTransfer[] {
  const EPSILON = 0.01

  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, balance] of balances) {
    if (balance > EPSILON) {
      creditors.push({ id, amount: balance })
    } else if (balance < -EPSILON) {
      debtors.push({ id, amount: -balance })
    }
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transfers: SettlementTransfer[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amount, debtors[di].amount)
    if (settle > EPSILON) {
      transfers.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: Math.round(settle * 100) / 100,
      })
    }
    creditors[ci].amount -= settle
    debtors[di].amount -= settle

    if (creditors[ci].amount < EPSILON) ci++
    if (debtors[di].amount < EPSILON) di++
  }

  return transfers
}

/**
 * Calculate per-currency balances and simplified transfers.
 * No conversion — amounts stay in original currency.
 */
export function calculatePerCurrencySettlements(
  expenses: Expense[],
  members: Member[]
): Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }> {
  const byCurrency = new Map<string, Expense[]>()
  for (const expense of expenses) {
    const list = byCurrency.get(expense.currency) ?? []
    list.push(expense)
    byCurrency.set(expense.currency, list)
  }

  const result = new Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }>()

  for (const [currency, currencyExpenses] of byCurrency) {
    const balances = new Map<string, number>()
    for (const m of members) {
      balances.set(m.id, 0)
    }

    for (const expense of currencyExpenses) {
      balances.set(
        expense.paidBy,
        (balances.get(expense.paidBy) ?? 0) + expense.amount
      )

      const shares = resolveShares(expense, expense.amount)
      for (const [memberId, share] of shares) {
        balances.set(memberId, (balances.get(memberId) ?? 0) - share)
      }
    }

    const transfers = simplifyDebts(balances)
    result.set(currency, { balances, transfers, expenses: currencyExpenses })
  }

  return result
}

/**
 * Calculate all pairwise direct debts from aggregated balances.
 * For each pair (A, B): if A's balance < 0 and B's balance > 0,
 * A owes B proportional to their respective imbalances.
 */
export function calcDirectDebtsFromBalances(
  balances: Map<string, number>
): SettlementTransfer[] {
  const EPSILON = 0.01
  const transfers: SettlementTransfer[] = []

  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, balance] of balances) {
    if (balance > EPSILON) creditors.push({ id, amount: balance })
    else if (balance < -EPSILON) debtors.push({ id, amount: -balance })
  }

  const totalDebt = debtors.reduce((s, d) => s + d.amount, 0)
  if (totalDebt < EPSILON) return transfers

  // Each debtor pays each creditor proportionally
  for (const debtor of debtors) {
    for (const creditor of creditors) {
      const amount = Math.round((debtor.amount * creditor.amount / totalDebt) * 100) / 100
      if (amount > EPSILON) {
        transfers.push({ from: debtor.id, to: creditor.id, amount })
      }
    }
  }

  return transfers
}
