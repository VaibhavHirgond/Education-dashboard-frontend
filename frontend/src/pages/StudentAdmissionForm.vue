<template>
  <div class="admissions-page">
    <Sidebar />

    <main class="main-content">
      <div class="content-wrap form-wrap">

        <!-- HEADER -->
        <section class="page-header">
          <div class="header-left">
            <div class="breadcrumb">
              <router-link to="/admission-cycles">Student Admissions</router-link>
              <span class="breadcrumb-line">/</span>
              <span class="current">{{ isNew ? 'New Admission' : name }}</span>
            </div>
            <div class="title-row">
              <div class="title-icon">▤</div>
              <div>
                <h1>{{ isNew ? 'Add Student Admission' : displayName }}</h1>
                <p v-if="!isNew" class="doc-id">
                  {{ name }}
                  <span class="status-pill" :class="form.published ? 'status-published' : 'status-draft'">
                    <span class="dot"></span>{{ form.published ? 'Published' : 'Draft' }}
                  </span>
                </p>
                <p v-else>Define an admission cycle with its eligibility and fees.</p>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button
              v-if="!isNew"
              class="desk-btn desk-btn-danger"
              type="button"
              :disabled="deleting"
              @click="remove"
            >
              <span v-if="deleting" class="mini-spinner"></span>
              <span>{{ deleting ? 'Deleting…' : 'Delete' }}</span>
            </button>

            <button class="desk-btn desk-btn-secondary" type="button" @click="goBack">
              ← Back to list
            </button>

            <button
              class="desk-btn desk-btn-primary"
              type="button"
              :disabled="saving"
              @click="save"
            >
              <span v-if="saving" class="mini-spinner"></span>
              <span>{{ saving ? 'Saving…' : (isNew ? 'Create Admission' : 'Save Changes') }}</span>
            </button>
          </div>
        </section>

        <!-- GLOBAL ERROR -->
        <div v-if="globalError" class="alert error-alert">
          <span class="alert-icon">!</span>
          <div>{{ globalError }}</div>
        </div>

        <!-- SUCCESS -->
        <div v-if="successMessage" class="alert success-alert">
          <span class="alert-icon">✓</span>
          <div>{{ successMessage }}</div>
        </div>

        <!-- LOADING -->
        <section v-if="loading" class="state-panel">
          <div class="spinner"></div>
          <p>Loading admission…</p>
        </section>

        <div v-else class="form-body">

          <!-- ======================================================
               ADMISSION DETAILS
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Admission Details</h2>

            <div class="grid-2">
              <div class="field">
                <label>Title <span class="req">*</span></label>
                <input v-model.trim="form.title" type="text" placeholder="e.g. B.Tech Admission 2025-26" />
              </div>

              <div class="field">
                <label>Academic Year <span class="req">*</span></label>
                <LinkField
                  v-model="form.academic_year"
                  doctype="Academic Year"
                  placeholder="Search academic year…"
                />
              </div>

              <div class="field">
                <label>Admission Start Date</label>
                <input v-model="form.admission_start_date" type="date" />
              </div>

              <div class="field">
                <label>Admission End Date</label>
                <input v-model="form.admission_end_date" type="date" />
              </div>

              <div class="field">
                <label>Route</label>
                <input v-model.trim="form.route" type="text" placeholder="Optional website route slug" />
                <small class="hint">Used for the public admission page URL.</small>
              </div>

              <div class="field checkbox-stack">
                <label class="checkbox-label">
                  <input v-model="form.published" type="checkbox" :true-value="1" :false-value="0" />
                  <span>Publish on website</span>
                </label>
                <label class="checkbox-label">
                  <input v-model="form.enable_admission_application" type="checkbox" :true-value="1" :false-value="0" />
                  <span>Enable Admission Application</span>
                </label>
              </div>
            </div>
          </section>

          <!-- ======================================================
               INTRODUCTION
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Introduction</h2>
            <div class="field">
              <textarea
                v-model="form.introduction"
                rows="5"
                placeholder="Optional introductory text shown on the admission page…"
              ></textarea>
            </div>
          </section>

          <!-- ======================================================
               ELIGIBILITY AND DETAILS (child table)
          ======================================================= -->
          <section class="form-section">
            <div class="sub-header">
              <h2 class="section-title" style="margin:0">Eligibility and Details</h2>
              <button class="add-row-btn" type="button" @click="addProgram">+ Add Program</button>
            </div>
            <p class="section-hint">
              Programs offered under this admission cycle, with eligibility and fees.
            </p>

            <div v-if="form.program_details.length === 0" class="empty-rows">
              No programs added yet. Click “+ Add Program” to begin.
            </div>

            <div v-else class="child-table program-table">
              <div class="child-head">
                <span>Program</span>
                <span>Min Age</span>
                <span>Max Age</span>
                <span>Application Fee</span>
                <span>Naming Series</span>
                <span>Description</span>
                <span></span>
              </div>
              <div v-for="(row, i) in form.program_details" :key="i" class="child-row">
                <LinkField
                  v-model="row.program"
                  doctype="Program"
                  placeholder="Select program…"
                />
                <input v-model.number="row.min_age" type="number" min="0" placeholder="Min" />
                <input v-model.number="row.max_age" type="number" min="0" placeholder="Max" />
                <input v-model.number="row.application_fee" type="number" min="0" step="0.01" placeholder="0.00" />
                <input v-model.trim="row.applicant_naming_series" type="text" placeholder="EDU-APP-.YYYY.-" />
                <input v-model.trim="row.description" type="text" placeholder="Optional note" />
                <button class="remove-row-btn" type="button" title="Remove" @click="removeProgram(i)">×</button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import LinkField from '@/components/LinkField.vue'
