import { getAllPublicEventsAction } from '@/app/actions/athlete-interests'
import { getCurrentUser } from '@/app/actions/user'
import { PublicEventsClient } from '@/components/public-events-client'

export default async function HomePage() {
  const events = await getAllPublicEventsAction()
  const user = await getCurrentUser()

  return <PublicEventsClient events={events} user={user} />
}
