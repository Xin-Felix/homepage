import type { PublicHome } from '#server/types/site'
import { backendJson } from '#server/utils/backend'
import { sendOgImage } from '#server/utils/og'

export default defineEventHandler(event => sendOgImage(event, 'home', async () => {
  const home = await backendJson<PublicHome>(event, '/api/public/home')
  return {
    title: home.profile.siteTitle,
    description: home.profile.description,
    kicker: 'HUANGXIN.WORK · PORTFOLIO',
  }
}))
