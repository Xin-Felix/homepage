<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { adminRequest } from '~/composables/useAdminApi'
import type {
  AdminAnalytics,
  AdminAnalyticsDays,
  AdminDashboardSummary,
  AdminRankItem,
} from '~/types/admin'

const props = defineProps<{
  days: AdminAnalyticsDays
}>()

const emit = defineEmits<{
  'update:days': [days: AdminAnalyticsDays]
}>()

const dashboard = ref<AdminDashboardSummary | null>(null)
const analytics = ref<AdminAnalytics | null>(null)
const loading = ref(true)
const errorMessage = ref('')
let loadSequence = 0

const trendMax = computed(() => Math.max(1, ...(analytics.value?.daily.map(point => point.uniqueVisitors) || [1])))
const hourMax = computed(() => Math.max(1, ...(analytics.value?.hourly.map(point => point.visitors) || [1])))

watch(() => props.days, load, { immediate: true })

async function load(): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  errorMessage.value = ''
  try {
    const [summary, report] = await Promise.all([
      adminRequest<AdminDashboardSummary>('GET', '/api/admin/dashboard'),
      adminRequest<AdminAnalytics>('GET', `/api/admin/analytics?days=${props.days}`),
    ])
    if (sequence !== loadSequence) return
    dashboard.value = summary
    analytics.value = report
  }
  catch (error) {
    if (sequence === loadSequence) errorMessage.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function changeRange(days: AdminAnalyticsDays): void {
  if (days !== props.days) emit('update:days', days)
}

function trendHeight(value: number): string {
  return `${Math.max(3, Math.round(value / trendMax.value * 100))}%`
}

function showTrendLabel(index: number): boolean {
  const length = analytics.value?.daily.length || 0
  return length <= 7 || index === 0 || index === length - 1 || index % 5 === 0
}

function hourOpacity(value: number): number {
  return value ? Math.max(0.18, value / hourMax.value) : 0.05
}

function rankWidth(items: AdminRankItem[], value: number): string {
  const max = Math.max(1, ...items.map(item => item.value))
  return `${Math.max(4, Math.round(value / max * 100))}%`
}
</script>

<template>
  <section>
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">Dashboard</span>
        <h2>概览</h2>
        <p>主页数据与访问趋势</p>
      </div>
      <div class="admin-range-switch" aria-label="统计时间范围">
        <button
          v-for="range in ([7, 30, 90] as const)"
          :key="range"
          type="button"
          :class="{ 'is-active': range === days }"
          @click="changeRange(range)"
        >
          {{ range }} 天
        </button>
      </div>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在汇总访问数据…</div>
    <div v-else-if="errorMessage" class="admin-card admin-empty" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" class="admin-btn" @click="load">重新加载</button>
    </div>

    <template v-else-if="dashboard && analytics">
      <div class="admin-stats">
        <a class="admin-stat" href="#visits">
          <span class="admin-stat-icon">Σ</span><strong>{{ dashboard.views }}</strong><span>累计独立访问</span>
        </a>
        <a class="admin-stat is-highlight" href="#visits">
          <span class="admin-stat-icon">↗</span><strong>{{ analytics.uniqueVisitors }}</strong><span>{{ analytics.days }} 天独立访问</span>
        </a>
        <a class="admin-stat" href="#visits">
          <span class="admin-stat-icon">◎</span><strong>{{ analytics.requests }}</strong><span>{{ analytics.days }} 天请求</span>
        </a>
        <a class="admin-stat" href="#visits">
          <span class="admin-stat-icon">↻</span><strong>{{ analytics.refreshes }}</strong><span>刷新请求</span>
        </a>
        <a class="admin-stat" :class="{ 'is-highlight': dashboard.unreadMessages > 0 }" href="#messages">
          <span class="admin-stat-icon">✉</span><strong>{{ dashboard.unreadMessages }}</strong><span>未读留言</span>
        </a>
        <a class="admin-stat" href="#notes">
          <span class="admin-stat-icon">N</span><strong>{{ dashboard.notes }}</strong><span>技术笔记</span>
        </a>
        <a class="admin-stat" href="#ai-projects">
          <span class="admin-stat-icon">AI</span><strong>{{ dashboard.aiProjects }}</strong><span>AI 项目</span>
        </a>
      </div>

      <div class="admin-analytics-grid">
        <article class="admin-analytics-card is-wide">
          <h3>独立访问趋势</h3>
          <div class="admin-trend-chart">
            <div
              v-for="(point, index) in analytics.daily"
              :key="point.date"
              class="admin-trend-column"
              :title="`${point.date}：${point.uniqueVisitors} 位 / ${point.requests} 次请求`"
            >
              <span>{{ point.uniqueVisitors || '' }}</span>
              <i :style="{ height: trendHeight(point.uniqueVisitors) }" />
              <small>{{ showTrendLabel(index) ? point.date.slice(5) : '' }}</small>
            </div>
          </div>
        </article>

        <article class="admin-analytics-card">
          <h3>首次访问时段</h3>
          <div class="admin-hour-grid">
            <div
              v-for="point in analytics.hourly"
              :key="point.hour"
              :title="`${String(point.hour).padStart(2, '0')}:00 · ${point.visitors} 位`"
            >
              <i :style="{ opacity: hourOpacity(point.visitors) }" />
              <small>{{ point.hour % 6 === 0 ? String(point.hour).padStart(2, '0') : '' }}</small>
            </div>
          </div>
        </article>

        <article
          v-for="group in [
            { title: '访问来源', items: analytics.sources },
            { title: '热门页面', items: analytics.paths },
            { title: '浏览器', items: analytics.browsers },
            { title: '设备', items: analytics.devices },
          ]"
          :key="group.title"
          class="admin-analytics-card"
        >
          <h3>{{ group.title }}</h3>
          <ol v-if="group.items.length" class="admin-rank-list">
            <li v-for="item in group.items" :key="item.name">
              <div><span>{{ item.name }}</span><b>{{ item.value }}</b></div>
              <i :style="{ width: rankWidth(group.items, item.value) }" />
            </li>
          </ol>
          <p v-else class="admin-empty">暂无数据</p>
        </article>
      </div>
      <p class="admin-muted admin-analytics-note">独立访问按 IP 窗口去重；图表只使用脱敏、最小化的自建日志。</p>
    </template>
  </section>
</template>
