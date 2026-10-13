<template>
  <div class="login-page">
    <div class="login-background">
      <div class="background-circle circle-one"></div>
      <div class="background-circle circle-two"></div>
      <div class="background-circle circle-three"></div>
    </div>

    <div class="login-container">
      <!-- LEFT BRANDING SECTION -->
      <section class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <span>E</span>
          </div>

          <div class="brand-text">
            <h1>Education</h1>
            <p>Management System</p>
          </div>

          <div class="brand-message">
            <span class="brand-label">EDUCATION MANAGEMENT</span>

            <h2>
              Manage education
              <br />
              smarter. 🎓
            </h2>

            <p>
              Manage students, courses, attendance, assessments,
              fees and academic information from one connected system.
            </p>
          </div>

          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>Student management</span>
            </div>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>Academic management</span>
            </div>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>Fee and payment tracking</span>
            </div>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>Attendance and assessments</span>
            </div>
          </div>
        </div>
      </section>

      <!-- LOGIN SECTION -->
      <section class="form-section">
        <div class="login-card">
          <div class="mobile-brand">
            <div class="mobile-logo">
              <span>E</span>
            </div>

            <div>
              <h1>Education</h1>
              <p>Management System</p>
            </div>
          </div>

          <div class="form-header">
            <span class="form-label">WELCOME BACK</span>

            <h2>Sign in</h2>

            <p>
              Sign in to access your Education Management System.
            </p>
          </div>

          <div
            v-if="successMessage"
            class="alert success-alert"
            role="status"
          >
            <span class="alert-icon">✓</span>

            <div>
              <strong>Success</strong>
              <p>{{ successMessage }}</p>
            </div>
          </div>

          <!-- ERROR -->
          <div
            v-if="errorMessage"
            class="alert error-alert"
            role="alert"
          >
            <span class="alert-icon">!</span>

            <div>
              <strong>Unable to sign in</strong>
              <p>{{ errorMessage }}</p>
            </div>
          </div>

          <!-- LOGIN FORM -->
          <form
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <!-- USERNAME -->
            <div class="form-group">
              <label for="login-username">
                Email or Username
              </label>

              <div class="input-wrapper">
                <span class="input-icon">
                  @
                </span>

                <input
                  id="login-username"
                  v-model.trim="username"
                  type="text"
                  name="usr"
                  autocomplete="off"
                  placeholder="Enter your email address"
                  :disabled="loading"
                  required
                />
              </div>
            </div>

            <!-- PASSWORD -->
            <div class="form-group">
              <div class="label-row">
                <label for="login-password">
                  Password
                </label>

                <router-link
                  to="/forgot-password"
                  class="forgot-link"
                >
                  Forgot password?
                </router-link>
              </div>

              <div class="input-wrapper">
                <span class="input-icon">
                  •
                </span>

                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  name="pwd"
                  autocomplete="off"
                  placeholder="Enter your password"
                  :disabled="loading"
                  required
                />

                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  "
                  :disabled="loading"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <!-- REMEMBER -->
            <label class="remember-row">
              <input
                v-model="rememberMe"
                type="checkbox"
                :disabled="loading"
              />

              <span class="custom-checkbox"></span>

              <span class="remember-text">
                Remember me
              </span>
            </label>

            <!-- LOGIN BUTTON -->
            <button
              type="submit"
              class="login-button"
              :disabled="loading || !username || !password"
            >
              <span v-if="loading" class="spinner"></span>

              <span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </span>

              <span
                v-if="!loading"
                class="button-arrow"
              >
                →
              </span>
            </button>
          </form>

          <!-- SIGN UP -->
          <div class="signup-section">
            <span>Don't have an account?</span>

            <router-link to="/signup">
              Create an account
            </router-link>
          </div>

          <div class="security-note">
            <span class="security-icon">🔒</span>

            <span>
              Your account is secured by Frappe authentication.
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearContext } from '@/lib/context'
import { clearCsrfToken } from '@/lib/csrf'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)

