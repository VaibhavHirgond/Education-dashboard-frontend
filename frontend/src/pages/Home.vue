<template>
  <div class="app-shell">

    <!-- =====================================================
         MAIN
    ====================================================== -->
    <main class="main">

      <div class="content">

        

        <!-- =================================================
             LOADING / ROLE NOT RESOLVED YET
             The role split below must not flash the staff
             dashboard for students/instructors while the context
             request is still in flight.
        ================================================== -->
        <template v-if="loading">

          <section class="hero">

            <div class="hero-content">

              <div class="hero-label">
                <span></span>
                EDUCATION PORTAL
              </div>

              <h2>
                Loading your dashboard…
              </h2>

              <p>
                Fetching your role and the latest data from the backend.
              </p>

            </div>

          </section>

        </template>

        <!-- Show context errors instead of an endless loading screen. -->
        <template v-else-if="!context">
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label">
                <span></span>
                EDUCATION PORTAL
              </div>

              <h2>Dashboard could not load</h2>

              <p>
                {{ error || 'Unable to determine your user role. Please try again.' }}
              </p>

              <button type="button" @click="refreshDashboard">
                Try again
              </button>
            </div>
          </section>
        </template>

        <!-- =================================================
             INSTRUCTOR DASHBOARD (own groups + students only)
        ================================================== -->
        

        <!-- =================================================
             ADMIN DASHBOARD (staff only)
             isStudent/isInstructor are both false for an
             unresolved context, so this branch is gated on
             isStaff instead of !isStudent.
        ================================================== -->
        <template v-else-if="isStaff">

        <!-- =================================================
             HERO
        ================================================== -->
        <section class="hero">

          <div class="hero-content">

            <div class="hero-label">
              <span></span>
              EDUCATION MANAGEMENT
            </div>

            <h2>
              {{ greeting }}
              <span>👋</span>
            </h2>

            <p>
              A live overview of students, teaching staff,
              fee collection and attendance.
            </p>
          </div>

          <div class="hero-orb orb-one"></div>
          <div class="hero-orb orb-two"></div>

        </section>

        <!-- =================================================
             ERROR
        ================================================== -->
        <div
          v-if="error"
          class="error-alert"
        >
          <strong>
            Dashboard error
          </strong>

          <span>
            {{ error }}
          </span>

          <button
            type="button"
            @click="refreshDashboard"
          >
            Try again
          </button>
        </div>

        <!-- =================================================
             SUMMARY CARDS
        ================================================== -->
        <section class="stats-grid">

          <!-- Card 1 — Students -->
          <article class="stat-card blue-card">

            <div class="stat-card-top">
              <div class="stat-icon blue">
                ♙
              </div>

              <span class="stat-tag">
                STUDENTS
              </span>
            </div>

            <div class="stat-body dual-metric">

              <div>
                <span>
                  Total Students
                </span>

                <strong>
                  {{ adminStats.students.total }}
                </strong>
              </div>

              <div>
                <span>
                  Present Today
                </span>

                <strong>
                  {{ adminStats.students.present_today }}
                </strong>
              </div>

            </div>

            <div class="stat-footer">
              <span class="green-dot"></span>

              Enabled student records ·
              {{ adminStats.students.attendance_date || 'today' }}
            </div>

            <div class="card-glow blue-glow"></div>

          </article>

          <!-- Card 2 — Teachers -->
          <article class="stat-card green-card">

            <div class="stat-card-top">
              <div class="stat-icon green">
                ★
              </div>

              <span class="stat-tag green-tag">
                TEACHERS
              </span>
            </div>

            <div class="stat-body dual-metric">

              <div>
                <span>
                  Total Teachers
                </span>

                <strong>
                  {{ adminStats.teachers.total }}
                </strong>
              </div>

              <div>
                <span>
                  Present Today
                </span>

                <strong
                  v-if="adminStats.teachers.present_available"
                >
                  {{ adminStats.teachers.present_today }}
                </strong>

                <strong
                  v-else
                  class="na-value"
                  :title="adminStats.teachers.note"
                >
                  Not configured
                </strong>
              </div>

            </div>

            <div class="stat-footer">
              <span class="orange-dot"></span>

              Active instructor records
            </div>

            <div class="card-glow green-glow"></div>

          </article>

          <!-- Card 3 — Fees -->
          <article class="stat-card orange-card">

            <div class="stat-card-top">
              <div class="stat-icon orange">
                ₹
              </div>

              <span class="stat-tag orange-tag">
                FEES
              </span>
            </div>

            <div class="stat-body dual-metric">

              <div>
                <span>
                  Fees Collected
                </span>

                <strong>
                  {{
                    formatCompactCurrency(
                      adminStats.fees.collected
                    )
                  }}
                </strong>
              </div>

              <div>
                <span>
                  Outstanding Fees
                </span>

                <strong>
                  {{
                    formatCompactCurrency(
                      adminStats.fees.outstanding
                    )
                  }}
                </strong>
              </div>

            </div>

            <div class="stat-footer">
              <span
                :class="
                  adminStats.fees.outstanding > 0
                    ? 'orange-dot'
                    : 'green-dot'
                "
              ></span>

              {{ adminPeriodLabel || 'Posted payments' }}
            </div>

            <div class="card-glow orange-glow"></div>

          </article>

          <!-- Card 4 — Attendance -->
          <article class="stat-card purple-card">

            <div class="stat-card-top">
              <div class="stat-icon purple">
                %
              </div>

              <span class="stat-tag purple-tag">
                ATTENDANCE
              </span>
            </div>

            <div class="stat-body">
              <span>
                Student attendance
              </span>

              <strong v-if="adminStats.attendance.available">
                {{ adminStats.attendance.percentage }}%
              </strong>

              <strong v-else class="na-value">
                No records
              </strong>
            </div>

            <div class="stat-footer">
              <span class="green-dot"></span>

              <template v-if="adminStats.attendance.available">
                {{ adminStats.attendance.present_days }}
                of {{ adminStats.attendance.recorded_days }}
                student-days present
              </template>

              <template v-else>
                No submitted attendance in this period
              </template>
            </div>

            <div class="card-glow purple-glow"></div>

          </article>

        </section>

        <!-- =================================================
             CHARTS + QUICK ACTIONS
        ================================================== -->
        <section class="dashboard-layout">

          <div class="dashboard-main">

            <!-- =============================================
                 CHART 1 — FEES COLLECTED
            ============================================== -->
            <article class="panel chart-panel">

              <div class="panel-header">

                <div class="panel-title">

                  <div class="panel-icon blue">
                    ₹
                  </div>

                  <div>
                    <h3>
                      Fees Collected
                    </h3>

                    <p>
                      Monthly payment allocations
                      · {{ adminPeriodLabel }}
                    </p>
                  </div>

                </div>

                <div class="panel-total">
                  <span>
                    TOTAL COLLECTED
                  </span>

                  <strong>
                    {{ formatCurrency(adminStats.fees.collected) }}
                  </strong>
                </div>

              </div>

              <div class="chart">

                <div class="chart-y">
                  <span
                    v-for="(label, index) in feesChartAxis"
                    :key="`fee-y-${index}`"
                  >
                    {{ label }}
                  </span>
                </div>

                <div class="chart-grid">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div
                  v-for="month in adminStats.charts.fees_collected"
                  :key="month.month"
                  class="chart-item"
                >

                  <div class="chart-tooltip">
                    {{ month.label }}
                    · {{ formatCurrency(month.amount) }}
                  </div>

                  <div class="bar-area">

                    <div
                      class="bar"
                      :style="{
                        height:
                          `${getFeesBarHeight(month.amount)}%`
                      }"
                    >
                      <div class="bar-highlight"></div>
                    </div>

                  </div>

                  <span>
                    {{ month.short }}
                  </span>

                </div>

                <div
                  v-if="!adminStats.charts.fees_collected.length"
                  class="chart-empty"
                >
                  No fee collection data available for this period.
                </div>

              </div>

            </article>

            <!-- =============================================
                 CHART 2 — ATTENDANCE
            ============================================== -->
            <article class="panel chart-panel">

              <div class="panel-header">

                <div class="panel-title">

                  <div class="panel-icon purple">
                    %
                  </div>

                  <div>
                    <h3>
                      Attendance
                    </h3>

                    <p>
                      Monthly student attendance percentage
                      · {{ adminPeriodLabel }}
                    </p>
                  </div>

                </div>

                <div class="panel-total">
                  <span>
                    OVERALL
                  </span>

                  <strong v-if="adminStats.attendance.available">
                    {{ adminStats.attendance.percentage }}%
                  </strong>

                  <strong v-else>
                    —
                  </strong>
                </div>

              </div>

              <div class="chart">

                <div class="chart-y">
                  <span
                    v-for="(label, index) in attendanceChartAxis"
                    :key="`att-y-${index}`"
                  >
                    {{ label }}
                  </span>
                </div>

                <div class="chart-grid">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div
                  v-for="month in adminStats.charts.attendance"
                  :key="month.month"
                  class="chart-item"
                >

                  <div class="chart-tooltip">
                    {{ attendanceTooltip(month) }}
                  </div>

                  <div class="bar-area">

                    <div
                      class="bar bar-pink"
                      :style="{
                        height:
                          `${getAttendanceBarHeight(month.percentage)}%`
                      }"
                    >
                      <div class="bar-highlight"></div>
                    </div>

                  </div>

                  <span>
                    {{ month.short }}
                  </span>

                </div>

                <div
                  v-if="!hasAttendanceChartData"
                  class="chart-empty"
                >
                  No submitted attendance records for this period.
                </div>

              </div>

            </article>

          </div>

          <!-- =============================================
               QUICK ACTIONS
          ============================================== -->
          <aside class="quick-actions-panel">

            <h3>
              Quick Actions
            </h3>

            <p>
              Jump straight to common administrative tasks
            </p>

           <a
  href="/desk/student-applicant/new-student-applicant-prmpkqagiy"
  class="quick-action-card"
  onclick="window.top.location.href=this.href; return false;"
