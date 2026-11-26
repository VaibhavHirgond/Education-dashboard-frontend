<template>
  <div class="sidebar-root">
    <aside class="desktop-sidebar">
      <div class="sidebar-inner">
        <div class="brand">
          <div class="brand-mark">E</div>
          <div class="brand-text">
            <strong>Education</strong>
            <span>Management System</span>
          </div>
        </div>

        <nav class="navigation">
          <template v-for="(section, index) in navSections" :key="'d-' + section.label">
            <p class="navigation-label" :class="{ 'education-label': index > 0 }">
              {{ section.label }}
            </p>

            <router-link
              v-for="item in section.items"
              :key="'d-' + item.to"
              :to="item.to"
              exact-active-class="navigation-active"
              active-class="navigation-active"
              class="navigation-item"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.text }}</span>
              <span
                v-if="item.to === '/student-notifications' && unreadNotifications"
                class="nav-badge"
              >
                {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
              </span>
              <span
                v-if="item.to === '/messages' && unreadMessages"
                class="nav-badge"
              >
                {{ unreadMessages > 99 ? '99+' : unreadMessages }}
              </span>
            </router-link>
          </template>
        </nav>

        <button
          type="button"
          class="sidebar-logout"
          :disabled="loggingOut"
          @click="logout"
        >
          <span class="logout-icon">
            {{ loggingOut ? '…' : '↪' }}
          </span>
          <span>
            {{ loggingOut ? 'Logging out…' : 'Logout' }}
          </span>
        </button>

       
      </div>
    </aside>

    <header class="mobile-topbar">
      <div class="mobile-brand">
        <div class="brand-mark">E</div>
        <div class="brand-text">
          <strong>Education</strong>
          <span>Management System</span>
        </div>
      </div>

      <button
        type="button"
        class="mobile-menu-button"
        aria-label="Open navigation"
        @click="openMobileMenu"
      >
        ☰
      </button>
    </header>

    <div v-if="mobileMenuOpen" class="mobile-navigation-layer">
      <button
        type="button"
        class="mobile-backdrop"
        aria-label="Close navigation"
        @click.stop="closeMobileMenu"
      ></button>

      <aside class="mobile-drawer" aria-label="Mobile navigation" @click.stop>
        <div class="drawer-header">
          <div class="mobile-brand">
            <div class="brand-mark">E</div>
            <div class="brand-text">
              <strong>Education</strong>
              <span>Management System</span>
            </div>
          </div>

          <button
            type="button"
            class="drawer-close"
            aria-label="Close navigation"
            @click="closeMobileMenu"
          >
            ×
          </button>
        </div>

        <nav class="navigation">
          <template v-for="(section, index) in navSections" :key="'m-' + section.label">
            <p class="navigation-label" :class="{ 'education-label': index > 0 }">
              {{ section.label }}
            </p>

            <router-link
              v-for="item in section.items"
              :key="'m-' + item.to"
              :to="item.to"
              exact-active-class="navigation-active"
              active-class="navigation-active"
              class="navigation-item"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.text }}</span>
              <span
                v-if="item.to === '/student-notifications' && unreadNotifications"
                class="nav-badge"
              >
                {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
              </span>
              <span
                v-if="item.to === '/messages' && unreadMessages"
                class="nav-badge"
              >
                {{ unreadMessages > 99 ? '99+' : unreadMessages }}
              </span>
            </router-link>
          </template>
        </nav>

        <button
          type="button"
          class="sidebar-logout"
          :disabled="loggingOut"
          @click="logout"
        >
          <span class="logout-icon">
            {{ loggingOut ? '…' : '↪' }}
          </span>
          <span>
            {{ loggingOut ? 'Logging out…' : 'Logout' }}
          </span>
        </button>
      </aside>
    </div>
  </div>
</template>

<script>
import { clearContext, getContext, portalMode } from '@/lib/context'
import { clearCsrfToken } from '@/lib/csrf'
import { apiGet } from '@/lib/api'

var STAFF_NAV = [
  {
    label: 'MAIN MENU',
    items: [
      { to: '/', icon: '⌂', text: 'Dashboard' },
    ],
  },
  {
    label: 'ADMISSIONS',
    items: [
      { to: '/admissions', icon: '✎', text: 'Student Applicants' },
      { to: '/admission-cycles', icon: '▤', text: 'Student Admissions' },
    ],
  },
  {
    label: 'ACADEMICS',
    items: [
      { to: '/students', icon: '♙', text: 'Students' },
      { to: '/fees', icon: '₹', text: 'Fees & Payments' },
      { to: '/attendance', icon: '✓', text: 'Attendance' },
      { to: '/notifications', icon: '◉', text: 'Notifications' },
      { to: '/messages', icon: '✉', text: 'Messages' },
      { to: '/courses', icon: '▣', text: 'Courses' },
      { to: '/timetable', icon: '◷', text: 'Timetable' },
      { to: '/assessments', icon: '◆', text: 'Assessments' },
      { to: '/instructors', icon: '♟', text: 'Instructors' },
      { to: '/student-groups', icon: '◎', text: 'Student Groups' },
    ],
  },
]

var STUDENT_NAV = [
  {
    label: 'MAIN MENU',
    items: [
      { to: '/', icon: '⌂', text: 'Dashboard' },
      { to: '/timetable', icon: '◷', text: 'Schedule' },
      { to: '/grades', icon: '★', text: 'Grades' },
      { to: '/fees', icon: '₹', text: 'Fees' },
      { to: '/attendance', icon: '✓', text: 'Attendance' },
      { to: '/student-notifications', icon: '◉', text: 'Notifications' },
      { to: '/messages', icon: '✉', text: 'Messages' },
    ],
  },
]

var INSTRUCTOR_NAV = [
  {
    label: 'MAIN MENU',
    items: [
      { to: '/', icon: '⌂', text: 'Dashboard' },
      { to: '/students', icon: '♙', text: 'My Students' },
      { to: '/timetable', icon: '◷', text: 'Timetable' },
      { to: '/attendance', icon: '✓', text: 'Attendance' },
      { to: '/messages', icon: '✉', text: 'Messages' },
    ],
  },
]

export default {
  name: 'Sidebar',

  data() {
    return {
      mobileMenuOpen: false,
      loggingOut: false,
      unreadNotifications: 0,
      mode: '',
      unreadMessages: 0,
    }
  },

  computed: {
    navSections() {
      if (this.mode === 'student') {
        return STUDENT_NAV
      }

      if (this.mode === 'instructor') {
        return INSTRUCTOR_NAV
      }

      if (this.mode === 'staff') {
        return STAFF_NAV
      }

      return []
    },
  },

  mounted() {
    var self = this
    getContext().then(function(ctx) {
      self.mode = portalMode(ctx) || ''
      if (self.mode === 'student') {
        self.loadUnreadNotifications()
        self.loadUnreadMessages()
        window.addEventListener('student-notifications-updated', self.loadUnreadNotifications)
        window.addEventListener('messages-updated', self.loadUnreadMessages)
      }
      if (self.mode === 'staff' || self.mode === 'instructor') {
        self.loadUnreadMessages()
        window.addEventListener('messages-updated', self.loadUnreadMessages)
      }
    }).catch(function(error) {
      console.warn('Sidebar context error:', error)
      self.mode = ''
    })
  },

  methods: {
    loadUnreadNotifications() {
      var self = this
      return apiGet(
        '/api/method/backend_custom_app.api.student_notifications.get_student_notifications',
        { limit: 1 }
      ).then(function(result) {
        var count = 0
        if (result && result.unread_count) {
          count = Number(result.unread_count)
        }
        if (!count && result && result.message && result.message.unread_count) {
          count = Number(result.message.unread_count)
        }
        self.unreadNotifications = count || 0
      }).catch(function(error) {
        self.unreadNotifications = 0
      })
    },

    loadUnreadMessages() {
      var self = this
      return apiGet('/api/method/backend_custom_app.api.messages.get_unread_counts').then(function(result) {
        var count = 0
        if (result && result.unread_count) {
          count = Number(result.unread_count)
        }
        if (!count && result && result.message && result.message.unread_count) {
          count = Number(result.message.unread_count)
        }
        self.unreadMessages = count || 0
      }).catch(function(error) {
        self.unreadMessages = 0
      })
    },

    openMobileMenu() {
      this.mobileMenuOpen = true
      document.body.classList.add('sidebar-mobile-open')
    },

    closeMobileMenu() {
      this.mobileMenuOpen = false
      document.body.classList.remove('sidebar-mobile-open')
    },

    logout() {
      if (this.loggingOut) return

      this.loggingOut = true
      this.closeMobileMenu()

      return fetch('/api/method/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(function(response) {
        if (!response.ok) {
          throw new Error('Logout failed with status ' + response.status)
        }
        sessionStorage.clear()
        localStorage.clear()
        clearContext()
        clearCsrfToken()
        window.top.location.href = '/login'
      }).catch(function(error) {
        console.error('Logout failed:', error)
        this.loggingOut = false
        window.alert('Unable to logout. Please try again.')
      }.bind(this))
    },
  },

  beforeUnmount() {
    document.body.classList.remove('sidebar-mobile-open')
    window.removeEventListener('student-notifications-updated', this.loadUnreadNotifications)
    window.removeEventListener('messages-updated', this.loadUnreadMessages)
  },
}
</script>

