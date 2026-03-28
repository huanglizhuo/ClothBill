import { useState } from 'react'
import { formatAmount, convertAmount } from '../../lib/currency'
import type { SettlementTransfer, Expense, Member, ExchangeRates } from '../../types'

interface OverallSettlementProps {
  balances: Map<string, number>
  directTransfers: SettlementTransfer[]
  simplifiedTransfers: SettlementTransfer[]
  perCurrencySettlements: Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }>
  members: Member[]
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
  dateRange?: { from: string; to: string } | null
}

export default function OverallSettlement({
  balances,
  directTransfers,
  simplifiedTransfers,
  perCurrencySettlements,
  members,
  settlementCurrency,
  exchangeRates,
  dateRange,
}: OverallSettlementProps) {
  const [simplified, setSimplified] = useState(false)
  const activeTransfers = simplified ? simplifiedTransfers : directTransfers
  const cur = settlementCurrency

  // No transfers needed
  if (directTransfers.length === 0 && simplifiedTransfers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{cur} 总结算</h4>
        <p className="text-sm text-gray-400">所有账目已结清</p>
      </div>
    )
  }

  const memberMap = new Map(members.map((m) => [m.id, m]))

  return (
    <div className="rounded-xl border border-primary-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="text-sm font-semibold text-primary-700">{cur} 总结算</h4>
        <button
          type="button"
          onClick={() => setSimplified(!simplified)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${simplified
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-primary-600 border-primary-400 active:bg-primary-50'
            }`}
        >
          {simplified ? '收起详情 ▲' : '查看计算详情 ▼'}
        </button>
      </div>

      {/* Simplified explanation */}
      {simplified && (
        <OverallExplanation
          balances={balances}
          directTransfers={directTransfers}
          simplifiedTransfers={simplifiedTransfers}
          perCurrencySettlements={perCurrencySettlements}
          members={members}
          memberMap={memberMap}
          settlementCurrency={cur}
          exchangeRates={exchangeRates}
        />
      )}

      {/* Transfer list */}
      <div className="divide-y divide-gray-100">
        {activeTransfers.map((transfer, index) => (
          <OverallTransferRow
            key={index}
            transfer={transfer}
            perCurrencySettlements={perCurrencySettlements}
            memberMap={memberMap}
            settlementCurrency={cur}
            exchangeRates={exchangeRates}
          />
        ))}
      </div>

      {/* Date range footer */}
      {dateRange && (
        <div className="border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">
          基于 {dateRange.from} ~ {dateRange.to} 期间平均汇率
        </div>
      )}
    </div>
  )
}

/* ---- Explanation ---- */

function OverallExplanation({
  balances,
  directTransfers,
  simplifiedTransfers,
  perCurrencySettlements,
  members,
  memberMap,
  settlementCurrency,
  exchangeRates,
}: {
  balances: Map<string, number>
  directTransfers: SettlementTransfer[]
  simplifiedTransfers: SettlementTransfer[]
  perCurrencySettlements: Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }>
  members: Member[]
  memberMap: Map<string, Member>
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
}) {
  const currencies = Array.from(perCurrencySettlements.keys())

  return (
    <div className="mx-4 mb-3 space-y-3">
      {/* Step 1: Per-currency balance calculation */}
      {currencies.map((cur) => {
        const data = perCurrencySettlements.get(cur)!
        const rate = cur !== settlementCurrency && exchangeRates
          ? convertAmount(1, cur, settlementCurrency, exchangeRates)
          : null
        return (
          <div key={cur} className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {cur} 各成员净余额
              {rate != null && (
                <span className="font-normal text-gray-400 ml-1">
                  (1 {cur} = {rate.toFixed(4)} {settlementCurrency})
                </span>
              )}
            </p>
            <div className="space-y-1">
              {members.map((m) => {
                const balance = data.balances.get(m.id) ?? 0
                if (Math.abs(balance) < 0.01) return null
                const paid = data.expenses.filter((e) => e.paidBy === m.id).reduce((s, e) => s + e.amount, 0)
                const shared = data.expenses.reduce((s, e) => {
                  const split = e.splits.find((sp) => sp.memberId === m.id)
                  if (!split) return s
                  if (e.splitType === 'equal') return s + e.amount / e.splits.length
                  if (e.splitType === 'exact') return s + (split.shareAmount ?? 0)
                  if (e.splitType === 'percentage') return s + ((split.sharePercentage ?? 0) / 100) * e.amount
                  return s
                }, 0)
                return (
                  <div key={m.id} className="text-xs text-gray-600">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-gray-400">
                      {' '}已付 {formatAmount(paid, cur)} - 应摊 {formatAmount(shared, cur)} ={' '}
                    </span>
                    <span className={`font-semibold ${balance > 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                      {balance > 0 ? '+' : ''}{formatAmount(balance, cur)}
                    </span>
                    {rate != null && (
                      <span className="text-primary-600 ml-1">
                        → {formatAmount(balance * rate, settlementCurrency)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Per-currency simplified transfers */}
            {data.transfers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">{cur} 简化转账（{data.transfers.length} 笔）</p>
                {data.transfers.map((t, i) => (
                  <p key={i} className="text-[10px] text-gray-500">
                    {memberMap.get(t.from)?.name} → {memberMap.get(t.to)?.name}: {formatAmount(t.amount, cur)}
                    {rate != null && (
                      <span className="text-primary-500"> → {formatAmount(t.amount * rate, settlementCurrency)}</span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Step 2: Aggregated balances in settlement currency */}
      <div className="rounded-lg bg-blue-50 p-3">
        <p className="text-xs font-semibold text-blue-700 mb-2">汇总至 {settlementCurrency}：每人净余额</p>
        <div className="space-y-1">
          {members.map((m) => {
            const totalBalance = balances.get(m.id) ?? 0
            if (Math.abs(totalBalance) < 0.01) return null
            // Show per-currency contributions
            const parts: { cur: string; original: number; converted: number }[] = []
            for (const cur of currencies) {
              const b = perCurrencySettlements.get(cur)?.balances.get(m.id) ?? 0
              if (Math.abs(b) < 0.01) continue
              const converted = cur === settlementCurrency || !exchangeRates
                ? b
                : convertAmount(b, cur, settlementCurrency, exchangeRates)
              parts.push({ cur, original: b, converted })
            }
            return (
              <div key={m.id} className="text-xs text-gray-600">
                <span className="font-medium">{m.name}</span>
                {parts.length > 1 && (
                  <span className="text-gray-400">
                    {' '}({parts.map((p, i) => (
                      <span key={p.cur}>
                        {i > 0 && ' + '}
                        {p.cur !== settlementCurrency
                          ? `${formatAmount(p.converted, settlementCurrency)}`
                          : formatAmount(p.original, p.cur)}
                      </span>
                    ))})
                  </span>
                )}
                <span className="text-gray-400"> = </span>
                <span className={`font-semibold ${totalBalance > 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalBalance > 0 ? '+' : ''}{formatAmount(totalBalance, settlementCurrency)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 3: Direct transfers (cross-currency) */}
      <div className="rounded-lg bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">跨币种直接债务（{directTransfers.length} 笔转账）</p>
        <div className="space-y-0.5">
          {directTransfers.map((t, i) => (
            <p key={i} className="text-xs text-gray-600">
              {memberMap.get(t.from)?.name} → {memberMap.get(t.to)?.name}: {formatAmount(t.amount, settlementCurrency)}
            </p>
          ))}
        </div>
      </div>

      {/* Step 4: Simplified */}
      <div className="rounded-lg bg-green-50 p-3">
        <p className="text-xs font-semibold text-green-700 mb-2">债务简化后（{simplifiedTransfers.length} 笔转账）</p>
        <div className="space-y-0.5">
          {simplifiedTransfers.map((t, i) => (
            <p key={i} className="text-xs text-gray-600">
              {memberMap.get(t.from)?.name} → {memberMap.get(t.to)?.name}: {formatAmount(t.amount, settlementCurrency)}
            </p>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-gray-400">
          * 通过合并跨币种债务关系减少转账笔数，每人收付净额不变
        </p>
      </div>
    </div>
  )
}

/* ---- Transfer Row ---- */

function OverallTransferRow({
  transfer,
  perCurrencySettlements,
  memberMap,
  settlementCurrency,
  exchangeRates,
}: {
  transfer: SettlementTransfer
  perCurrencySettlements: Map<string, { balances: Map<string, number>; transfers: SettlementTransfer[]; expenses: Expense[] }>
  memberMap: Map<string, Member>
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
}) {
  const [expanded, setExpanded] = useState(false)
  const payer = memberMap.get(transfer.from)
  const payee = memberMap.get(transfer.to)

  // Collect per-currency breakdown for this pair
  const currencyDetails: { currency: string; amount: number; converted: number }[] = []
  for (const [currency, { balances }] of perCurrencySettlements) {
    const fromBalance = balances.get(transfer.from) ?? 0
    const toBalance = balances.get(transfer.to) ?? 0
    // from owes to in this currency if from has negative balance and to has positive
    if (fromBalance < -0.01 && toBalance > 0.01) {
      // Proportional share: how much of from's debt goes to to
      // This is an approximation based on balances
      const totalCreditors = Array.from(balances.values()).filter((v) => v > 0.01).reduce((s, v) => s + v, 0)
      const share = totalCreditors > 0 ? (toBalance / totalCreditors) * (-fromBalance) : 0
      const rounded = Math.round(share * 100) / 100
      if (rounded > 0.01) {
        const converted = currency === settlementCurrency || !exchangeRates
          ? rounded
          : Math.round(convertAmount(rounded, currency, settlementCurrency, exchangeRates) * 100) / 100
        currencyDetails.push({ currency, amount: rounded, converted })
      }
    }
  }

  return (
    <div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900">{payer?.name ?? '未知'}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900">{payee?.name ?? '未知'}</span>
          </div>
          <span className="font-semibold text-primary-700">
            {formatAmount(transfer.amount, settlementCurrency)}
          </span>
        </div>
      </div>

      {/* Expandable currency breakdown */}
      {currencyDetails.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-1 border-t border-gray-50 py-2 text-xs text-gray-400 active:bg-gray-50"
          >
            <span>{expanded ? '收起明细' : '查看币种明细'}</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="space-y-1 px-4 pb-3">
              {currencyDetails.map((d) => (
                <div key={d.currency} className="flex items-center justify-between text-xs text-gray-600">
                  <span>{d.currency} 部分</span>
                  <span>
                    {d.currency !== settlementCurrency ? (
                      <>
                        {formatAmount(d.amount, d.currency)}
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="text-primary-600">{formatAmount(d.converted, settlementCurrency)}</span>
                      </>
                    ) : (
                      formatAmount(d.amount, d.currency)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
