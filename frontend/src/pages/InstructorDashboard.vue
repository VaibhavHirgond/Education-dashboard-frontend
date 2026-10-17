<template>
  <div class="app-shell">
    <main class="main">
      <div class="content">
        <template v-if="loading">
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label"><span></span> INSTRUCTOR PORTAL</div>
              <h2>Loading your dashboard…</h2>
              <p>Fetching your student groups, courses, and attendance.</p>
            </div>
          </section>
        </template>

        <template v-else-if="!context">
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label"><span></span> INSTRUCTOR PORTAL</div>
              <h2>Dashboard could not load</h2>
              <p>{{ error || 'Unable to determine your user role. Please try again.' }}</p>
              <button type="button" @click="refresh">Try again</button>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label"><span></span> INSTRUCTOR PORTAL</div>
              <h2>{{ greeting }}<span>👋</span></h2>
              <p>Your personal overview across the classes, students, and schedules you manage.</p>
            </div>
            <div class="hero-orb orb-one"></div>
            <div class="hero-orb orb-two"></div>
          </section>

          <section class="overview-row">
            <section v-if="instructorProfile" class="profile-panel">
              <div class="profile-avatar">{{ instructorInitials }}</div>

              <div class="profile-copy">
                <span class="eyebrow">PROFILE</span>
                <h3>{{ instructorName }}</h3>
                <div class="profile-meta">
                  <span v-if="instructorProfile.email">✉ {{ instructorProfile.email }}</span>
                  <span v-if="instructorProfile.status">● {{ instructorProfile.status }}</span>
                  <span>{{ myClassesCount }} assigned groups</span>
                </div>
              </div>

              <div class="profile-metrics">
                <div>
                  <strong>{{ students.length }}</strong>
                  <span>Students</span>
                </div>
                <div>
                  <strong>{{ myCoursesCount }}</strong>
                  <span>Courses</span>
                </div>
                <div>
                  <strong>{{ todayClassesCount }}</strong>
                  <span>Today</span>
                </div>
              </div>
            </section>

            <section class="toolbar-panel instructor-filter-panel">
              <div class="toolbar-header">
                <div>
                  <span class="eyebrow">FILTERS</span>
                  <h3>Date range</h3>
                </div>
                <span v-if="hasActiveFilters" class="filter-badge">Filtered</span>
              </div>

              <div class="toolbar-fields">
                <label class="filter-field">
                  <span>Start date</span>
                  <input v-model="filters.startDate" type="date" :disabled="loading" />
                </label>

                <label class="filter-field">
                  <span>End date</span>
                  <input v-model="filters.endDate" type="date" :disabled="loading" />
                </label>

                <div class="toolbar-actions">
                  <button type="button" class="primary-btn" :disabled="loading" @click="applyFilter">Apply Filter</button>
                  <button type="button" class="secondary-btn" :disabled="loading" @click="resetFilters">Reset</button>
                  <span v-if="loading" class="filter-status" role="status">Updating…</span>
                </div>
              </div>

              <p v-if="filterError" class="filter-error" role="alert">{{ filterError }}</p>
            </section>
          </section>

          <div v-if="error" class="error-alert">
            <strong>Dashboard error</strong>
            <span>{{ error }}</span>
            <button type="button" @click="refresh">Try again</button>
          </div>

          <section class="stats-grid instructor-stats">
            <article
              class="stat-card blue-card clickable-card"
              role="link"
              tabindex="0"
              aria-label="Open the student list"
              @click="navigateToDesk('/desk/student')"
              @keydown.enter.prevent="navigateToDesk('/desk/student')"
              @keydown.space.prevent="navigateToDesk('/desk/student')"
            >
              <div class="stat-card-top">
                <div class="stat-icon blue">♙</div>
                <span class="stat-tag">STUDENTS</span>
              </div>
              <div class="stat-body">
                <span>My Students</span>
                <strong>{{ students.length }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                Students in your assigned groups
              </div>
              <div class="card-glow blue-glow"></div>
            </article>

            <article
              class="stat-card purple-card clickable-card"
              role="link"
              tabindex="0"
              aria-label="Open the course list"
              @click="navigateToDesk('/desk/course')"
              @keydown.enter.prevent="navigateToDesk('/desk/course')"
              @keydown.space.prevent="navigateToDesk('/desk/course')"
            >
              <div class="stat-card-top">
                <div class="stat-icon purple">▣</div>
                <span class="stat-tag purple-tag">COURSES</span>
              </div>
              <div class="stat-body">
                <span>My Courses</span>
                <strong>{{ myCoursesCount }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                Courses linked to your groups
              </div>
              <div class="card-glow purple-glow"></div>
            </article>

            <article
              class="stat-card green-card clickable-card"
              role="link"
              tabindex="0"
              aria-label="Open the student group list"
              @click="navigateToDesk('/desk/student-group')"
              @keydown.enter.prevent="navigateToDesk('/desk/student-group')"
              @keydown.space.prevent="navigateToDesk('/desk/student-group')"
            >
              <div class="stat-card-top">
                <div class="stat-icon green">▤</div>
                <span class="stat-tag green-tag">CLASSES</span>
              </div>
              <div class="stat-body">
                <span>My Classes</span>
                <strong>{{ myClassesCount }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                Assigned student groups
              </div>
              <div class="card-glow green-glow"></div>
            </article>

            <article
              class="stat-card blue-card clickable-card"
              role="link"
              tabindex="0"
              aria-label="Open the class schedule"
              @click="navigateToDesk(courseSchedulePath)"
              @keydown.enter.prevent="navigateToDesk(courseSchedulePath)"
              @keydown.space.prevent="navigateToDesk(courseSchedulePath)"
            >
              <div class="stat-card-top">
                <div class="stat-icon blue">◷</div>
                <span class="stat-tag">TODAY</span>
              </div>
              <div class="stat-body">
                <span>Today's Classes</span>
                <strong>{{ todayClassesCount }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                {{ hasActiveFilters ? 'In the selected date range' : 'Scheduled for today' }}
              </div>
              <div class="card-glow blue-glow"></div>
            </article>
          </section>

          <article
            class="panel today-panel clickable-panel"
            role="link"
            tabindex="0"
            aria-label="Open the class schedule"
            @click="navigateToDesk(courseSchedulePath)"
            @keydown.enter.prevent="navigateToDesk(courseSchedulePath)"
            @keydown.space.prevent="navigateToDesk(courseSchedulePath)"
          >
            <div class="panel-header">
              <div class="panel-title">
                <div class="panel-icon blue">◷</div>
                <div>
                  <h3>Today's Classes</h3>
                  <p>{{ hasActiveFilters ? 'Filtered schedule' : 'Classes scheduled for today' }}</p>
                </div>
              </div>
              <div class="panel-header-actions">
                <button
                  type="button"
                  class="add-schedule-btn"
                  aria-label="Add a new class schedule"
                  @click.stop="openNewCourseSchedule"
                  @keydown.enter.stop.prevent="openNewCourseSchedule"
                >
                  + New
                </button>
                <span class="count-chip today-chip">{{ todayClassesCount }}</span>
              </div>
            </div>

            <div v-if="todayClasses.length" class="stack-list">
              <div v-for="session in todayClasses" :key="session.id || session.name || `${session.course}-${session.date}`" class="list-row">
                <div>
                  <strong>{{ session.course || 'Class' }}</strong>
                  <small>{{ session.studentGroup || 'Group not available' }}</small>
                </div>
                <div class="list-meta">
                  <span>{{ formatDate(session.date) || '—' }}</span>
                  <small>{{ session.fromTime || '' }}{{ session.toTime ? ' - ' + session.toTime : '' }}</small>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">No classes are scheduled in the selected date range.</div>
          </article>

          <section class="detail-grid">
            <article
              class="panel detail-panel clickable-panel"
              role="link"
              tabindex="0"
              aria-label="Open the student list"
              @click="navigateToDesk('/desk/student')"
              @keydown.enter.prevent="navigateToDesk('/desk/student')"
              @keydown.space.prevent="navigateToDesk('/desk/student')"
            >
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon green">♙</div>
                  <div>
                    <h3>My Students</h3>
                    <p>Students assigned to your groups</p>
                  </div>
                </div>
              </div>

              <div v-if="students.length" class="stack-list compact-list">
                <div v-for="student in students" :key="student.id || student.name" class="list-row student-row">
                  <div class="student-pill">{{ getInitials(student.name) }}</div>
                  <div>
                    <strong>{{ student.name }}</strong>
                    <small>{{ student.id }}</small>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">No students are assigned to your groups yet.</div>
            </article>

            <article
              class="panel detail-panel clickable-panel"
              role="link"
              tabindex="0"
              aria-label="Open the course list"
              @click="navigateToDesk('/desk/course')"
              @keydown.enter.prevent="navigateToDesk('/desk/course')"
              @keydown.space.prevent="navigateToDesk('/desk/course')"
            >
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon purple">▣</div>
                  <div>
                    <h3>My Courses</h3>
                    <p>Courses attached to your student groups</p>
                  </div>
                </div>
              </div>

              <div v-if="courses.length" class="stack-list compact-list">
                <div v-for="course in courses" :key="course.name || course.id || course.group" class="list-row">
                  <div>
                    <strong>{{ course.name }}</strong>
                    <small>{{ course.group || 'Group not set' }}</small>
                  </div>
                  <span class="count-chip">{{ course.studentCount || 0 }}</span>
                </div>
              </div>
              <div v-else class="empty-state">No courses are assigned to your instructor groups.</div>
            </article>

            <article
              class="panel detail-panel clickable-panel"
              role="link"
              tabindex="0"
              aria-label="Open the student group list"
              @click="navigateToDesk('/desk/student-group')"
              @keydown.enter.prevent="navigateToDesk('/desk/student-group')"
              @keydown.space.prevent="navigateToDesk('/desk/student-group')"
            >
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon orange">▤</div>
                  <div>
                    <h3>My Classes</h3>
                    <p>Groups, batches, and programs you teach</p>
                  </div>
                </div>
              </div>

              <div v-if="groups.length" class="stack-list compact-list">
                <div v-for="group in groups" :key="group.id || group.name" class="list-row">
                  <div>
                    <strong>{{ group.name }}</strong>
                    <small>{{ group.program || 'Program not set' }}</small>
                  </div>
                  <span class="count-chip">{{ group.studentCount || 0 }}</span>
                </div>
              </div>
              <div v-else class="empty-state">No classes are currently assigned to this instructor.</div>
            </article>

            <section
              class="panel chart-panel clickable-panel"
              role="link"
              tabindex="0"
              aria-label="Open the student attendance list"
              @click="navigateToDesk(attendanceListPath)"
              @keydown.enter.prevent="navigateToDesk(attendanceListPath)"
              @keydown.space.prevent="navigateToDesk(attendanceListPath)"
            >
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon purple">%</div>
                  <div>
                    <h3>Student Attendance</h3>
                    <p>Daily present vs absent · your assigned groups<span v-if="attendancePeriodLabel"> · {{ attendancePeriodLabel }}</span></p>
                  </div>
                </div>
                <div class="panel-total">
                  <span>RANGE TOTALS</span>
                  <strong class="attendance-totals">
                    <span>Present {{ attendanceTotals.present }}</span>
                    <i aria-hidden="true">·</i>
                    <span>Absent {{ attendanceTotals.absent }}</span>
                  </strong>
                </div>
              </div>

              <div class="chart-legend">
                <span class="legend-item"><i class="legend-dot present-dot"></i>Present</span>
                <span class="legend-item"><i class="legend-dot absent-dot"></i>Absent</span>
              </div>

              <div class="chart">
                <div class="chart-y">
                  <span v-for="(label, index) in attendanceChartAxis" :key="`att-y-${index}`">{{ label }}</span>
                </div>

                <div class="chart-grid">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div class="chart-bars">
                  <div
                    v-for="day in attendanceTrend"
                    :key="day.date"
                    class="chart-item"
                    tabindex="0"
                  >
                    <div class="chart-tooltip">{{ attendanceTooltip(day) }}</div>

                    <div class="bar-area dual-bar">
                      <div
                        class="bar bar-present"
                        :style="{ height: `${getPresentBarHeight(day.present)}%` }"
                      >
                        <div class="bar-highlight"></div>
                      </div>
                      <div
                        class="bar bar-absent"
                        :style="{ height: `${getAbsentBarHeight(day.absent)}%` }"
                      >
                        <div class="bar-highlight"></div>
                      </div>
                    </div>

                    <span>{{ shortDateDay(day.date) }}<span class="chart-x-month"> {{ shortDateMonth(day.date) }}</span></span>
                  </div>

                  <div v-if="!hasAttendanceChartData" class="chart-empty">
                    No submitted attendance records in this date range.
                  </div>
                </div>
              </div>

              <p class="chart-open-hint">Open the full attendance list →</p>
            </section>
          </section>

          <section class="quick-section">
            <div class="quick-heading">
              <h3>Quick Links</h3>
              <p>Jump straight to the records you manage most often</p>
            </div>

            <div class="quick-grid">
              <a href="/desk/student" class="quick-card green-quick" @click.prevent="navigateToDesk('/desk/student')">
                <div class="quick-icon">♙</div>
                <div>
                  <strong>My Students</strong>
                  <span>Open the student list</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/student-group" class="quick-card orange-quick" @click.prevent="navigateToDesk('/desk/student-group')">
                <div class="quick-icon">▤</div>
                <div>
                  <strong>My Classes</strong>
                  <span>Open the student groups</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/course-schedule" class="quick-card purple-quick" @click.prevent="navigateToDesk('/desk/course-schedule')">
                <div class="quick-icon">◷</div>
                <div>
                  <strong>Schedule</strong>
                  <span>Open the class timetable</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/student-attendance" class="quick-card blue-quick" @click.prevent="navigateToDesk('/desk/student-attendance')">
                <div class="quick-icon">✓</div>
                <div>
                  <strong>Attendance</strong>
                  <span>Open attendance records</span>
                </div>
                <b>→</b>
              </a>
            </div>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script>
import { getContext, isInstructorUser } from '@/lib/context'

export default {
  name: 'InstructorDashboard',

  data() {
    return {
      loading: true,
      error: null,
      context: null,
      dashboard: {
        mode: null,
        instructor: {},
        students: [],
        courses: [],
        groups: [],
        today_sessions: [],
        upcoming_sessions: [],
        attendance: {},
        students_count: 0,
        sessions_count: 0,
      },
      filters: { startDate: '', endDate: '' },
      appliedRange: { start: '', end: '' },
      filterError: null,
    }
  },

  computed: {
    greeting() {
      const hour = new Date().getHours()

      if (hour >= 5 && hour < 12) return 'Good morning'
      if (hour >= 12 && hour < 17) return 'Good afternoon'
      return 'Good evening'
    },

    hasActiveFilters() {
      return Boolean(this.appliedRange.start || this.appliedRange.end)
    },

    courseSchedulePath() {
      const instructorId = this.instructorProfile?.id

      return instructorId
        ? `/desk/course-schedule?instructor=${encodeURIComponent(instructorId)}`
        : '/desk/course-schedule'
    },

    instructorProfile() {
      return this.dashboard?.instructor || {}
    },

    instructorName() {
      return this.instructorProfile.name || 'Instructor'
    },

    instructorInitials() {
      const name = this.instructorName || 'Instructor'
      const parts = name.split(/\s+/).filter(Boolean)

      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }

      return name.slice(0, 2).toUpperCase() || 'IN'
    },

    instructor() {
      return this.dashboard?.instructor || {}
    },

    students() {
      return Array.isArray(this.dashboard?.students)
        ? this.dashboard.students
        : []
    },

    courses() {
      return Array.isArray(this.dashboard?.courses)
        ? this.dashboard.courses
        : []
    },

    groups() {
      return Array.isArray(this.dashboard?.groups)
        ? this.dashboard.groups
        : []
    },

    todayClasses() {
      return Array.isArray(this.dashboard?.today_sessions)
        ? this.dashboard.today_sessions
        : []
    },

    myClasses() {
      return [...this.groups]
    },

    myCoursesCount() {
      return this.courses.length
    },

    myClassesCount() {
      return this.groups.length
    },

    todayClassesCount() {
      return this.todayClasses.length
    },

    attendanceTrend() {
      const trend = this.dashboard?.attendance?.trend

      return Array.isArray(trend) ? trend : []
    },

    attendanceChartMax() {
      return this.attendanceTrend.reduce(
        (max, day) =>
          Math.max(
            max,
            Number(day.present) || 0,
            Number(day.absent) || 0
          ),
        0
      )
    },

    attendanceChartAxis() {
      const max = Math.max(this.attendanceChartMax, 1)

      const quarter = max * 0.75
      const half = max * 0.5
      const third = max * 0.25

      const round = value =>
        Number.isInteger(value) ? value : Math.round(value * 10) / 10

      return [
        String(round(max)),
        String(round(quarter)),
        String(round(half)),
        String(round(third)),
        '0',
      ]
    },

    hasAttendanceChartData() {
      return this.attendanceTrend.some(
        day => (Number(day.present) || 0) > 0 || (Number(day.absent) || 0) > 0
      )
    },

    attendancePeriodLabel() {
      const filters = this.dashboard?.filters
      const start = filters?.start_date
      const end = filters?.end_date

      if (!start || !end) {
        return ''
      }

      return `${this.formatDate(start)} - ${this.formatDate(end)}`
    },

    attendanceTotals() {
      return this.attendanceTrend.reduce(
        (acc, day) => ({
          present: acc.present + (Number(day.present) || 0),
          absent: acc.absent + (Number(day.absent) || 0),
        }),
        { present: 0, absent: 0 }
      )
    },

    attendanceListPath() {
      return '/desk/student-attendance'
    },
  },

  mounted() {
    this.load()
    this.$nextTick(() => this.reportDashboardHeight())

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
            height,
          },
          window.location.origin
        )
      })
    },

    getInitials(value) {
      const name = value || 'Instructor'
      const parts = name.split(/\s+/).filter(Boolean)

      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }

      return name.slice(0, 2).toUpperCase() || 'IN'
    },

    async refresh() {
      await this.load()
    },

    async fetchJson(url) {
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
        throw new Error(
          result?.exception ||
          result?.message ||
          `Request failed with status ${response.status}`
        )
      }

      return result
    },

    async load() {
      this.loading = true
      this.error = null

      try {
        this.context = await getContext()

        if (!isInstructorUser(this.context)) {
          this.error = 'This dashboard is only available to instructor accounts.'
          return
        }

        const params = new URLSearchParams()

        if (this.appliedRange.start) {
          params.set('start_date', this.appliedRange.start)
        }

        if (this.appliedRange.end) {
          params.set('end_date', this.appliedRange.end)
        }

        const query = params.toString() ? `?${params.toString()}` : ''
        const result = await this.fetchJson(
          `/api/method/backend_custom_app.api.education.get_dashboard${query}`
        )

        if (result?.message) {
          this.dashboard = {
            ...this.dashboard,
            ...result.message,
          }

        }
      } catch (error) {
        console.error('Instructor dashboard API error:', error)
        this.error = error?.message || 'Unable to load dashboard data.'
      } finally {
        this.loading = false
      }
    },

    applyFilter() {
      this.filterError = null

      const start = String(this.filters.startDate || '').trim()
      const end = String(this.filters.endDate || '').trim()

      if (!start || !end) {
        this.filterError = 'Select both a start date and an end date.'
        return
      }

      const startParsed = new Date(start)
      const endParsed = new Date(end)

      if (
        Number.isNaN(startParsed.getTime()) ||
        Number.isNaN(endParsed.getTime())
      ) {
        this.filterError = 'Enter valid dates for both fields.'
        return
      }

      // ISO yyyy-mm-dd strings compare correctly as strings.
      if (start > end) {
        this.filterError = 'Start date must be on or before the end date.'
        return
      }

      this.appliedRange = { start, end }
      this.load()
    },

    resetFilters() {
      this.filterError = null
      this.appliedRange = { start: '', end: '' }
      this.filters = { startDate: '', endDate: '' }
      this.load()
    },

    navigateToDesk(path) {
      /*
       * The dashboard runs inside the Desk iframe; navigate the
       * top window so the whole desk changes page.
       */
      const target = window.top || window

      try {
        target.location.href = path
      } catch (error) {
        window.location.href = path
      }
    },

    openNewCourseSchedule() {
      /*
       * Direct link to the Course Schedule creation form (the Desk
       * "New Course Schedule" form), opened from the Today's Classes
       * card header. Stop propagation so the panel's own navigation
       * does not also fire.
       */
      this.navigateToDesk('/desk/course-schedule/new/course-schedule')
    },

    formatDate(value) {
      if (!value) {
        return ''
      }

      const parts = String(value).split('-')

      if (parts.length < 3) {
        return String(value)
      }

      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]

      const monthIndex = Number(parts[1]) - 1
      const month = months[monthIndex] || parts[1]

      return `${Number(parts[2])} ${month} ${parts[0]}`
    },

    shortDateLabel(value) {
      if (!value) {
        return ''
      }

      const parts = String(value).split('-')

      if (parts.length < 3) {
        return String(value)
      }

      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]

      const monthIndex = Number(parts[1]) - 1

      return `${Number(parts[2])} ${months[monthIndex] || parts[1]}`
    },

    shortDateDay(value) {
      return this.shortDateLabel(value).split(' ')[0] || ''
    },

    shortDateMonth(value) {
      return this.shortDateLabel(value).split(' ')[1] || ''
    },

    getPresentBarHeight(count) {
      return this.getAttendanceBarHeight(count)
    },

    getAbsentBarHeight(count) {
      return this.getAttendanceBarHeight(count)
    },

    getAttendanceBarHeight(count) {
      const value = Number(count)
      const max = Math.max(this.attendanceChartMax, 1)

      if (!Number.isFinite(value) || value <= 0) {
        return 0
      }

      return Math.max(
        Math.round((value / max) * 100),
        6
      )
    },

    attendanceTooltip(day) {
      const present = Number(day.present) || 0
      const absent = Number(day.absent) || 0
      const leave = Number(day.leave) || 0

      const parts = [`Present ${present}`, `Absent ${absent}`]

      if (leave > 0) {
        parts.push(`Leave ${leave}`)
      }

      return `${day.label || this.formatDate(day.date)}: ${parts.join(' · ')}`
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

.content {
  width: 100%;
  max-width: none;
  min-height: 0;
  box-sizing: border-box;

  margin: 0 auto;

  padding: 28px 24px 40px;
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

  background: linear-gradient(120deg, #453D89 0%, #75449A 52%, #C8499A 100%);

  box-shadow: 0 20px 50px rgba(30, 64, 175, 0.16);
}

.hero-content {
  position: relative;
  z-index: 2;

  max-width: 650px;
}

.hero-label {
  display: flex;
  align-items: center;

  gap: 7px;

  margin-bottom: 13px;

  color: #67e8f9;

  font-size: 10px;
  font-weight: 800;

  letter-spacing: 0.12em;
}

.hero-label span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #C8499A;
}

.hero h2 {
  margin: 0;

  font-size: 30px;
  font-weight: 800;

  letter-spacing: -0.04em;
}

.hero h2 span {
  font-size: 25px;
}

.hero p {
  max-width: 590px;

  margin: 10px 0 0;

  color: #cbd5e1;

  font-size: 13px;
  line-height: 1.7;
}

.hero-content button {
  margin-top: 18px;

  padding: 9px 16px;

  border: 0;

  border-radius: 999px;

  color: #453D89;

  background: #ffffff;

  font-size: 12px;
  font-weight: 800;

  cursor: pointer;
}

.hero-content button:hover {
  background: #f3f2ff;
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

  background: rgba(200, 73, 154, 0.15);
}

.orb-two {
  width: 180px;
  height: 180px;

  right: 230px;
  bottom: -130px;

  background: rgba(69, 61, 137, 0.16);
}

/* =========================================================
   ERROR
========================================================= */

.error-alert {
  display: grid;

  grid-template-columns: auto minmax(0, 1fr) auto;

  align-items: center;

  gap: 12px;

  margin: 16px 0;

  padding: 13px 15px;

  border: 1px solid #fecaca;

  border-radius: 12px;

  color: #991b1b;

  background: #fef2f2;

  font-size: 11px;
}

.error-alert strong {
  font-size: 11px;
}

.error-alert span {
  color: #b91c1c;
}

.error-alert button {
  padding: 7px 10px;

  border: 0;

  border-radius: 7px;

  color: white;

  background: #dc2626;

  font-size: 10px;
  font-weight: 700;

  cursor: pointer;
}

/* =========================================================
   STATS
========================================================= */

.stats-grid {
  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 13px;

  margin-top: 18px;
}

.stat-card {
  position: relative;

  min-width: 0;
  min-height: 174px;

  padding: 17px;

  overflow: hidden;

  border: 1px solid #e2e8f0;

  border-radius: 16px;

  background: white;

  box-shadow: 0 6px 20px rgba(69, 61, 137, 0.035);
}

.stat-card-top {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-icon {
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

.stat-icon.purple {
  color: #6d28d9;
  background: #EDEBFA;
}

.stat-tag {
  padding: 4px 7px;

  border-radius: 6px;

  color: #0369a1;

  background: #F3EFF9;

  font-size: 9px;
  font-weight: 800;

  letter-spacing: 0.04em;
}

.green-tag {
  color: #15803d;
  background: #dcfce7;
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

.stat-body span {
  display: block;

  color: #64748b;

  font-size: 11px;
  font-weight: 600;
}

.stat-body strong {
  display: block;

  margin-top: 5px;

  color: #1E1B33;

  font-size: 24px;
  font-weight: 800;

  letter-spacing: -0.04em;
}

.stat-body strong.na-value {
  padding-top: 4px;

  color: #94a3b8;

  font-size: 13px;
  font-weight: 700;

  letter-spacing: 0;
}

.stat-footer {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;

  gap: 6px;

  margin-top: 14px;

  color: #64748b;

  font-size: 10px;
  line-height: 1.4;
}

.green-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #22c55e;
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
  background: rgba(200, 73, 154, 0.07);
}

.green-glow {
  background: rgba(34, 197, 94, 0.07);
}

.purple-glow {
  background: rgba(200, 73, 154, 0.07);
}

/* =========================================================
   PANELS
========================================================= */

.panel {
  min-width: 0;

  padding: 17px;

  border: 1px solid #e2e8f0;

  border-radius: 16px;

  background: white;

  box-shadow: 0 5px 18px rgba(69, 61, 137, 0.035);
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

.panel-title h3 {
  margin: 0;

  color: #1e293b;

  font-size: 13px;
  font-weight: 800;

  line-height: 1.3;
}

.panel-title p {
  margin: 3px 0 0;

  color: #64748b;

  font-size: 10.5px;

  line-height: 1.4;
}

/* =========================================================
   QUICK ACCESS
========================================================= */

.quick-section {
  margin-top: 28px;
}

.quick-heading {
  margin-bottom: 12px;
}

.quick-heading h3 {
  margin: 0;

  color: #1E1B33;

  font-size: 16px;
}

.quick-heading p {
  margin: 4px 0 0;

  color: #64748b;

  font-size: 10px;
}

.quick-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 11px;
}

.quick-card {
  display: grid;

  grid-template-columns: 38px minmax(0, 1fr) auto;

  align-items: center;

  gap: 10px;

  padding: 13px;

  border: 1px solid #e2e8f0;

  border-radius: 13px;

  color: inherit;

  background: white;

  text-decoration: none;

  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-2px);

  box-shadow: 0 8px 22px rgba(69, 61, 137, 0.07);
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

.quick-card strong {
  color: #334155;

  font-size: 12px;
  font-weight: 700;

  overflow-wrap: anywhere;
}

.quick-card span {
  margin-top: 3px;

  color: #64748b;

  font-size: 10px;

  overflow-wrap: anywhere;
}

.quick-card > b {
  color: #94a3b8;

  font-size: 13px;
}

.purple-quick .quick-icon {
  color: #6d28d9;
  background: #ede9fe;
}

.blue-quick .quick-icon {
  color: #0369a1;
  background: #dbeafe;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 5px;

  color: #7c3aed;

  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.toolbar-panel,
.profile-panel,
.detail-panel,
.today-panel {
  margin-top: 18px;
  padding: 16px 18px;

  border: 1px solid #e2e8f0;
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 18px rgba(69, 61, 137, 0.035);
}

/* Compact date-range filter (mirrors the Admin dashboard) */

.instructor-filter-panel {
  margin-top: 12px;
  padding: 10px 14px;

  border-radius: 14px;

  box-shadow: 0 4px 14px rgba(69, 61, 137, 0.035);
}

/* Combined profile + date-filter row */

.overview-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  align-items: stretch;

  gap: 13px;
  margin-top: 18px;
}

.overview-row .profile-panel,
.overview-row .instructor-filter-panel {
  min-width: 0;
  margin-top: 0;
}

.overview-row .instructor-filter-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* One compact row: Start · End · Apply · Reset */

.instructor-filter-panel .toolbar-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;

  gap: 8px;
  margin-top: 6px;
}

.instructor-filter-panel .filter-field {
  flex: 1 1 120px;
  max-width: 160px;
}

.instructor-filter-panel .toolbar-actions {
  flex: 0 0 auto;
  margin-top: 0;
}

.toolbar-header,
.profile-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-header h3 {
  margin: 0;

  color: #1e293b;
  font-size: 13px;
  font-weight: 800;

  line-height: 1.2;
}

.profile-copy h3 {
  margin: 0;

  color: #1e293b;
  font-size: 15px;
  font-weight: 800;
}

.filter-badge {
  padding: 3px 8px;

  border-radius: 999px;

  color: #6d28d9;
  background: #f3e8ff;

  font-size: 10px;
  font-weight: 700;
}

.toolbar-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 148px));
  gap: 10px;
  margin-top: 8px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 3px;

  min-width: 0;
}