<style scoped>
.desktop-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 255px;
  height: 100vh;
  z-index: 1000;
  overflow: hidden;
  box-sizing: border-box;
  color: #ffffff;
  background: var(--theme-sidebar-bg,linear-gradient(105deg, #453D89, #C8499A));
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 10px 0 35px rgba(34, 30, 69, 0.25);
}

.sidebar-inner {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 28px 17px 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.brand,
.mobile-brand,
.drawer-header {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.brand {
  padding: 0 9px 30px;
}

.brand-mark{
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  background: var(--theme-gradient, linear-gradient(105deg, #453D89, #C8499A));
  box-shadow: 0 9px 28px rgba(200, 73, 154, 0.35);
}

.brand-text {
  min-width: 0;
}

.brand-text strong{
  display: block;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.brand-text span{
  display: block;
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 10px;
  white-space: nowrap;
}

.navigation {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.navigation-label{
  margin: 0 10px 9px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.education-label {
  margin-top: 25px;
}

.navigation-item{
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 39px;
  box-sizing: border-box;
  padding: 10px 13px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease, background 0.2s ease;
}

.nav-badge {
  min-width: 20px;
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 999px;
  color: #453d89;
  background: #ffffff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.3;
  text-align: center;
}

.navigation-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.navigation-active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  font-weight: 600;
}

.navigation-active::before {
  content: '';
  position: absolute;
  left: -17px;
  width: 3px;
  height: 20px;
  border-radius: 0 4px 4px 0;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.45);
}

.nav-icon{
  width: 22px;
  flex: 0 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14px;
}

.sidebar-logout{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  margin: 16px 0 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.2);
  color: #f8fafc;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.sidebar-logout:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.1);
}

.sidebar-logout:disabled {
  opacity: 0.7;
  cursor: wait;
}

.logout-icon{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  line-height: 1;
}

.sidebar-bottom {
  margin-top: auto;
  padding-top: 25px;
}

.sidebar-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  background: linear-gradient(105deg, #453D89, #C8499A);
}

.status-circle {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgba(34, 197, 94, 0.1);
}

.status-circle span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.sidebar-status strong{
  display: block;
  color: #f8fafc;
  font-size: 10px;
}

.sidebar-status small{
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 8px;
}

.sidebar-version{
  display: flex;
  justify-content: space-between;
  padding: 15px 5px 0;
  color: #475569;
  font-size: 8px;
}

.mobile-topbar {
  display: none;
}

.mobile-navigation-layer {
  position: fixed;
  inset: 0;
  z-index: 20000;
  width: 100vw;
  height: 100vh;
  pointer-events: auto;
}

.mobile-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(2px);
  cursor: pointer;
  z-index: 1;
}

.mobile-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: min(290px, 86vw);
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 22px 17px;
  color: #fff;
  background: var(--theme-sidebar-bg, linear-gradient(105deg, #453D89, #C8499A));
  box-shadow: 12px 0 40px rgba(34, 30, 69, 0.4);
  z-index: 2;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-header {
  padding: 0 4px 25px;
}

.drawer-header .brand-mark{
  width: 38px;
  height: 38px;
  flex-basis: 38px;
  font-size: 16px;
}

.drawer-close{
  width: 34px;
  height: 34px;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 9px;
  color: #fff;
  background: rgba(148, 163, 184, 0.08);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.mobile-drawer .sidebar-bottom {
  margin-top: auto;
}

@media (max-width: 900px){
  .desktop-sidebar {
    display: none;
  }

  .mobile-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.96);
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(12px);
  }

  
.mobile-topbar .brand-mark {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
    border-radius: 10px;
    font-size: 14px;
  }

  .mobile-topbar .brand-text strong {
    color: #1E1B33;
    font-size: 12px;
  }

  .mobile-topbar .brand-text span {
    color: #64748b;
    font-size: 8px;
  }

  .mobile-menu-button {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbe3ee;
    border-radius: 10px;
    color: #1E1B33;
    background: #fff;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  }  .mobile-drawer .navigation-active::before {
    left: -17px;
  }
}

@media (max-width: 480px) {
  .mobile-topbar {
    height: 60px;
    padding: 9px 12px;
  }

  .mobile-menu-button {
    width: 36px;
    height: 36px;
  }

  .mobile-drawer {
    width: min(290px, 88vw);
  }
}

@media (min-width: 901px) {
  .mobile-navigation-layer,
  .mobile-topbar {
    display: none !important;
  }
}

:global(body.sidebar-mobile-open) {
  overflow: hidden !important;
}
</style>
