import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useSettlement } from '../hooks/useSettlement'
import { useCurrency } from '../hooks/useCurrency'
import { useLockToggle } from '../hooks/useLockToggle'
import PageHeader from '../components/layout/PageHeader'
import BottomNav from '../components/layout/BottomNav'
import BalanceMatrix from '../components/settlement/BalanceMatrix'
import SettlementStepList from '../components/settlement/SettlementStepList'
import CurrencyPicker from '../components/shared/CurrencyPicker'
import EmptyState from '../components/shared/EmptyState'
import { formatAmount } from '../lib/currency'

export default function SettlementPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { members, expenses } = useTrip(tripId)
  const { balances, transfers, settlementCurrency } = useSettlement()
  const { stale } = useCurrency()
  const { lockIcon, passwordModal } = useLockToggle(tripId)
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null)

  const currency = displayCurrency ?? settlementCurrency

  const handleShare = async () => {
    const lines = ['结算方案:']
    transfers.forEach((t) => {
      const fromMember = members.find((m) => m.id === t.from)
      const toMember = members.find((m) => m.id === t.to)
      if (fromMember && toMember) {
        lines.push(`${fromMember.name} -> ${toMember.name}: ${formatAmount(t.amount, currency)}`)
      }
    })
    const text = lines.join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: '旅行结算', text })
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="结算" rightAction={lockIcon} />
        <div className="pt-14 px-4 py-12">
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

      <div className="pt-14 px-4 space-y-6 py-6">
        {stale && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
            汇率数据已超过24小时，结算金额可能不准确
          </div>
        )}

        {/* Balance section */}
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-3">余额</h3>
          <BalanceMatrix balances={balances} members={members} currency={currency} />
        </section>

        {/* Settlement steps */}
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-3">最优转账方案</h3>
          <SettlementStepList transfers={transfers} members={members} currency={currency} />
        </section>

        {/* Currency switcher */}
        <section>
          <h3 className="text-sm font-medium text-gray-500 mb-2">结算货币</h3>
          <CurrencyPicker value={currency} onChange={setDisplayCurrency} inline />
        </section>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          分享结算结果
        </button>
      </div>

      <BottomNav tripId={tripId!} />
      {passwordModal}
    </div>
  )
}
