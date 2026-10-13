<template>
  <div class="admissions-page">
    <Sidebar />

    <main class="main-content">
      <div class="content-wrap">

        <!-- HEADER -->
        <section class="page-header">
          <div class="header-left">
            <div class="breadcrumb">
              <span>Education</span>
              <span class="breadcrumb-line">/</span>
              <span class="current">Admissions</span>
              <span class="breadcrumb-line">/</span>
              <span class="current">Student Admissions</span>
            </div>
            <div class="title-row">
              <div class="title-icon">▤</div>
              <div>
                <h1>Student Admissions</h1>
                <p>Admission cycles that define programs, fees and eligibility.</p>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button
              class="desk-btn desk-btn-primary"
              type="button"
              @click="goNew"
            >
              <span class="desk-btn-icon">＋</span>
              <span>New Admission</span>
            </button>

            <button
              class="desk-btn desk-btn-secondary"
              type="button"
              title="Open the Student Admission list in Frappe Desk"
              @click="openDesk(deskListUrl)"
            >
              <span class="desk-btn-icon">☰</span>
              <span>View in Desk</span>
            </button>

            <button
              class="refresh-btn"
              type="button"
              :disabled="loading"
              @click="loadAdmissions"
            >
              <span class="refresh-icon" :class="{ spinning: loading }">⟳</span>
              <span>Refresh</span>
            </button>
          </div>
        </section>

        <!-- LOADING -->
        <section v-if="loading" class="state-panel">
          <div class="spinner"></div>
          <p>Loading admission cycles…</p>
        </section>

        <!-- ERROR -->
        <section v-else-if="error" class="state-panel error">
          <div class="state-icon">!</div>
          <p>{{ error }}</p>
          <button class="desk-btn desk-btn-secondary" type="button" @click="loadAdmissions">
            Try again
          </button>
        </section>

        <!-- EMPTY -->
        <section v-else-if="admissions.length === 0" class="state-panel">
          <div class="state-icon">▤</div>
          <p>No student admissions yet.</p>
          <button class="desk-btn desk-btn-primary" type="button" @click="goNew">
            Create the first admission cycle
          </button>
        </section>

        <!-- TABLE -->
        <section v-else class="list-panel">
          <table class="desk-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Academic Year</th>
                <th>Admission Window</th>
                <th>Programs</th>
                <th>Status</th>
                <th>Modified</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in admissions" :key="a.name" class="list-row" @click="goEdit(a.name)">
                <td class="cell-title">
                  <span class="title-text">{{ a.title || a.name }}</span>
                  <span class="doc-name">{{ a.name }}</span>
                </td>
                <td>{{ a.academic_year || '—' }}</td>
                <td>{{ formatDateRange(a.admission_start_date, a.admission_end_date) }}</td>
                <td>{{ a.program_count }} {{ a.program_count === 1 ? 'program' : 'programs' }}</td>
                <td>
                  <div class="badge-stack">
                    <span v-if="a.published" class="badge badge-published">Published</span>
                    <span v-if="a.enable_admission_application" class="badge badge-open">Applications Open</span>
                    <span v-if="!a.published && !a.enable_admission_application" class="badge badge-draft">Draft</span>
                  </div>
                </td>
                <td class="cell-muted">{{ formatModified(a.modified) }}</td>
                <td class="cell-actions" @click.stop>
                  <button class="row-btn" type="button" title="Edit" @click="goEdit(a.name)">✎</button>
                  <button class="row-btn row-btn-desk" type="button" title="Open in Desk" @click="openDesk(deskItemUrl(a.name))">↗</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

      </div>
    </main>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import { apiGet, extractMessage } from '@/lib/api'