>

              <div class="quick-action-icon application">
                ✎
              </div>

              <div>
                <strong>
                  Add Student Application
                </strong>

                <span>
                  Create a new student applicant record
                </span>
              </div>

              <b>
                →
              </b>

            </a>

            <a
  href="/desk/instructor/new-instructor-tmjocfaadi"
  class="quick-action-card"
  onclick="window.top.location.href=this.href; return false;"
>

              <div class="quick-action-icon teacher">
                ★
              </div>

              <div>
                <strong>
                  Add Teacher
                </strong>

                <span>
                  Manage instructor records
                </span>
              </div>

              <b>
                →
              </b>

            </a>

           <a
  href="/desk/query-report/Student%20Fee%20Collection"
  class="quick-action-card"
  onclick="window.top.location.href=this.href; return false;"
>

              <div class="quick-action-icon fees">
                ₹
              </div>

              <div>
                <strong>
                  Fee Reports
                </strong>

                <span>
                  View collections and outstanding fees
                </span>
              </div>

              <b>
                →
              </b>

            </a>

          </aside>

        </section>
        </template>

        <StudentDashboard v-else-if="isStudent" />

        <!-- =================================================
             FOOTER
        ================================================== -->
        <footer class="footer">

          <span>
            © 2026 Education Management System
          </span>

          <span>
            Powered by Frappe
          </span>

        </footer>

      </div>

    </main>

  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import StudentDashboard from '@/pages/StudentDashboard.vue'
import { getContext, isInstructorUser, isStaffUser, isStudentUser } from '@/lib/context'

