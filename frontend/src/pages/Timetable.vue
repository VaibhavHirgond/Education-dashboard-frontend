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



              <span>Timetable</span>



            </div>







            <div class="title-wrap">



              <div class="title-icon">◷</div>



              <div>



                <h1>Timetable</h1>



                <p>Course schedules and session timings.</p>



              </div>



            </div>



          </div>







          <button class="refresh-btn" :disabled="loading" @click="loadTimetable">



            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>



            {{ loading ? 'Refreshing...' : 'Refresh' }}



          </button>



        </section>







        <div v-if="error" class="error-box">



          <div class="error-icon">!</div>



          <div class="error-copy">



            <strong>Unable to load timetable</strong>



            <p>{{ error }}</p>



          </div>



          <button class="retry-btn" @click="loadTimetable">Retry</button>



        </div>







        <div v-if="loading && !records.length" class="loading-state">



          <div class="loader"></div>



          <p>Loading timetable data...</p>



        </div>







        <template v-else>



          <section class="summary-grid">



            <article class="summary-card accent-purple">



              <div class="card-icon">◷</div>



              <div>


                <span>Total Sessions</span>




                <strong>{{ filteredRecords.length }}</strong>



              </div>



            </article>







            <article class="summary-card accent-blue">



              <div class="card-icon">▣</div>



              <div>



                <span>Courses</span>



                <strong>{{ uniqueCourses }}</strong>



              </div>



            </article>







            <article class="summary-card accent-green">



              <div class="card-icon">✓</div>



              <div>



                <span>Scheduled</span>



                <strong>{{ activeSchedules }}</strong>



              </div>



            </article>



          </section>







          <section class="filter-panel">
            <div class="filter-header">
              <div>
                <div class="eyebrow">FILTER SCHEDULES</div>
                <h2>{{ isStudent ? 'My Sessions' : 'Find Sessions' }}</h2>
                <p v-if="isStudent">
                  Only the sessions of your student groups are shown.
                </p>
                <p v-else>
                  Filter course schedules by branch, division, standard,
                  academic year, student group, course, instructor or date.
                </p>
              </div>

              <button
                v-if="hasActiveFilters"
                type="button"
                class="clear-filter-btn"
                @click="clearFilters"
              >
                Clear Filters
              </button>
            </div>

            <div class="filter-grid">
              <label class="filter-field search-field">
                <span>Search</span>
                <div class="input-wrap">
                  <span class="input-icon">⌕</span>
                  <input
                    v-model.trim="searchQuery"
                    type="text"
                    placeholder="Search course, student group, instructor or room..."
                  />
                </div>
              </label>

              <template v-if="!isStudent">
                <label v-if="!isInstructor" class="filter-field">
                  <span>Branch</span>
                  <select v-model="branchFilter">
                    <option value="">All Branches</option>
                    <option v-for="option in masterOptions.branch" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label v-if="!isInstructor" class="filter-field">
                  <span>Division</span>
                  <select v-model="divisionFilter">
                    <option value="">All Divisions</option>
                    <option v-for="option in masterOptions.division" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label v-if="!isInstructor" class="filter-field">
                  <span>Standard</span>
                  <select v-model="standardFilter">
                    <option value="">All Standards</option>
                    <option v-for="option in masterOptions.standard" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>Academic Year</span>
                  <select v-model="yearFilter">
                    <option value="">All Academic Years</option>
                    <option v-for="option in masterOptions.year" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>Student Group</span>
                  <select v-model="groupFilter">
                    <option value="">All Student Groups</option>
                    <option v-for="option in masterOptions.group" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>Course</span>
                  <select v-model="courseFilter">
                    <option value="">All Courses</option>
                    <option v-for="option in courseOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label v-if="!isInstructor" class="filter-field">
                  <span>Instructor</span>
                  <select v-model="instructorFilter">
                    <option value="">All Instructors</option>
                    <option v-for="option in instructorOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>From Date</span>
                  <input v-model="fromDate" type="date" />
                </label>

                <label class="filter-field">
                  <span>To Date</span>
                  <input v-model="toDate" type="date" />
                </label>

                <label class="filter-field">
                  <span>Status</span>
                  <select v-model="statusFilter">
                    <option value="">All Statuses</option>
                    <option v-for="status in statusOptions" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                </label>
              </template>
            </div>

            <div class="filter-footer">
              Showing <strong>{{ filteredRecords.length }}</strong> of
              <strong>{{ records.length }}</strong> sessions
            </div>
          </section>

          <section class="records-panel">



            <div class="panel-header">



              <div>



                <div class="eyebrow">COURSE SCHEDULES</div>



                <h2>Session Records</h2>



              </div>



              <span class="panel-count">{{ filteredRecords.length }} records</span>



            </div>







            <div v-if="!filteredRecords.length" class="empty-state">



              <div class="empty-icon">◷</div>



              <strong>No timetable entries found</strong>



              <p>{{ records.length ? "No sessions match the selected filters." : "No course schedule data is available in Frappe Education." }}</p>



            </div>







            <div v-else class="table-wrap record-scroll">



              <table>



                <thead>



                  <tr>



                    <th>Course</th>



                    <th>Student Group</th>



                    <th>Instructor</th>



                    <th>Date</th>



                    <th>Time</th>



                    <th>Room</th>



                    <th>Status</th>



                  </tr>



                </thead>



                <tbody>



                  <tr v-for="item in filteredRecords" :key="item.id || item.course + item.date + item.fromTime">



                    <td>



                      <div class="name-cell">



                        <span class="record-badge">C</span>



                        <div>



                          <strong>{{ item.course || '—' }}</strong>



                          <small>{{ item.id || 'Schedule' }}</small>



                        </div>



                      </div>



                    </td>



                    <td>{{ item.studentGroup || '—' }}</td>



                    <td>{{ item.instructor || '—' }}</td>



                    <td>{{ formatDate(item.date) }}</td>



                    <td>{{ formatTimeRange(item) }}</td>



                    <td>{{ item.room || '—' }}</td>



                    <td>



                      <span class="status-pill" :class="statusClass(item.status)">



                        {{ item.status || 'Scheduled' }}



                      </span>



                    </td>



                  </tr>



                </tbody>



              </table>



            </div>



          </section>



        </template>



      </div>



    </main>



  </div>