.filter-field span {
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.filter-field input {
  width: 100%;
  min-width: 0;
  padding: 6px 8px;

  border: 1px solid #dfe7f1;
  border-radius: 8px;

  color: #1f2937;
  background: #f8fafc;

  font: inherit;
  font-size: 12px;
}

.filter-field input:disabled {
  opacity: 0.65;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  gap: 8px;
  margin-top: 8px;
}

.primary-btn,
.secondary-btn {
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;

  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  color: white;
  background: linear-gradient(120deg, #453D89 0%, #C8499A 100%);
}

.secondary-btn {
  color: #334155;
  background: #eef2ff;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.filter-status {
  color: #64748b;

  font-size: 11px;
  font-weight: 600;
}

.filter-error {
  margin: 8px 0 0;

  color: #b91c1c;

  font-size: 11.5px;
  font-weight: 600;
}

.profile-panel {
  align-items: center;
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;

  border-radius: 16px;

  color: white;
  background: linear-gradient(120deg, #453D89 0%, #C8499A 100%);

  font-size: 14px;
  font-weight: 800;
}

.profile-copy {
  flex: 1;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;

  color: #64748b;
  font-size: 10px;
}

.profile-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 90px));
  gap: 10px;
}

.profile-metrics div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 6px;

  border-radius: 12px;
  background: #f8fafc;
}

