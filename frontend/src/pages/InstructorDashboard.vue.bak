<template>
  <div class="app-shell">
    <main class="main">
      <div class="content">

        <!-- LOADING -->
        <template v-if="loading">
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label"><span></span> INSTRUCTOR PORTAL</div>
              <h2>Loading your dashboard…</h2>
              <p>Fetching your students and today's attendance.</p>
            </div>
          </section>
        </template>

        <!-- CONTEXT ERROR -->
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

        <!-- DASHBOARD -->
        <template v-else>

          <!-- HERO -->
          <section class="hero">
            <div class="hero-content">
              <div class="hero-label"><span></span> INSTRUCTOR PORTAL</div>
              <h2>{{ greeting }}<span>👋</span></h2>
              <p>Your students and attendance for the classes you teach.</p>
            </div>
            <div class="hero-orb orb-one"></div>
            <div class="hero-orb orb-two"></div>
          </section>

          <!-- ERROR -->
          <div v-if="error" class="error-alert">
            <strong>Dashboard error</strong>
            <span>{{ error }}</span>
            <button type="button" @click="refresh">Try again</button>
          </div>

          <!-- SUMMARY CARDS -->
          <section class="stats-grid">

            <article class="stat-card blue-card">
              <div class="stat-card-top">
                <div class="stat-icon blue">♙</div>
                <span class="stat-tag">STUDENTS</span>
              </div>
              <div class="stat-body">
                <span>Total Students</span>
                <strong>{{ stats.studentsCount }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                Your assigned students only
              </div>
              <div class="card-glow blue-glow"></div>
            </article>

            <article class="stat-card green-card">
              <div class="stat-card-top">
                <div class="stat-icon green">✓</div>
                <span class="stat-tag green-tag">PRESENT</span>
              </div>
              <div class="stat-body">
                <span>Students Present Today</span>
                <strong>{{ stats.todayPresent }}</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                {{ stats.attendanceDate || 'Today' }}
              </div>
              <div class="card-glow green-glow"></div>
            </article>

            <article class="stat-card purple-card">
              <div class="stat-card-top">
                <div class="stat-icon purple">%</div>
                <span class="stat-tag purple-tag">RATE</span>
              </div>
              <div class="stat-body">
                <span>Attendance Percentage</span>
                <strong v-if="stats.todayPercentage !== null">{{ stats.todayPercentage }}%</strong>
                <strong v-else class="na-value" title="No submitted attendance records for today">No records today</strong>
              </div>
              <div class="stat-footer">
                <span class="green-dot"></span>
                {{ stats.todayRecorded }} of {{ stats.studentsCount }} students recorded today
              </div>
              <div class="card-glow purple-glow"></div>
            </article>

          </section>

          <!-- ATTENDANCE TREND -->
          <section class="chart-section">

            <!-- 14-DAY ATTENDANCE TREND -->
            <article class="panel chart-panel">
              <div class="panel-header">
                <div class="panel-title">
                  <div class="panel-icon blue">%</div>
                  <div>
                    <h3>Attendance Trend</h3>
                    <p>Daily attendance for your students — last 14 days</p>
                  </div>
                </div>
              </div>

              <div class="chart">
                <div class="chart-y">
                  <span v-for="(label, index) in trendChartAxis" :key="`ty-${index}`">{{ label }}</span>
                </div>

                <div class="chart-grid">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>

                <div v-for="day in trend" :key="day.date" class="chart-item">
                  <div class="chart-tooltip">{{ trendTooltip(day) }}</div>

                  <div class="bar-area">
                    <div class="bar bar-pink" :style="{ height: `${barHeight(day.percentage)}%` }">
                      <div class="bar-highlight"></div>
                    </div>
                  </div>

                  <span>{{ day.short }}</span>
                </div>

                <div v-if="!hasTrendData" class="chart-empty">
                  No submitted attendance records in the last 14 days.
                </div>
              </div>
            </article>

          </section>

          <!-- QUICK ACCESS -->
          <section class="quick-section">
            <div class="quick-heading">
              <h3>Quick Access</h3>
              <p>Jump straight to the records you manage</p>
            </div>

            <div class="quick-grid">
              <a
                href="/desk/student-attendance"
                class="quick-card green-quick"
                onclick="window.top.location.href=this.href; return false;"
              >
                <div class="quick-icon">✓</div>
                <div>
                  <strong>Attendance</strong>
                  <span>Open the Student Attendance list</span>
                </div>
                <b>→</b>
              </a>

              <a
                href="/desk/assessment-plan"
                class="quick-card orange-quick"
                onclick="window.top.location.href=this.href; return false;"
              >
                <div class="quick-icon">✎</div>
                <div>
                  <strong>Assessment</strong>
                  <span>Open the Assessment Plan list</span>
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
        attendance: {},
        students_count: 0,
      },
    }
  },

  computed: {
    attendance() {
      return this.dashboard?.attendance || {}
    },

    trend() {
      return Array.isArray(this.attendance.trend) ? this.attendance.trend : []
    },

    stats() {
      const a = this.attendance
      return {
        studentsCount: this.dashboard?.students_count || 0,
        attendanceDate: a.attendance_date || '',
        todayPresent: a.today_present ?? 0,
        todayRecorded: a.today_recorded ?? 0,
        todayPercentage:
          a.today_percentage === null || a.today_percentage === undefined
            ? null
            : a.today_percentage,
      }
    },

    trendChartAxis() {
      return ['100%', '75%', '50%', '25%', '0']
    },

    hasTrendData() {
      return this.trend.some(day => Number(day.percentage) > 0)
    },

    greeting() {
      const hour = new Date().getHours()

      if (hour >= 5 && hour < 12) return 'Good morning'
      if (hour >= 12 && hour < 17) return 'Good afternoon'
      return 'Good evening'
    },
  },

  mounted() {
    this.load()
  },

  methods: {
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

        const result = await this.fetchJson(
          '/api/method/backend_custom_app.api.education.get_dashboard'
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

    barHeight(percentage) {
      const value = Number(percentage)

      if (!Number.isFinite(value) || value <= 0) {
        return 3
      }

      return Math.max(Math.min(Math.round(value), 100), 5)
    },

    trendTooltip(day) {
      if (day.percentage === null || day.percentage === undefined) {
        return `${day.label || day.date}: No records`
      }

      return (
        `${day.label || day.date}: ${day.percentage}% ` +
        `(${day.present}/${day.recorded} students)`
      )
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

  font-size: 9px;
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

  font-size: 12px;
  line-height: 1.7;
}

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

  font-size: 10px;
}

.error-alert strong {
  font-size: 10px;
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

  font-size: 9px;
  font-weight: 700;

  cursor: pointer;
}

/* =========================================================
   STATS
========================================================= */

.stats-grid {
  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

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

  font-size: 7px;
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

  font-size: 9px;
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

  font-size: 8px;
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

  font-size: 8px;
}

/* =========================================================
   CHART SECTION
========================================================= */

.chart-section {
  margin-top: 13px;
}

/* =========================================================
   CHART — 14 DAILY BARS
========================================================= */

.chart {
  position: relative;

  display: flex;
  align-items: flex-end;

  height: 190px;

  padding: 15px 12px 4px 38px;

  overflow: hidden;
}

.chart-y {
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

/* Narrower bars so 14 days fit without overflow (Home uses 42px). */
.bar-area {
  width: 16px;
  height: 135px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  position: relative;

  width: 11px;

  min-height: 4px;

  border-radius: 7px 7px 3px 3px;

  background: linear-gradient(180deg, #38bdf8, #453D89);

  transition: height 0.4s ease;
}

.bar-pink {
  background: linear-gradient(180deg, #f9a8d4, #C8499A);
}

.bar-highlight {
  position: absolute;

  top: 0;
  left: 2px;
  right: 2px;

  height: 2px;

  border-radius: 99px;

  background: rgba(255, 255, 255, 0.55);
}

.chart-item > span {
  color: #94a3b8;

  font-size: 6px;
}

.chart-tooltip {
  position: absolute;

  top: 0;

  padding: 4px 5px;

  border-radius: 5px;

  color: #475569;

  background: #f8fafc;

  font-size: 6px;

  opacity: 0;

  transition: opacity 0.2s ease;

  white-space: nowrap;
}

.chart-item:hover .chart-tooltip {
  opacity: 1;
}

.chart-empty {
  width: 100%;

  align-self: center;

  color: #94a3b8;

  font-size: 9px;

  text-align: center;
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

  font-size: 8px;
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

  font-size: 9px;
}

.quick-card span {
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

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-top: 30px;
  padding-top: 17px;

  border-top: 1px solid #e2e8f0;

  color: #94a3b8;

  font-size: 7px;
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

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .main {
    margin-left: 0;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .content {
    padding: 0 14px 28px;
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
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