</template>







<script setup>



import { computed, onMounted, ref, watch } from 'vue'



import Sidebar from '@/components/Sidebar.vue'

import { getContext, isInstructorUser, isStudentUser } from '@/lib/context'







const loading = ref(true)



const error = ref('')



const records = ref([])

const searchQuery = ref('')
const statusFilter = ref('')

const context = ref(null)

const mode = ref('admin')

const isStudent = computed(() => isStudentUser(context.value) || mode.value === 'student')

// Branch / division / standard / instructor filters only exist in the
// staff branch of get_course_schedules, so instructors must not see
// them (selecting one silently returned unfiltered results).
const isInstructor = computed(
  () => isInstructorUser(context.value) || mode.value === 'instructor'
)

/* Staff-only filters, validated server side against real masters. */
const branchFilter = ref('')
const divisionFilter = ref('')
const standardFilter = ref('')
const yearFilter = ref('')
const groupFilter = ref('')
const courseFilter = ref('')
const instructorFilter = ref('')
const fromDate = ref('')
const toDate = ref('')

const masterOptions = ref({
  branch: [],
  division: [],
  standard: [],
  year: [],
  group: [],
  course: [],
  instructor: [],
})

const courseOptions = computed(() => masterOptions.value.course)

const instructorOptions = computed(() => masterOptions.value.instructor)

