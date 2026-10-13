<template>
  <div class="admissions-page">
    <Sidebar />

    <main class="main-content">
      <div class="content-wrap form-wrap">

        <!-- HEADER -->
        <section class="page-header">
          <div class="header-left">
            <div class="breadcrumb">
              <router-link to="/admissions">Student Applicants</router-link>
              <span class="breadcrumb-line">/</span>
              <span class="current">{{ isNew ? 'New Applicant' : name }}</span>
            </div>
            <div class="title-row">
              <div class="title-icon">✎</div>
              <div>
                <h1>{{ isNew ? 'Add Student Applicant' : displayName || name }}</h1>
                <p v-if="!isNew" class="doc-id">
                  {{ name }}
                  <span class="status-pill" :class="statusClass">
                    <span class="dot"></span>{{ form.application_status || 'Applied' }}
                  </span>
                </p>
                <p v-else>Fill in the application details below.</p>
              </div>
            </div>
          </div>

          <div class="header-actions">
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
              <span>{{ saving ? 'Saving…' : (isNew ? 'Create Applicant' : 'Save Changes') }}</span>
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
          <p>Loading applicant…</p>
        </section>

        <div v-else class="form-body">

          <!-- ======================================================
               WORKFLOW ACTIONS (edit mode only)
          ======================================================= -->
          <section v-if="!isNew" class="workflow-bar">
            <div class="workflow-label">Workflow</div>
            <div class="workflow-actions">
              <button
                v-if="canApprove"
                class="wf-btn wf-approve"
                type="button"
                :disabled="acting"
                @click="setStatus('Approved')"
              >Approve</button>

              <button
                v-if="canReject"
                class="wf-btn wf-reject"
                type="button"
                :disabled="acting"
                @click="setStatus('Rejected')"
              >Reject</button>

              <button
                v-if="canEnroll"
                class="wf-btn wf-enroll"
                type="button"
                :disabled="acting"
                @click="enroll"
              >Enroll → Student</button>
            </div>

            <div v-if="form.application_status === 'Admitted' && enrolledStudent" class="enrolled-note">
              Enrolled as
              <router-link :to="`/students`">{{ enrolledStudent }}</router-link>
            </div>
          </section>

          <!-- ======================================================
               APPLICATION DETAILS
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Application Details</h2>

            <div class="grid-2">
              <div class="field">
                <label>First Name <span class="req">*</span></label>
                <input v-model.trim="form.first_name" type="text" placeholder="First Name" />
              </div>

              <div class="field">
                <label>Middle Name</label>
                <input v-model.trim="form.middle_name" type="text" placeholder="Middle Name" />
              </div>

              <div class="field">
                <label>Last Name</label>
                <input v-model.trim="form.last_name" type="text" placeholder="Last Name" />
              </div>

              <div class="field">
                <label>Naming Series</label>
                <select v-model="form.naming_series">
                  <option value="EDU-APP-.YYYY.-">EDU-APP-.YYYY.-</option>
                </select>
              </div>

              <div class="field">
                <label>Application Date</label>
                <input v-model="form.application_date" type="date" />
              </div>

              <div class="field">
                <label>Application Status</label>
                <input :value="form.application_status || 'Applied'" type="text" disabled />
                <small class="hint">Set by the Approve / Reject / Enroll actions.</small>
              </div>

              <div class="field">
                <label>Program <span class="req">*</span></label>
                <LinkField
                  v-model="form.program"
                  doctype="Program"
                  placeholder="Search program…"
                />
              </div>

              <div class="field">
                <label>Student Email Address</label>
                <input v-model.trim="form.student_email_id" type="email" placeholder="student@example.com" />
              </div>

              <div class="field">
                <label>Student Admission</label>
                <LinkField
                  v-model="form.student_admission"
                  doctype="Student Admission"
                  placeholder="Search admission…"
                />
              </div>

              <div class="field">
                <label>Student Category</label>
                <LinkField
                  v-model="form.student_category"
                  doctype="Student Category"
                  placeholder="Search category…"
                />
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
                <label>Academic Term</label>
                <LinkField
                  v-model="form.academic_term"
                  doctype="Academic Term"
                  :filters="termFilters"
                  placeholder="Search academic term…"
                />
                <small v-if="form.academic_year" class="hint">Filtered by the selected Academic Year.</small>
              </div>

              <div class="field checkbox-field">
                <label class="checkbox-label">
                  <input v-model="form.paid" type="checkbox" true-value="1" false-value="0" />
                  <span>Paid</span>
                </label>
                <small class="hint">Mark only when the application fee has been received.</small>
              </div>
            </div>
          </section>

          <!-- ======================================================
               PERSONAL DETAILS
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Personal Details</h2>

            <div class="grid-2">
              <div class="field">
                <label>Date of Birth</label>
                <input v-model="form.date_of_birth" type="date" />
              </div>

              <div class="field">
                <label>Gender</label>
                <LinkField v-model="form.gender" doctype="Gender" placeholder="Search gender…" />
              </div>

              <div class="field">
                <label>Blood Group</label>
                <select v-model="form.blood_group">
                  <option value="">—</option>
                  <option v-for="b in BLOOD_GROUPS" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>

              <div class="field">
                <label>Student Mobile Number</label>
                <input v-model.trim="form.student_mobile_number" type="tel" placeholder="Mobile number" />
              </div>

              <div class="field">
                <label>Nationality</label>
                <input v-model.trim="form.nationality" type="text" placeholder="Nationality" />
              </div>
            </div>
          </section>

          <!-- ======================================================
               RELATIONS
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Relations</h2>

            <!-- Guardians -->
            <div class="sub-section">
              <div class="sub-header">
                <h3>Guardian Details</h3>
                <button class="add-row-btn" type="button" @click="addGuardian">+ Add Guardian</button>
              </div>

              <div v-if="form.guardians.length === 0" class="empty-rows">
                No guardians added yet.
              </div>

              <div v-else class="child-table">
                <div class="child-head">
                  <span>Guardian</span>
                  <span>Relation</span>
                  <span></span>
                </div>
                <div v-for="(row, i) in form.guardians" :key="i" class="child-row">
                  <LinkField
                    v-model="row.guardian"
                    doctype="Guardian"
                    placeholder="Select guardian…"
                  />
                  <select v-model="row.relation">
                    <option value="">—</option>
                    <option v-for="r in RELATIONS" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <button class="remove-row-btn" type="button" title="Remove" @click="removeGuardian(i)">×</button>
                </div>
              </div>
            </div>

            <!-- Siblings -->
            <div class="sub-section">
              <div class="sub-header">
                <h3>Sibling Details</h3>
                <button class="add-row-btn" type="button" @click="addSibling">+ Add Sibling</button>
              </div>

              <div v-if="form.siblings.length === 0" class="empty-rows">
                No siblings added yet.
              </div>

              <div v-else class="child-table sibling-table">
                <div class="child-head">
                  <span>Full Name</span>
                  <span>Gender</span>
                  <span>Same Institute</span>
                  <span>Institution</span>
                  <span>Student</span>
                  <span></span>
                </div>
                <div v-for="(row, i) in form.siblings" :key="i" class="child-row">
                  <input v-model.trim="row.full_name" type="text" placeholder="Full name" />
                  <LinkField v-model="row.gender" doctype="Gender" placeholder="Gender…" />
                  <select v-model="row.studying_in_same_institute">
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                  <input v-model.trim="row.institution" type="text" placeholder="Institution" />
                  <LinkField
                    v-if="row.studying_in_same_institute === 'YES'"
                    v-model="row.student"
                    doctype="Student"
                    placeholder="Student…"
                  />
                  <span v-else class="muted-cell">—</span>
                  <button class="remove-row-btn" type="button" title="Remove" @click="removeSibling(i)">×</button>
                </div>
              </div>
            </div>
          </section>

          <!-- ======================================================
               ADDRESS
          ======================================================= -->
          <section class="form-section">
            <h2 class="section-title">Address</h2>

            <div class="grid-2">
              <div class="field">
                <label>Address Line 1</label>
                <input v-model.trim="form.address_line_1" type="text" placeholder="Address line 1" />
              </div>

              <div class="field">
                <label>Address Line 2</label>
                <input v-model.trim="form.address_line_2" type="text" placeholder="Address line 2" />
              </div>

              <div class="field">
                <label>City</label>
                <input v-model.trim="form.city" type="text" placeholder="City" />
              </div>

              <div class="field">
                <label>State</label>
                <input v-model.trim="form.state" type="text" placeholder="State" />
              </div>

              <div class="field">
                <label>Pincode</label>
                <input v-model.trim="form.pincode" type="text" placeholder="Pincode" />
              </div>

              <div class="field">
                <label>Country</label>
                <LinkField v-model="form.country" doctype="Country" placeholder="Search country…" />
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const RELATIONS = ['Mother', 'Father', 'Others']

