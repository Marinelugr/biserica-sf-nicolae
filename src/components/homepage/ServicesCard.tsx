import PascalCard from '@/components/PascalCard'
import NextServiceWidget from '@/components/NextServiceWidget'
import FeedCard from '@/components/shell/FeedCard'

/**
 * Identitatea `slujbe`: Calendarul Pascal și numărătoarea până la următoarea
 * slujbă, într-un singur card cu chenar dublu (două carduri vecine cu același
 * accent ar fi încălcat regula „vecinii diferă").
 */
export default function ServicesCard({ kicker }: { kicker: string }) {
  return (
    <FeedCard kind="parohie" sec="slujbe" kicker={kicker}>
      <div className="slujbe-grid">
        <PascalCard />
        {/* nu se randează deloc când nu are ce afișa */}
        <NextServiceWidget />
      </div>
    </FeedCard>
  )
}
