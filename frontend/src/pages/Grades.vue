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
            <strong class="summary-value">{{ summary.latestScore }}</strong>
            <span class="summary-hint">Most recent result</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Latest Grade</span>
            <strong class="summary-value">{{ summary.latestGrade || '—' }}</strong>
            <span class="summary-hint">Most recent result</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Standard</span>
            <strong class="summary-value program-value">{{ payload.standard || '—' }}</strong>
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

            <div class="grade-actions">
              <div class="assessment-dd-wrap">
                <span class="assessment-dd-label">Assessment</span>
                <div class="assessment-dd" v-bind:class="{ 'is-open': assessmentMenuOpen }">
                  <button
                    type="button"
                    class="assessment-dd-btn"
                    v-bind:aria-expanded="assessmentMenuOpen ? 'true' : 'false'"
                    v-on:click="toggleAssessmentMenu"
                    v-on:keydown.esc="closeAssessmentMenu"
                  >
                    <span class="assessment-dd-left">
                      <span class="assessment-dd-badge" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </span>
                      <span class="assessment-dd-text">{{ selectedAssessmentLabel }}</span>
                    </span>
                    <svg
                      class="assessment-dd-arrow"
                      v-bind:class="{ 'is-rotated': assessmentMenuOpen }"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div
                    class="assessment-dd-menu"
                    v-show="assessmentMenuOpen"
                    role="listbox"
                  >
                    <button
                      type="button"
                      class="assessment-dd-item"
                      v-bind:class="{ 'is-selected': selectedAssessment === '' }"
                      v-on:click="selectAssessment('')"
                    >
                      <span class="assessment-dd-item-dot" aria-hidden="true"></span>
                      <span class="assessment-dd-item-text">All Assessments</span>
                      <span class="assessment-dd-check" v-if="selectedAssessment === ''" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    </button>
                    <button
                      type="button"
                      class="assessment-dd-item"
                      v-for="item in assessments"
                      v-bind:key="item.value"
                      v-bind:class="{ 'is-selected': selectedAssessment === item.value }"
                      v-on:click="selectAssessment(item.value)"
                    >
                      <span class="assessment-dd-item-dot" aria-hidden="true"></span>
                      <span class="assessment-dd-item-text">{{ item.label }}</span>
                      <span class="assessment-dd-check" v-if="selectedAssessment === item.value" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                class="download-button"
                :disabled="!selectedAssessment || downloading"
                @click="downloadResult"
              >
                <span v-if="downloading">Generating…</span>
                <span v-else>Download Result</span>
              </button>
            </div>
          </div>

          <p v-if="!selectedAssessment" class="download-hint">
            Select an assessment to download its result
          </p>

          <p v-if="downloadError" class="download-error">
            {{ downloadError }}
          </p>

          <div v-if="loading" class="loading-state">
            Loading grades…
          </div>

          <div v-else-if="!filteredResults.length" class="empty-state">
            <strong v-if="!results.length">No grades yet</strong>
            <strong v-else>No submitted results for this assessment</strong>
            <p v-if="!results.length">
              Your assessment results will appear here once they
              are published.
            </p>
            <p v-else>
              Choose another assessment from the filter above.
            </p>
          </div>

          <div v-else class="table-wrap record-scroll">
            <table>
              <thead>
                <tr>
                  <th>ASSESSMENT</th>
                  <th>SUBJECT</th>
                  <th>CRITERIA BREAKDOWN</th>
                  <th>SCORE</th>
                  <th>MAX</th>
                  <th>GRADE</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="row in filteredResults" :key="row.id">
                  <td>
                    <strong>{{ row.assessment || row.id }}</strong>
                  </td>
                  <td>{{ row.subject || row.course || '—' }}</td>
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
      selectedAssessment: '',
      assessmentMenuOpen: false,
      downloading: false,
      downloadError: '',
      payload: {
        student: null,
        studentName: '',
        standard: '',
        program: '',
        academicYear: '',
        assessments: [],
        results: [],
        summary: {
          total: 0,
          latestScore: 0,
          latestGrade: '',
        },
      },
    }
  },

  computed: {
    results() {
      return Array.isArray(this.payload.results) ? this.payload.results : []
    },

    assessments() {
      return Array.isArray(this.payload.assessments) ? this.payload.assessments : []
    },

    selectedAssessmentLabel() {
      if (!this.selectedAssessment) {
        return 'All Assessments'
      }
      for (var i = 0; i < this.assessments.length; i++) {
        if (this.assessments[i].value === this.selectedAssessment) {
          return this.assessments[i].label
        }
      }
      return 'All Assessments'
    },

    filteredResults() {
      var list = []
      var parents = {}
      if (this.payload.assessmentGroupParents && typeof this.payload.assessmentGroupParents === 'object') {
        parents = this.payload.assessmentGroupParents
      }
      var allResults = this.results

      if (!this.selectedAssessment) {
        return allResults
      }

      var allowed = {}
      allowed[this.selectedAssessment] = true
      var changed = true
      var guard = 0
      while (changed && guard < 200) {
        changed = false
        guard++
        for (var key in allowed) {
          if (!allowed[key]) {
            continue
          }
          var p = parents[key]
          if (p && p !== 'All Assessment Groups' && !allowed[p]) {
            allowed[p] = true
            changed = true
          }
        }
        for (var i = 0; i < allResults.length; i++) {
          var g = allResults[i].assessmentGroup || ''
          if (g && allowed[g]) {
            var gp = parents[g]
            if (gp && gp !== 'All Assessment Groups' && !allowed[gp]) {
              allowed[gp] = true
              changed = true
            }
          }
        }
      }

      for (var i = 0; i < allResults.length; i++) {
        var row = allResults[i]
        var gname = row.assessmentGroup || ''
        if (allowed[gname]) {
          list.push(row)
        }
      }

      return list
    },

    summary() {
      return this.payload.summary || { total: 0, latestScore: 0, latestGrade: '' }
    },
  },

  mounted() {
    document.addEventListener('click', this.onDocumentClick)
    document.addEventListener('keydown', this.onDocumentKeydown)
    this.load()
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick)
    document.removeEventListener('keydown', this.onDocumentKeydown)
  },

  methods: {
    onDocumentClick(e) {
      var root = this.$el
      if (!root) {
        return
      }
      if (!root.contains(e.target)) {
        this.assessmentMenuOpen = false
      }
    },
    onDocumentKeydown(e) {
      if (e.key === 'Escape') {
        this.assessmentMenuOpen = false
      }
    },
    toggleAssessmentMenu() {
      this.assessmentMenuOpen = !this.assessmentMenuOpen
    },
    closeAssessmentMenu() {
      this.assessmentMenuOpen = false
    },
    selectAssessment(val) {
      this.selectedAssessment = val
      this.assessmentMenuOpen = false
    },
    gradeClass(grade) {
      const value = String(grade || '').trim().toUpperCase()

      if (['A', 'A+', 'B', 'B+'].includes(value)) return 'grade-good'
      if (['C', 'C+', 'D'].includes(value)) return 'grade-mid'

      return 'grade-low'
    },

    downloadResult() {
      if (!this.selectedAssessment || this.downloading) {
        return
      }

      var self = this
      self.downloading = true
      self.downloadError = ''

      var url = '/api/method/backend_custom_app.api.education.download_result?assessment_group=' + encodeURIComponent(self.selectedAssessment)

      fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/pdf' }
      }).then(function(response) {
        if (!response.ok) {
          return response.text().then(function(text) {
            var message = text || 'Unable to generate result.'
            var detail = message.match(/"exception":"([^"]+)"/)
            if (detail) {
              message = detail[1]
            }
            throw new Error(message)
          })
        }

        return response.blob().then(function(blob) {
          var disposition = response.headers.get('Content-Disposition') || ''
          var match = disposition.match(/filename="?([^";]+)"?/)
          var filename = match ? match[1] : 'Result.pdf'
          var objectUrl = window.URL.createObjectURL(blob)
          var link = document.createElement('a')

          link.href = objectUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(objectUrl)
        })
      }).then(function() {
        self.downloading = false
      }).catch(function(err) {
        self.downloading = false
        self.downloadError = err.message || 'Unable to generate result.'
      })
    },

    async load() {
      this.loading = true
      this.error = ''
      this.downloadError = ''

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

        var found = false
        for (var i = 0; i < this.assessments.length; i++) {
          if (this.assessments[i].value === this.selectedAssessment) {
            found = true
          }
        }

        if (this.selectedAssessment && !found) {
          this.selectedAssessment = ''
        }
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

.grade-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.assessment-dd-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.assessment-dd-label {
  font-size: 13px;
  color: #475569;
}

.assessment-dd {
  position: relative;
  min-width: 280px;
}

.assessment-dd-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #1E1B33;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.assessment-dd-btn:focus {
  outline: 2px solid #453D89;
  outline-offset: 2px;
}