onMounted(() => {
  username.value = ''
  password.value = ''
  rememberMe.value = false
  errorMessage.value = ''
  successMessage.value = ''

  try {
    sessionStorage.clear()
    localStorage.removeItem('user_id')
    localStorage.removeItem('full_name')
    localStorage.removeItem('system_user')
  } catch (error) {
    console.warn('Unable to clear stored auth state:', error)
  }

  if (typeof route.query.message === 'string' && route.query.message.trim()) {
    successMessage.value = route.query.message.trim()
  }
})

watch(
  () => route.query.message,
  (message) => {
    successMessage.value = typeof message === 'string' && message.trim() ? message.trim() : ''
  }
)

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

async function handleLogin() {
  if (loading.value) {
    return
  }

  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter your username and password.'
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/method/login', {
      method: 'POST',

      credentials: 'include',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },

      body: new URLSearchParams({
        usr: username.value,
        pwd: password.value,
      }),
    })

    let data = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    /*
    |--------------------------------------------------------------------------
    | Frappe authentication failed
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.exc ||
        'Invalid username or password.'
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Frappe may return a message even when the HTTP status is successful.
    |--------------------------------------------------------------------------
    */

    if (
      data?.message &&
      typeof data.message === 'string' &&
      data.message.toLowerCase().includes('error')
    ) {
      throw new Error(data.message)
    }

    /*
    |--------------------------------------------------------------------------
    | Successful login
    |--------------------------------------------------------------------------
    */

    // The previous visitor's role context and CSRF token must never
    // survive a sign-in: getContext() caches its answer for the SPA
    // lifetime and the token belongs to the old session.
    clearContext()
    clearCsrfToken()

    const redirectPath =
      typeof route.query.redirect === 'string' &&
      route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/'

    await router.replace(redirectPath)
  } catch (error) {
    console.error('Login failed:', error)

    errorMessage.value = getLoginErrorMessage(error)
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Friendly error messages
|--------------------------------------------------------------------------
*/

function getLoginErrorMessage(error) {
  const message = error?.message || ''

  const normalized = message.toLowerCase()

  if (
    normalized.includes('invalid login') ||
    normalized.includes('invalid username') ||
    normalized.includes('invalid password') ||
    normalized.includes('incorrect')
  ) {
    return 'The username or password is incorrect.'
  }

  if (
    normalized.includes('disabled') ||
    normalized.includes('not allowed')
  ) {
    return 'This account is disabled or you do not have permission to sign in.'
  }

  if (
    normalized.includes('network') ||
    normalized.includes('failed to fetch')
  ) {
    return 'Unable to connect to the server. Please check that Frappe is running.'
  }

  return message || 'Unable to sign in. Please try again.'
}
</script>

<style scoped>
/* =========================================================
   PAGE
========================================================= */

.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f4f7fb;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #1E1B33;
}

/* =========================================================
   BACKGROUND
========================================================= */

.login-background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.background-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
}

.circle-one {
  width: 520px;
  height: 520px;
  top: -250px;
  left: -160px;
  background: rgba(200, 73, 154, 0.07);
}

.circle-two {
  width: 620px;
  height: 620px;
  right: -260px;
  bottom: -280px;
  background: rgba(69, 61, 137, 0.07);
}

.circle-three {
  width: 280px;
  height: 280px;
  right: 20%;
  top: 12%;
  background: rgba(200, 73, 154, 0.05);
}

/* =========================================================
   CONTAINER
========================================================= */

.login-container {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(460px, 0.85fr);

  width: min(1180px, calc(100% - 48px));
  min-height: calc(100vh - 48px);

  margin: 24px auto;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #e3eaf3;
  border-radius: 28px;

  box-shadow:
    0 25px 70px rgba(69, 61, 137, 0.12);
}

/* =========================================================
   BRAND SECTION
========================================================= */

.brand-section {
  position: relative;

  display: flex;
  align-items: center;

  padding: 64px;

  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(200, 73, 154, 0.28),
      transparent 32%
    ),
    linear-gradient(
      145deg,
      #221E45 0%,
      #2A2552 55%,
      #332D66 100%
    );

  color: #ffffff;
}

.brand-content {
  width: min(500px, 100%);
  margin: auto;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 56px;
  height: 56px;

  margin-bottom: 16px;

  border-radius: 16px;

  background: linear-gradient(
    105deg,
    #453D89,
    #C8499A
  );

  box-shadow:
    0 12px 28px rgba(200, 73, 154, 0.35);
}

