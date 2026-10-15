<template>
  <div class="student-notifications-page">
    <Sidebar />
    <main class="main-content">
      <header class="page-header">
        <div>
          <div class="breadcrumb">Education <span>/</span> Notifications</div>
          <h1>Notifications</h1>
          <p>Updates about your classes, attendance, fees, leave and grades.</p>
        </div>
        <div class="header-actions">
          <button
            v-if="unreadCount"
            class="mark-all-button"
            type="button"
            :disabled="markingAll"
            @click="markAllRead"
          >
            {{ markingAll ? 'Updating...' : 'Mark all as read' }}
          </button>
          <button
            class="refresh-button"
            type="button"
            :disabled="loading"
            @click="loadNotifications"
          >
            <span :class="{ spinning: loading }" aria-hidden="true">↻</span>
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </header>

      <div v-if="error" class="error-box" role="alert">
        <div>
          <strong>Unable to load notifications</strong>
          <p>{{ error }}</p>
        </div>
        <button type="button" @click="loadNotifications">Try again</button>
      </div>

      <div v-if="loading && !records.length" class="loading-state" role="status">
        <span class="loader"></span>
        <span>Loading notifications...</span>
      </div>

      <section v-else-if="records.length" class="notifications-section" aria-label="Your notifications">
        <div class="list-heading">
          <span>{{ records.length }} recent updates</span>
          <span v-if="unreadCount" class="unread-summary">{{ unreadCount }} unread</span>
        </div>

        <article
          v-for="notification in records"
          :key="notification.name"
          class="notification-row"
          :class="{ 'is-unread': !notification.read }"
        >
          <span class="unread-marker" :class="{ visible: !notification.read }" aria-hidden="true"></span>
          <div class="notification-copy">
            <div class="notification-heading">
              <h2>{{ notification.title }}</h2>
              <span class="category-label">{{ notification.category }}</span>
            </div>
            <p class="notification-description">{{ notification.description || 'There are no additional details.' }}</p>
            <div class="notification-meta">
              <time :datetime="notification.creation">{{ formatTimestamp(notification.creation) }}</time>
              <span>{{ notification.read ? 'Read' : 'Unread' }}</span>
            </div>
          </div>
          <div class="notification-actions">
            <router-link
              v-if="notification.destination"
              :to="notification.destination"
              class="open-link"
            >
              Open
            </router-link>
            <button
              v-if="!notification.read"
              type="button"
              class="read-button"
              :disabled="busyNotification === notification.name"
              @click="markRead(notification)"
            >
              {{ busyNotification === notification.name ? 'Saving...' : 'Mark read' }}
            </button>
          </div>
        </article>
      </section>

      <section v-else-if="!error" class="empty-state">
        <div class="empty-icon" aria-hidden="true">◉</div>
        <h2>You're all caught up</h2>
        <p>New student updates will appear here.</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { apiGet, apiPost } from '@/lib/api'

const records = ref([])
const unreadCount = ref(0)
const loading = ref(true)
const error = ref('')
const markingAll = ref(false)
const busyNotification = ref('')

async function loadNotifications() {
  loading.value = true
  error.value = ''

  try {
    const result = await apiGet(
      '/api/method/backend_custom_app.api.student_notifications.get_student_notifications'
    )
    records.value = Array.isArray(result?.notifications) ? result.notifications : []
    unreadCount.value = Number(result?.unread_count) || 0
  } catch (requestError) {
    error.value = requestError.message || 'Please try again.'
  } finally {
    loading.value = false
  }
}

async function markRead(notification) {
  if (busyNotification.value) return

  busyNotification.value = notification.name
  error.value = ''

  try {
    await apiPost(
      '/api/method/backend_custom_app.api.student_notifications.mark_student_notification_read',
      { notification_name: notification.name }
    )
    notification.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    window.dispatchEvent(new Event('student-notifications-updated'))
  } catch (requestError) {
    error.value = requestError.message || 'Unable to update this notification.'
  } finally {
    busyNotification.value = ''
  }
}

