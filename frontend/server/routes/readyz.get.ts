import { setResponseStatus } from 'h3'

import { getBackendOrigin } from '#server/utils/backend'

export default defineEventHandler(async (event) => {
  try {
    const response = await fetch(`${getBackendOrigin(event)}/internal/health`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (response.ok) return { status: 'UP' }
  } catch {
    // readiness 只暴露 UP/DOWN，不泄露内网错误。
  }
  setResponseStatus(event, 503)
  return { status: 'DOWN' }
})
