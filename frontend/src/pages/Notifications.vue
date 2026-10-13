<template>



  <div class="page-shell">



    <Sidebar />







    <main class="main-content">



      <div class="content-container">



        <section class="page-header">



          <div class="header-copy">



            <div class="breadcrumb">



              <span>Education</span>



              <span class="separator">/</span>



              <span>Notifications</span>



            </div>







            <div class="title-wrap">



              <div class="title-icon">◉</div>



              <div>



                <h1>Notifications</h1>



                <p>Monitor email and communication activity.</p>



              </div>



            </div>



          </div>







          <button class="refresh-btn" :disabled="loading" @click="loadNotifications">



            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>



            {{ loading ? 'Refreshing...' : 'Refresh' }}



          </button>



        </section>







        <div v-if="error" class="error-box">



          <div class="error-icon">!</div>



          <div class="error-copy">



            <strong>Unable to load notifications</strong>



            <p>{{ error }}</p>



          </div>



          <button class="retry-btn" @click="loadNotifications">Retry</button>



        </div>







        <div v-if="loading && !records.length" class="loading-state">



          <div class="loader"></div>



          <p>Loading notification data...</p>



        </div>







        <template v-else>



          <section class="summary-grid">



            <article class="summary-card accent-purple">



              <div class="card-icon">◇</div>



              <div>



                <span>Total Notifications</span>



                <strong>{{ summary.total_notifications }}</strong>



              </div>



            </article>







            <article class="summary-card accent-blue">



              <div class="card-icon">@</div>



              <div>



                <span>Email Sent</span>



                <strong>{{ summary.email_sent }}</strong>



              </div>



            </article>







            <article class="summary-card accent-green">



              <div class="card-icon">☎</div>



              <div>



                <span>WhatsApp Status</span>



                <strong>{{ summary.whatsapp_status }}</strong>



              </div>



            </article>



          </section>







          <section class="filter-panel">
            <div class="filter-header">
              <div>
                <div class="eyebrow">FILTERS</div>
                <h2>Notification Filters</h2>
                <p>Search and filter communication activity.</p>
              </div>
              <button
                v-if="hasActiveFilters"
                class="clear-filter-btn"
                type="button"
                @click="clearFilters"
              >
                Clear Filters
              </button>
            </div>

            <div class="filter-grid">
              <label class="filter-field">
                <span>Search</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search recipient, contact or purpose..."
                />
              </label>

              <label class="filter-field">
                <span>Status</span>
                <select v-model="statusFilter">
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </label>

              <label class="filter-field">
                <span>Channel</span>
                <select v-model="channelFilter">
                  <option value="all">All Channels</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>
            </div>
          </section>

          <section class="records-panel">



            <div class="panel-header">



              <div>



                <div class="eyebrow">COMMUNICATION</div>



                <h2>Recent Activity</h2>



              </div>



              <span class="panel-count">{{ filteredRecords.length }} of {{ records.length }} records</span>



            </div>







            <div v-if="!filteredRecords.length" class="empty-state">



              <div class="empty-icon">◉</div>



              <strong>No notifications found</strong>



              <p>No communication records are available in Frappe Education.</p>



            </div>







            <div v-else class="records-list">



              <article v-for="item in filteredRecords" :key="item.id || item.contact" class="record-card">



                <div class="record-top">



                  <div class="record-leading">



                    <span class="record-badge">{{ item.role ? item.role.charAt(0) : 'N' }}</span>



                    <div>



                      <strong>{{ item.recipient || item.contact || 'Recipient' }}</strong>



                      <small>{{ item.role || 'Recipient' }} · {{ item.channel || 'Email' }}</small>



                    </div>



                  </div>



                  <span class="status-pill" :class="statusClass(item.status)">{{ item.status || 'Pending' }}</span>



                </div>







                <div class="meta-row">



                  <span>Contact</span>



                  <strong>{{ item.contact || '—' }}</strong>



                </div>







                <div class="meta-row">



                  <span>Purpose</span>



                  <strong>{{ item.purpose || 'Fee Payment' }}</strong>



                </div>







                <div class="meta-row">



                  <span>Date</span>



                  <strong>{{ formatDate(item.date) }}</strong>



                </div>



              </article>



            </div>



          </section>



        </template>



      </div>



    </main>



  </div>



</template>







<script setup>



import { computed, onMounted, ref } from 'vue'



import Sidebar from '@/components/Sidebar.vue'







const loading = ref(true)



const error = ref('')



const records = ref([])



const summary = ref({



  total_notifications: 0,



  email_sent: 0,



  whatsapp_sent: 0,



  failed: 0,



  whatsapp_status: 'Not Configured',



})







const searchQuery = ref('')
const statusFilter = ref('all')
const channelFilter = ref('all')

const filteredRecords = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return records.value.filter((item) => {
    const status = String(item.status || 'Pending').trim().toLowerCase()
    const channel = String(item.channel || 'Email').trim().toLowerCase()

    const searchableText = [
      item.recipient,
      item.contact,
      item.purpose,
      item.role,
      item.channel,
      item.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = !query || searchableText.includes(query)
    const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value
    const matchesChannel = channelFilter.value === 'all' || channel === channelFilter.value

    return matchesSearch && matchesStatus && matchesChannel
  })
})

