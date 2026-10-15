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

          <section class="toolbar-panel">
            <div class="toolbar-header">
              <div>
                <span class="eyebrow">FILTERS</span>
                <h3>Instructor date range</h3>
              </div>
              <span v-if="hasActiveFilters" class="filter-badge">Filtered</span>
            </div>

            <div class="toolbar-fields">
              <label class="filter-field">
                <span>Start date</span>
                <input v-model="startDate" type="date" />
              </label>

              <label class="filter-field">
                <span>End date</span>
                <input v-model="endDate" type="date" />
              </label>
            </div>

            <div class="toolbar-actions">
              <button type="button" class="primary-btn" @click="applyFilter">Apply Filter</button>
              <button type="button" class="secondary-btn" @click="resetFilters">Reset</button>
              <button v-if="hasActiveFilters" type="button" class="text-btn" @click="backToOverview">Back</button>
            </div>
          </section>

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

          <div v-if="error" class="error-alert">
            <strong>Dashboard error</strong>
            <span>{{ error }}</span>
            <button type="button" @click="refresh">Try again</button>
          </div>

          <section class="stats-grid instructor-stats">
            <article class="stat-card blue-card">
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

            <article class="stat-card purple-card">
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

            <article class="stat-card green-card">
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

            <article class="stat-card blue-card">
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

          <section class="detail-grid">
            <article class="panel detail-panel">
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon blue">◷</div>
                  <div>
                    <h3>Today's Classes</h3>
                    <p>{{ hasActiveFilters ? 'Filtered schedule' : 'Classes scheduled for today' }}</p>
                  </div>
                </div>
              </div>

              <div v-if="todayClasses.length" class="stack-list">
                <div v-for="session in todayClasses.slice(0, 6)" :key="session.id || session.name || `${session.course}-${session.date}`" class="list-row">
                  <div>
                    <strong>{{ session.course || 'Class' }}</strong>
                    <small>{{ session.studentGroup || 'Group not available' }}</small>
                  </div>
                  <div class="list-meta">
                    <span>{{ session.date || '—' }}</span>
                    <small>{{ session.fromTime || '' }}{{ session.toTime ? ' - ' + session.toTime : '' }}</small>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">No classes are scheduled in the selected date range.</div>
            </article>

            <article class="panel detail-panel">
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
                <div v-for="student in students.slice(0, 8)" :key="student.id || student.name" class="list-row student-row">
                  <div class="student-pill">{{ getInitials(student.name) }}</div>
                  <div>
                    <strong>{{ student.name }}</strong>
                    <small>{{ student.id }}</small>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">No students are assigned to your groups yet.</div>
            </article>

            <article class="panel detail-panel">
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
                <div v-for="course in courses.slice(0, 8)" :key="course.name || course.id || course.group" class="list-row">
                  <div>
                    <strong>{{ course.name }}</strong>
                    <small>{{ course.group || 'Group not set' }}</small>
                  </div>
                  <span class="count-chip">{{ course.studentCount || 0 }}</span>
                </div>
              </div>
              <div v-else class="empty-state">No courses are assigned to your instructor groups.</div>
            </article>

            <article class="panel detail-panel">
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
                <div v-for="group in groups.slice(0, 8)" :key="group.id || group.name" class="list-row">
                  <div>
                    <strong>{{ group.name }}</strong>
                    <small>{{ group.program || 'Program not set' }}</small>
                  </div>
                  <span class="count-chip">{{ group.studentCount || 0 }}</span>
                </div>
              </div>
              <div v-else class="empty-state">No classes are currently assigned to this instructor.</div>
            </article>
          </section>

          <section class="quick-section">
            <div class="quick-heading">
              <h3>Quick Links</h3>
              <p>Jump straight to the records you manage most often</p>
            </div>

            <div class="quick-grid">
              <a href="/desk/student" class="quick-card green-quick" onclick="window.top.location.href=this.href; return false;">
                <div class="quick-icon">♙</div>
                <div>
                  <strong>My Students</strong>
                  <span>Open the student list</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/student-group" class="quick-card orange-quick" onclick="window.top.location.href=this.href; return false;">
                <div class="quick-icon">▤</div>
                <div>
                  <strong>My Classes</strong>
                  <span>Open the student groups</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/course-schedule" class="quick-card purple-quick" onclick="window.top.location.href=this.href; return false;">
                <div class="quick-icon">◷</div>
                <div>
                  <strong>Schedule</strong>
                  <span>Open the class timetable</span>
                </div>
                <b>→</b>
              </a>

              <a href="/desk/student-attendance" class="quick-card blue-quick" onclick="window.top.location.href=this.href; return false;">
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
      startDate: '',
      endDate: '',
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
      return Boolean(this.startDate || this.endDate)
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

        if (this.startDate) {
          params.set('start_date', this.startDate)
        }

        if (this.endDate) {
          params.set('end_date', this.endDate)
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
      if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.error = 'Start date must be earlier than the end date.'
        return
      }

      this.load()
    },

    resetFilters() {
      this.startDate = ''
      this.endDate = ''
      this.load()
    },

    backToOverview() {
      this.resetFilters()
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

  font-size: 8px;
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

  font-size: 10px;
}

.stat-body strong {
  display: block;

  margin-top: 5px;

  color: #1E1B33;

  font-size: 25px;
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

  color: #94a3b8;

  font-size: 9px;
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

  font-size: 12px;
  font-weight: 800;
}

.panel-title p {
  margin: 3px 0 0;

  color: #94a3b8;

  font-size: 9px;
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

  color: #94a3b8;

  font-size: 9px;
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

  font-size: 10px;
}

.quick-card span {
  margin-top: 3px;

  color: #94a3b8;

  font-size: 9px;
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
.detail-panel {
  margin-top: 18px;
  padding: 18px 20px;

  border: 1px solid #e2e8f0;
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 18px rgba(69, 61, 137, 0.035);
}

.toolbar-header,
.profile-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.toolbar-header h3,
.profile-copy h3 {
  margin: 0;

  color: #1e293b;
  font-size: 15px;
  font-weight: 800;
}

.filter-badge {
  padding: 6px 10px;

  border-radius: 999px;

  color: #6d28d9;
  background: #f3e8ff;

  font-size: 9px;
  font-weight: 700;
}

.toolbar-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 180px));
  gap: 12px;
  margin-top: 16px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-field span {
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filter-field input {
  width: 100%;
  padding: 10px 12px;

  border: 1px solid #dfe7f1;
  border-radius: 10px;

  color: #1f2937;
  background: #f8fafc;

  font: inherit;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.primary-btn,
.secondary-btn,
.text-btn {
  padding: 9px 14px;
  border: 0;
  border-radius: 10px;

  font-size: 10px;
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

.text-btn {
  color: #4f46e5;
  background: transparent;
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
  font-size: 9px;
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
  font-size: 9px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
  margin-top: 18px;
}

.detail-panel {
  min-height: 220px;
}

.stack-list {
  display: grid;
  gap: 10px;
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
  font-size: 10px;
}

.list-row small {
  display: block;
  margin-top: 3px;
  color: #94a3b8;
  font-size: 9px;
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

  font-size: 9px;
  font-weight: 800;
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

  font-size: 9px;
  font-weight: 800;
}

.empty-state {
  padding: 20px 8px 0;

  color: #94a3b8;
  font-size: 10px;
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
    grid-template-columns: 1fr;
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
  .detail-panel {
    margin-top: 12px;
    padding: 14px;
  }

  .stats-grid,
  .toolbar-fields,
  .detail-grid {
    grid-template-columns: 1fr;
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