export default {
  name: 'Home',

  components: {
    Sidebar,
    StudentDashboard,
  },

  data() {
    return {
      loading: true,

      error: null,

      context: null,

      studentDashboard: null,

      dashboard: {
        mode: null,
      },

      adminStats: {
        period: null,

        students: {
          total: 0,
          present_today: 0,
          attendance_date: '',
        },

        teachers: {
          total: 0,
          present_today: null,
          present_available: false,
          note: '',
        },

        fees: {
          collected: 0,
          outstanding: 0,
        },

        attendance: {
          percentage: null,
          present_days: 0,
          recorded_days: 0,
          available: false,
        },

        charts: {
          fees_collected: [],
          attendance: [],
        },
      },

      profileTabs: ['Personal', 'Contact', 'Academic'],

      activeProfileTab: 'Personal',

      profilePhotoBroken: false,

    }
  },

  computed: {
    isStudent() {
      if (this.context) {
        return isStudentUser(this.context)
      }

      return this.dashboard?.mode === 'student'
    },

    isInstructor() {
      if (this.context) {
        return isInstructorUser(this.context)
      }

      return this.dashboard?.mode === 'instructor'
    },

    isStaff() {
      if (this.context) {
        return isStaffUser(this.context)
      }

      return this.dashboard?.mode === 'staff'
    },

    instructorGroups() {
      return Array.isArray(this.dashboard?.groups)
        ? this.dashboard.groups
        : []
    },

    instructorToday() {
      return Array.isArray(this.dashboard?.today_sessions)
        ? this.dashboard.today_sessions
        : []
    },

    instructorPendingLeaves() {
      return Array.isArray(this.dashboard?.pending_leave_requests)
        ? this.dashboard.pending_leave_requests.slice(0, 10)
        : []
    },

    instructorStudentsCount() {
      return this.dashboard?.students_count || 0
    },

    instructorSessionsCount() {
      return this.dashboard?.sessions_count || 0
    },

    instructorAttendance() {
      return this.dashboard?.attendance || {}
    },

    studentProfile() {
      return (
        this.studentDashboard?.profile ||
        this.context?.student ||
        {}
      )
    },

    studentDisplayName() {
      return (
        this.studentProfile.student_name ||
        this.context?.full_name ||
        'Student'
      )
    },

    studentInitials() {
      return this.getInitials(this.studentDisplayName)
    },

    profilePhoto() {
      if (this.profilePhotoBroken) {
        return ''
      }

      return this.studentProfile.image || ''
    },

    profileFullName() {
      const parts = [
        this.studentProfile.first_name,
        this.studentProfile.middle_name,
        this.studentProfile.last_name,
      ].filter(Boolean)

      if (parts.length) {
        return parts.join(' ')
      }

      return (
        this.studentProfile.student_name ||
        this.context?.full_name ||
        ''
      )
    },

    primaryGuardian() {
      const guardians = this.studentProfile.guardians

      if (Array.isArray(guardians) && guardians.length) {
        return guardians[0]
      }

      return {}
    },

    profileAddress() {
      const parts = [
        this.studentProfile.address_line_1,
        this.studentProfile.address_line_2,
        this.studentProfile.city,
        this.studentProfile.state,
        this.studentProfile.pincode,
        this.studentProfile.country,
      ].filter(Boolean)

      return parts.join(', ')
    },

    profileGroups() {
      const groups = this.studentProfile.groups

      return Array.isArray(groups) ? groups : []
    },

    studentAttendance() {
      return this.studentDashboard?.attendance || {}
    },

    studentFees() {
      return this.studentDashboard?.fees || {}
    },

    studentFeesRows() {
      const rows = this.studentFees.fees

      return Array.isArray(rows) ? rows.slice(0, 6) : []
    },

    studentUpcoming() {
      const rows = this.studentDashboard?.timetable

      return Array.isArray(rows) ? rows.slice(0, 6) : []
    },

    studentLeaveRows() {
      const rows = this.studentDashboard?.leave_applications

      return Array.isArray(rows) ? rows.slice(0, 6) : []
    },

    pendingLeaveCount() {
      return this.studentLeaveRows.filter(
        row => row.status === 'Pending'
      ).length
    },

    nextClassLabel() {
      const session = this.studentUpcoming[0]

      if (!session) {
        return 'None scheduled'
      }

      return `${this.formatDate(session.date)} ${session.fromTime || ''}`
    },

    adminPeriodLabel() {
      const period = this.adminStats?.period

      if (!period?.from_date || !period?.to_date) {
        return ''
      }

      return `${period.label} · ${this.formatDate(period.from_date)} – ${this.formatDate(period.to_date)}`
    },

    chartFeesMax() {
      const series = this.adminStats?.charts?.fees_collected || []

      return series.reduce(
        (max, month) =>
          Math.max(max, Number(month.amount) || 0),
        0
      )
    },

    feesChartAxis() {
      const max = this.chartFeesMax

      return [
        this.formatCompactCurrency(max),
        this.formatCompactCurrency(max * 0.75),
        this.formatCompactCurrency(max * 0.5),
        this.formatCompactCurrency(max * 0.25),
        '0',
      ]
    },

    attendanceChartAxis() {
      return ['100%', '75%', '50%', '25%', '0']
    },

    hasAttendanceChartData() {
      const series = this.adminStats?.charts?.attendance || []

      return series.some(
        month => Number(month.percentage) > 0
      )
    },

    greeting() {
      const hour = new Date().getHours()

      if (hour >= 5 && hour < 12) {
        return 'Good morning'
      }

      if (hour >= 12 && hour < 17) {
        return 'Good afternoon'
      }

      if (hour >= 17 && hour < 21) {
        return 'Good evening'
      }

      return 'Good night'
    },
  },

  mounted() {
  this.loadDashboard()
  this.$nextTick(() => {
    this.reportDashboardHeight()
  })

  this._dashboardResizeObserver = new ResizeObserver(() => {
    this.reportDashboardHeight()
  })

  this._dashboardResizeObserver.observe(this.$el)
  window.addEventListener('resize', this.reportDashboardHeight)
},

beforeUnmount() {
  if (this._dashboardResizeObserver) {
    this._dashboardResizeObserver.disconnect()
  }

  window.removeEventListener('resize', this.reportDashboardHeight)
},

  methods: {
    
reportDashboardHeight() {
  this.$nextTick(() => {
    const height = Math.ceil(
      Math.max(
        this.$el.scrollHeight,
        this.$el.offsetHeight
      )
    )

    window.parent.postMessage(
      {
        type: 'education-dashboard-height',
        height
      },
      window.location.origin
    )
  })
},

    async refreshDashboard() {
      await this.loadDashboard()
    },

    async fetchJson(url) {
      const response = await fetch(
        url,
        {
          credentials: 'include',

          headers: {
            Accept: 'application/json',
          },
        }
      )

      let result = null

      try {
        result = await response.json()
      } catch (jsonError) {
        throw new Error(
          `Invalid response received from ${url}`
        )
      }

      if (!response.ok) {
        throw new Error(
          result?.exception ||
          result?.message ||
          `Request failed with status ${response.status}`
        )
      }

      return result
    },
    async loadDashboard() {
      this.loading = true
      this.error = null

      try {
        this.context = await getContext()

        // StudentDashboard.vue loads student data independently.
        if (isStudentUser(this.context)) {
          this.dashboard = {
            ...this.dashboard,
            mode: 'student',
          }
          return
        }

        if (isStaffUser(this.context)) {
          const adminResult = await this.fetchJson(
            '/api/method/backend_custom_app.api.dashboard.get_admin_dashboard'
          )

          this.adminStats = this.normalizeAdminStats(
            adminResult?.message
          )

          this.dashboard = {
            ...this.dashboard,
            mode: 'staff',
          }
          return
        }

        // Instructor dashboard remains loaded by Home.vue.
        const dashboardResult = await this.fetchJson(
          '/api/method/backend_custom_app.api.education.get_dashboard'
        )

        if (dashboardResult?.message) {
          this.dashboard = {
            ...this.dashboard,
            ...dashboardResult.message,
          }
        }
      } catch (error) {
        console.error('Dashboard API error:', error)
        this.error =
          error?.message ||
          'Unable to load dashboard data.'
      } finally {
        this.loading = false
      }
    },

    normalizeAdminStats(message) {
      const data =
        message && typeof message === 'object'
          ? message
          : {}

      return {
        period: data.period || null,

        students: {
          total: Number(data.students?.total) || 0,

          present_today:
            Number(data.students?.present_today) || 0,

          attendance_date:
            data.students?.attendance_date || '',
        },

        teachers: {
          total: Number(data.teachers?.total) || 0,

          present_today:
            data.teachers?.present_today ?? null,

          present_available:
            !!data.teachers?.present_available,

          note: data.teachers?.note || '',
        },

        fees: {
          collected:
            Number(data.fees?.collected) || 0,

          outstanding:
            Number(data.fees?.outstanding) || 0,
        },

        attendance: {
          percentage:
            data.attendance?.percentage === null ||
            data.attendance?.percentage === undefined
              ? null
              : Number(data.attendance.percentage),

          present_days:
            Number(data.attendance?.present_days) || 0,

          recorded_days:
            Number(data.attendance?.recorded_days) || 0,

          available:
            !!data.attendance?.available,
        },

        charts: {
          fees_collected: Array.isArray(
            data.charts?.fees_collected
          )
            ? data.charts.fees_collected
            : [],

          attendance: Array.isArray(
            data.charts?.attendance
          )
            ? data.charts.attendance
            : [],
        },
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }
      ).format(
        Number(value) || 0
      )
    },

    formatCompactCurrency(value) {
      const amount =
        Number(value) || 0

      if (amount >= 10000000) {
        return `₹${(
          amount / 10000000
        ).toFixed(2)}Cr`
      }

      if (amount >= 100000) {
        return `₹${(
          amount / 100000
        ).toFixed(2)}L`
      }

      if (amount >= 1000) {
        return `₹${(
          amount / 1000
        ).toFixed(1)}K`
      }

      return this.formatCurrency(
        amount
      )
    },

    getFeesBarHeight(amount) {
      const series =
        this.adminStats?.charts?.fees_collected || []

      const maxAmount = series.reduce(
        (max, month) =>
          Math.max(max, Number(month.amount) || 0),
        0
      )

      if (!maxAmount) {
        return 3
      }

      if (!Number(amount)) {
        return 3
      }

      return Math.max(
        Math.round(
          (Number(amount) / maxAmount) * 100
        ),
        5
      )
    },

    getAttendanceBarHeight(percentage) {
      const value = Number(percentage)

      if (!Number.isFinite(value) || value <= 0) {
        return 3
      }

      return Math.max(
        Math.min(Math.round(value), 100),
        5
      )
    },

    attendanceTooltip(month) {
      if (
        month.percentage === null ||
        month.percentage === undefined
      ) {
        return `${month.label}: No records`
      }

      return (
        `${month.label}: ${month.percentage}% ` +
        `(${month.present_days}/${month.recorded_days} student-days)`
      )
    },

    getInitials(name) {
      if (!name) {
        return '?'
      }

      const words =
        String(name)
          .trim()
          .split(/\s+/)

      if (words.length === 1) {
        return words[0]
          .substring(0, 2)
          .toUpperCase()
      }

      return (
        words[0][0] +
        words[words.length - 1][0]
      ).toUpperCase()
    },

    formatDate(date) {
      if (!date) {
        return '-'
      }

      const parsed =
        new Date(date)

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return date
      }

      return parsed.toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    },

    formatDateField(value) {
      if (!value) {
        return 'Not provided'
      }

      const parsed = new Date(value)

      if (Number.isNaN(parsed.getTime())) {
        return value
      }

      return parsed.toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    },

    statusClass(status) {
      const value = String(status || '').toLowerCase()

      if (value === 'present' || value === 'paid' || value === 'approved') {
        return 'chip-green'
      }

      if (value === 'absent' || value === 'rejected') {
        return 'chip-red'
      }

      if (value === 'unpaid' || value === 'pending') {
        return 'chip-amber'
      }

      return ''
    },

    formatDay(date) {
      if (!date) {
        return '-'
      }

      const parsed =
        new Date(date)

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return '-'
      }

      return parsed
        .getDate()
        .toString()
        .padStart(2, '0')
    },

    formatMonth(date) {
      if (!date) {
        return '-'
      }

      const parsed =
        new Date(date)

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return '-'
      }

      return parsed
        .toLocaleDateString(
          'en-IN',
          {
            month: 'short',
          }
        )
        .toUpperCase()
    },

    formatTime(value) {
      if (!value) {
        return '-'
      }

      /*
       * Frappe time values can arrive as:
       *
       * 10:00:00
       *
       * or as a Python timedelta
       * serialized into seconds.
       */

      if (
        typeof value === 'string'
      ) {
        const parts =
          value.split(':')

        if (parts.length >= 2) {

          let hour =
            Number(parts[0]) || 0

          const minute =
            Number(parts[1]) || 0

          const suffix =
            hour >= 12
              ? 'PM'
              : 'AM'

          hour =
            hour % 12 || 12

          return `${hour}:${String(
            minute
          ).padStart(2, '0')} ${suffix}`
        }

        return value
      }

      if (
        typeof value === 'number'
      ) {

        const totalSeconds =
          Math.floor(value)

        const hours =
          Math.floor(
            totalSeconds / 3600
          )

        const minutes =
          Math.floor(
            (totalSeconds % 3600) / 60
          )

        const suffix =
          hours >= 12
            ? 'PM'
            : 'AM'

        const displayHour =
          hours % 12 || 12

        return `${displayHour}:${String(
          minutes
        ).padStart(2, '0')} ${suffix}`
      }

      return String(value)
    },
  },
}
</script>