.brand-logo span{
  font-size: 25px;
  font-weight: 800;
}

.brand-text h1{
  margin: 0;

  font-size: 24px;
  font-weight: 750;
}

.brand-text p{
  margin: 3px 0 0;

  color: rgba(255, 255, 255, 0.58);

  font-size: 12px;
}

.brand-message {
  margin-top: 100px;
}

.brand-label{
  display: inline-block;

  margin-bottom: 18px;

  color: #D96BB0;

  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.brand-message h2 {
  margin: 0 0 20px;

  font-size: clamp(38px, 4vw, 56px);
  line-height: 1.08;
  letter-spacing: -1.8px;
}

.brand-message p{
  max-width: 470px;

  margin: 0;

  color: rgba(255, 255, 255, 0.7);

  font-size: 15px;
  line-height: 1.8;
}

.brand-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  margin-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;

  color: rgba(255, 255, 255, 0.8);

  font-size: 13px;
}

.feature-icon{
  display: flex;
  align-items: center;
  justify-content: center;

  width: 24px;
  height: 24px;

  border-radius: 50%;

  background: rgba(200, 73, 154, 0.14);

  color: #D96BB0;

  font-size: 12px;
  font-weight: 800;
}

/* =========================================================
   FORM SECTION
========================================================= */

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 60px 64px;

  background: #ffffff;
}

.login-card {
  width: min(430px, 100%);
}

.mobile-brand {
  display: none;
}

/* =========================================================
   FORM HEADER
========================================================= */

.form-header {
  margin-bottom: 32px;
}

