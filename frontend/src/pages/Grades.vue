<template>
  <div class="app-shell">
    <Sidebar />

    <main class="main-content">
      <!-- HEADER -->
      <section class="page-header">
        <div>
          <div class="breadcrumb">
            Education
            <span>/</span>
            Grades
          </div>
          <h1>My Grades</h1>
          <p>
            Assessment results for your enrolled courses -
            only your own records are shown.
          </p>
        </div>

        <div class="header-actions">
          <button
            class="refresh-button"
            :disabled="loading"
            @click="load"
          >
            <span :class="{ spinning: loading }">↻</span>
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </section>

      <!-- ERROR -->
      <div v-if="error" class="error-box">
        <div class="error-icon">!</div>
        <div>
          <strong>Unable to load grades</strong>
          <p>{{ error }}</p>
          <button @click="load">Try Again</button>
        </div>
      </div>

      <!-- NO STUDENT RECORD -->
      <div v-else-if="!loading && !payload.studentName && payload.student === null" class="error-box">
        <div class="error-icon">!</div>
        <div>
          <strong>No student record</strong>
          <p>{{ payload.message || 'No student record is linked to this account yet. Contact your administrator.' }}</p>
        </div>
      </div>

      <template v-else>
        <!-- SUMMARY -->
        <section class="summary-grid">
          <article class="summary-card">
            <span class="summary-label">Assessments</span>
            <strong class="summary-value">{{ summary.total }}</strong>
            <span class="summary-hint">Graded results</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Average Score</span>
            <strong class="summary-value">{{ summary.averageScore }}</strong>
            <span class="summary-hint">Across all results</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Latest Grade</span>
            <strong class="summary-value">{{ summary.latestGrade || '—' }}</strong>
            <span class="summary-hint">Most recent result</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Program</span>
            <strong class="summary-value program-value">{{ payload.program || '—' }}</strong>
            <span class="summary-hint">
              {{ payload.academicYear || '' }}
            </span>
          </article>
        </section>

        <!-- RESULTS -->
        <section class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">ASSESSMENT RESULTS</span>
              <h2>Grade Book</h2>
              <p>
                Submitted assessment results from Frappe Education.
              </p>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            Loading grades…
          </div>

          <div v-else-if="!results.length" class="empty-state">
            <strong>No grades yet</strong>
            <p>
              Your assessment results will appear here once they
              are published.
            </p>
          </div>

          <div v-else class="table-wrap record-scroll">
            <table>
              <thead>
                <tr>
                  <th>ASSESSMENT</th>
                  <th>COURSE</th>
                  <th>CRITERIA BREAKDOWN</th>
                  <th>SCORE</th>
                  <th>MAX</th>
                  <th>GRADE</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="row in results" :key="row.id">
                  <td>
                    <strong>{{ row.assessment || row.id }}</strong>
                  </td>
                  <td>{{ row.course || '—' }}</td>
                  <td>
                    <span
                      v-for="detail in row.details"
                      :key="detail.criteria"
                      class="criteria-chip"
                    >
                      {{ detail.criteria }}: {{ detail.score }}/{{ detail.maximumScore }}
                    </span>
                    <span v-if="!row.details.length">—</span>
                  </td>
                  <td>{{ row.totalScore }}</td>
                  <td>{{ row.maximumScore }}</td>
                  <td>
                    <span class="grade-chip" :class="gradeClass(row.grade)">
                      {{ row.grade || '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'

export default {
  name: 'Grades',

  components: {
    Sidebar,
  },

  data() {
    return {
      loading: true,
      error: '',
      payload: {
        student: null,
        studentName: '',
        program: '',
        academicYear: '',
        results: [],
        summary: {
          total: 0,
          averageScore: 0,
          latestGrade: '',
        },
      },
    }
  },

  computed: {
    results() {
      return Array.isArray(this.payload.results) ? this.payload.results : []
    },

    summary() {
      return this.payload.summary || { total: 0, averageScore: 0, latestGrade: '' }
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    gradeClass(grade) {
      const value = String(grade || '').trim().toUpperCase()

      if (['A', 'A+', 'B', 'B+'].includes(value)) return 'grade-good'
      if (['C', 'C+', 'D'].includes(value)) return 'grade-mid'

      return 'grade-low'
    },

    async load() {
      this.loading = true
      this.error = ''

      try {
        const response = await fetch(
          '/api/method/backend_custom_app.api.education.get_grades',
          { credentials: 'include', headers: { Accept: 'application/json' } }
        )

        const body = await response.json().catch(() => ({}))

        if (!response.ok) {
          const raw = body._server_messages

          if (raw) {
            try {
              const list = typeof raw === 'string' ? JSON.parse(raw) : raw
              throw new Error(JSON.parse(list[0])?.message || body.exception || '')
            } catch (parseError) {
              throw new Error(body.exception || `Server returned ${response.status}`)
            }
          }

          throw new Error(body.exception || `Server returned ${response.status}`)
        }

        this.payload = { ...this.payload, ...(body.message || {}) }
      } catch (err) {
        console.error('Grades API error:', err)
        this.error = err.message || 'Unable to load grades.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f4f7fb;
}

.main-content {
  flex: 1;
  margin-left: 255px;
  padding: 32px 34px 60px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}

.breadcrumb {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 13px;
}

.breadcrumb span {
  margin: 0 6px;
  color: #cbd5e1;
}

.page-header h1 {
  margin: 0;
  color: #1E1B33;
  font-size: 26px;
  font-weight: 800;
}

.page-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  max-width: 560px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #fff;
  color: #1E1B33;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-box {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #991b1b;
  margin-bottom: 22px;
}

.error-box button {
  margin-top: 10px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.error-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #fee2e2;
  font-weight: 800;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(69, 61, 137, 0.04);
}

.summary-label {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.summary-value {
  color: #1E1B33;
  font-size: 26px;
  font-weight: 800;
}

.program-value {
  font-size: 14px;
  line-height: 1.35;
}

.summary-hint {
  color: #94a3b8;
  font-size: 13px;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 26px rgba(69, 61, 137, 0.05);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid #eef2f7;
}

.eyebrow {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.panel-header h2 {
  margin: 0;
  color: #1E1B33;
  font-size: 16px;
  font-weight: 800;
}

.panel-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.loading-state,
.empty-state {
  padding: 40px 22px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.empty-state strong {
  display: block;
  margin-bottom: 6px;
  color: #1E1B33;
  font-size: 13px;
}

.table-wrap {
  overflow-x: auto;
}

/* Internal scroll for Grade Book rows (summary cards + heading stay outside). */
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

  background: #f8fafc;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 12px 18px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #eef2f7;
}

td {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 13px;
  vertical-align: top;
}

tr:last-child td {
  border-bottom: 0;
}

.criteria-chip {
  display: inline-block;
  margin: 0 6px 4px 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.grade-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.grade-good {
  background: #dcfce7;
  color: #166534;
}

.grade-mid {
  background: #fef9c3;
  color: #854d0e;
}

.grade-low {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .main-content {
    margin-left: 0;
    padding: 12px 16px 48px;
  }

  .page-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .record-scroll {
    max-height: 300px;
  }
}
</style>