export default {
  name: 'StudentAdmissions',

  components: { Sidebar },

  data() {
    return {
      admissions: [],
      loading: true,
      error: null,
      deskBaseUrl: window.location.origin,
    }
  },

  computed: {
    deskListUrl() {
      return `${this.deskBaseUrl}/app/student-admission`
    },
  },

  created() {
    this.loadAdmissions()
  },

  methods: {
    async loadAdmissions() {
      this.loading = true
      this.error = null
      try {
        const res = await apiGet(
          '/api/method/backend_custom_app.api.admissions.get_admissions',
          {}
        )
        this.admissions = res?.admissions || []
      } catch (err) {
        this.error = extractMessage(err.body) || err.message || 'Unable to load admissions.'
        this.admissions = []
      } finally {
        this.loading = false
      }
    },

    goNew() {
      this.$router.push('/admission-cycles/new')
    },

    goEdit(name) {
      this.$router.push(`/admission-cycles/${encodeURIComponent(name)}`)
    },

    openDesk(url) {
      window.open(url, '_blank', 'noopener')
    },

    deskItemUrl(name) {
      return `${this.deskBaseUrl}/app/student-admission/${encodeURIComponent(name)}`
    },

    formatDateRange(start, end) {
      if (!start && !end) return '—'
      const fmt = (v) => (v ? new Date(v).toLocaleDateString() : '…')
      return `${fmt(start)} → ${fmt(end)}`
    },

    formatModified(value) {
      if (!value) return '—'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      return d.toLocaleDateString()
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

.main-content { min-height: 100vh; margin-left: 255px; }
.content-wrap { width: min(100%, 1240px); margin: 0 auto; padding: 24px 32px 40px; }

/* HEADER */
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
.breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #7c7c7c; font-size: 13px; }
.breadcrumb a { color: #0070cc; text-decoration: none; font-weight: 420; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb-line { color: #c7c7c7; }
.breadcrumb .current { color: #383838; font-weight: 500; }
.title-row { display: flex; align-items: center; gap: 12px; }
.title-icon {
  width: 40px; height: 40px; display: grid; place-items: center; border-radius: 8px;
  color: #0070cc; background: #edf6fd; font-size: 16px;
}
.page-header h1 { margin: 0; color: #171717; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.page-header p { margin: 4px 0 0; color: #7c7c7c; font-size: 13px; }
.header-actions { display: flex; align-items: center; gap: 8px; }

/* BUTTONS — Desk-consistent */
.desk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; border: 0; border-radius: 8px;
  font-size: 13px; font-weight: 420; letter-spacing: 0.02em; cursor: pointer;
  transition: background 0.15s ease;
}
.desk-btn-primary { color: #fff; background: #171717; }
.desk-btn-primary:hover { background: #040404; }
.desk-btn-secondary { color: #383838; background: #f3f3f3; }
.desk-btn-secondary:hover { background: #e2e2e2; }
.desk-btn-icon { font-size: 13px; }

.refresh-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px;
  border: 0; border-radius: 8px; background: #f3f3f3;
  color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.refresh-btn:hover:not(:disabled) { background: #e2e2e2; }
.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.refresh-icon { display: inline-block; font-size: 13px; }
.refresh-icon.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* STATE */
.state-panel {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 24px; text-align: center; background: #fff;
  border: 1px solid #e2e2e2; border-radius: 8px; color: #7c7c7c;
}
.state-panel.error { background: #fff0f0; border-color: #f5c6c6; color: #b52a2a; }
.state-icon {
  width: 40px; height: 40px; display: grid; place-items: center; border-radius: 8px;
  background: #f3f3f3; color: #7c7c7c; font-size: 16px;
}
.state-panel.error .state-icon { background: rgba(181, 42, 42, 0.08); color: #b52a2a; }
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #e2e2e2; border-top-color: #7c7c7c; animation: spin 0.8s linear infinite;
}

/* LIST TABLE */
.list-panel {
  background: #fff; border: 1px solid #e2e2e2; border-radius: 8px;
  overflow: hidden;
}

.desk-table { width: 100%; border-collapse: collapse; }

.desk-table th {
  text-align: left; padding: 8px 12px; background: #f8f8f8; color: #7c7c7c;
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e2e2;
}

.desk-table td {
  padding: 12px; border-bottom: 1px solid #f3f3f3; font-size: 13px; color: #383838;
  vertical-align: middle;
}

.list-row { cursor: pointer; transition: background 0.15s ease; }
.list-row:hover { background: #fafafa; }
.list-row:last-child td { border-bottom: 0; }

.cell-title { display: flex; flex-direction: column; gap: 2px; }
.title-text { font-weight: 500; color: #171717; }
.doc-name { font-family: monospace; font-size: 13px; color: #7c7c7c; }
.cell-muted { color: #7c7c7c; font-size: 13px; }

/* BADGES — Desk gray/green */
.badge-stack { display: flex; flex-wrap: wrap; gap: 6px; }
.badge { padding: 4.5px 8px; border-radius: 999px; font-size: 11px; font-weight: 420; letter-spacing: 0.02em; white-space: nowrap; }
.badge-published { color: #16794c; background: #e4f5e9; }
.badge-open { color: #0070cc; background: #edf6fd; }
.badge-draft { color: #525252; background: #f3f3f3; }

.actions-col { width: 90px; }
.cell-actions { display: flex; gap: 6px; }

.row-btn {
  width: 28px; height: 28px; border: 0; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; cursor: pointer; line-height: 1;
}
.row-btn:hover { background: #e2e2e2; }
.row-btn-desk { color: #7c7c7c; }

@media (max-width: 900px) {
  .main-content { margin-left: 0; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-wrap: wrap; }
  .list-panel { overflow-x: auto; }
  .desk-table { min-width: 720px; }
}
</style>
