import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useSettlement } from '../hooks/useSettlement'
import { useCurrency } from '../hooks/useCurrency'
import { useLockToggle } from '../hooks/useLockToggle'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import PerCurrencyBreakdown from '../components/settlement/PerCurrencyBreakdown'
import EmptyState from '../components/shared/EmptyState'

export default function SettlementPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { members, expenses } = useTrip(tripId)
  const { perCurrencySettlements, settlementCurrency } = useSettlement()
  const { exchangeRates, stale } = useCurrency()
  const { lockIcon, passwordModal } = useLockToggle(tripId)

  if (expenses.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="结算" rightAction={lockIcon} />
        <div className="px-4 py-12">
          <EmptyState icon="📊" title="暂无消费记录" description="添加消费后即可查看结算" />
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
        {stale && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
            汇率数据已超过24小时，结算金额可能不准确
          </div>
        )}

        <PerCurrencyBreakdown
          perCurrencySettlements={perCurrencySettlements}
          members={members}
          settlementCurrency={settlementCurrency}
          exchangeRates={exchangeRates}
          tripId={tripId!}
        />
      </div>

      <BottomNav tripId={tripId!} />
      {passwordModal}
    </div>
  )
}