<style scoped>

/* =========================================================
   MAIN
========================================================= */

.main {
  min-width: 0;
  margin-left: 0;
  width: 100%;
}
/* =========================================================
   GLOBAL
========================================================= */

*,
*::before,
*::after {
  box-sizing: border-box;
}

:global(html) {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

:global(body) {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: #f7f9fc;
}

:global(#app) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
}

/* =========================================================
   APP
========================================================= */

.app-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  overflow-x: hidden;
  color: #1E1B33;
  background: #f7f9fc;
}

/* =========================================================
   MAIN
========================================================= */

.main {
  min-width: 0;
  margin-left: 0;
  width: 100%;
}
  .content {
  width: 100%;
  max-width: none;
  min-height: 0;
  box-sizing: border-box;

  margin: 0 auto;

 padding: 28px 24px 40px;
}

/* =========================================================
   HEADER
========================================================= */


.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;

  padding: 20px 24px;
  margin-bottom: 24px;

  background: linear-gradient(105deg, #453D89, #C8499A);
  border-radius: 12px;
  color: #ffffff;
  box-sizing: border-box;
}

.breadcrumb {
  margin: 0 0 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
}


.breadcrumb span {
  margin: 0 5px;
}


.top-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.03em;
}


.top-actions {
  display: flex;
  align-items: center;

  gap: 10px;
}

.live-indicator{
  display: flex;
  align-items: center;

  gap: 7px;

  padding: 8px 11px;

  border:
    1px solid
    #FCEAF4;

  border-radius: 9px;

  color: #0369a1;

  background: #F8F7FC;

  font-size: 9px;
  font-weight: 700;
}

.live-indicator span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow:
    0 0 0 3px
    rgba(34, 197, 94, 0.12);
}

.refresh-btn{
  display: flex;
  align-items: center;

  gap: 7px;

  padding: 9px 13px;

  border:
    1px solid
    #dbe5ef;

  border-radius: 9px;

  color: #334155;

  background: white;

  font-size: 10px;
  font-weight: 700;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.refresh-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.refresh-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

.refresh-btn span{
  font-size: 14px;
}

.refresh-btn .rotate {
  animation:
    spin 0.9s linear infinite;
}

/* =========================================================
   HERO
========================================================= */

.hero {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 30px;

  min-height: 160px;
padding: 24px 32px;

  overflow: hidden;

  border-radius: 22px;

  color: white;

  background: linear-gradient(
  120deg,
  #453D89 0%,
  #75449A 52%,
  #C8499A 100%
);

  box-shadow:
    0 20px 50px
    rgba(30, 64, 175, 0.16);
}

.hero-content {
  position: relative;
  z-index: 2;

  max-width: 650px;
}

.hero-label{
  display: flex;
  align-items: center;

  gap: 7px;

  margin-bottom: 13px;

  color: #67e8f9;

  font-size: 9px;
  font-weight: 800;

  letter-spacing: 0.12em;
}

.hero-label span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: var(--theme-pink, #C8499A);
}

.hero h2{
  margin: 0;

  font-size: 30px;
  font-weight: 800;

  letter-spacing: -0.04em;
}

.hero h2 span{
  font-size: 25px;
}

.hero p{
  max-width: 590px;

  margin: 10px 0 16px;

  color: #cbd5e1;

  font-size: 12px;
  line-height: 1.7;
}

.hero-connected{
  display: flex;
  align-items: center;

  gap: 7px;

  color: #94a3b8;

  font-size: 9px;
}

.connection-dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #22c55e;
}

.hero-metrics {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;

  padding: 20px 23px;

  border:
    1px solid
    rgba(255,255,255,0.1);

  border-radius: 16px;

  background:
    rgba(255,255,255,0.055);

  backdrop-filter: blur(10px);
}

.hero-metric {
  min-width: 95px;

  text-align: center;
}

.hero-metric span{
  display: block;

  margin-bottom: 5px;

  color: #94a3b8;

  font-size: 8px;
  font-weight: 700;

  text-transform: uppercase;
}

.hero-metric strong{
  color: white;

  font-size: 20px;
}

.hero-divider {
  width: 1px;
  height: 34px;

  margin: 0 8px;

  background:
    rgba(255,255,255,0.1);
}

.hero-orb {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(2px);
}

.orb-one {
  width: 220px;
  height: 220px;

  right: -60px;
  top: -100px;

  background:
    rgba(200, 73, 154, 0.15);
}

.orb-two {
  width: 180px;
  height: 180px;

  right: 230px;
  bottom: -130px;

  background:
    rgba(69, 61, 137, 0.16);
}

/* =========================================================
   ERROR
========================================================= */

.error-alert{
  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 12px;

  margin: 16px 0;

  padding: 13px 15px;

  border:
    1px solid
    #fecaca;

  border-radius: 12px;

  color: #991b1b;

  background: #fef2f2;

  font-size: 10px;
}

.error-alert strong{
  font-size: 10px;
}

.error-alert span {
  color: #b91c1c;
}

.error-alert button{
  padding: 7px 10px;

  border: 0;

  border-radius: 7px;

  color: white;

  background: #dc2626;

  font-size: 9px;
  font-weight: 700;

  cursor: pointer;
}

/* Retry button inside the "dashboard could not load" hero state
   (shown when the context request fails, instead of an endless
   loading screen). */
.hero-content button {
  margin-top: 18px;

  padding: 9px 16px;

  border: 0;

  border-radius: 999px;

  color: #453D89;

  background: #ffffff;

  font-size: 11px;
  font-weight: 800;

  cursor: pointer;
}

.hero-content button:hover {
  background: #f3f2ff;
}

/* =========================================================
   STATS
========================================================= */

.stats-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 13px;

  margin-top: 18px;
}

.stat-card {
  position: relative;

  min-width: 0;
  min-height: 174px;

  padding: 17px;

  overflow: hidden;

  border:
    1px solid
    #e2e8f0;

  border-radius: 16px;

  background: white;

  box-shadow:
    0 6px 20px
    rgba(69, 61, 137, 0.035);
}

.stat-card-top {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-icon{
  width: 35px;
  height: 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  font-size: 14px;
  font-weight: 800;
}

.stat-icon.blue {
  color: #0369a1;
  background: #F3EFF9;
}

.stat-icon.green {
  color: #15803d;
  background: #dcfce7;
}

.stat-icon.orange {
  color: #c2410c;
  background: #ffedd5;
}

.stat-icon.purple {
  color: #6d28d9;
  background: #EDEBFA;
}

.stat-tag{
  padding: 4px 7px;

  border-radius: 6px;

  color: #0369a1;

  background: #F3EFF9;

  font-size: 7px;
  font-weight: 800;

  letter-spacing: 0.04em;
}

.green-tag {
  color: #15803d;
  background: #dcfce7;
}

.orange-tag {
  color: #c2410c;
  background: #ffedd5;
}

.purple-tag {
  color: #6d28d9;
  background: #EDEBFA;
}

.stat-body {
  position: relative;
  z-index: 2;

  margin-top: 25px;
}

.stat-body span{
  display: block;

  color: #64748b;

  font-size: 9px;
}

.stat-body strong{
  display: block;

  margin-top: 5px;

  color: #1E1B33;

  font-size: 25px;
  font-weight: 800;

  letter-spacing: -0.04em;
}

.stat-footer{
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;

  gap: 6px;

  margin-top: 14px;

  color: #94a3b8;

  font-size: 8px;
}

.green-dot,
.orange-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;
}

.green-dot {
  background: #22c55e;
}

.orange-dot {
  background: #f59e0b;
}

.trend-up {
  color: #16a34a;

  font-size: 13px;
  font-weight: 800;
}

.card-glow {
  position: absolute;

  width: 110px;
  height: 110px;

  right: -50px;
  bottom: -55px;

  border-radius: 50%;

  filter: blur(2px);
}

.blue-glow {
  background:
    rgba(200, 73, 154, 0.07);
}

.green-glow {
  background:
    rgba(34, 197, 94, 0.07);
}

.orange-glow {
  background:
    rgba(245, 158, 11, 0.07);
}

.purple-glow {
  background:
    rgba(200, 73, 154, 0.07);
}

/* =========================================================
   SECTION HEADINGS
========================================================= */

.section-heading {
  margin: 28px 0 13px;
}

.section-kicker{
  color: #64748b;

  font-size: 8px;
  font-weight: 800;

  letter-spacing: 0.12em;
}

