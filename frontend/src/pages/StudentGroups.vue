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

              <span>Student Groups</span>

            </div>



            <div class="title-wrap">

              <div class="title-icon">◎</div>

              <div>

                <h1>Student Groups</h1>

                <p>Academic cohorts and group-based student records.</p>

              </div>

            </div>

          </div>



          <div class="header-actions">

            <button
              v-if="isStaff"
              class="desk-btn desk-btn-secondary"
              type="button"
              title="Open the Student Group list in Frappe Desk"
              @click="openDesk(deskListUrl)"
            >

              View All

            </button>



            <button
              v-if="isStaff"
              class="desk-btn desk-btn-primary"
              type="button"
              title="Create a new Student Group in Frappe Desk"
              @click="openDesk(deskNewUrl)"
            >

              Add

            </button>



            <button class="refresh-btn" :disabled="loading" @click="loadGroups">

              <span class="refresh-icon" :class="{ spinning: loading }">↻</span>

              {{ loading ? 'Refreshing...' : 'Refresh' }}

            </button>

          </div>

        </section>



        <div v-if="error" class="error-box">

          <div class="error-icon">!</div>

          <div class="error-copy">

            <strong>Unable to load student groups</strong>

            <p>{{ error }}</p>

          </div>

          <button class="retry-btn" @click="loadGroups">Retry</button>

        </div>



        <div v-if="loading && !records.length" class="loading-state">

          <div class="loader"></div>

          <p>Loading student group data...</p>

        </div>



        <template v-else>

          <section class="summary-grid">

            <article class="summary-card accent-purple">

              <div class="card-icon">◎</div>

              <div>

                <span>Total Groups</span>

                <strong>{{ records.length }}</strong>

              </div>

            </article>



            <article class="summary-card accent-blue">

              <div class="card-icon">♙</div>

              <div>

                <span>Students</span>

                <strong>{{ totalStudents }}</strong>

              </div>

            </article>



            <article class="summary-card accent-green">

              <div class="card-icon">♟</div>

              <div>

                <span>Instructors</span>

                <strong>{{ totalInstructors }}</strong>

              </div>

            </article>

          </section>



          <section class="filter-panel">
              <div class="filter-header">
                <div>
                  <div class="eyebrow">FILTER GROUPS</div>
                  <h2>Find Student Groups</h2>
                  <p>Search groups by name, program, batch, or course.</p>
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
                      placeholder="Search group, program, batch, course..."
                    />
                  </div>
                </label>

                <label class="filter-field">
                  <span>Program</span>
                  <select v-model="programFilter">
                    <option value="">All Programs</option>
                    <option v-for="program in programOptions" :key="program" :value="program">
                      {{ program }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>Batch</span>
                  <select v-model="batchFilter">
                    <option value="">All Batches</option>
                    <option v-for="batch in batchOptions" :key="batch" :value="batch">
                      {{ batch }}
                    </option>
                  </select>
                </label>

                <label class="filter-field">
                  <span>Course</span>
                  <select v-model="courseFilter">
                    <option value="">All Courses</option>
                    <option v-for="course in courseOptions" :key="course" :value="course">
                      {{ course }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="filter-footer">
                Showing <strong>{{ filteredRecords.length }}</strong> of
                <strong>{{ records.length }}</strong> student groups
              </div>
            </section>

            <section class="records-panel">

            <div class="panel-header">

              <div>

                <div class="eyebrow">STUDENT COHORTS</div>

                <h2>Group Records</h2>

              </div>

              <span class="panel-count">{{ filteredRecords.length }} records</span>

            </div>



            <div v-if="!filteredRecords.length" class="empty-state">

              <div class="empty-icon">◎</div>

              <strong>No student groups found</strong>

              <p>{{ records.length ? "No student groups match the selected filters." : "No student group records are available in Frappe Education." }}</p>

            </div>



            <div v-else class="table-wrap">

              <table>

                <thead>

                  <tr>

                    <th>Name</th>

                    <th>Program</th>

                    <th>Batch</th>

                    <th>Course</th>

                    <th>Academic Year</th>

                    <th>Students</th>

                    <th>Instructors</th>

                  </tr>

                </thead>

                <tbody>

                  <tr v-for="item in filteredRecords" :key="item.id || item.name">

                    <td>

                      <div class="name-cell">

                        <span class="record-badge">G</span>

                        <div>

                          <strong>{{ item.name || 'Group' }}</strong>

                          <small>{{ item.id || 'N/A' }}</small>

                        </div>

                      </div>

                    </td>

                    <td>{{ item.program || '—' }}</td>

                    <td>{{ item.batch || '—' }}</td>

                    <td>{{ item.course || '—' }}</td>

                    <td>{{ item.academicYear || '—' }}</td>

                    <td>{{ item.studentCount ?? '0' }}</td>

                    <td>{{ item.instructorCount ?? '0' }}</td>

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

import { computed, onMounted, ref } from 'vue'

import Sidebar from '@/components/Sidebar.vue'

import { getContext, isStaffUser } from '@/lib/context'



const loading = ref(true)

const error = ref('')

const records = ref([])

// Desk shortcuts are staff-only; keep them hidden until we know the role.
const isStaff = ref(false)

const searchQuery = ref('')
const programFilter = ref('')
const batchFilter = ref('')
const courseFilter = ref('')

const deskBaseUrl = window.location.origin

const deskListUrl = `${deskBaseUrl}/desk/student-group`

const deskNewUrl = `${deskBaseUrl}/desk/student-group/new`

function openDesk(url) {

  window.location.href = url

}

const uniqueValues = (field) => {
  return [...new Set(
    records.value
      .map((item) => String(item[field] || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))
}

const programOptions = computed(() => uniqueValues('program'))
const batchOptions = computed(() => uniqueValues('batch'))
const courseOptions = computed(() => uniqueValues('course'))

const filteredRecords = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return records.value.filter((item) => {
    const searchable = [
      item.name,
      item.id,
      item.program,
      item.batch,
      item.course,
      item.academicYear
    ].map((value) => String(value || '').toLowerCase()).join(' ')

    return (
      (!query || searchable.includes(query)) &&
      (!programFilter.value || String(item.program || '').trim() === programFilter.value) &&
      (!batchFilter.value || String(item.batch || '').trim() === batchFilter.value) &&
      (!courseFilter.value || String(item.course || '').trim() === courseFilter.value)
    )
  })
})

const hasActiveFilters = computed(() => Boolean(
  searchQuery.value ||
  programFilter.value ||
  batchFilter.value ||
  courseFilter.value
))

function clearFilters() {
  searchQuery.value = ''
  programFilter.value = ''
  batchFilter.value = ''
  courseFilter.value = ''
}



const totalStudents = computed(() => records.value.reduce((sum, item) => sum + (Number(item.studentCount) || 0), 0))

const totalInstructors = computed(() => records.value.reduce((sum, item) => sum + (Number(item.instructorCount) || 0), 0))



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



async function loadGroups() {

  loading.value = true

  error.value = ''



  try {

    const result = await fetchJson('/api/method/backend_custom_app.api.education.get_student_groups')

    const payload = result?.message ?? result ?? {}

    records.value = normalizeList(payload, 'student_groups')

  } catch (err) {

    console.error('Student Groups API error:', err)

    error.value = err?.message || 'Unable to load student group data.'

  } finally {

    loading.value = false

  }

}



onMounted(async () => {

  loadGroups()

  try {
    const ctx = await getContext()
    isStaff.value = isStaffUser(ctx)
  } catch (e) {
    console.warn('Role check failed:', e)
    isStaff.value = false
  }

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

  font-weight: 600;

  letter-spacing: 0.06em;

  text-transform: uppercase;

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

  background: linear-gradient(135deg, #FCEAF4, #F3EFF9);

  color: #453D89;

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



.refresh-icon { display: inline-block; margin-right: 8px; }



.spinning { animation: spin 1s linear infinite; }



@keyframes spin {

  from { transform: rotate(0deg); }

  to { transform: rotate(360deg); }
}




.header-actions {

  display: flex;

  align-items: center;

  justify-content: flex-end;

  flex-wrap: wrap;

  gap: 10px;

}



.desk-btn {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  height: 42px;

  padding: 0 16px;

  border: 0;

  border-radius: 12px;

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  transition: transform 0.2s ease, box-shadow 0.2s ease;

}



.desk-btn-secondary {

  color: #453D89;

  background: #F3EFF9;

  border: 1px solid #cfe0fb;

}



.desk-btn-secondary:hover {

  transform: translateY(-2px);

  box-shadow: 0 9px 20px rgba(69, 61, 137, 0.14);

}



.desk-btn-primary {

  color: #fff;

  background: linear-gradient(135deg, #10b981, #059669);

  box-shadow: 0 9px 22px rgba(5, 150, 105, 0.2);

}



.desk-btn-primary:hover {

  transform: translateY(-2px);

  box-shadow: 0 13px 27px rgba(5, 150, 105, 0.27);

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
  gap: 18px;
  margin-bottom: 18px;
}

.filter-header h2 {
  margin: 6px 0 0;
  font-size: 26px;
  color: #111827;
}

.filter-header p {
  margin: 7px 0 0;
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
  color: #111827;
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



.table-wrap { overflow-x: auto; }



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



td{ color: #1f2937; font-size: 14px; }



.name-cell { display: flex; align-items: center; gap: 10px; }



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



.name-cell strong, .name-cell small { display: block; }

.name-cell small { color: #64748b; margin-top: 2px; }



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

  .main-content { margin-left: 0; }

  .content-container { padding: 24px 18px 30px; }

  .page-header { flex-direction: column; align-items: stretch; }

  .summary-grid { grid-template-columns: 1fr; }

}


@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 960px) {
  .main-content {
    margin-left: 0;
    width: 100%;
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

@media (max-width: 640px){
  .content-container {
    padding: 20px 14px 28px;
  }

  .filter-panel,
  .records-panel {
    padding: 18px 14px;
    border-radius: 16px;
  }

  .filter-header {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-filter-btn {
    align-self: flex-start;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    grid-column: auto;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  .table-wrap {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 900px;
  }

  .title-wrap {
    align-items: flex-start;
  }

  
h1 {    font-size: 28px;
  }}

@media (max-width: 480px){
  .content-container {
    padding: 16px 12px 24px;
  }

  .title-icon {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  
h1 {    font-size: 25px;
  }  .summary-card {
    padding: 18px 16px;
  }

  .summary-card strong {
    font-size: 26px;
  }
}

</style>