.assessment-dd-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.assessment-dd-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #F1EEFA;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.assessment-dd-badge svg {
  width: 18px;
  height: 18px;
}

.assessment-dd-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assessment-dd-arrow {
  width: 18px;
  height: 18px;
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.assessment-dd-arrow.is-rotated {
  transform: rotate(180deg);
}

.assessment-dd-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(30, 27, 51, 0.12);
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
}

.assessment-dd-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #1E1B33;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.assessment-dd-item:hover {
  background: #f3f0ff;
}

.assessment-dd-item.is-selected {
  background: #ede9fe;
  font-weight: 600;
}

.assessment-dd-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #453D89;
  flex-shrink: 0;
}

.assessment-dd-item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assessment-dd-check {
  width: 18px;
  height: 18px;
  color: #453D89;
  flex-shrink: 0;
}

.assessment-dd-check svg {
  width: 18px;
  height: 18px;
}

.download-button {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #1E1B33;
  background: #1E1B33;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-end;
}

.download-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.download-hint {
  margin: 0 22px 16px;
  color: #64748b;
  font-size: 13px;
}

.download-error {
  margin: 0 22px 16px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
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

  .panel-header {
    flex-direction: column;
  }

  .grade-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .assessment-dd {
    width: 100%;
    min-width: 0;
  }

  .download-button {
    width: 100%;
    align-self: stretch;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .record-scroll {
    max-height: 300px;
  }
}
</style>