.section-heading h3{
  margin: 4px 0 4px;

  color: #1E1B33;

  font-size: 18px;
  font-weight: 800;
}

.section-heading p{
  margin: 0;

  color: #94a3b8;

  font-size: 9px;
  line-height: 1.6;
}

/* =========================================================
   PANELS
========================================================= */

.panel {
  min-width: 0;

  padding: 17px;

  border:
    1px solid
    #e2e8f0;

  border-radius: 16px;

  background: white;

  box-shadow:
    0 5px 18px
    rgba(69, 61, 137, 0.035);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-bottom: 15px;
}

.panel-title {
  display: flex;
  align-items: center;

  gap: 10px;

  min-width: 0;
}

.panel-icon {
  width: 34px;
  height: 34px;

  flex: 0 0 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  font-size: 13px;
  font-weight: 800;
}

.panel-icon.blue {
  color: #0369a1;
  background: #F3EFF9;
}

.panel-icon.green {
  color: #15803d;
  background: #dcfce7;
}

.panel-icon.purple {
  color: #6d28d9;
  background: #EDEBFA;
}

.panel-icon.orange {
  color: #c2410c;
  background: #ffedd5;
}

.panel-icon.indigo {
  color: #4338ca;
  background: #eef2ff;
}

.panel-icon.teal {
  color: #0f766e;
  background: #ccfbf1;
}

.panel-title h3{
  margin: 0;

  color: #1e293b;

  font-size: 12px;
  font-weight: 800;
}

.panel-title p{
  margin: 3px 0 0;

  color: #94a3b8;

  font-size: 8px;
}

.view-link{
  color: var(--theme-purple, #453D89);

  font-size: 8px;
  font-weight: 700;

  text-decoration: none;

  white-space: nowrap;
}

.view-link:hover {
  text-decoration: underline;
}

.count-badge,
.live-badge{
  padding: 5px 8px;

  border-radius: 7px;

  color: #0369a1;

  background: #F3EFF9;

  font-size: 8px;
  font-weight: 800;
}

.live-badge {
  color: #15803d;
  background: #dcfce7;
}

/* =========================================================
   ACADEMIC SNAPSHOT
========================================================= */

.academic-grid {
  display: grid;

  grid-template-columns:
    1.1fr
    0.9fr;

  gap: 13px;
}

.academic-summary-cards {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 9px;
}

.academic-mini {
  min-width: 0;

  padding: 12px;

  border-radius: 11px;
}

.academic-mini span{
  display: block;

  color: #64748b;

  font-size: 8px;
}

.academic-mini strong {
  display: block;

  margin-top: 6px;

  color: #1E1B33;

  font-size: 19px;
}

.academic-mini small{
  display: block;

  margin-top: 3px;

  color: #94a3b8;

  font-size: 7px;
}

.blue-mini {
  background: #F8F7FC;
}

.green-mini {
  background: #f0fdf4;
}

.purple-mini {
  background: #faf5ff;
}

.orange-mini {
  background: #fff7ed;
}

/* =========================================================
   PROGRAMS
========================================================= */

.program-list {
  display: flex;
  flex-direction: column;

  gap: 11px;
}

.program-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 14px;
}

.program-row-main {
  display: flex;
  align-items: center;

  gap: 9px;

  min-width: 0;
}

.program-avatar{
  width: 29px;
  height: 29px;

  flex: 0 0 29px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  color: #6d28d9;

  background: #EDEBFA;

  font-size: 8px;
  font-weight: 800;
}

.program-row-main strong{
  display: block;

  max-width: 210px;

  overflow: hidden;

  color: #334155;

  font-size: 9px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.program-row-main span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.program-progress-wrap {
  display: flex;
  align-items: center;

  gap: 7px;

  width: 120px;
}

.program-progress {
  flex: 1;

  height: 5px;

  overflow: hidden;

  border-radius: 99px;

  background: #f1f5f9;
}

.program-progress span {
  display: block;

  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #453D89,
      #C8499A
    );
}

.program-progress-wrap b{
  width: 27px;

  color: #64748b;

  font-size: 7px;
  text-align: right;
}

/* =========================================================
   ANALYTICS
========================================================= */

.analytics-grid {
  display: grid;

  grid-template-columns:
    1.25fr
    0.75fr;

  gap: 13px;

  margin-top: 13px;
}

.panel-total {
  text-align: right;
}

.panel-total span{
  display: block;

  color: #94a3b8;

  font-size: 7px;
  font-weight: 800;
}

.panel-total strong{
  display: block;

  margin-top: 3px;

  color: #1E1B33;

  font-size: 14px;
}

.chart {
  position: relative;

  display: flex;
  align-items: flex-end;

  height: 190px;

  padding:
    15px
    12px
    4px
    38px;

  overflow: hidden;
}

.chart-y{
  position: absolute;

  left: 0;
  top: 12px;
  bottom: 22px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  color: #cbd5e1;

  font-size: 6px;
}

.chart-grid {
  position: absolute;

  left: 38px;
  right: 5px;
  top: 15px;
  bottom: 23px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  pointer-events: none;
}

.chart-grid span {
  width: 100%;
  height: 1px;

  background: #f1f5f9;
}

.chart-item {
  position: relative;
  z-index: 2;

  flex: 1;

  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  gap: 6px;
}

.bar-area {
  width: 42px;
  height: 135px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  position: relative;

  width: 27px;

  min-height: 4px;

  border-radius:
    7px
    7px
    3px
    3px;

  background:
    linear-gradient(
      180deg,
      #38bdf8,
      #453D89
    );

  transition:
    height 0.4s ease;
}

.bar-highlight {
  position: absolute;

  top: 0;
  left: 4px;
  right: 4px;

  height: 2px;

  border-radius: 99px;

  background:
    rgba(255,255,255,0.55);
}

.chart-item > span{
  color: #94a3b8;

  font-size: 7px;
}

.chart-tooltip{
  position: absolute;

  top: 0;

  padding: 4px 5px;

  border-radius: 5px;

  color: #475569;

  background: #f8fafc;

  font-size: 6px;

  opacity: 0;

  transition:
    opacity 0.2s ease;
}

.chart-item:hover .chart-tooltip {
  opacity: 1;
}

.chart-empty{
  width: 100%;

  align-self: center;

  color: #94a3b8;

  font-size: 9px;

  text-align: center;
}


/* =========================================================
   ADMIN DASHBOARD — DUAL METRICS, LAYOUT, QUICK ACTIONS
========================================================= */

.stat-body.dual-metric {
  display: flex;

  gap: 12px;
}

.stat-body.dual-metric > div {
  flex: 1;

  min-width: 0;
}

.stat-body.dual-metric strong {
  font-size: 25px;
}

.stat-body strong.na-value {
  padding-top: 4px;

  color: #94a3b8;

  font-size: 13px;
  font-weight: 700;

  letter-spacing: 0;
}

.bar-pink {
  background:
    linear-gradient(
      180deg,
      #f9a8d4,
      #C8499A
    );
}

.dashboard-layout {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    300px;

  gap: 14px;

  margin-top: 14px;

  align-items: start;
}

.dashboard-main {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 14px;

  min-width: 0;
}

.quick-actions-panel {
  position: relative;

  padding: 17px;

  border: 1px solid #e2e8f0;

  border-radius: 16px;

  background: #ffffff;

  box-shadow:
    0 7px 22px
    rgba(69, 61, 137, 0.04);
}

.quick-actions-panel h3 {
  margin: 0;

  color: #1e293b;

  font-size: 15px;
}

.quick-actions-panel > p {
  margin: 4px 0 13px;

  color: #94a3b8;

  font-size: 12px;

  line-height: 1.5;
}

.quick-action-card {
  display: flex;

  align-items: center;

  gap: 11px;

  padding: 11px 12px;

  border: 1px solid #edf2f7;

  border-radius: 12px;

  background: #ffffff;

  text-decoration: none;

  margin-bottom: 9px;

  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.quick-action-card:last-child {
  margin-bottom: 0;
}

.quick-action-card:hover {
  transform: translateY(-1px);

  border-color: #c9bce4;

  box-shadow:
    0 6px 16px
    rgba(69, 61, 137, 0.08);
}

.quick-action-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 34px;
  height: 34px;

  border-radius: 10px;

  color: #ffffff;

  font-size: 13px;
  font-weight: 700;
}