.profile-metrics strong {
  color: #1e293b;
  font-size: 16px;
}

.profile-metrics span {
  color: #64748b;
  font-size: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
  margin-top: 18px;
}

.detail-panel {
  min-height: 220px;
  margin-top: 0;
}

.today-panel {
  margin-top: 18px;
}

.today-chip {
  flex: 0 0 auto;
}

/* =========================================================
   ATTENDANCE CHART
========================================================= */

.chart-panel {
  position: relative;

  min-height: 220px;
  margin-top: 0;

  container-type: inline-size;
  container-name: chartPanel;
}

.chart-panel:hover,
.chart-panel:focus-within {
  z-index: 5;
}

@container chartPanel (max-width: 540px) {
  .chart-x-month {
    display: none;
  }

  .chart-tooltip {
    max-width: 150px;
  }
}

.chart-panel .panel-header {
  flex-wrap: wrap;

  gap: 8px 12px;
}

.chart-panel .panel-title {
  flex: 1 1 220px;
}

.chart-open-hint {
  margin: 6px 0 0;

  color: #6d28d9;

  font-size: 11px;
  font-weight: 700;

  text-align: right;
}

.clickable-panel:hover .chart-open-hint {
  text-decoration: underline;
}

.panel-total {
  flex: 0 0 auto;
  text-align: right;
}

