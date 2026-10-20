import { createError, getRequestHeader, setResponseStatus } from 'h3'

import { backendJson, getErrorReason, getErrorStatus, readPreviewJson } from '#server/utils/backend'
import { renderMarkdown } from '#server/utils/markdown'

export default defineEventHandler(async (event) => {
  try {
    const body = await readPreviewJson(event)
    const authorization = getRequestHeader(event, 'authorization') || ''
    if (!/^Bearer\s+\S+$/i.test(authorization)) {
      throw createError({
        statusCode: 401,
        message: '未登录或登录已过期',
        data: { status: 'error', reason: '未登录或登录已过期' },
      })
    }

    // 不自行解析 token；由 Spring 的统一管理员认证端点判定其有效性。
    await backendJson<void>(event, '/api/admin/me')
    return {
      status: 'success',
      data: { html: renderMarkdown(body.markdown) },
    }
  } catch (error) {
    const statusCode = getErrorStatus(error, 500)
    setResponseStatus(event, statusCode)
    return {
      status: 'error',
      reason: getErrorReason(
        error,
        statusCode >= 500 ? '服务暂时不可用，请稍后再试。' : '未登录或登录已过期',
      ),
    }
  }
})