async function markAllRead() {
  if (markingAll.value || !unreadCount.value) return

  markingAll.value = true
  error.value = ''

  try {
    await apiPost(
      '/api/method/backend_custom_app.api.student_notifications.mark_all_student_notifications_read'
    )
    records.value.forEach(notification => {
      notification.read = true
    })
    unreadCount.value = 0
    window.dispatchEvent(new Event('student-notifications-updated'))
  } catch (requestError) {
    error.value = requestError.message || 'Unable to update notifications.'
  } finally {
    markingAll.value = false
  }
}

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

onMounted(loadNotifications)
</script>

<style scoped>
.student-notifications-page {
  min-height: 100vh;
  color: #20213a;
  background: #f6f7fb;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.main-content {
  width: calc(100% - 255px);
  min-height: 100vh;
  margin-left: 255px;
  padding: 34px 38px 50px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 28px;
}

.breadcrumb {
  display: flex;
  gap: 9px;
  align-items: center;
  color: #7a7a91;
  font-size: 12px;
}

.breadcrumb span {
  color: #b8b8c5;
}

h1 {
  margin: 9px 0 5px;
  color: #20213a;
  font-size: 27px;
}

.page-header p,
.notification-description,
.empty-state p {
  margin: 0;
  color: #77778d;
  line-height: 1.55;
}

.header-actions,
.notification-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.refresh-button,
.mark-all-button,
.read-button,
.error-box button {
  min-height: 40px;
  padding: 9px 13px;
  border: 1px solid #e5e5ed;
  border-radius: 8px;
  color: #45455e;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button span {
  display: inline-block;
  margin-right: 5px;
}

.mark-all-button {
  color: #4a4bd0;
  border-color: #d9d8f4;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.notifications-section {
  border-top: 1px solid #e7e7ef;
}

.list-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 2px;
  color: #77778d;
  font-size: 12px;
}

.unread-summary {
  color: #4a4bd0;
  font-weight: 700;
}

.notification-row {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  padding: 18px 16px;
  border-bottom: 1px solid #e7e7ef;
  background: #fff;
}

.notification-row.is-unread {
  background: #fbfbff;
}

.unread-marker {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 50%;
  background: #5b5ce2;
  opacity: 0;
}

.unread-marker.visible {
  opacity: 1;
}

.notification-copy,
.notification-heading,
.notification-meta {
  min-width: 0;
}

.notification-heading {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.notification-heading h2 {
  min-width: 0;
  margin: 0;
  color: #24243c;
  font-size: 15px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.category-label {
  flex: 0 0 auto;
  padding: 3px 7px;
  border-radius: 5px;
  color: #4a4bd0;
  background: #eeeeff;
  font-size: 10px;
  font-weight: 700;
}

.notification-description {
  margin-top: 7px;
  color: #55556c;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.notification-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 10px;
  color: #88889b;
  font-size: 11px;
}

.notification-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.open-link {
  color: #4a4bd0;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.open-link:hover {
  text-decoration: underline;
}

.read-button {
  min-height: 34px;
  padding: 6px 9px;
  font-size: 11px;
}

.error-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  background: #fff7f7;
}

.error-box p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.error-box button {
  flex: 0 0 auto;
}

.loading-state,
.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 70px 20px;
  color: #77778d;
  text-align: center;
}

.loader {
  width: 24px;
  height: 24px;
  border: 2px solid #deddf5;
  border-top-color: #5b5ce2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 50%;
  color: #5b5ce2;
  background: #eeeeff;
  font-size: 20px;
}

.empty-state h2 {
  margin: 4px 0 0;
  color: #24243c;
  font-size: 17px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .main-content {
    width: 100%;
    margin-left: 0;
    padding: 76px 24px 40px;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 72px 16px 32px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1 1 0;
  }

  .notification-row {
    grid-template-columns: 8px minmax(0, 1fr);
    gap: 10px;
    padding: 16px 10px;
  }

  .notification-actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}

@media (max-width: 360px) {
  .main-content {
    padding-right: 12px;
    padding-left: 12px;
  }

  .notification-heading h2 {
    font-size: 14px;
  }
}
</style>
