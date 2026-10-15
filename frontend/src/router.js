import {
  createRouter,
  createWebHashHistory,
} from 'vue-router'

import { getContext, portalMode } from '@/lib/context'

const routes = [
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  // {
  //   path: '/login',
  //   name: 'Login',
  //   component: () => import('@/pages/Login.vue'),
  //   meta: {
  //     guestOnly: true,
  //   },
  // },

  // {
  //   path: '/signup',
  //   name: 'Signup',
  //   component: () => import('@/pages/Signup.vue'),
  //   meta: {
  //     guestOnly: true,
  //   },
  // },

  // {
  //   path: '/forgot-password',
  //   name: 'ForgotPassword',
  //   component: () => import('@/pages/ForgotPassword.vue'),
  //   meta: {
  //     guestOnly: true,
  //   },
  // },

  // =========================================================
  // MAIN APPLICATION
  // =========================================================

  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/students',
    name: 'Students',
    component: () => import('@/pages/Students.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff', 'instructor'],
    },
  },

  {
    path: '/fees',
    name: 'Fees',
    component: () => import('@/pages/Fees.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff', 'student'],
    },
  },

  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/pages/Notifications.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff', 'instructor'],
    },
  },

  {
    path: '/student-notifications',
    name: 'StudentNotifications',
    component: () => import('@/pages/StudentNotifications.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['student'],
    },
  },

  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('@/pages/Attendance.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/courses',
    name: 'Courses',
    component: () => import('@/pages/Courses.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff', 'instructor'],
    },
  },

  {
    path: '/timetable',
    name: 'Timetable',
    component: () => import('@/pages/Timetable.vue'),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/grades',
    name: 'Grades',
    component: () => import('@/pages/Grades.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['student'],
    },
  },

  {
    path: '/assessments',
    name: 'Assessments',
    component: () => import('@/pages/Assessments.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff', 'instructor'],
    },
  },

  {
    path: '/instructor',
    name: 'InstructorDashboard',
    component: () => import('@/pages/InstructorDashboard.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['instructor'],
    },
  },

  {
    path: '/instructors',
    name: 'Instructors',
    component: () => import('@/pages/Instructors.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  // {
  //   path: '/student-groups',
  //   name: 'StudentGroups',
  //   component: () => import('@/pages/StudentGroups.vue'),
  //   meta: {
  //     requiresAuth: true,
  //     allowed: ['staff', 'instructor'],
  //   },
  // },

  // =========================================================
  // ADMISSIONS (staff only)
  // =========================================================

  {
    path: '/admissions',
    name: 'Admissions',
    component: () => import('@/pages/StudentApplicants.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  {
    path: '/admissions/new',
    name: 'NewStudentApplicant',
    component: () => import('@/pages/StudentApplicantForm.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  {
    path: '/admissions/:name',
    name: 'EditStudentApplicant',
    component: () => import('@/pages/StudentApplicantForm.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  {
    path: '/admission-cycles',
    name: 'AdmissionCycles',
    component: () => import('@/pages/StudentAdmissions.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  {
    path: '/admission-cycles/new',
    name: 'NewAdmissionCycle',
    component: () => import('@/pages/StudentAdmissionForm.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  {
    path: '/admission-cycles/:name',
    name: 'EditAdmissionCycle',
    component: () => import('@/pages/StudentAdmissionForm.vue'),
    meta: {
      requiresAuth: true,
      allowed: ['staff'],
    },
  },

  // =========================================================
  // FALLBACK
  // =========================================================

  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// =========================================================
// ROUTER
// =========================================================

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// =========================================================
// CHECK FRAPPE LOGIN SESSION
// =========================================================
//
// Returns:
//   true  - a real, signed-in session was confirmed
//   false - the server answered that nobody is signed in
//   null  - the check itself failed (network / server error), which is
//           NOT the same as "logged out" and must not bounce a valid
//           session to the login page.
async function isLoggedIn() {
  try {
    const response = await fetch(
      '/api/method/frappe.auth.get_logged_user',
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json().catch(() => ({}))

      const user = data?.message

      return Boolean(
        user &&
        user !== 'Guest'
      )
    }

    // 4xx from this endpoint means the session is missing or invalid.
    // 5xx means the backend is unhealthy: report "unknown" instead.
    if (response.status >= 400 && response.status < 500) {
      return false
    }

    return null
  } catch (error) {
    console.error('Authentication check failed:', error)

    return null
  }
}

// =========================================================
// ROUTER AUTH GUARD
// =========================================================

router.beforeEach(async (to) => {
  const loggedIn = await isLoggedIn()

  if (to.meta.requiresAuth && loggedIn === false) {
    // This frontend is embedded in Frappe Desk.
    // Use Frappe's login page instead of a disabled Vue Login route.
    // `window.top` because the app normally runs inside the Desk iframe;
    // navigating the frame itself would nest a second login page inside
    // the Desk. There is no loop: /login never routes back through here.
    window.top.location.href = '/login'
    return false
  }

  if (to.meta.guestOnly && loggedIn) {
    return {
      name: 'Home',
    }
  }

  // Send authenticated instructors to the native Frappe Desk.
  if (loggedIn && to.name === 'Home') {
    try {
      const ctx = await getContext()
      const mode = portalMode(ctx)

      if (mode === 'instructor') {
        window.top.location.href = '/desk'
        return false
      }
    } catch (error) {
      console.warn('Instructor redirect context error:', error)
    }
  }

  // Role-based page access: the server scopes every API call too,
  // this only keeps users away from pages that are not theirs.
  if (to.meta.allowed) {
    try {
      const ctx = await getContext()
      const mode = portalMode(ctx)

      if (!to.meta.allowed.includes(mode)) {
        return {
          name: 'Home',
        }
      }
    } catch (error) {
      console.warn('Role guard context error:', error)

      // Fail closed. An unknown role (null from portalMode) never
      // matches a route's allow-list, and a failed context request
      // must not open the page either.
      return {
        name: 'Home',
      }
    }
  }

  return true
})

export default router