.quick-action-icon.application {
  background: linear-gradient(105deg, #453D89, #7c6fd6);
}

.quick-action-icon.teacher {
  background: linear-gradient(105deg, #7c6fd6, #C8499A);
}

.quick-action-icon.fees {
  background: linear-gradient(105deg, #C8499A, #f472b6);
}

.quick-action-card strong {
  display: block;

  color: #1e293b;

  font-size: 13px;
}

.quick-action-card span {
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 12px;

  line-height: 1.4;
}

.quick-action-card b {
  margin-left: auto;

  color: #453D89;

  font-size: 13px;
}

/* =========================================================
   PAYMENT
========================================================= */

.payment-items {
  display: flex;
  flex-direction: column;

  gap: 9px;
}

.payment-item {
  display: grid;

  grid-template-columns:
    31px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 9px;

  padding: 9px;

  border:
    1px solid
    #edf2f7;

  border-radius: 10px;
}

.payment-icon{
  width: 29px;
  height: 29px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  font-size: 11px;
  font-weight: 800;
}

.payment-icon.success {
  color: #15803d;
  background: #dcfce7;
}

.payment-icon.warning {
  color: #c2410c;
  background: #ffedd5;
}

.payment-info strong{
  display: block;

  color: #334155;

  font-size: 9px;
}

.payment-info span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.payment-count{
  color: #1E1B33;

  font-size: 12px;
}

.collection-box {
  margin-top: 13px;

  padding: 12px;

  border-radius: 11px;

  background: #f8fafc;
}

.collection-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.collection-heading strong{
  display: block;

  color: #334155;

  font-size: 9px;
}

.collection-heading span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.collection-value{
  color: var(--theme-purple, #453D89) !important;

  font-size: 14px !important;
}

.progress {
  height: 6px;

  margin-top: 9px;

  overflow: hidden;

  border-radius: 99px;

  background: #e2e8f0;
}

.progress-value {
  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #22c55e,
      #16a34a
    );
}

.payment-summary{
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 14px;

  color: #94a3b8;

  font-size: 8px;
}

.payment-summary strong{
  color: #334155;

  font-size: 10px;
}

/* =========================================================
   ACTIVITY
========================================================= */

.activity-grid {
  display: grid;

  grid-template-columns:
    1.25fr
    0.75fr;

  gap: 13px;

  margin-top: 13px;
}

.payment-table {
  display: flex;
  flex-direction: column;
}

.payment-row {
  display: grid;

  grid-template-columns:
    33px
    minmax(0, 1fr)
    90px
    90px
    auto;

  align-items: center;

  gap: 10px;

  padding: 10px 0;

  border-bottom:
    1px solid
    #f1f5f9;
}

.payment-row:last-child {
  border-bottom: 0;
}

.avatar{
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  color: #0369a1;

  background: #F3EFF9;

  font-size: 8px;
  font-weight: 800;
}

.payment-student {
  min-width: 0;
}

.payment-student strong{
  display: block;

  overflow: hidden;

  color: #334155;

  font-size: 8px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-student span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.payment-date{
  color: #64748b;

  font-size: 7px;
}

.payment-amount{
  color: #1E1B33;

  font-size: 9px;
  font-weight: 800;
}

.paid-pill{
  padding: 4px 6px;

  border-radius: 6px;

  color: #15803d;

  background: #dcfce7;

  font-size: 7px;
  font-weight: 800;
}

.empty{
  padding: 25px 10px;

  color: #94a3b8;

  font-size: 9px;

  text-align: center;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

.notification-items {
  display: flex;
  flex-direction: column;

  gap: 9px;
}

.notification-item {
  display: grid;

  grid-template-columns:
    34px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 10px;

  padding: 10px;

  border:
    1px solid
    #edf2f7;

  border-radius: 11px;
}

.notification-icon{
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  font-size: 11px;
  font-weight: 800;
}

.notification-icon.email {
  color: #0369a1;
  background: #F3EFF9;
}

.notification-icon.whatsapp {
  color: #15803d;
  background: #dcfce7;
}

.notification-icon.failed {
  color: #b91c1c;
  background: #fee2e2;
}

.notification-item strong,
.notification-item span {
  display: block;
}

.notification-item strong{
  color: #334155;

  font-size: 9px;
}

.notification-item span{
  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.notification-item b{
  color: #1E1B33;

  font-size: 12px;
}

.notification-item b.danger {
  color: #dc2626;
}

.whatsapp-alert {
  display: flex;
  align-items: center;

  gap: 9px;

  margin-top: 12px;

  padding: 10px;

  border:
    1px solid
    #fde68a;

  border-radius: 11px;

  background: #fffbeb;
}

.whatsapp-alert.ready {
  border-color: #bbf7d0;

  background: #f0fdf4;
}

.whatsapp-status-icon{
  color: #d97706;

  font-size: 10px;
}

.whatsapp-alert.ready .whatsapp-status-icon {
  color: #16a34a;
}

.whatsapp-alert strong,
.whatsapp-alert span {
  display: block;
}

.whatsapp-alert strong{
  color: #334155;

  font-size: 8px;
}

.whatsapp-alert span{
  margin-top: 2px;

  color: #64748b;

  font-size: 7px;
}

/* =========================================================
   ACADEMIC DATA
========================================================= */

.academic-data-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 13px;

  margin-bottom: 13px;
}

.attendance-summary {
  display: grid;

  grid-template-columns:
    1.35fr
    repeat(3, 1fr);

  gap: 9px;
}

.attendance-score,
.attendance-stat {
  min-height: 82px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 11px;

  border-radius: 11px;
}

.attendance-score {
  color: white;

  background:
    linear-gradient(
      135deg,
      #0f766e,
      #14b8a6
    );
}

.attendance-score strong{
  font-size: 22px;
}

.attendance-score span,
.attendance-stat span{
  margin-top: 4px;

  font-size: 7px;
  font-weight: 700;
}

.attendance-stat strong{
  font-size: 17px;
}

.attendance-stat span {
  color: #64748b;
}

.present-stat {
  background: #f0fdf4;
}

.present-stat strong {
  color: #15803d;
}

.leave-stat {
  background: #fffbeb;
}

.leave-stat strong {
  color: #d97706;
}

.absent-stat {
  background: #fef2f2;
}

.absent-stat strong {
  color: #dc2626;
}

.attendance-progress {
  height: 7px;

  margin-top: 12px;

  overflow: hidden;

  border-radius: 99px;

  background: #e2e8f0;
}

.attendance-progress div {
  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #14b8a6,
      #0f766e
    );

  transition:
    width 0.5s ease;
}

/* =========================================================
   COURSES
========================================================= */

.course-list {
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.course-row {
  display: flex;
  align-items: center;

  gap: 9px;

  padding: 9px;

  border:
    1px solid
    #edf2f7;

  border-radius: 10px;
}

.course-icon{
  width: 31px;
  height: 31px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  color: #0369a1;

  background: #F3EFF9;

  font-size: 11px;
}

.course-info {
  flex: 1;

  min-width: 0;
}

.course-info strong,
.course-info span {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-info strong{
  color: #334155;

  font-size: 9px;
}

.course-info span{
  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.course-status{
  padding: 4px 6px;

  border-radius: 6px;

  color: #15803d;

  background: #dcfce7;

  font-size: 7px;
  font-weight: 800;
}

/* =========================================================
   TIMETABLE
========================================================= */

.timetable-panel {
  margin-bottom: 13px;
}

.schedule-list {
  display: flex;
  flex-direction: column;
}

.schedule-row {
  display: grid;

  grid-template-columns:
    58px
    minmax(170px, 1fr)
    110px
    minmax(160px, 0.7fr);

  align-items: center;

  gap: 13px;

  padding: 12px 0;

  border-bottom:
    1px solid
    #f1f5f9;
}

.schedule-row:last-child {
  border-bottom: 0;
}

.schedule-date {
  padding: 8px;

  border-radius: 9px;

  text-align: center;

  background: #f5f3ff;
}

.schedule-date strong{
  display: block;

  color: #6d28d9;

  font-size: 14px;
}

.schedule-date span{
  display: block;

  margin-top: 2px;

  color: var(--theme-pink, #C8499A);

  font-size: 6px;
  font-weight: 800;
}

.schedule-main {
  min-width: 0;
}

.schedule-main strong,
.schedule-main span {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-main strong{
  color: #334155;

  font-size: 9px;
}

.schedule-main span{
  margin-top: 3px;

  color: #94a3b8;

  font-size: 7px;
}

.schedule-time strong{
  display: block;

  color: var(--theme-purple, #453D89);

  font-size: 9px;
}

.schedule-time span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.schedule-extra{
  display: flex;
  flex-direction: column;

  gap: 4px;

  color: #64748b;

  font-size: 7px;
}

/* =========================================================
   ASSESSMENTS
========================================================= */

.assessments-panel {
  margin-bottom: 13px;
}

.assessment-list {
  display: flex;
  flex-direction: column;

  gap: 9px;
}

.assessment-card {
  display: grid;

  grid-template-columns:
    36px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 10px;

  padding: 11px;

  border:
    1px solid
    #edf2f7;

  border-radius: 11px;
}

.assessment-icon{
  width: 31px;
  height: 31px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  color: #c2410c;

  background: #ffedd5;

  font-size: 11px;
  font-weight: 800;
}

.assessment-main {
  min-width: 0;
}

.assessment-main strong,
.assessment-main span,
.assessment-main small {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.assessment-main strong{
  color: #334155;

  font-size: 9px;
}

.assessment-main span{
  margin-top: 3px;

  color: #64748b;

  font-size: 7px;
}

.assessment-main small{
  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.assessment-meta {
  min-width: 150px;

  text-align: right;
}

.assessment-meta strong,
.assessment-meta span,
.assessment-meta small {
  display: block;
}

.assessment-meta strong{
  color: #334155;

  font-size: 9px;
}

.assessment-meta span{
  margin-top: 3px;

  color: var(--theme-purple, #453D89);

  font-size: 7px;
}

.assessment-meta small{
  margin-top: 3px;

  color: #94a3b8;

  font-size: 7px;
}

/* =========================================================
   INSTRUCTORS
========================================================= */

.instructor-list,
.group-list {
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.instructor-row,
.group-row {
  display: flex;
  align-items: center;

  gap: 9px;

  padding: 9px;

  border:
    1px solid
    #edf2f7;

  border-radius: 10px;
}

.instructor-avatar{
  width: 33px;
  height: 33px;

  flex: 0 0 33px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  color: #4338ca;

  background: #eef2ff;

  font-size: 8px;
  font-weight: 800;
}

.instructor-info,
.group-info {
  flex: 1;

  min-width: 0;
}

.instructor-info strong,
.instructor-info span,
.instructor-info small,
.group-info strong,
.group-info span,
.group-info small {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.instructor-info strong,
.group-info strong{
  color: #334155;

  font-size: 9px;
}

.instructor-info span,
.group-info span{
  margin-top: 2px;

  color: #64748b;

  font-size: 7px;
}

.instructor-info small,
.group-info small{
  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.active-status{
  padding: 4px 6px;

  border-radius: 6px;

  color: #15803d;

  background: #dcfce7;

  font-size: 7px;
  font-weight: 800;
}

.group-icon{
  width: 33px;
  height: 33px;

  flex: 0 0 33px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  color: #0f766e;

  background: #ccfbf1;

  font-size: 12px;
}

.group-counts {
  display: flex;
  flex-direction: column;

  gap: 3px;

  text-align: right;
}

.group-counts span{
  color: #94a3b8;

  font-size: 6px;
}

.group-counts b{
  color: #334155;

  font-size: 8px;
}

/* =========================================================
   OVERVIEW
========================================================= */

.overview-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 13px;

  margin-top: 13px;
}

.student-overview {
  display: grid;

  grid-template-columns:
    1.4fr
    1fr
    1fr;

  gap: 10px;
}

.student-total,
.student-stat {
  min-height: 80px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 13px;

  border-radius: 11px;
}

.student-total {
  color: white;

  background:
    linear-gradient(
      135deg,
      #453D89,
      #C8499A
    );
}

.student-total strong{
  font-size: 23px;
}

.student-total span{
  margin-top: 3px;

  color: #FCEAF4;

  font-size: 8px;
}

.student-stat {
  background: #f8fafc;
}

.student-stat strong {
  font-size: 19px;
}

.student-stat span{
  margin-top: 3px;

  color: #64748b;

  font-size: 8px;
}

.student-stat.active strong {
  color: #16a34a;
}

.student-stat.disabled strong {
  color: #64748b;
}

.service-list {
  display: flex;
  flex-direction: column;

  gap: 9px;
}

.service {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 9px;

  border:
    1px solid
    #edf2f7;

  border-radius: 9px;
}

.service-name{
  display: flex;
  align-items: center;

  gap: 7px;

  color: #475569;

  font-size: 8px;
  font-weight: 600;
}

.service-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #22c55e;
}

.service-dot.neutral {
  background: #f59e0b;
}

.service-badge{
  padding: 4px 6px;

  border-radius: 6px;

  color: #15803d;

  background: #dcfce7;

  font-size: 6px;
  font-weight: 800;
}

.service-badge.neutral {
  color: #b45309;
  background: #fef3c7;
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

.quick-section {
  margin-top: 28px;
}

.quick-heading {
  margin-bottom: 12px;
}

.quick-heading h3{
  margin: 0;

  color: #1E1B33;

  font-size: 16px;
}

.quick-heading p{
  margin: 4px 0 0;

  color: #94a3b8;

  font-size: 8px;
}

.quick-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 11px;
}

.quick-card {
  display: grid;

  grid-template-columns:
    38px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 10px;

  padding: 13px;

  border:
    1px solid
    #e2e8f0;

  border-radius: 13px;

  color: inherit;

  background: white;

  text-decoration: none;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-2px);

  box-shadow:
    0 8px 22px
    rgba(69, 61, 137, 0.07);
}

.quick-icon {
  width: 35px;
  height: 35px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  font-size: 13px;
  font-weight: 800;
}

.blue-quick .quick-icon {
  color: #0369a1;
  background: #F3EFF9;
}

.green-quick .quick-icon {
  color: #15803d;
  background: #dcfce7;
}

.orange-quick .quick-icon {
  color: #c2410c;
  background: #ffedd5;
}

.quick-card strong,
.quick-card span {
  display: block;
}

.quick-card strong{
  color: #334155;

  font-size: 9px;
}

.quick-card span{
  margin-top: 3px;

  color: #94a3b8;

  font-size: 7px;
}

.quick-card > b {
  color: #94a3b8;

  font-size: 13px;
}

/* =========================================================
   FOOTER
========================================================= */

.footer{
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-top: 30px;
  padding-top: 17px;

  border-top:
    1px solid
    #e2e8f0;

  color: #94a3b8;

  font-size: 7px;
}

/* =========================================================
   ANIMATION
========================================================= */

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1200px) {

    .content {
  padding: 24px 22px 35px;
}

  .hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-metrics {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .academic-grid,
  .analytics-grid,
  .activity-grid {
    grid-template-columns:
      1fr;
  }

  .academic-data-grid {
    grid-template-columns:
      1fr;
  }

  .overview-grid {
    grid-template-columns:
      1fr;
  }

  .dashboard-layout {
    grid-template-columns:
      1fr;
  }

}

@media (max-width: 900px) {

  .shared-sidebar {
    display: none;
  }

  .main {
    margin-left: 0;

    width: 100%;
  }

  .shared-mobile-topbar {
    position: sticky;

    top: 0;

    z-index: 500;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 12px 16px;

    border-bottom:
      1px solid
      #e2e8f0;

    background:
      rgba(255,255,255,0.94);

    backdrop-filter: blur(12px);
  }

  .mobile-brand {
    color: #1E1B33;
  }

  .mobile-brand strong {
    color: #1E1B33;
  }

  .mobile-brand span {
    color: #64748b;
  }

  .mobile-menu-button {
    display: flex;
  }

  .mobile-backdrop {
    display: block;
  }

  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .academic-summary-cards {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .quick-grid {
    grid-template-columns:
      1fr;
  }

  .dashboard-main {
    grid-template-columns:
      1fr;
  }

  .schedule-row {
    grid-template-columns:
      55px
      minmax(0, 1fr)
      100px;
  }

  .schedule-extra {
    display: none;
  }

}

@media (max-width: 650px) {
  .content {
    padding: 0 14px 28px;
  }
  .top-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-actions {
    width: 100%;
  }

  .live-indicator {
    flex: 1;
  }

  .refresh-btn {
    flex: 0 0 auto;
  }

  .hero {
    min-height: auto;

    padding: 23px 20px;
  }

  
.hero h2 {
    font-size: 24px;
  }

  .hero p {
    font-size: 10px;
  }  .hero-metrics {
    padding: 14px 8px;
  }

  .hero-metric {
    min-width: 75px;
  }

  
.hero-metric strong {    font-size: 16px;
  }  .stats-grid {
    grid-template-columns:
      1fr;
  }

  .academic-summary-cards {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .attendance-summary {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .attendance-score {
    grid-column:
      1 / -1;
  }

  .payment-row {
    grid-template-columns:
      33px
      minmax(0, 1fr)
      auto;
  }

  .payment-date,
  .payment-amount {
    display: none;
  }

  .schedule-row {
    grid-template-columns:
      50px
      minmax(0, 1fr);
  }

  .schedule-time {
    display: none;
  }

  .assessment-card {
    grid-template-columns:
      34px
      minmax(0, 1fr);
  }

  .assessment-meta {
    grid-column:
      2 / -1;

    min-width: 0;

    text-align: left;
  }

  .group-counts {
    display: none;
  }

  .student-overview {
    grid-template-columns:
      1fr 1fr;
  }

  .student-total {
    grid-column:
      1 / -1;
  }

  .quick-grid {
    grid-template-columns:
      1fr;
  }

  .footer {
    align-items: flex-start;
    flex-direction: column;
  }

}

@media (max-width: 420px){

  .hero-metrics {
    width: 100%;
  }

  .hero-divider {
    margin: 0 3px;
  }

  .hero-metric {
    min-width: 63px;
  }

  
.hero-metric span {
    font-size: 6px;
  }

  .hero-metric strong {
    font-size: 14px;
  }  .academic-summary-cards {
    grid-template-columns:
      1fr;
  }

  .attendance-summary {
    grid-template-columns:
      1fr 1fr;
  }

  .attendance-score {
    grid-column:
      1 / -1;
  }

  .program-progress-wrap {
    width: 85px;
  }

  .stat-body.dual-metric {
    flex-direction: column;

    gap: 8px;
  }

}

/* =========================================================
   STUDENT PORTAL
========================================================= */

.student-hero {
  position: relative;

  margin-top: 14px;

  padding: 14px 20px;

  overflow: hidden;

  border:
    1px solid
    #e2e8f0;

  border-radius: 18px;

  background:
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f8fafc 100%
    );

  box-shadow:
    0 8px 24px
    rgba(69, 61, 137, 0.05);
}

.student-hero-main {
  display: flex;
  align-items: center;
  gap: 18px;
}

.student-hero-text h2 {
  margin: 0;

  color: #1E1B33;

  font-size: 20px;
  font-weight: 700;
}

.student-stats .stat-card {
  min-height: 150px;
}

.student-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 13px;

  margin-top: 13px;
}

.panel-link {
  color: var(--theme-purple, #453D89);

  font-size: 13px;
  font-weight: 600;

  text-decoration: none;

  white-space: nowrap;
}

.panel-link:hover {
  text-decoration: underline;
}

.panel-body {
  padding: 0 18px 18px;
}

/* Internal scroll for dashboard card content (keeps headers visible). */
.scroll-body {
  max-height: none;
  overflow-y: visible;

  /* Visible, unobtrusive scrollbar (WebKit + Firefox). */
  scrollbar-width: thin;
  scrollbar-color: #c7cbe0 transparent;

  overscroll-behavior: auto;
}

.scroll-body::-webkit-scrollbar {
  width: 8px;
}

.scroll-body::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-body::-webkit-scrollbar-thumb {
  background: #c7cbe0;

  border-radius: 999px;
}

.scroll-body::-webkit-scrollbar-thumb:hover {
  background: #b0b5d2;
}

.student-list {
  display: flex;
  flex-direction: column;

  gap: 8px;

  margin: 0;
  padding: 0;

  list-style: none;
}

.student-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding: 10px 12px;

  border:
    1px solid #eef2f7;

  border-radius: 12px;

  background: #fcfdff;
}

.student-list li > div {
  display: flex;
  flex-direction: column;

  min-width: 0;
}

.student-list strong {
  color: #1E1B33;

  font-size: 13px;
  font-weight: 600;
}

.student-list span {
  color: #64748b;

  font-size: 13px;
}

.student-list em {
  color: var(--theme-purple, #453D89);

  font-style: normal;
  font-weight: 600;
}

.student-chip {
  padding: 3px 10px;

  border-radius: 999px;

  background: #f1f5f9;

  color: #475569;

  font-size: 13px;
  font-weight: 600;

  white-space: nowrap;
}

.student-chip.chip-green {
  background: #dcfce7;
  color: #15803d;
}

.student-chip.chip-red {
  background: #fee2e2;
  color: #b91c1c;
}

.student-chip.chip-amber {
  background: #fef3c7;
  color: #b45309;
}

@media (max-width: 1100px) {
  .student-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .student-hero-main {
    align-items: flex-start;
  }

  .student-hero-text h2 {
    font-size: 16px;
  }

  .scroll-body {
    max-height: 200px;
  }
}

/* =========================================================
   STUDENT PROFILE CARDS
========================================================= */

.profile-wrap {
  display: grid;

  grid-template-columns:
    240px
    minmax(0, 1fr);

  gap: 0;

  margin-top: 14px;

  border: 1px solid #e2e8f0;

  border-radius: 18px;

  overflow: hidden;

  background: #ffffff;

  box-shadow: 0 8px 24px rgba(69, 61, 137, 0.05);
}

.profile-card {
  padding: 22px;

  min-width: 0;
}

.profile-photo-card {
  display: flex;
  flex-direction: column;

  align-items: center;

  text-align: center;

  gap: 6px;

  background:
    linear-gradient(
      160deg,
      #f7f6fd 0%,
      #fdf2f9 100%
    );

  border-right: 1px solid #e9e6f5;
}

.profile-photo {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 92px;
  height: 92px;

  border-radius: 50%;

  overflow: hidden;

  background: linear-gradient(135deg, #453D89, #C8499A);

  box-shadow: 0 8px 20px rgba(69, 61, 137, 0.25);

  margin-bottom: 6px;
}

.profile-photo img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.profile-initials {
  color: #ffffff;

  font-size: 26px;
  font-weight: 700;

  letter-spacing: 0.5px;
}

.profile-name {
  margin: 0;

  color: #1E1B33;

  font-size: 16px;
  font-weight: 700;

  word-break: break-word;
}

.profile-id {
  color: #64748b;

  font-size: 13px;
  font-weight: 600;
}

.profile-status {
  margin-top: 4px;

  padding: 3px 11px;

  border-radius: 999px;

  font-size: 13px;
  font-weight: 700;
}

.profile-status.status-on {
  color: #047857;
  background: #ecfdf5;
}

.profile-status.status-off {
  color: #b45309;
  background: #fffbeb;
}

/* ---- Right card ---- */

.profile-info-card {
  display: flex;
  flex-direction: column;
}

.profile-tabs {
  display: flex;

  gap: 4px;

  padding: 4px;

  border: 1px solid #e9e6f5;

  border-radius: 12px;

  background: #f8f7fd;

  width: fit-content;

  margin-bottom: 18px;
}

.profile-tab {
  padding: 7px 16px;

  border: 0;

  border-radius: 9px;

  background: transparent;

  color: #64748b;

  font-size: 13px;
  font-weight: 650;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.profile-tab:hover {
  color: #453D89;
}

.profile-tab.active {
  background: linear-gradient(135deg, #453D89, #5A4FA8);

  color: #ffffff;

  box-shadow: 0 4px 12px rgba(69, 61, 137, 0.25);
}

.profile-fields {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 14px 20px;
}

.field {
  display: flex;
  flex-direction: column;

  gap: 3px;

  min-width: 0;
}

.field-span {
  grid-column: 1 / -1;
}

.field-label {
  color: #94a3b8;

  font-size: 13px;
  font-weight: 650;

  letter-spacing: 0.02em;
}

.field-value {
  color: #1E1B33;

  font-size: 13px;
  font-weight: 600;

  word-break: break-word;
}

.group-chip {
  display: inline-block;

  margin: 0 6px 4px 0;

  padding: 3px 10px;

  border-radius: 999px;

  background: #f1f5f9;

  color: #475569;

  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .profile-wrap {
    grid-template-columns: 1fr;
  }

  .profile-photo-card {
    border-right: 0;

    border-bottom: 1px solid #e9e6f5;
  }
}

@media (max-width: 560px) {
  .profile-fields {
    grid-template-columns: 1fr;
  }

  .profile-tabs {
    width: 100%;

    overflow-x: auto;
  }
}

</style>
