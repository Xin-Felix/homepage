import { sendOgImage } from '#server/utils/og'

export default defineEventHandler(event => sendOgImage(event, 'ai', () => ({
  title: 'AI Lab',
  description: 'AI、Agent、RAG、MCP 与模型工程实验',
  kicker: 'HUANGXIN.WORK · AI LAB',
})))