const statusOptions = computed(() => {
  return [...new Set(
    records.value
      .map((item) => String(item.status || 'Scheduled').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))
})

const filteredRecords = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return records.value.filter((item) => {
    const searchable = [
      item.course,
      item.studentGroup,
      item.instructor,
      item.room,
      item.id,
      item.status,
      item.date
    ].map((value) => String(value || '').toLowerCase()).join(' ')

    const matchesSearch = !query || searchable.includes(query)
    const itemStatus = String(item.status || 'Scheduled').trim()
    const matchesStatus =
      !statusFilter.value || itemStatus === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

const hasActiveFilters = computed(() => {
  return Boolean(
    searchQuery.value ||
    statusFilter.value ||
    branchFilter.value ||
    divisionFilter.value ||
    standardFilter.value ||
    yearFilter.value ||
    groupFilter.value ||
    courseFilter.value ||
    instructorFilter.value ||
    fromDate.value ||
    toDate.value
  )
})

function filterPayload() {
  const payload = {}

  const map = [
    ['academic_year', yearFilter.value],
    ['branch', branchFilter.value],
    ['division', divisionFilter.value],
    ['standard', standardFilter.value],
    ['group', groupFilter.value],
    ['course', courseFilter.value],
    ['instructor', instructorFilter.value],
    ['from_date', fromDate.value],
    ['to_date', toDate.value],
  ]

  map.forEach(([key, value]) => {
    if (value) payload[key] = value
  })

  return payload
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  branchFilter.value = ''
  divisionFilter.value = ''
  standardFilter.value = ''
  yearFilter.value = ''
  groupFilter.value = ''
  courseFilter.value = ''
  instructorFilter.value = ''
  fromDate.value = ''
  toDate.value = ''
}
const uniqueCourses = computed(() => {




  // Derived from the filtered rows so the summary cards agree with
  // the table and the "Showing X of Y" footer.
  const courses = new Set(filteredRecords.value.map((item) => String(item.course || '').trim()).filter(Boolean))




  return courses.size




})










const activeSchedules = computed(() => {




  return filteredRecords.value.filter((item) => {



    const status = String(item.status || '').trim()



    return !status || status.toLowerCase() === 'scheduled' || status.toLowerCase() === 'active'



  }).length



})







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







function normalizeList(payload, key) {



  if (Array.isArray(payload)) return payload



  if (payload && typeof payload === 'object') {



    const value = payload[key]



    return Array.isArray(value) ? value : []



  }



  return []



}







async function loadTimetable() {



  loading.value = true



  error.value = ''







  try {


    let result

    const payload = isStudent.value ? {} : filterPayload()


    if (Object.keys(payload).length) {

      result = await fetchJsonPost(
        '/api/method/backend_custom_app.api.education.get_course_schedules',
        { payload }
      )

    } else {

      result = await fetchJson('/api/method/backend_custom_app.api.education.get_course_schedules')

    }



    const message = result?.message ?? result ?? {}

    mode.value =
      message.mode === 'student' || message.mode === 'instructor'
        ? message.mode
        : mode.value

    records.value = normalizeList(message, 'schedules')



  } catch (err) {



    console.error('Timetable API error:', err)



    error.value = err?.message || 'Unable to load timetable data.'



  } finally {



    loading.value = false



  }



}







async function fetchJsonPost(url, payload = {}) {

  const response = await fetch(url, {

    method: 'POST',

    credentials: 'include',

    headers: {

      Accept: 'application/json',

      'Content-Type': 'application/json',

    },

    body: JSON.stringify(payload),

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



async function loadContext() {

  try {

    context.value = await getContext()

    if (!isStudent.value) {

      await loadMasterOptions()

    }

  } catch (err) {

    console.warn('Context API error:', err)

  }

}



async function fetchMasterNames(doctype, labelField) {

  const fields = encodeURIComponent(

    JSON.stringify(labelField ? ['name', labelField] : ['name'])
  )


  const response = await fetch(

    `/api/resource/${encodeURIComponent(doctype)}?fields=${fields}&limit_page_length=200&order_by=name%20asc`,

    { credentials: 'include', headers: { Accept: 'application/json' } }

  )


  if (!response.ok) return []


  const body = await response.json().catch(() => ({}))

  if (!Array.isArray(body.data)) return []


  return body.data.map((row) => ({

    value: row.name,

    label: labelField ? (row[labelField] || row.name) : row.name,

  }))

}



async function loadMasterOptions() {

  const [branch, division, standard, year, group, course, instructor] =

    await Promise.all([

      fetchMasterNames('Branch').catch(() => []),

      fetchMasterNames('Division').catch(() => []),

      fetchMasterNames('Standard').catch(() => []),

      fetchMasterNames('Academic Year').catch(() => []),

      fetchMasterNames('Student Group').catch(() => []),

      fetchMasterNames('Course', 'course_name').catch(() => []),

      fetchMasterNames('Instructor', 'instructor_name').catch(() => []),

    ])


  masterOptions.value = { branch, division, standard, year, group, course, instructor }

}


let filterTimer = null

watch(

  [branchFilter, divisionFilter, standardFilter, yearFilter, groupFilter, courseFilter, instructorFilter, fromDate, toDate],

  () => {

    if (isStudent.value) return

    if (filterTimer) clearTimeout(filterTimer)

    filterTimer = setTimeout(() => { loadTimetable() }, 250)

  }

)



function formatDate(value) {



  if (!value) return '—'



  const date = new Date(value)



  if (Number.isNaN(date.getTime())) return value



  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)



}







function formatTimeRange(item) {



  if (!item.fromTime && !item.toTime) return '—'



  const fromTime = item.fromTime || '—'



  const toTime = item.toTime || '—'



  return `${fromTime} - ${toTime}`



}







function statusClass(status) {



  const normalized = String(status || '').trim().toLowerCase()



  if (!normalized) return 'neutral'



  if (['scheduled', 'active', 'confirmed'].includes(normalized)) return 'success'



  if (['cancelled', 'reassigned'].includes(normalized)) return 'danger'



  return 'warning'



}






onMounted(() => {




  loadContext()

  loadTimetable()



})



</script>







<style scoped>



:global(body) {



  margin: 0;



  font-family: Inter, 'Segoe UI', sans-serif;



  background: #f3f6fb;



  color: #111827;



}







* {



  box-sizing: border-box;



}







.page-shell {



  min-height: 100vh;



  background: #f5f7fb;



}







.main-content {



  margin-left: 255px;



  min-height: 100vh;



}







.content-container {



  padding: 32px 28px 40px;



}







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



  font-weight: 600;



  letter-spacing: 0.06em;



  text-transform: uppercase;



}







.separator {



  margin: 0 8px;



}







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



  background: linear-gradient(135deg, #EDEBFA, #FCEAF4);



  color: #C8499A;



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



  box-shadow: 0 10px 20px rgba(200, 73, 154, 0.22);



}







.refresh-btn:disabled {



  opacity: 0.7;



  cursor: not-allowed;



}







.refresh-icon {



  display: inline-block;



  margin-right: 8px;



}







.spinning {



  animation: spin 1s linear infinite;



}







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







.error-copy {



  flex: 1;



}







.error-copy strong {



  display: block;



  margin-bottom: 6px;



}







.error-copy p {



  margin: 0;



  color: #9f1239;



}







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







.card-icon {



  width: 52px;



  height: 52px;



  display: grid;



  place-items: center;



  border-radius: 15px;



  background: linear-gradient(135deg, #EDEBFA, #FCEAF4);



  color: #4338ca;



  font-weight: 700;



}







.summary-card span{



  display: block;



  color: #64748b;



  font-size: 12px;



  margin-bottom: 6px;



}







.summary-card strong{



  display: block;



  font-size: 30px;



  color: #111827;



}







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
  gap: 18px;
  margin-bottom: 18px;
}

.filter-header h2{
  margin: 6px 0 0;
  font-size: 24px;
}

.filter-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) repeat(3, minmax(150px, 1fr));
  gap: 14px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.filter-field > span{
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-field input,
.filter-field select {
  width: 100%;
  height: 44px;
  border: 1px solid #dbe3ee;
  border-radius: 11px;
  background: #fff;
  color: #1e293b;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.filter-field input {
  padding: 0 14px 0 38px;
}

.filter-field select {
  padding: 0 12px;
  cursor: pointer;
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: #5A4FA8;
  box-shadow: 0 0 0 3px rgba(69, 61, 137, 0.1);
}

.input-wrap {
  position: relative;
}

.input-icon{
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 18px;
  pointer-events: none;
}

.clear-filter-btn{
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  padding: 9px 13px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.clear-filter-btn:hover {
  background: #f8fafc;
}

.filter-footer{
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #edf2f7;
  color: #64748b;
  font-size: 12px;
}

.filter-footer strong {
  color: #1e293b;
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







h2 {



  margin: 6px 0 0;



  font-size: 26px;



}







.panel-count{



  color: #475569;



  font-size: 12px;



  font-weight: 700;



}







.table-wrap {



  overflow-x: auto;



}

/* Internal scroll for Session Records (heading stays outside). */
.record-scroll {
  max-height: 340px;

  overflow-y: auto;

  scrollbar-width: thin;
  scrollbar-color: #c7cbe0 transparent;

  overscroll-behavior: auto;
}

.record-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.record-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.record-scroll::-webkit-scrollbar-thumb {
  background: #c7cbe0;

  border-radius: 999px;
}

.record-scroll::-webkit-scrollbar-thumb:hover {
  background: #b0b5d2;
}

/* Sticky header inside the scroll container. */
.record-scroll thead th {
  position: sticky;
  top: 0;
  z-index: 1;

  background: #ffffff;
}







table {



  width: 100%;



  border-collapse: collapse;



  min-width: 900px;



}







th, td {



  text-align: left;



  padding: 16px 12px;



  border-bottom: 1px solid #edf2f7;



  vertical-align: middle;



}







th{



  color: #475569;



  font-size: 11px;



  text-transform: uppercase;



  letter-spacing: 0.08em;



}







td{



  color: #1f2937;



  font-size: 14px;



}







.name-cell {



  display: flex;



  align-items: center;



  gap: 10px;



}







.record-badge {



  width: 30px;



  height: 30px;



  border-radius: 10px;



  display: grid;



  place-items: center;



  background: #eef2ff;



  color: #C8499A;



  font-weight: 700;



}







.name-cell strong,



.name-cell small {



  display: block;



}







.name-cell small {



  color: #64748b;



  margin-top: 2px;



}







.status-pill {



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







.empty-state {



  display: grid;



  place-items: center;



  text-align: center;



  min-height: 220px;



  padding: 30px 16px;



  color: #475569;



}







.empty-icon {



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



  .main-content {



    margin-left: 0;



  }







  .content-container {



    padding: 24px 18px 30px;



  }







  .page-header {



    flex-direction: column;



    align-items: stretch;



  }







  .summary-grid {



    grid-template-columns: 1fr;



  }



}




@media (max-width: 960px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-header {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-filter-btn {
    align-self: flex-start;
  }

  .record-scroll {
    max-height: 300px;
  }
}

</style>