.form-label{
  display: inline-block;

  margin-bottom: 12px;

  color: var(--theme-pink, #C8499A);

  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.form-header h2{
  margin: 0 0 10px;

  color: #1E1B33;

  font-size: 38px;
  line-height: 1.15;
  letter-spacing: -1px;
}

.form-header p{
  margin: 0;

  color: #75849b;

  font-size: 14px;
  line-height: 1.6;
}

/* =========================================================
   ALERT
========================================================= */

.alert {
  display: flex;
  gap: 12px;

  margin-bottom: 22px;
  padding: 13px 15px;

  border-radius: 12px;

  font-size: 13px;
}

.error-alert {
  border: 1px solid #ffd4d4;
  background: #fff5f5;
  color: #a51d2d;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 22px;
  height: 22px;

  border-radius: 50%;

  background: #ffe0e0;

  font-weight: 800;
}

.alert strong {
  display: block;
  margin-bottom: 2px;
}

.alert p {
  margin: 0;

  color: #bd4b57;

  line-height: 1.45;
}

/* =========================================================
   FORM
========================================================= */

.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form-group label,
.label-row label {
  color: #263957;

  font-size: 13px;
  font-weight: 650;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.forgot-link{
  color: var(--theme-purple, #453D89);

  font-size: 12px;
  font-weight: 650;

  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.input-wrapper {
  position: relative;
}

.input-icon{
  position: absolute;
  left: 15px;
  top: 50%;

  transform: translateY(-50%);

  color: #8090a7;

  font-size: 15px;
  font-weight: 700;

  pointer-events: none;
}

.input-wrapper input{
  width: 100%;
  height: 52px;

  padding: 0 15px 0 44px;

  border: 1px solid #d8e1ec;
  border-radius: 12px;

  outline: none;

  background: #ffffff;

  color: #152643;

  font-family: inherit;
  font-size: 14px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-wrapper input::placeholder {
  color: #a0adbd;
}

.input-wrapper input:focus {
  border-color: var(--theme-purple-light, #5A4FA8);

  box-shadow:
    0 0 0 4px rgba(69, 61, 137, 0.1);
}

.input-wrapper input:disabled {
  cursor: not-allowed;
  background: #f6f8fb;
}

.password-toggle{
  position: absolute;

  right: 12px;
  top: 50%;

  transform: translateY(-50%);

  padding: 5px 7px;

  border: 0;
  background: transparent;

  color: var(--theme-purple, #453D89);

  font-family: inherit;
  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* =========================================================
   REMEMBER
========================================================= */

.remember-row{
  position: relative;

  display: flex;
  align-items: center;
  gap: 9px;

  cursor: pointer;

  color: #64748a;

  font-size: 12px;
}

.remember-row input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 17px;
  height: 17px;

  border: 1px solid #cbd6e4;
  border-radius: 5px;

  background: #ffffff;

  transition: all 0.15s ease;
}

.remember-row input:checked + .custom-checkbox {
  border-color: var(--theme-purple, #453D89);
  background: var(--theme-purple, #453D89);
}

.remember-row input:checked + .custom-checkbox::after{
  content: "✓";

  color: #ffffff;

  font-size: 10px;
  font-weight: 800;
}

.remember-text {
  user-select: none;
}

/* =========================================================
   LOGIN BUTTON
========================================================= */

.login-button{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  width: 100%;
  height: 54px;

  margin-top: 2px;

  border: 0;
  border-radius: 12px;

  background: linear-gradient(
    105deg,
    #453D89,
    #C8499A
  );

  color: #ffffff;

  font-family: inherit;
  font-size: 14px;
  font-weight: 750;

  cursor: pointer;

  box-shadow:
    0 12px 25px rgba(200, 73, 154, 0.28);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);

  box-shadow:
    0 15px 30px rgba(200, 73, 154, 0.35);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.button-arrow{
  font-size: 18px;
}

/* =========================================================
   SPINNER
========================================================= */

.spinner {
  width: 17px;
  height: 17px;

  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;

  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   SIGN UP
========================================================= */

.signup-section {
  display: flex;
  justify-content: center;
  gap: 5px;

  margin-top: 28px;

  color: #7a899e;

  font-size: 13px;
  text-align: center;
}

.signup-section a {
  color: var(--theme-purple, #453D89);

  font-weight: 700;

  text-decoration: none;
}

.signup-section a:hover {
  text-decoration: underline;
}

/* =========================================================
   SECURITY
========================================================= */

.security-note{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  margin-top: 30px;

  color: #9aa6b6;

  font-size: 10px;
  text-align: center;
}

.security-icon{
  font-size: 11px;
}

/* =========================================================
   TABLET
========================================================= */

@media (max-width: 1000px){
  .login-container {
    grid-template-columns: 1fr;

    width: min(600px, calc(100% - 32px));

    min-height: auto;

    margin: 16px auto;
  }

  .brand-section {
    display: none;
  }

  .form-section {
    min-height: calc(100vh - 32px);

    padding: 48px 40px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 12px;

    margin-bottom: 42px;
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 46px;
    height: 46px;

    border-radius: 13px;

    background: linear-gradient(
      105deg,
      #453D89,
      #C8499A
    );

    color: #ffffff;

    box-shadow:
      0 8px 20px rgba(200, 73, 154, 0.28);
  }

  
.mobile-logo span {
    font-size: 20px;
    font-weight: 800;
  }

  .mobile-brand h1 {
    margin: 0;
    color: #132441;
    font-size: 18px;
  }

  .mobile-brand p {
    margin: 2px 0 0;
    color: #8491a5;
    font-size: 10px;
  }}

/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 640px){
  .login-page {
    min-height: 100svh;
  }

  .login-container {
    width: 100%;
    min-height: 100svh;

    margin: 0;

    border: 0;
    border-radius: 0;

    box-shadow: none;
  }

  .form-section {
    align-items: flex-start;

    min-height: 100svh;

    padding: 32px 22px 30px;
  }

  .mobile-brand {
    margin-bottom: 50px;
  }

  .form-header {
    margin-bottom: 26px;
  }

  
.form-header h2 {    font-size: 32px;
  }  .form-header p {
    font-size: 13px;
  }

  .login-form {
    gap: 19px;
  }

  .input-wrapper input {
    height: 50px;
  }

  .login-button {
    height: 52px;
  }

  .signup-section {
    flex-wrap: wrap;

    margin-top: 24px;
  }

  .security-note {
    margin-top: 24px;
  }
}

/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 380px){
  .form-section {
    padding-right: 18px;
    padding-left: 18px;
  }

  .mobile-brand {
    margin-bottom: 38px;
  }

  
.form-header h2 {
    font-size: 29px;
  }

  .form-header p {
    font-size: 12px;
  }  .label-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
}
</style>