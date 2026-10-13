<template>
  <div class="admissions-page">
    <Sidebar />

    <main class="main-content">
      <div class="content-wrap">

        <!-- PAGE HEADER -->
        <section class="page-header">
          <div class="header-left">
            <div class="breadcrumb">
              <span>Education</span>
              <span class="breadcrumb-line">/</span>
              <span class="current">Admissions</span>
              <span class="breadcrumb-line">/</span>
              <span class="current">Student Applicants</span>
            </div>
            <div class="title-row">
              <div class="title-icon">✎</div>
              <div>
                <h1>Student Applicants</h1>
                <p>Review, approve and enroll new student applications.</p>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button
              class="desk-btn desk-btn-secondary"
              type="button"
              title="Open the Student Applicant list in Frappe Desk"
              @click="openDesk(deskListUrl)"
            >
              <span class="desk-btn-icon">☰</span>
              <span>View in Desk</span>
            </button>

            <button
              class="desk-btn desk-btn-primary"
              type="button"
              title="Add a new student applicant"
              @click="$router.push('/admissions/new')"
            >
              <span class="desk-btn-icon">+</span>
              <span>Add Student Applicant</span>
            </button>

            <button
              class="refresh-btn"
              type="button"
              :disabled="loading"
              @click="loadApplicants"
            >
              <span class="refresh-icon" :class="{ spinning: loading }">⟳</span>
              <span>Refresh</span>
            </button>
          </div>
        </section>

        <!-- TOOLBAR: search + filters -->
        <section class="toolbar">
          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input
              v-model.trim="search"
              type="search"
              placeholder="Search by name, e-mail or ID…"
              :disabled="loading"
              @keyup.enter="applySearch"
            />
            <button
              v-if="search"
              class="clear-search"
              type="button"
              title="Clear search"
              @click="clearSearch"
            >×</button>
          </div>

          <div class="filter-group">
            <select v-model="filters.application_status" :disabled="loading" @change="applyFilters">
              <option value="">All Statuses</option>
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>

            <select v-model="filters.program" :disabled="loading" @change="applyFilters">
              <option value="">All Programs</option>
              <option v-for="p in programOptions" :key="p.name" :value="p.name">{{ p.label }}</option>
            </select>

            <select v-model="filters.academic_year" :disabled="loading" @change="applyFilters">
              <option value="">All Academic Years</option>
              <option v-for="y in yearOptions" :key="y.name" :value="y.name">{{ y.label }}</option>
            </select>

            <select v-model="filters.academic_term" :disabled="loading" @change="applyFilters">
              <option value="">All Academic Terms</option>
              <option v-for="t in termOptions" :key="t.name" :value="t.name">{{ t.label }}</option>
            </select>

            <button
              v-if="hasActiveFilters"
              class="clear-filters"
              type="button"
              @click="clearFilters"
            >Clear filters</button>
          </div>
        </section>

        <!-- RESULT COUNT -->
        <section v-if="!loading && !error" class="result-bar">
          <span>
            {{ total }} {{ total === 1 ? 'applicant' : 'applicants' }}
            <template v-if="search || hasActiveFilters"> match your search</template>
          </span>
        </section>

        <!-- LOADING -->
        <section v-if="loading" class="state-panel">
          <div class="spinner"></div>
          <p>Loading applicants…</p>
        </section>

        <!-- ERROR -->
        <section v-else-if="error" class="state-panel error">
          <div class="state-icon">!</div>
          <p>{{ error }}</p>
          <button class="desk-btn desk-btn-secondary" type="button" @click="loadApplicants">
            Try again
          </button>
        </section>

        <!-- EMPTY -->
        <section v-else-if="applicants.length === 0" class="state-panel">
          <div class="state-icon">✎</div>
          <p v-if="search || hasActiveFilters">No applicants match your search.</p>
          <p v-else>No student applicants yet. Create the first one to get started.</p>
          <button
            v-if="!search && !hasActiveFilters"
            class="desk-btn desk-btn-primary"
            type="button"
            @click="$router.push('/admissions/new')"
          >
            <span class="desk-btn-icon">+</span>
            <span>Add Student Applicant</span>
          </button>
        </section>

        <!-- TABLE -->
        <section v-else class="table-card">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Status</th>
                  <th>Program</th>
                  <th>Academic Year</th>
                  <th>Applied On</th>
                  <th>Paid</th>
                  <th class="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in applicants" :key="a.name">
                  <td>
                    <div class="cell-primary">
                      <span class="applicant-name">{{ displayName(a) }}</span>
                      <span class="cell-sub">{{ a.name }}</span>
                    </div>
                    <span v-if="a.student_email_id" class="cell-email">{{ a.student_email_id }}</span>
                  </td>
                  <td>
                    <span class="status-pill" :class="statusClass(a)">
                      <span class="dot"></span>{{ a.application_status || 'Applied' }}
                    </span>
                  </td>
                  <td>{{ a.program || '—' }}</td>
                  <td>{{ a.academic_year || '—' }}</td>
                  <td>{{ formatDate(a.application_date) }}</td>
                  <td>
                    <span class="paid-flag" :class="a.paid ? 'is-paid' : 'is-unpaid'">
                      {{ a.paid ? 'Paid' : 'Unpaid' }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="link-btn" type="button" @click="openApplicant(a.name)">
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINATION -->
          <div v-if="total > limitPageLength" class="pagination">
            <button
              class="page-btn"
              type="button"
              :disabled="limitStart === 0 || loading"
              @click="prevPage"
            >← Previous</button>
            <span class="page-info">
              {{ limitStart + 1 }}–{{ Math.min(limitStart + limitPageLength, total) }} of {{ total }}
            </span>
            <button
              class="page-btn"
              type="button"
              :disabled="limitStart + limitPageLength >= total || loading"
              @click="nextPage"
            >Next →</button>
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import { getContext, isStaffUser } from '@/lib/context'
import { apiGet, extractMessage } from '@/lib/api'

const STATUSES = ['Applied', 'Approved', 'Rejected', 'Admitted']

export default {
  name: 'StudentApplicants',

  components: { Sidebar },

  data() {
    return {
      STATUSES,
      search: '',
      appliedSearch: '',
      filters: {
        application_status: '',
        program: '',
        academic_year: '',
        academic_term: '',
      },
      applicants: [],
      total: 0,
      limitStart: 0,
      limitPageLength: 20,
      loading: true,
      error: null,
      programOptions: [],
      yearOptions: [],
      termOptions: [],
      context: null,
      deskBaseUrl: window.location.origin,
    }
  },

  computed: {
    isStaff() {
      return isStaffUser(this.context)
    },

    deskListUrl() {
      return `${this.deskBaseUrl}/app/student-applicant`
    },

    hasActiveFilters() {
      return Boolean(
        this.filters.application_status ||
        this.filters.program ||
        this.filters.academic_year ||
        this.filters.academic_term
      )
    },
  },

  created() {
    this.loadContext()
    this.loadFilterOptions()
    this.loadApplicants()
  },

  methods: {
    async loadContext() {
      try {
        this.context = await getContext()
      } catch (e) {
        this.context = null
      }
    },

    async loadFilterOptions() {
      const load = async (doctype) => {
        try {
          const res = await apiGet('/api/method/backend_custom_app.api.admissions.get_link_options', {
            doctype,
          })
          return res?.options || []
        } catch (e) {
          return []
        }
      }
      const [programs, years, terms] = await Promise.all([
        load('Program'),
        load('Academic Year'),
        load('Academic Term'),
      ])
      this.programOptions = programs
      this.yearOptions = years
      this.termOptions = terms
    },

    async loadApplicants() {
      this.loading = true
      this.error = null
      try {
        const res = await apiGet('/api/method/backend_custom_app.api.admissions.get_applicants', {
          search: this.appliedSearch || undefined,
          application_status: this.filters.application_status || undefined,
          program: this.filters.program || undefined,
          academic_year: this.filters.academic_year || undefined,
          academic_term: this.filters.academic_term || undefined,
          limit_start: this.limitStart,
          limit_page_length: this.limitPageLength,
        })
        this.applicants = res?.applicants || []
        this.total = res?.total || 0
      } catch (err) {
        this.error = extractMessage(err.body) || err.message || 'Unable to load applicants.'
        this.applicants = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    applySearch() {
      this.appliedSearch = this.search
      this.limitStart = 0
      this.loadApplicants()
    },

    clearSearch() {
      this.search = ''
      this.applySearch()
    },

    applyFilters() {
      this.limitStart = 0
      this.loadApplicants()
    },

    clearFilters() {
      this.filters = { application_status: '', program: '', academic_year: '', academic_term: '' }
      this.limitStart = 0
      this.loadApplicants()
    },

    prevPage() {
      this.limitStart = Math.max(0, this.limitStart - this.limitPageLength)
      this.loadApplicants()
    },

    nextPage() {
      this.limitStart += this.limitPageLength
      this.loadApplicants()
    },

    openApplicant(name) {
      this.$router.push(`/admissions/${encodeURIComponent(name)}`)
    },

    openDesk(url) {
      window.open(url, '_blank', 'noopener')
    },

    displayName(a) {
      return (
        [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ') ||
        a.title ||
        a.name
      )
    },

    formatDate(value) {
      if (!value) return '—'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      return d.toLocaleDateString()
    },

    statusClass(a) {
      const s = a.application_status || 'Applied'
      return {
        Applied: 'status-applied',
        Approved: 'status-approved',
        Rejected: 'status-rejected',
        Admitted: 'status-admitted',
      }[s] || 'status-applied'
    },
  },
}
</script>

<style scoped>
.admissions-page {
  min-height: 100vh;
  background: #f8f8f8;
  color: #383838;
}

.main-content {
  min-height: 100vh;
  margin-left: 255px;
}

.content-wrap {
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 24px 32px 40px;
}

/* HEADER */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #7c7c7c;
  font-size: 13px;
}

.breadcrumb-line { color: #c7c7c7; }
.breadcrumb .current { color: #383838; font-weight: 500; }

.title-row { display: flex; align-items: center; gap: 12px; }

.title-icon {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 8px;
  color: #0070cc;
  background: #edf6fd;
  font-size: 16px;
}

.page-header h1 {
  margin: 0; color: #171717;
  font-size: 20px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em;
}

.page-header p { margin: 4px 0 0; color: #7c7c7c; font-size: 13px; }

.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* BUTTONS — Desk-consistent */
.desk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; border: 0; border-radius: 8px;
  font-size: 13px; font-weight: 420; letter-spacing: 0.02em; cursor: pointer;
  transition: background 0.15s ease;
}
.desk-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.desk-btn-primary { color: #fff; background: #171717; }
.desk-btn-primary:hover:not(:disabled) { background: #040404; }

.desk-btn-secondary { color: #383838; background: #f3f3f3; }
.desk-btn-secondary:hover:not(:disabled) { background: #e2e2e2; }

.desk-btn-icon { font-size: 13px; line-height: 1; }

.refresh-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; border: 0; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.refresh-btn:hover:not(:disabled) { background: #e2e2e2; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.refresh-icon { display: inline-block; font-size: 13px; }
.refresh-icon.spinning { animation: spin 0.9s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* TOOLBAR */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
}

.search-box {
  position: relative; display: flex; align-items: center;
  flex: 1; min-width: 240px; max-width: 420px;
}

.search-icon { position: absolute; left: 11px; color: #7c7c7c; font-size: 14px; }

.search-box input {
  width: 100%; height: 32px; padding: 0 32px 0 32px;
  border: 1px solid #c7c7c7; border-radius: 8px; background: #f3f3f3;
  font-size: 13px; color: #383838;
}
.search-box input:focus {
  outline: 0; border-color: #999999; background: #f3f3f3;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}

.clear-search {
  position: absolute; right: 6px; width: 22px; height: 22px;
  border: 0; border-radius: 6px; background: transparent; color: #7c7c7c;
  cursor: pointer; font-size: 13px; line-height: 1;
}
.clear-search:hover { background: #e2e2e2; color: #383838; }

.filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.filter-group select {
  height: 32px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.filter-group select:focus {
  outline: 0; border-color: #999999;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}

.clear-filters {
  height: 32px; padding: 0 10px; border: 0; border-radius: 8px;
  background: #fff0f0; color: #b52a2a; font-size: 13px; font-weight: 420; cursor: pointer;
}
.clear-filters:hover { background: #ffe4e4; }

/* RESULT BAR */
.result-bar { margin-bottom: 10px; color: #7c7c7c; font-size: 13px; font-weight: 500; }

/* STATE PANELS */
.state-panel {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 24px; text-align: center;
  background: #fff; border: 1px solid #e2e2e2;
  border-radius: 8px; color: #7c7c7c;
}
.state-panel p { margin: 0; font-size: 13px; }

.state-panel.error { background: #fff0f0; border-color: #f5c6c6; color: #b52a2a; }

.state-icon {
  width: 40px; height: 40px; display: grid; place-items: center;
  border-radius: 8px; background: #f3f3f3; color: #7c7c7c; font-size: 16px;
}
.state-panel.error .state-icon { background: rgba(181, 42, 42, 0.08); color: #b52a2a; }

.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #e2e2e2; border-top-color: #7c7c7c;
  animation: spin 0.8s linear infinite;
}

/* TABLE */
.table-card {
  background: #fff; border: 1px solid #e2e2e2;
  border-radius: 8px; overflow: hidden;
}

.table-scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; text-align: left; }

thead th {
  padding: 8px 12px; background: #f8f8f8; color: #7c7c7c;
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e2e2; white-space: nowrap;
}

thead th.actions-col { text-align: right; }

tbody td {
  padding: 12px; border-bottom: 1px solid #f3f3f3;
  font-size: 13px; color: #383838; vertical-align: top;
}

tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: #fafafa; }

.cell-primary { display: flex; flex-direction: column; gap: 2px; }
.applicant-name { font-weight: 500; color: #171717; }
.cell-sub { font-size: 13px; color: #7c7c7c; font-family: monospace; }
.cell-email { display: block; margin-top: 3px; font-size: 13px; color: #7c7c7c; }

/* STATUS PILL — Desk indicator-pill colors */
.status-pill {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  padding: 4.5px 8px; border-radius: 999px; font-size: 11px; font-weight: 420; letter-spacing: 0.02em;
}
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* Desk: Applied → orange */
.status-applied { color: #bd3e0c; background: #fff1e7; }
.status-applied .dot { background: #bd3e0c; }
/* Desk: Approved → green */
.status-approved { color: #16794c; background: #e4f5e9; }
.status-approved .dot { background: #16794c; }
/* Desk: Rejected → red */
.status-rejected { color: #b52a2a; background: #fff0f0; }
.status-rejected .dot { background: #b52a2a; }
/* Desk: Admitted → blue */
.status-admitted { color: #0070cc; background: #edf6fd; }
.status-admitted .dot { background: #0070cc; }

/* Paid flag — Desk Paid indicator is green; unpaid is gray */
.paid-flag {
  display: inline-block; padding: 4px 8px; border-radius: 999px;
  font-size: 13px; font-weight: 420; letter-spacing: 0.02em;
}
.is-paid { color: #16794c; background: #e4f5e9; }
.is-unpaid { color: #525252; background: #f3f3f3; }

/* ROW ACTIONS */
.row-actions { display: flex; justify-content: flex-end; gap: 6px; }

.link-btn {
  border: 0; background: transparent; color: #0070cc;
  font-size: 13px; font-weight: 420; cursor: pointer; padding: 4px 6px; border-radius: 6px;
}
.link-btn:hover { background: #edf6fd; }

/* PAGINATION */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 10px; border-top: 1px solid #e2e2e2; background: #f8f8f8;
}

.page-btn {
  height: 30px; padding: 0 12px; border: 0; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.page-btn:hover:not(:disabled) { background: #e2e2e2; }
.page-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.page-info { font-size: 13px; color: #7c7c7c; font-weight: 500; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .main-content { margin-left: 0; }
  .page-header { flex-direction: column; align-items: stretch; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: none; }
  .filter-group { overflow-x: auto; }
}
</style>