import { apiGet, apiPost, extractMessage } from '@/lib/api'

function blankProgramRow() {
  return {
    program: '',
    min_age: null,
    max_age: null,
    application_fee: null,
    applicant_naming_series: '',
    description: '',
  }
}

function blankForm() {
  return {
    name: '',
    title: '',
    route: '',
    published: 0,
    enable_admission_application: 0,
    academic_year: '',
    admission_start_date: '',
    admission_end_date: '',
    introduction: '',
    program_details: [],
  }
}

export default {
  name: 'StudentAdmissionForm',

  components: { Sidebar, LinkField },

  data() {
    return {
      name: this.$route.params.name || '',
      isNew: !this.$route.params.name,
      form: blankForm(),
      loading: false,
      saving: false,
      deleting: false,
      globalError: '',
      successMessage: '',
    }
  },

  computed: {
    displayName() {
      return this.form.title || this.name
    },
  },

  created() {
    if (!this.isNew) {
      this.loadAdmission()
    }
  },

  methods: {
    async loadAdmission() {
      this.loading = true
      this.globalError = ''
      try {
        const res = await apiGet(
          '/api/method/backend_custom_app.api.admissions.get_admission',
          { name: this.name }
        )
        const merged = blankForm()
        for (const key of Object.keys(merged)) {
          if (key === 'program_details') continue
          if (res && res[key] !== undefined && res[key] !== null) {
            merged[key] = res[key]
          }
        }
        // Checks come back as 0/1.
        merged.published = res?.published ? 1 : 0
        merged.enable_admission_application = res?.enable_admission_application ? 1 : 0
        merged.program_details = (res?.program_details || []).map((r) => ({
          program: r.program || '',
          min_age: r.min_age ?? null,
          max_age: r.max_age ?? null,
          application_fee: r.application_fee ?? null,
          applicant_naming_series: r.applicant_naming_series || '',
          description: r.description || '',
        }))
        this.form = merged
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Unable to load admission.'
      } finally {
        this.loading = false
      }
    },

    addProgram() {
      this.form.program_details.push(blankProgramRow())
    },

    removeProgram(i) {
      this.form.program_details.splice(i, 1)
    },

    validate() {
      if (!this.form.title) return 'Title is required.'
      if (!this.form.academic_year) return 'Academic Year is required.'

      if (this.form.admission_start_date && this.form.admission_end_date) {
        if (new Date(this.form.admission_start_date) > new Date(this.form.admission_end_date)) {
          return 'Admission End Date cannot be before Admission Start Date.'
        }
      }

      for (const p of this.form.program_details) {
        if (!p.program) return 'Each program row needs a selected Program.'
      }

      return ''
    },

    buildPayload() {
      return {
        name: this.isNew ? undefined : this.name,
        title: this.form.title,
        route: this.form.route,
        published: this.form.published ? 1 : 0,
        enable_admission_application: this.form.enable_admission_application ? 1 : 0,
        academic_year: this.form.academic_year,
        admission_start_date: this.form.admission_start_date,
        admission_end_date: this.form.admission_end_date,
        introduction: this.form.introduction,
        program_details: this.form.program_details.map((p) => ({
          program: p.program,
          min_age: p.min_age,
          max_age: p.max_age,
          application_fee: p.application_fee,
          applicant_naming_series: p.applicant_naming_series,
          description: p.description,
        })),
      }
    },

    async save() {
      this.globalError = ''
      this.successMessage = ''

      const validationError = this.validate()
      if (validationError) {
        this.globalError = validationError
        return
      }

      this.saving = true
      try {
        const res = await apiPost(
          '/api/method/backend_custom_app.api.admissions.save_admission',
          { payload: JSON.stringify(this.buildPayload()) }
        )
        this.successMessage = res?.message || 'Student Admission saved.'

        if (this.isNew && res?.name) {
          this.$router.replace(`/admission-cycles/${encodeURIComponent(res.name)}`)
        } else {
          this.loadAdmission()
        }
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Unable to save the admission.'
      } finally {
        this.saving = false
      }
    },

    async remove() {
      if (!window.confirm(`Delete Student Admission ${this.name}? This cannot be undone.`)) {
        return
      }
      this.globalError = ''
      this.successMessage = ''
      this.deleting = true
      try {
        await apiPost(
          '/api/method/backend_custom_app.api.admissions.delete_admission',
          { name: this.name }
        )
        this.$router.push('/admission-cycles')
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Unable to delete the admission.'
      } finally {
        this.deleting = false
      }
    },

    goBack() {
      this.$router.push('/admission-cycles')
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
.content-wrap { width: min(100%, 1080px); margin: 0 auto; padding: 24px 32px 48px; }

/* HEADER */
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 18px; }

.breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #7c7c7c; }
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
.page-header p { margin: 4px 0 0; color: #7c7c7c; font-size: 13px; display: flex; align-items: center; gap: 10px; }
.doc-id { font-family: monospace; font-size: 13px; }

.header-actions { display: flex; align-items: center; gap: 8px; }

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
.desk-btn-danger { color: #b52a2a; background: #fff0f0; }
.desk-btn-danger:hover:not(:disabled) { background: #ffe4e4; }

.mini-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}
.desk-btn-secondary .mini-spinner, .desk-btn-danger .mini-spinner { border-color: rgba(56, 56, 56, 0.25); border-top-color: #383838; }
.desk-btn-danger .mini-spinner { border-color: rgba(181, 42, 42, 0.25); border-top-color: #b52a2a; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ALERTS */
.alert {
  display: flex; gap: 10px; align-items: flex-start; width: 100%; box-sizing: border-box;
  padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; font-size: 13px;
}
.error-alert { background: #fff0f0; border: 1px solid #f5c6c6; color: #b52a2a; }
.success-alert { background: #e4f5e9; border: 1px solid #b8e0c8; color: #16794c; }
.alert-icon {
  width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; font-weight: 600; font-size: 13px; background: rgba(0, 0, 0, 0.06); flex-shrink: 0;
}

/* STATE */
.state-panel {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 24px; text-align: center; background: #fff;
  border: 1px solid #e2e2e2; border-radius: 8px; color: #7c7c7c;
}
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #e2e2e2; border-top-color: #7c7c7c; animation: spin 0.8s linear infinite;
}

/* STATUS PILL — Desk gray/green */
.status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4.5px 8px; border-radius: 999px; font-size: 11px; font-weight: 420; letter-spacing: 0.02em; }
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
.status-published { color: #16794c; background: #e4f5e9; }
.status-published .dot { background: #16794c; }
.status-draft { color: #525252; background: #f3f3f3; }
.status-draft .dot { background: #7c7c7c; }

/* FORM */
.form-body { display: flex; flex-direction: column; gap: 16px; }

.form-section {
  background: #fff; border: 1px solid #e2e2e2;
  border-radius: 8px; padding: 18px 20px;
}
.section-title { margin: 0 0 14px; font-size: 13px; font-weight: 600; color: #171717; }
.section-hint { margin: 4px 0 14px; font-size: 13px; color: #7c7c7c; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 18px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; font-weight: 500; color: #383838; }
.field .req { color: #e03636; }

.field input[type="text"],
.field input[type="date"],
.field input[type="number"],
.field select,
.field textarea {
  height: 32px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  background: #f3f3f3; font-size: 13px; color: #383838; width: 100%; box-sizing: border-box;
}
.field textarea { height: auto; padding: 8px; resize: vertical; font-family: inherit; }
.field input:focus, .field select:focus, .field textarea:focus {
  outline: 0; border-color: #999999; background: #f3f3f3;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}

.hint { font-size: 13px; color: #7c7c7c; }

.checkbox-stack { justify-content: center; gap: 10px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 420; color: #383838; cursor: pointer; }
.checkbox-label input { width: 14px; height: 14px; }

/* CHILD TABLE */
.sub-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }

.add-row-btn {
  height: 28px; padding: 0 10px; border: 1px solid #c7c7c7; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.add-row-btn:hover { background: #e2e2e2; }

.empty-rows { padding: 14px; text-align: center; color: #7c7c7c; font-size: 13px; background: #f8f8f8; border-radius: 8px; }

.child-table { border: 1px solid #e2e2e2; border-radius: 8px; overflow-x: auto; }

.child-head {
  display: grid; gap: 8px; padding: 8px 12px; background: #f8f8f8;
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #7c7c7c;
  border-bottom: 1px solid #e2e2e2;
  grid-template-columns: 1.4fr 0.6fr 0.6fr 0.9fr 1.1fr 1fr 30px;
  min-width: 780px;
}
.child-head span:last-child { width: 30px; }

.child-row {
  display: grid; gap: 8px; padding: 8px 12px; align-items: center;
  border-bottom: 1px solid #f3f3f3;
  grid-template-columns: 1.4fr 0.6fr 0.6fr 0.9fr 1.1fr 1fr 30px;
  min-width: 780px;
}
.child-row:last-child { border-bottom: 0; }

.child-row input {
  height: 30px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  font-size: 13px; background: #f3f3f3; width: 100%; box-sizing: border-box;
}
.child-row input:focus {
  outline: 0; border-color: #999999;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}

.remove-row-btn {
  width: 28px; height: 28px; border: 0; border-radius: 8px; background: #fff0f0;
  color: #b52a2a; font-size: 14px; cursor: pointer; line-height: 1;
}
.remove-row-btn:hover { background: #ffe4e4; }

/* RESPONSIVE */
@media (max-width: 820px) {
  .main-content { margin-left: 0; }
  .page-header { flex-direction: column; align-items: stretch; }
  .grid-2 { grid-template-columns: 1fr; }
  .header-actions { flex-wrap: wrap; }
}
</style>
