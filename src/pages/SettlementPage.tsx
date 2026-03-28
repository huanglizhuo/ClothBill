import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useSettlement } from '../hooks/useSettlement'
import { useCurrency } from '../hooks/useCurrency'
import { useHistoricalRates } from '../hooks/useHistoricalRates'
import { useLockToggle } from '../hooks/useLockToggle'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import PerCurrencyBreakdown from '../components/settlement/PerCurrencyBreakdown'
import OverallSettlement from '../components/settlement/OverallSettlement'
import EmptyState from '../components/shared/EmptyState'

export default function SettlementPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { members, expenses } = useTrip(tripId)
  const { perCurrencySettlements, settlementCurrency, balances, overallSimplifiedTransfers, overallDirectTransfers } = useSettlement()
  const { exchangeRates } = useCurrency()
  const { averageRates, dateRange, isLoading: ratesLoading, errorType } = useHistoricalRates(expenses, settlementCurrency)
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  // Prefer average rates; fall back to live rates
  const effectiveRates = averageRates ?? exchangeRates

  if (expenses.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="结算" rightAction={lockIcon} />
        <div className="px-4 py-12">
          <EmptyState icon="📊" title="暂无账单记录" description="添加账单后即可查看结算" />
        </div>
        <BottomNav tripId={tripId!} />
        {passwordModal}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="结算" rightAction={lockIcon} />

      <div className="px-4 space-y-6 py-6">
        {ratesLoading && dateRange && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
            正在获取 {dateRange.from} ~ {dateRange.to} 期间的历史汇率...
          </div>
        )}
        {errorType === 'rate_limit' && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
            历史汇率请求次数已达上限，使用实时汇率替代
          </div>
        )}
        {errorType === 'api_error' && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
            历史汇率获取失败，使用实时汇率替代
          </div>
        )}

        {/* Overall settlement: only show for multi-currency with rates available */}
        {perCurrencySettlements.size > 1 && effectiveRates != null && (
          <OverallSettlement
            balances={balances}
            directTransfers={overallDirectTransfers}
            simplifiedTransfers={overallSimplifiedTransfers}
            perCurrencySettlements={perCurrencySettlements}
            members={members}
            settlementCurrency={settlementCurrency}
            exchangeRates={effectiveRates}
            dateRange={dateRange}
          />
        )}

        <PerCurrencyBreakdown
          perCurrencySettlements={perCurrencySettlements}
          members={members}
          settlementCurrency={settlementCurrency}
          exchangeRates={effectiveRates}
          dateRange={dateRange}
          tripId={tripId!}
        />
      </div>

      <BottomNav tripId={tripId!} />
      {passwordModal}
    </div>
  )
}
