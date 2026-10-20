import { sendOgImage } from '#server/utils/og'

export default defineEventHandler(event => sendOgImage(event, 'notes', () => ({
  title: '技术笔记',
  description: '系统设计、迁移实践、实时风控与稳定性治理',
  kicker: 'ENGINEERING NOTES',
})))