.panel-total span {
  display: block;

  color: #64748b;

  font-size: 10px;
  font-weight: 800;

  letter-spacing: 0.05em;
}

.attendance-totals {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: baseline;

  gap: 2px 6px;

  margin-top: 3px;

  color: #1E1B33;

  font-size: 14px;
  font-weight: 800;
}

.attendance-totals span {
  display: inline;

  color: inherit;

  font-size: inherit;
  font-weight: inherit;

  letter-spacing: normal;

  white-space: nowrap;
}

.attendance-totals i {
  color: #94a3b8;

  font-style: normal;
}

.chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 14px;

  margin: 0 0 2px 48px;
}

.legend-item {
  display: inline-flex;
  align-items: center;

  gap: 6px;

  color: #475569;

  font-size: 11px;
  font-weight: 600;
}

.legend-dot {
  width: 10px;
  height: 10px;

  border-radius: 3px;
}

.legend-dot.present-dot {
  background: linear-gradient(180deg, #38bdf8, #453D89);
}

.legend-dot.absent-dot {
  background: linear-gradient(180deg, #f9a8d4, #C8499A);
}

.chart {
  position: relative;

  display: flex;
  align-items: flex-end;

  height: 230px;

  padding:
    15px
    12px
    4px
    52px;

  overflow: visible;
}

.chart-bars {
  display: flex;
  align-items: flex-end;

  flex: 1;
  min-width: 0;

  height: 100%;
}

.chart-y {
  position: absolute;

  left: 0;
  top: 12px;
  bottom: 24px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  color: #64748b;

  font-size: 10px;
  font-weight: 600;
}

.chart-grid {
  position: absolute;

  left: 52px;
  right: 5px;
  top: 15px;
  bottom: 24px;

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
  min-width: 0;

  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  gap: 6px;

  border-radius: 8px;
}

.chart-item:focus-visible {
  outline: 2px solid #453D89;

  outline-offset: 2px;
}

.bar-area {
  width: min(42px, 100%);
  height: 170px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-area.dual-bar {
  gap: 5px;
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

.dual-bar .bar {
  width: 14px;
  max-width: calc(50% - 4px);
  min-height: 0;
}

.bar-present {
  background:
    linear-gradient(
      180deg,
      #38bdf8,
      #453D89
    );
}

.bar-absent {
  background:
    linear-gradient(
      180deg,
      #f9a8d4,
      #C8499A
    );
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

.chart-item > span {
  max-width: 100%;

  overflow: hidden;
  text-overflow: ellipsis;

  color: #64748b;

  font-size: 10px;
  font-weight: 600;

  white-space: nowrap;
}

.chart-x-month {
  color: #94a3b8;

  font-weight: 500;
}

.chart-tooltip {
  position: absolute;

  top: 0;
  left: 50%;

  transform: translateX(-50%);

  z-index: 6;

  max-width: 220px;

  padding: 7px 10px;

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;

  color: #f8fafc;

  background: #0f172a;

  box-shadow:
    0 6px 16px
    rgba(15, 23, 42, 0.35);

  font-size: 11px;
  font-weight: 600;

  line-height: 1.45;

  text-align: center;

  pointer-events: none;

  opacity: 0;

  transition:
    opacity 0.2s ease;
}

.chart-item:hover .chart-tooltip,
.chart-item:focus-within .chart-tooltip {
  opacity: 1;
}

/* Keep edge tooltips inside the card instead of
   overflowing into neighbouring panels. */

.chart-bars .chart-item:first-child .chart-tooltip {
  left: 0;
  transform: none;
}

.chart-bars .chart-item:last-child .chart-tooltip {
  left: auto;
  right: 0;
  transform: none;
}

.chart-empty {
  width: 100%;

  align-self: center;

  color: #64748b;

  font-size: 12px;

  text-align: center;
}

/* =========================================================
   CLICKABLE CARDS + PANELS
========================================================= */

.clickable-card {
  cursor: pointer;

  transition:
    transform 0.18s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.clickable-card:hover {
  transform: translateY(-2px);

  border-color: #c9bce4;

  box-shadow:
    0 10px 26px
    rgba(69, 61, 137, 0.1);
}

.clickable-card:focus-visible {
  outline: 2px solid #453D89;

  outline-offset: 2px;

  box-shadow:
    0 10px 26px
    rgba(69, 61, 137, 0.12);
}

.clickable-panel {
  cursor: pointer;

  transition:
    transform 0.18s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.clickable-panel:hover {
  transform: translateY(-2px);

  border-color: #c9bce4;

  box-shadow:
    0 10px 26px
    rgba(69, 61, 137, 0.1);
}

.clickable-panel:focus-visible {
  outline: 2px solid #453D89;

  outline-offset: 2px;

  box-shadow:
    0 10px 26px
    rgba(69, 61, 137, 0.12);
}

.stack-list {
  display: grid;
  gap: 10px;

  /* The panel header stays visible; only this list region scrolls
     when a section's data outgrows the card height. */

  max-height: 360px;
  overflow-y: auto;
  overscroll-behavior: contain;

  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.35) transparent;
}

.stack-list::-webkit-scrollbar {
  width: 6px;
}

.stack-list::-webkit-scrollbar-track {
  background: transparent;
}

.stack-list::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background: rgba(100, 116, 139, 0.35);
}

.stack-list.compact-list {
  max-height: 300px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;

  border-bottom: 1px solid #edf2f7;
}

.list-row:last-child {
  border-bottom: 0;
}

.list-row strong {
  display: block;
  color: #1e293b;
  font-size: 12px;
  font-weight: 700;

  overflow-wrap: anywhere;
}

.list-row small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 10.5px;

  overflow-wrap: anywhere;
}

.list-meta {
  text-align: right;
}

.count-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 24px;
  padding: 0 8px;

  border-radius: 999px;

  background: #f3e8ff;
  color: #6d28d9;

  font-size: 10px;
  font-weight: 800;
}

.panel-header-actions {
  display: flex;
  align-items: center;

  gap: 8px;
}

.add-schedule-btn {
  padding: 5px 11px;

  border: 1px solid #e2e8f0;
  border-radius: 999px;

  background: #ffffff;
  color: #453D89;

  font-size: 10px;
  font-weight: 700;

  cursor: pointer;

  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.add-schedule-btn:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.add-schedule-btn:focus-visible {
  outline: 2px solid #a5b4fc;
  outline-offset: 2px;
}

.student-row {
  align-items: center;
}

.student-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;

  border-radius: 10px;

  background: linear-gradient(120deg, #e0e7ff, #f5d0fe);
  color: #453D89;

  font-size: 10px;
  font-weight: 800;
}

.empty-state {
  padding: 20px 8px 0;

  color: #64748b;
  font-size: 11px;
  line-height: 1.6;
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

/* =========================================================
   FOOTER
========================================================= */

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-top: 30px;
  padding-top: 17px;

  border-top: 1px solid #e2e8f0;

  color: #94a3b8;

  font-size: 9px;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1200px) {
  .content {
    padding: 8px 12px 20px;
  }

  .hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .app-shell {
    padding-top: 0;
  }

  .content {
    padding: 8px 22px 32px;
  }

  .main {
    margin-left: 0;
    padding-top: 0;
    padding-bottom: 0;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-header,
  .profile-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-row {
    grid-template-columns: 1fr;
  }

  .panel-header {
    align-items: flex-start;
  }

  .panel-total {
    text-align: left;
  }

  .attendance-totals {
    justify-content: flex-start;
  }

  .chart-legend {
    margin-left: 0;
  }

  .profile-copy {
    width: 100%;
    min-width: 0;
  }

  .profile-metrics {
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .content {
    padding: 12px 12px 20px;
  }

  .hero {
    min-height: auto;
    gap: 12px;
    padding: 18px 16px;
    border-radius: 16px;
  }

  .hero-content {
    width: 100%;
    min-width: 0;
  }

  .hero h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .hero p {
    overflow-wrap: anywhere;
    font-size: 11px;
  }

  .toolbar-panel,
  .profile-panel,
  .detail-panel,
  .today-panel,
  .chart-panel {
    margin-top: 12px;
    padding: 14px;
  }

  .stack-list {
    max-height: 280px;
  }

  .stack-list.compact-list {
    max-height: 240px;
  }

  .instructor-filter-panel {
    padding: 10px 12px;
  }

  .instructor-filter-panel .filter-field {
    flex: 1 1 100%;
    max-width: none;
  }

  .stats-grid,
  .toolbar-fields,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .bar-area.dual-bar {
    gap: 3px;
  }

  .dual-bar .bar {
    width: 10px;
  }

  .chart-x-month {
    display: none;
  }

  .stat-card {
    min-height: 0;
    padding: 14px;
  }

  .stat-body {
    margin-top: 16px;
  }

  .stat-body strong {
    font-size: 22px;
    overflow-wrap: anywhere;
  }

  .stat-footer {
    align-items: flex-start;
    flex-wrap: wrap;
    line-height: 1.4;
  }

  .toolbar-fields,
  .filter-field,
  .filter-field input {
    min-width: 0;
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .toolbar-actions button {
    min-height: 40px;
  }

  .profile-metrics {
    gap: 8px;
  }

  .profile-meta {
    overflow-wrap: anywhere;
  }

  .detail-panel {
    min-height: 0;
  }

  .list-row {
    align-items: flex-start;
    gap: 8px;
  }

  .list-row > div:not(.student-pill) {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .list-row > div:first-child:not(.student-pill),
  .student-row > div:last-child {
    flex: 1;
  }

  .list-meta {
    flex: 0 0 auto;
    max-width: 45%;
  }

  .student-pill {
    flex: 0 0 30px;
  }

  .error-alert {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
