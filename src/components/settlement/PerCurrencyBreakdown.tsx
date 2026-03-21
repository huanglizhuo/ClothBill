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

  return (
    <div className="space-y-4">
      {Array.from(perCurrencySettlements.entries()).map(([currency, { transfers, expenses }]) => {
        if (transfers.length === 0) return null

        const isSameCurrency = currency === settlementCurrency
        const showConversion = !isSameCurrency && !!exchangeRates

        return (
          <div key={currency} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <h4 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-700">{currency} 消费结算</h4>
            <div className="divide-y divide-gray-100">
              {transfers.map((transfer, index) => (
                <TransferRow
                  key={index}
                  transfer={transfer}
                  currency={currency}
                  expenses={expenses}
                  members={members}
                  settlementCurrency={settlementCurrency}
                  exchangeRates={exchangeRates}
                  showConversion={showConversion}
                  tripId={tripId}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TransferRow({
  transfer,
  currency,
  expenses,
  members,
  settlementCurrency,
  exchangeRates,
  showConversion,
  tripId,
}: {
  transfer: SettlementTransfer
  currency: string
  expenses: Expense[]
  members: Member[]
  settlementCurrency: string
  exchangeRates: ExchangeRates | null
  showConversion: boolean
  tripId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const memberMap = new Map(members.map((m) => [m.id, m]))
  const payer = memberMap.get(transfer.from)
  const payee = memberMap.get(transfer.to)

  const details = collectExpenseDetails(transfer, expenses)

  const rate = showConversion && exchangeRates
    ? convertAmount(1, currency, settlementCurrency, exchangeRates)
    : null
  const convertedAmount = rate != null ? transfer.amount * rate : null

  return (
    <div>
      {/* Main row: original currency */}
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

        {/* Converted amount inline */}
        {convertedAmount != null && rate != null && (
          <div className="mt-1 flex items-center justify-between text-xs text-primary-600">
            <span>折合 {settlementCurrency}</span>
            <span className="font-semibold">{formatAmount(convertedAmount, settlementCurrency)}</span>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {(details.length > 0 || rate != null) && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-1 border-t border-gray-50 py-2 text-xs text-gray-400 active:bg-gray-50"
          >
            <span>{expanded ? '收起详情' : '查看详情'}</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="space-y-2 px-4 pb-3">
              {/* Exchange rate info */}
              {rate != null && (
                <div className="rounded-lg bg-primary-50 p-2.5 text-xs text-primary-700">
                  汇率: 1 {currency} = {rate.toFixed(4)} {settlementCurrency}
                </div>
              )}

              {/* Expense breakdown */}
              {details.map((d, i) => {
                const shareConverted = rate != null ? d.memberShare * rate : null
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 active:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/trip/${tripId}/expense/${d.expense.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-700">{d.expense.description}</p>
                      <span className="text-gray-400 ml-2 flex-shrink-0">{d.expense.date}</span>
                    </div>
                    <p className="mt-1">
                      {payee?.name} 支付: {formatAmount(d.expense.amount, currency)}
                    </p>
                    <p className="mt-0.5">
                      {payer?.name} 应分摊: {formatAmount(d.memberShare, currency)}
                    </p>
                    {shareConverted != null && rate != null && (
                      <p className="mt-0.5 text-primary-600">
                        {formatAmount(d.memberShare, currency)} × {rate.toFixed(4)} = {formatAmount(shareConverted, settlementCurrency)}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-end text-gray-400">
                      <span className="text-[10px]">查看消费</span>
                      <svg className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}

              {/* Conversion sum line */}
              {convertedAmount != null && rate != null && (
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-xs">
                  <span className="text-gray-500">
                    合计: {formatAmount(transfer.amount, currency)} × {rate.toFixed(4)}
                  </span>
                  <span className="font-bold text-primary-700">{formatAmount(convertedAmount, settlementCurrency)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ---- Helper ---- */

function collectExpenseDetails(transfer: SettlementTransfer, expenses: Expense[]) {
  return expenses
    .filter((e) => e.paidBy === transfer.to && e.splits.some((s) => s.memberId === transfer.from))
    .map((e) => {
      let memberShare = 0
      if (e.splitType === 'equal') {
        memberShare = e.amount / e.splits.length
      } else if (e.splitType === 'exact') {
        const split = e.splits.find((s) => s.memberId === transfer.from)
        memberShare = split?.shareAmount ?? 0
      } else if (e.splitType === 'percentage') {
        const split = e.splits.find((s) => s.memberId === transfer.from)
        memberShare = ((split?.sharePercentage ?? 0) / 100) * e.amount
      }
      return { expense: e, memberShare }
    })
    .filter((d) => d.memberShare > 0.01)
}
