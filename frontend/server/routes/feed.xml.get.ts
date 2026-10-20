import { sendRssFeed } from '#server/utils/feed'

export default defineEventHandler(event => sendRssFeed(event))
