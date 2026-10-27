import PascalCard from '@/components/PascalCard'
import FeedCard from '@/components/shell/FeedCard'

/** „Calendar Pascal" (identitatea `slujbe`: albastru, chenar dublu), cu selectorul de ani. */
export default function ServicesCard({ kicker }: { kicker: string }) {
  return (
    <FeedCard kind="parohie" sec="slujbe" kicker={kicker}>
      <PascalCard />
    </FeedCard>
  )
}
