import type { Expense, Member, ExchangeRates, SettlementTransfer } from '../types'
import { convertAmount } from './currency'

/**
 * Calculate the net balance for every member.
 * Positive = is owed money (creditor), negative = owes money (debtor).
 * All amounts are converted to the settlement currency.
 */
export function calculateBalances(
  expenses: Expense[],
  members: Member[],
  rates: ExchangeRates,
  settlementCurrency: string
): Map<string, number> {
  const balances = new Map<string, number>()

  // Initialise all members to 0
  for (const m of members) {
    balances.set(m.id, 0)
  }

  for (const expense of expenses) {
    const amountInSettlement = convertAmount(
      expense.amount,
      expense.currency,
      settlementCurrency,
      rates
    )

    // The payer paid the full amount, so credit them
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) ?? 0) + amountInSettlement
    )

    // Determine each member's share
    const memberShares = resolveShares(expense, amountInSettlement)

    // Each member owes their share, so debit them
    for (const [memberId, share] of memberShares) {
      balances.set(memberId, (balances.get(memberId) ?? 0) - share)
    }
  }

  return balances
}

/**
 * Resolve the shares for a single expense (already converted to settlement currency).
 */
function resolveShares(
  expense: Expense,
  amountInSettlement: number
): Map<string, number> {
  const shares = new Map<string, number>()

  switch (expense.splitType) {
    case 'equal': {
      const count = expense.splits.length
      if (count === 0) break
      const each = amountInSettlement / count
      for (const s of expense.splits) {
        shares.set(s.memberId, each)
      }
      break
    }
    case 'exact': {
      // shareAmount is in the expense's original currency; scale proportionally
      const totalOriginal = expense.splits.reduce(
        (sum, s) => sum + (s.shareAmount ?? 0),
        0
      )
      if (totalOriginal === 0) break
      for (const s of expense.splits) {
        const ratio = (s.shareAmount ?? 0) / totalOriginal
        shares.set(s.memberId, ratio * amountInSettlement)
      }
      break
    }
    case 'percentage': {
      for (const s of expense.splits) {
        const pct = (s.sharePercentage ?? 0) / 100
        shares.set(s.memberId, pct * amountInSettlement)
      }
      break
    }
  }

  return shares
}

/**
 * Simplify debts using a greedy algorithm.
 * Sort creditors descending and debtors ascending (most negative first),
 * then pair them off until all balances are settled.
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
      debtors.push({ id, amount: -balance }) // store as positive
    }
  }

  // Sort creditors descending by amount, debtors descending by amount
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