const hasActiveFilters = computed(() => {
  return Boolean(
    searchQuery.value.trim() ||
    statusFilter.value !== 'all' ||
    channelFilter.value !== 'all'
  )
})

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  channelFilter.value = 'all'
}

const statusClass = (status) => {



  const normalized = String(status || '').trim().toLowerCase()



  if (normalized === 'sent') return 'success'



  if (normalized === 'failed') return 'danger'



  if (normalized === 'pending') return 'warning'



  return 'neutral'



}







async function fetchJson(url) {



  const response = await fetch(url, {



    credentials: 'include',



    headers: { Accept: 'application/json' },



  })







  let result = null



  try {



    result = await response.json()



  } catch (jsonError) {



    throw new Error(`Invalid response received from ${url}`)



  }







  if (!response.ok) {



    throw new Error(result?.exception || result?.message || `Request failed with status ${response.status}`)



  }







  return result



}







async function loadNotifications() {



  loading.value = true



  error.value = ''







  try {



    const result = await fetchJson('/api/method/backend_custom_app.api.education.get_notifications')



    const message = result?.message && typeof result.message === 'object' ? result.message : {}



    summary.value = {



      total_notifications: Number(message.total_notifications) || 0,



      email_sent: Number(message.email_sent) || 0,



      whatsapp_sent: Number(message.whatsapp_sent) || 0,



      failed: Number(message.failed) || 0,



      whatsapp_status: message.whatsapp_status || 'Not Configured',



    }



    records.value = Array.isArray(message.notifications) ? message.notifications : []



  } catch (err) {



    console.error('Notifications API error:', err)



    error.value = err?.message || 'Unable to load notification data.'



  } finally {



    loading.value = false



  }



}







function formatDate(value) {



  if (!value) return '—'



  const date = new Date(value)



  if (Number.isNaN(date.getTime())) return value



  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)



}







onMounted(() => {



  loadNotifications()



})



</script>







<style scoped>



:global(body) {



  margin: 0;



  font-family: Inter, 'Segoe UI', sans-serif;



  background: #f3f6fb;



  color: #111827;



}







* { box-sizing: border-box; }