function blankForm() {
  // Local calendar date (not UTC) so the default Application Date
  // matches what the user sees, including just after midnight IST.
  const now = new Date()
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return {
    name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    naming_series: 'EDU-APP-.YYYY.-',
    application_date: localDate,
    application_status: 'Applied',
    program: '',
    student_email_id: '',
    student_admission: '',
    student_category: '',
    academic_year: '',
    academic_term: '',
    paid: '0',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    student_mobile_number: '',
    nationality: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    guardians: [],
    siblings: [],
  }
}

export default {
  name: 'StudentApplicantForm',

  components: { Sidebar, LinkField },

  data() {
    return {
      BLOOD_GROUPS,
      RELATIONS,
      name: this.$route.params.name || '',
      isNew: !this.$route.params.name,
      form: blankForm(),
      loading: false,
      saving: false,
      acting: false,
      globalError: '',
      successMessage: '',
      enrolledStudent: '',
    }
  },

  computed: {
    displayName() {
      return [this.form.first_name, this.form.middle_name, this.form.last_name]
        .filter(Boolean)
        .join(' ')
    },

    termFilters() {
      return this.form.academic_year ? { academic_year: this.form.academic_year } : null
    },

    statusClass() {
      const s = this.form.application_status || 'Applied'
      return (
        {
          Applied: 'status-applied',
          Approved: 'status-approved',
          Rejected: 'status-rejected',
          Admitted: 'status-admitted',
        }[s] || 'status-applied'
      )
    },

    canApprove() {
      return ['Applied', 'Rejected'].includes(this.form.application_status)
    },

    canReject() {
      return ['Applied', 'Approved'].includes(this.form.application_status)
    },

    canEnroll() {
      return this.form.application_status === 'Approved'
    },
  },

  created() {
    if (!this.isNew) {
      // Show the success flash passed via ?saved=1 (set right after a
      // create -> replace), then strip it so a later reload does not
      // replay the flash.
      if (this.$route.query.saved) {
        this.successMessage = 'Applicant saved.'
        this.$router.replace({ path: this.$route.path })
      }
      this.loadApplicant()
    }
  },

  watch: {
    // Navigating between /admissions/new and /admissions/:name (or
    // between two different applicants) reuses this component when the
    // route record is the same, so reload form state from the route.
    '$route.params.name'(val, old) {
      if (val === old) return
      this.name = val || ''
      this.isNew = !val
      this.form = blankForm()
      this.enrolledStudent = ''
      this.globalError = ''
      this.successMessage = this.$route.query.saved ? 'Applicant saved.' : ''
      if (this.$route.query.saved) {
        this.$router.replace({ path: this.$route.path })
      }
      if (!this.isNew) {
        this.loadApplicant()
      }
    },
  },

  methods: {
    async loadApplicant() {
      this.loading = true
      this.globalError = ''
      try {
        const res = await apiGet(
          '/api/method/backend_custom_app.api.admissions.get_applicant',
          { name: this.name }
        )
        // Merge server data over the blank form, keeping only known fields.
        const merged = blankForm()
        for (const key of Object.keys(merged)) {
          if (res && res[key] !== undefined && res[key] !== null) {
            merged[key] = res[key]
          }
        }
        merged.guardians = (res?.guardians || []).map((r) => ({
          guardian: r.guardian || '',
          relation: r.relation || '',
        }))
        merged.siblings = (res?.siblings || []).map((r) => ({
          full_name: r.full_name || '',
          gender: r.gender || '',
          studying_in_same_institute: r.studying_in_same_institute || 'NO',
          institution: r.institution || '',
          student: r.student || '',
        }))
        this.form = merged
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Unable to load applicant.'
      } finally {
        this.loading = false
      }
    },

    addGuardian() {
      this.form.guardians.push({ guardian: '', relation: '' })
    },

    removeGuardian(i) {
      this.form.guardians.splice(i, 1)
    },

    addSibling() {
      this.form.siblings.push({
        full_name: '',
        gender: '',
        studying_in_same_institute: 'NO',
        institution: '',
        student: '',
      })
    },

    removeSibling(i) {
      this.form.siblings.splice(i, 1)
    },

    validate() {
      if (!this.form.first_name) return 'First Name is required.'
      if (!this.form.program) return 'Program is required.'
      if (!this.form.academic_year) return 'Academic Year is required.'

      const email = this.form.student_email_id
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Please enter a valid Student Email Address.'
      }

      if (this.form.date_of_birth) {
        const dob = new Date(this.form.date_of_birth)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (dob >= today) return 'Date of Birth must be strictly before today.'
      }

      for (const g of this.form.guardians) {
        if (!g.guardian) return 'Each guardian row needs a selected Guardian.'
      }
      for (const s of this.form.siblings) {
        if (!s.full_name) return 'Each sibling row needs a Full Name.'
        if (s.studying_in_same_institute === 'YES' && !s.student) {
          return 'A sibling marked "Same Institute: YES" needs a selected Student.'
        }
      }

      return ''
    },

    buildPayload() {
      const payload = {
        name: this.isNew ? undefined : this.name,
        first_name: this.form.first_name,
        middle_name: this.form.middle_name,
        last_name: this.form.last_name,
        naming_series: this.form.naming_series,
        application_date: this.form.application_date,
        program: this.form.program,
        student_email_id: this.form.student_email_id,
        student_admission: this.form.student_admission,
        student_category: this.form.student_category,
        academic_year: this.form.academic_year,
        academic_term: this.form.academic_term,
        paid: this.form.paid === '1' || this.form.paid === 1 ? 1 : 0,
        date_of_birth: this.form.date_of_birth,
        gender: this.form.gender,
        blood_group: this.form.blood_group,
        student_mobile_number: this.form.student_mobile_number,
        nationality: this.form.nationality,
        address_line_1: this.form.address_line_1,
        address_line_2: this.form.address_line_2,
        city: this.form.city,
        state: this.form.state,
        pincode: this.form.pincode,
        country: this.form.country,
        guardians: this.form.guardians.map((g) => ({
          guardian: g.guardian,
          relation: g.relation,
        })),
        siblings: this.form.siblings.map((s) => ({
          full_name: s.full_name,
          gender: s.gender,
          studying_in_same_institute: s.studying_in_same_institute,
          institution: s.institution,
          student: s.student || undefined,
        })),
      }
      return payload
    },

    async save() {
      if (this.saving) return
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
          '/api/method/backend_custom_app.api.admissions.save_applicant',
          { payload: JSON.stringify(this.buildPayload()) }
        )

        if (this.isNew && res?.name) {
          // Route to the edit view so the workflow actions become
          // available. Pass ?saved=1 so the new component instance
          // shows the success flash instead of a blank header.
          this.$router.replace({
            path: `/admissions/${encodeURIComponent(res.name)}`,
            query: { saved: '1' },
          })
        } else {
          this.successMessage = res?.message || 'Applicant saved.'
          // Reload to pick up any server-side computed fields.
          this.loadApplicant()
        }
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Unable to save the applicant.'
      } finally {
        this.saving = false
      }
    },

    async setStatus(status) {
      if (this.acting) return
      this.globalError = ''
      this.successMessage = ''
      this.acting = true
      try {
        const res = await apiPost(
          '/api/method/backend_custom_app.api.admissions.set_applicant_status',
          { name: this.name, status }
        )
        this.form.application_status = res?.application_status || status
        this.successMessage = res?.message || `Applicant is now ${status}.`
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Action failed.'
      } finally {
        this.acting = false
      }
    },

    async enroll() {
      if (this.acting) return
      this.globalError = ''
      this.successMessage = ''
      if (!window.confirm('Enroll this approved applicant as a Student? This creates a Student and Program Enrollment.')) {
        return
      }
      this.acting = true
      try {
        const res = await apiPost(
          '/api/method/backend_custom_app.api.admissions.enroll_applicant',
          { name: this.name }
        )
        this.form.application_status = 'Admitted'
        this.enrolledStudent = res?.student || ''
        this.successMessage = res?.message || 'Applicant enrolled.'
      } catch (err) {
        this.globalError = extractMessage(err.body) || err.message || 'Enrollment failed.'
      } finally {
        this.acting = false
      }
    },

    goBack() {
      this.$router.push('/admissions')
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
  color: #0070cc; background: #edf6fd;
  font-size: 16px;
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

.mini-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}
.desk-btn-secondary .mini-spinner { border-color: rgba(56, 56, 56, 0.25); border-top-color: #383838; }
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

/* WORKFLOW BAR */
.workflow-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 14px; margin-bottom: 16px;
  background: #f8f8f8; border: 1px solid #e2e2e2; border-radius: 8px;
}
.workflow-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #7c7c7c; }
.workflow-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.wf-btn {
  height: 28px; padding: 0 10px; border: 0; border-radius: 8px;
  font-size: 13px; font-weight: 420; letter-spacing: 0.02em; cursor: pointer;
}
.wf-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.wf-approve { color: #16794c; background: #e4f5e9; }
.wf-approve:hover:not(:disabled) { background: #d4eedd; }
.wf-reject { color: #b52a2a; background: #fff0f0; }
.wf-reject:hover:not(:disabled) { background: #ffe4e4; }
.wf-enroll { color: #fff; background: #171717; }
.wf-enroll:hover:not(:disabled) { background: #040404; }

.enrolled-note { margin-left: auto; font-size: 13px; color: #0070cc; font-weight: 420; }
.enrolled-note a { color: #0070cc; }

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

/* FORM */
.form-body { display: flex; flex-direction: column; gap: 16px; }

.form-section {
  background: #fff; border: 1px solid #e2e2e2;
  border-radius: 8px; padding: 18px 20px;
}
.section-title { margin: 0 0 14px; font-size: 13px; font-weight: 600; color: #171717; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 18px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; font-weight: 500; color: #383838; }
.field .req { color: #e03636; }

.field input[type="text"],
.field input[type="email"],
.field input[type="tel"],
.field input[type="date"],
.field select {
  height: 32px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  background: #f3f3f3; font-size: 13px; color: #383838; width: 100%; box-sizing: border-box;
}
.field input:focus, .field select:focus {
  outline: 0; border-color: #999999; background: #f3f3f3;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}
.field input:disabled { background: #f8f8f8; color: #7c7c7c; cursor: not-allowed; }

.hint { font-size: 13px; color: #7c7c7c; }

.checkbox-field { justify-content: center; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 420; color: #383838; cursor: pointer; }
.checkbox-label input { width: 14px; height: 14px; }

/* CHILD TABLES */
.sub-section { margin-bottom: 18px; }
.sub-section:last-child { margin-bottom: 0; }

.sub-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sub-header h3 { margin: 0; font-size: 13px; font-weight: 600; color: #383838; }

.add-row-btn {
  height: 28px; padding: 0 10px; border: 1px solid #c7c7c7; border-radius: 8px;
  background: #f3f3f3; color: #383838; font-size: 13px; font-weight: 420; cursor: pointer;
}
.add-row-btn:hover { background: #e2e2e2; }

.empty-rows { padding: 14px; text-align: center; color: #7c7c7c; font-size: 13px; background: #f8f8f8; border-radius: 8px; }

.child-table { border: 1px solid #e2e2e2; border-radius: 8px; overflow: hidden; }

.child-head {
  display: grid; gap: 8px; padding: 8px 12px; background: #f8f8f8;
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #7c7c7c;
  border-bottom: 1px solid #e2e2e2;
}
.child-head span:last-child { width: 30px; }

.child-row {
  display: grid; gap: 8px; padding: 8px 12px; align-items: center;
  border-bottom: 1px solid #f3f3f3;
}
.child-row:last-child { border-bottom: 0; }

.child-table:not(.sibling-table) .child-head,
.child-table:not(.sibling-table) .child-row { grid-template-columns: 1fr 1fr 30px; }

.sibling-table .child-head,
.sibling-table .child-row { grid-template-columns: 1.2fr 0.8fr 0.9fr 1fr 1fr 30px; }

.child-row input, .child-row select {
  height: 30px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  font-size: 13px; background: #f3f3f3; width: 100%; box-sizing: border-box;
}
.child-row input:focus, .child-row select:focus {
  outline: 0; border-color: #999999;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}
/* LinkField renders its own wrapper - size its input to match siblings. */
.child-row .link-field input {
  height: 30px; padding: 0 8px; border: 1px solid #c7c7c7; border-radius: 8px;
  font-size: 13px; background: #f3f3f3; width: 100%; box-sizing: border-box;
}
.muted-cell {
  display: flex; align-items: center; height: 30px;
  color: #8d8d8d; font-size: 13px;
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
  .child-head { display: none; }
  .child-row, .child-table:not(.sibling-table) .child-row, .sibling-table .child-row {
    grid-template-columns: 1fr; gap: 8px;
  }
  .remove-row-btn { justify-self: start; }
}
</style>
