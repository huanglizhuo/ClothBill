import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatAmount, convertAmount } from '../../lib/currency'
import type { SettlementTransfer, Expense, Member, ExchangeRates } from '../../types'

interface PerCurrencyBreakdownProps {
  perCurrencySettlements: Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }>
  members: Member[]
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
  tripId: string
}

export default function PerCurrencyBreakdown({
  perCurrencySettlements,
  members,
  settlementCurrency,
  exchangeRates,
  tripId,
}: PerCurrencyBreakdownProps) {
  if (perCurrencySettlements.size === 0) return null

  const memberMap = new Map(members.map((m) => [m.id, m]))

  return (
    <div className="space-y-4">
      {Array.from(perCurrencySettlements.entries()).map(([currency, { balances, transfers, expenses }]) => {
        if (transfers.length === 0) return null
        return (
          <CurrencyCard
            key={currency}
            currency={currency}
            balances={balances}
            simplifiedTransfers={transfers}
            expenses={expenses}
            members={members}
            memberMap={memberMap}
            settlementCurrency={settlementCurrency}
            exchangeRates={exchangeRates}
            tripId={tripId}
          />
        )
      })}
    </div>
  )
}

/* ---- Currency Card ---- */

function CurrencyCard({
  currency,
  balances,
  simplifiedTransfers,
  expenses,
  members,
  memberMap,
  settlementCurrency,
  exchangeRates,
  tripId,
}: {
  currency: string
  balances: Map<string, number>
  simplifiedTransfers: SettlementTransfer[]
  expenses: Expense[]
  members: Member[]
  memberMap: Map<string, Member>
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
  tripId: string
}) {
  const [simplified, setSimplified] = useState(false)

  const isSameCurrency = currency === settlementCurrency
  const showConversion = !isSameCurrency && !!exchangeRates
  const rate = showConversion && exchangeRates
    ? convertAmount(1, currency, settlementCurrency, exchangeRates)
    : null

  // Calculate direct (non-simplified) transfers
  const directTransfers = calcAllDirectDebts(expenses, members)

  const activeTransfers = simplified ? simplifiedTransfers : directTransfers

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="text-sm font-semibold text-gray-700">{currency} 账单结算</h4>
        <button
          type="button"
          onClick={() => setSimplified(!simplified)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
            simplified
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-500 active:bg-gray-200'
          }`}
        >
          {simplified ? '已简化' : '债务简化'}
        </button>
      </div>

      {/* Simplified explanation */}
      {simplified && (
        <SimplifiedExplanation
          directTransfers={directTransfers}
          simplifiedTransfers={simplifiedTransfers}
          balances={balances}
          expenses={expenses}
          members={members}
          memberMap={memberMap}
          currency={currency}
        />
      )}

      <div className="divide-y divide-gray-100">
        {activeTransfers.map((transfer, index) => (
          <TransferRow
            key={index}
            transfer={transfer}
            currency={currency}
            expenses={expenses}
            memberMap={memberMap}
            settlementCurrency={settlementCurrency}
            rate={rate}
            tripId={tripId}
            simplified={simplified}
          />
        ))}
      </div>

      {/* Exchange rate footer */}
      {rate != null && (
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-primary-700 bg-primary-50/50">
          汇率: 1 {currency} = {rate.toFixed(4)} {settlementCurrency}
        </div>
      )}
    </div>
  )
}

/* ---- Simplified Explanation ---- */

function SimplifiedExplanation({
  directTransfers,
  simplifiedTransfers,
  balances,
  expenses,
  members,
  memberMap,
  currency,
}: {
  directTransfers: SettlementTransfer[]
  simplifiedTransfers: SettlementTransfer[]
  balances: Map<string, number>
  expenses: Expense[]
  members: Member[]
  memberMap: Map<string, Member>
  currency: string
}) {

  return (
    <div className="mx-4 mb-3 space-y-3">
      {/* Step 1: Member balances */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">第一步：每人净余额</p>
        <div className="space-y-1">
          {members.map((m) => {
            const balance = balances.get(m.id) ?? 0
            if (Math.abs(balance) < 0.01) return null
            const paid = expenses.filter((e) => e.paidBy === m.id).reduce((s, e) => s + e.amount, 0)
            const shared = expenses.reduce((s, e) => s + getShare(e, m.id), 0)
            return (
              <div key={m.id} className="text-xs text-gray-600">
                <span className="font-medium">{m.name}</span>
                <span className="text-gray-400"> 已付 {formatAmount(paid, currency)} - 应摊 {formatAmount(shared, currency)} = </span>
                <span className={`font-semibold ${balance > 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                  {balance > 0 ? '+' : ''}{formatAmount(balance, currency)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 2: Before vs After */}
      <div className="rounded-lg bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">第二步：简化前（{directTransfers.length} 笔转账）</p>
        <div className="space-y-0.5">
          {directTransfers.map((t, i) => (
            <p key={i} className="text-xs text-gray-600">
              {memberMap.get(t.from)?.name} → {memberMap.get(t.to)?.name}: {formatAmount(t.amount, currency)}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-green-50 p-3">
        <p className="text-xs font-semibold text-green-700 mb-2">第三步：简化后（{simplifiedTransfers.length} 笔转账）</p>
        <div className="space-y-0.5">
          {simplifiedTransfers.map((t, i) => (
            <p key={i} className="text-xs text-gray-600">
              {memberMap.get(t.from)?.name} → {memberMap.get(t.to)?.name}: {formatAmount(t.amount, currency)}
            </p>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-gray-400">
          * 通过合并债务关系减少转账笔数，每人收付净额不变
        </p>
      </div>
    </div>
  )
}

/* ---- Transfer Row ---- */

function TransferRow({
  transfer,
  currency,
  expenses,
  memberMap,
  settlementCurrency,
  rate,
  tripId,
  simplified,
}: {
  transfer: SettlementTransfer
  currency: string
  expenses: Expense[]
  memberMap: Map<string, Member>
  settlementCurrency: string
  rate: number | null
  tripId: string
  simplified: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const payer = memberMap.get(transfer.from)
  const payee = memberMap.get(transfer.to)
  const convertedAmount = rate != null ? transfer.amount * rate : null

  // Show expense details for this transfer pair
  const breakdown = collectPairBreakdown(transfer.from, transfer.to, expenses)
  const hasDetails = (breakdown.oweDetails.length + breakdown.offsetDetails.length) > 0

  return (
    <div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900">{payer?.name ?? '未知'}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900">{payee?.name ?? '未知'}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {formatAmount(transfer.amount, currency)}
          </span>
        </div>

        {convertedAmount != null && rate != null && (
          <div className="mt-1 flex items-center justify-between text-xs text-primary-600">
            <span>折合 {settlementCurrency}</span>
            <span className="font-semibold">{formatAmount(convertedAmount, settlementCurrency)}</span>
          </div>
        )}
      </div>

      {/* Expandable expense details */}
      {hasDetails && !simplified && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-1 border-t border-gray-50 py-2 text-xs text-gray-400 active:bg-gray-50"
          >
            <span>{expanded ? '收起明细' : '查看明细'}</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="space-y-2 px-4 pb-3">
              {/* Owe section: payee paid, payer shared */}
              {breakdown.oweDetails.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-red-400 mb-1">
                    {payee?.name} 付款，{payer?.name} 应分摊:
                  </p>
                  {breakdown.oweDetails.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-red-50/50 p-3 mb-1 text-xs text-gray-600 active:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/bill/${tripId}/expense/${d.expense.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-700">{d.expense.description}</p>
                        <span className="text-gray-400 ml-2 flex-shrink-0">{d.expense.date.slice(0, 10)}</span>
                      </div>
                      <p className="mt-1">
                        {payee?.name} 支付 {formatAmount(d.expense.amount, currency)}，{payer?.name} 分摊 {formatAmount(d.share, currency)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-medium text-red-600 px-1">
                    <span>小计（{payer?.name} 欠 {payee?.name}）</span>
                    <span>+{formatAmount(breakdown.totalOwe, currency)}</span>
                  </div>
                </div>
              )}

              {/* Offset section: payer paid, payee shared */}
              {breakdown.offsetDetails.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-green-500 mb-1">
                    {payer?.name} 付款，{payee?.name} 应分摊（抵消）:
                  </p>
                  {breakdown.offsetDetails.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-green-50/50 p-3 mb-1 text-xs text-gray-600 active:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/bill/${tripId}/expense/${d.expense.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-700">{d.expense.description}</p>
                        <span className="text-gray-400 ml-2 flex-shrink-0">{d.expense.date.slice(0, 10)}</span>
                      </div>
                      <p className="mt-1">
                        {payer?.name} 支付 {formatAmount(d.expense.amount, currency)}，{payee?.name} 分摊 {formatAmount(d.share, currency)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-medium text-green-600 px-1">
                    <span>小计（{payee?.name} 欠 {payer?.name}，抵消）</span>
                    <span>-{formatAmount(breakdown.totalOffset, currency)}</span>
                  </div>
                </div>
              )}

              {/* Net calculation */}
              {breakdown.offsetDetails.length > 0 && (
                <div className="border-t border-gray-200 pt-2 px-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>净额 = {formatAmount(breakdown.totalOwe, currency)} - {formatAmount(breakdown.totalOffset, currency)}</span>
                    <span>{formatAmount(breakdown.net, currency)}</span>
                  </div>
                </div>
              )}

              {rate != null && (
                <div className="px-1">
                  <div className="flex justify-between text-xs text-primary-600">
                    <span>折合 {settlementCurrency}</span>
                    <span className="font-semibold">{formatAmount(transfer.amount * rate, settlementCurrency)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ---- Helpers ---- */

function getShare(expense: Expense, memberId: string): number {
  const split = expense.splits.find((s) => s.memberId === memberId)
  if (!split) return 0
  if (expense.splitType === 'equal') return expense.amount / expense.splits.length
  if (expense.splitType === 'exact') return split.shareAmount ?? 0
  if (expense.splitType === 'percentage') return ((split.sharePercentage ?? 0) / 100) * expense.amount
  return 0
}

/** Calculate all pairwise direct debts across all members */
function calcAllDirectDebts(
  expenses: Expense[],
  members: Member[],
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = []

  for (const from of members) {
    for (const to of members) {
      if (from.id === to.id) continue
      let net = 0
      for (const e of expenses) {
        if (e.paidBy === to.id) net += getShare(e, from.id)
        if (e.paidBy === from.id) net -= getShare(e, to.id)
      }
      if (net > 0.01) {
        transfers.push({
          from: from.id,
          to: to.id,
          amount: Math.round(net * 100) / 100,
        })
      }
    }
  }

  return transfers
}

interface PairDetail {
  expense: Expense
  share: number
  /** 'owe' = toId paid, fromId shared (fromId owes toId)
   *  'offset' = fromId paid, toId shared (toId owes fromId, reduces net) */
  direction: 'owe' | 'offset'
}

interface PairBreakdown {
  oweDetails: PairDetail[]
  offsetDetails: PairDetail[]
  totalOwe: number
  totalOffset: number
  net: number
}

/** Collect expense details between a specific pair (from owes to) with both directions */
function collectPairBreakdown(
  fromId: string,
  toId: string,
  expenses: Expense[],
): PairBreakdown {
  const oweDetails: PairDetail[] = []
  const offsetDetails: PairDetail[] = []
  let totalOwe = 0
  let totalOffset = 0

  for (const e of expenses) {
    // toId paid, fromId shared → fromId owes toId
    if (e.paidBy === toId) {
      const share = getShare(e, fromId)
      if (share > 0.01) {
        oweDetails.push({ expense: e, share, direction: 'owe' })
        totalOwe += share
      }
    }
    // fromId paid, toId shared → toId owes fromId (offset)
    if (e.paidBy === fromId) {
      const share = getShare(e, toId)
      if (share > 0.01) {
        offsetDetails.push({ expense: e, share, direction: 'offset' })
        totalOffset += share
      }
    }
  }

  return {
    oweDetails,
    offsetDetails,
    totalOwe: Math.round(totalOwe * 100) / 100,
    totalOffset: Math.round(totalOffset * 100) / 100,
    net: Math.round((totalOwe - totalOffset) * 100) / 100,
  }
}