.page-shell { min-height: 100vh; background: #f5f7fb; }







.main-content { margin-left: 255px; min-height: 100vh; }







.content-container { padding: 32px 28px 40px; }







.page-header {



  display: flex;



  align-items: center;



  justify-content: space-between;



  gap: 18px;



  margin-bottom: 24px;



}







.breadcrumb{



  color: #7c879c;



  font-size: 12px;



  letter-spacing: 0.06em;



  text-transform: uppercase;



  font-weight: 600;



}







.separator { margin: 0 8px; }







.title-wrap {



  margin-top: 10px;



  display: flex;



  align-items: center;



  gap: 14px;



}







.title-icon{



  width: 52px;



  height: 52px;



  display: grid;



  place-items: center;



  border-radius: 16px;



  background: linear-gradient(135deg, #fef3c7, #fde68a);



  color: #b45309;



  font-size: 24px;



  font-weight: 700;



}







h1 {



  margin: 0;



  font-size: clamp(28px, 2vw, 36px);



  color: #111827;



}







.page-header p {



  margin: 8px 0 0;



  color: #64748b;



}







.refresh-btn, .retry-btn {



  border: none;



  border-radius: 12px;



  padding: 11px 16px;



  font-weight: 700;



  cursor: pointer;



  background: linear-gradient(105deg, #453D89, #C8499A);



  color: #fff;



  box-shadow: 0 10px 20px rgba(200, 73, 154, 0.2);



}







.refresh-btn:disabled { opacity: 0.7; cursor: not-allowed; }







.refresh-icon{
  font-size: 15px; display: inline-block; margin-right: 8px; }







.spinning { animation: spin 1s linear infinite; }







@keyframes spin {



  from { transform: rotate(0deg); }



  to { transform: rotate(360deg); }



}







.error-box {



  display: flex;



  align-items: center;



  gap: 16px;



  padding: 18px 20px;



  background: #fff1f2;



  border: 1px solid #fecdd3;



  border-radius: 16px;



  color: #9f1239;



  margin-bottom: 22px;



}







.error-icon {



  width: 36px;



  height: 36px;



  border-radius: 50%;



  display: grid;



  place-items: center;



  background: #fecdd3;



  font-weight: 800;



}







.error-copy { flex: 1; }



.error-copy strong { display: block; margin-bottom: 6px; }



.error-copy p { margin: 0; color: #9f1239; }







.loading-state {



  display: grid;



  place-items: center;



  min-height: 280px;



  background: #fff;



  border-radius: 18px;



  box-shadow: 0 12px 24px rgba(69, 61, 137, 0.04);



  color: #475569;



}







.loader {



  width: 40px;



  height: 40px;



  border: 4px solid #e2e8f0;



  border-top-color: #453D89;



  border-radius: 50%;



  animation: spin 1s linear infinite;



  margin-bottom: 10px;



}







.summary-grid {



  display: grid;



  grid-template-columns: repeat(3, minmax(0, 1fr));



  gap: 18px;



  margin-bottom: 24px;



}







.summary-card {



  display: flex;



  align-items: center;



  gap: 16px;



  padding: 22px 20px;



  border-radius: 18px;



  background: #fff;



  box-shadow: 0 10px 24px rgba(69, 61, 137, 0.04);



}







.card-icon{
  font-size: 15px;



  width: 52px;



  height: 52px;



  display: grid;



  place-items: center;



  border-radius: 15px;



  background: linear-gradient(135deg, #EDEBFA, #FCEAF4);



  color: #4338ca;



  font-weight: 700;



}







.summary-card span{ display: block; color: #64748b; font-size: 12px; margin-bottom: 6px; }



.summary-card strong{ display: block; font-size: 30px; color: #111827; }







.accent-purple .card-icon { background: linear-gradient(135deg, #EDEBFA, #F8D4E8); color: #C8499A; }



.accent-blue .card-icon { background: linear-gradient(135deg, #FCEAF4, #F8D4E8); color: #453D89; }



.accent-green .card-icon { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }







.filter-panel {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(69, 61, 137, 0.04);
  padding: 22px 20px;
  margin-bottom: 24px;
}

.filter-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.filter-header h2{
  margin: 6px 0 4px;
  font-size: 22px;
}

.filter-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) repeat(2, minmax(180px, 1fr));
  gap: 14px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.filter-field span{
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.filter-field input,
.filter-field select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #fff;
  color: #111827;
  font: inherit;
  outline: none;
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: #453D89;
  box-shadow: 0 0 0 3px rgba(69, 61, 137, 0.1);
}

.clear-filter-btn {
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  padding: 9px 13px;
  background: #fff;
  color: #C8499A;
  font-weight: 700;
  cursor: pointer;
}

.clear-filter-btn:hover {
  background: #f8fafc;
}

.records-panel {



  background: #fff;



  border-radius: 20px;



  box-shadow: 0 12px 28px rgba(69, 61, 137, 0.04);



  padding: 22px 20px;



}







.panel-header {



  display: flex;



  align-items: center;



  justify-content: space-between;



  margin-bottom: 18px;



}







.eyebrow{



  font-size: 11px;



  letter-spacing: 0.12em;



  color: #C8499A;



  font-weight: 700;



}







h2 { margin: 6px 0 0; font-size: 26px; }







.panel-count{ color: #475569; font-size: 12px; font-weight: 700; }







.records-list {



  display: grid;



  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));



  gap: 16px;



}







.record-card {



  padding: 18px;



  border-radius: 16px;



  background: #f8fafc;



  border: 1px solid #e5e7eb;



}







.record-top {



  display: flex;



  align-items: center;



  justify-content: space-between;



  gap: 12px;



  margin-bottom: 16px;



}







.record-leading {



  display: flex;



  align-items: center;



  gap: 12px;



}







.record-badge {



  width: 36px;



  height: 36px;



  display: grid;



  place-items: center;



  border-radius: 12px;



  background: #eef2ff;



  color: #4338ca;



  font-weight: 700;



}







.record-leading strong,



.record-leading small {



  display: block;



}







.record-leading small {



  color: #64748b;



  margin-top: 4px;



}







.status-pill{



  display: inline-flex;



  align-items: center;



  padding: 7px 12px;



  border-radius: 999px;



  font-size: 11px;



  font-weight: 700;



  text-transform: capitalize;



}







.status-pill.success { background: #dcfce7; color: #166534; }



.status-pill.warning { background: #fef3c7; color: #92400e; }



.status-pill.danger { background: #fee2e2; color: #991b1b; }



.status-pill.neutral { background: #e2e8f0; color: #334155; }







.meta-row {



  display: flex;



  align-items: center;



  justify-content: space-between;



  gap: 8px;



  padding-top: 10px;



  border-top: 1px solid #e5e7eb;



  margin-top: 10px;



  color: #475569;



}







.meta-row strong{



  color: #111827;



  font-size: 14px;



}







.empty-state {



  display: grid;



  place-items: center;



  text-align: center;



  min-height: 220px;



  padding: 30px 16px;



  color: #475569;



}







.empty-icon{



  width: 62px;



  height: 62px;



  display: grid;



  place-items: center;



  border-radius: 18px;



  background: #f1f5f9;



  color: #C8499A;



  font-size: 26px;



  margin-bottom: 12px;



}







.empty-state strong{



  display: block;



  margin-bottom: 8px;



  color: #111827;



  font-size: 20px;



}







@media (max-width: 960px) {



  .main-content { margin-left: 0; }



  .content-container { padding: 24px 18px 30px; }



  .page-header { flex-direction: column; align-items: stretch; }



  .summary-grid { grid-template-columns: 1fr; }



}



@media (max-width: 640px) {
  .filter-grid { grid-template-columns: 1fr; }
  .filter-header { flex-direction: column; align-items: stretch; }
}
</style>
