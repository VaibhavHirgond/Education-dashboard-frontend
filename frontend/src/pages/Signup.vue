<template>
  <div class="auth-page">
    <div class="auth-panel">
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
              Build your
              <br />
              account. 🎓
            </h2>
            <p>
              Create a secure access account to manage students, fees,
              attendance, and academic operations from one connected system.
            </p>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="auth-card">
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
            <span class="form-label">CREATE ACCOUNT</span>
            <h2>Sign up</h2>
            <p>Register to access your education dashboard.</p>
          </div>

          <div v-if="errorMessage" class="alert error-alert" role="alert">
            <span class="alert-icon">!</span>
            <div>
              <strong>Unable to create account</strong>
              <p>{{ errorMessage }}</p>
            </div>
          </div>

          <div v-if="successMessage" class="alert success-alert" role="status">
            <span class="alert-icon">✓</span>
            <div>
              <strong>Success</strong>
              <p>{{ successMessage }}</p>
            </div>
          </div>

          <form class="signup-form" @submit.prevent="submitSignup">
            <div class="form-group">
              <label for="full-name">Full Name</label>
              <div class="input-wrapper">
                <span class="input-icon">✎</span>
                <input
                  id="full-name"
                  v-model.trim="form.full_name"
                  type="text"
                  placeholder="Enter your full name"
                  :disabled="loading"
                  autocomplete="name"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <div class="input-wrapper">
                <span class="input-icon">@</span>
                <input
                  id="email"
                  v-model.trim="form.email"
                  type="email"
                  placeholder="Enter your email"
                  :disabled="loading"
                  autocomplete="email"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-wrapper">
                <span class="input-icon">•</span>
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Create a strong password"
                  :disabled="loading"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :disabled="loading"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">•</span>
                <input
                  id="confirm-password"
                  v-model="form.confirm_password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Re-enter your password"
                  :disabled="loading"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                  :disabled="loading"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  {{ showConfirmPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="signup-button"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="spinner"></span>
              <span>{{ loading ? 'Creating account...' : 'Create Account' }}</span>
            </button>
          </form>

          <div class="signin-section">
            <span>Already have an account?</span>
            <router-link to="/login">Sign in</router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SignupPage',

  data() {
    return {
      form: {
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
      },
      loading: false,
      errorMessage: '',
      successMessage: '',
      showPassword: false,
      showConfirmPassword: false,
    }
  },

  computed: {
    isFormValid() {
      return (
        this.form.full_name.trim() &&
        this.form.email.trim() &&
        this.form.password &&
        this.form.confirm_password
      )
    },
  },

  methods: {
    extractErrorMessage(payload) {
      const fromServerMessages = () => {
        try {
          if (!payload?._server_messages) return ''

          const entries = JSON.parse(payload._server_messages)
          const messages = (Array.isArray(entries) ? entries : [])
            .map((entry) => {
              try {
                const parsed = typeof entry === 'string' ? JSON.parse(entry) : entry
                return typeof parsed?.message === 'string' ? parsed.message : ''
              } catch (error) {
                return ''
              }
            })
            .filter(Boolean)

          return messages.join(' ')
        } catch (error) {
          return ''
        }
      }

      const stripHtml = (value) =>
        typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''

      const candidates = [
        fromServerMessages(),
        stripHtml(payload?.message?.error),
        typeof payload?.message === 'string' ? stripHtml(payload.message) : '',
        stripHtml(payload?.error),
        stripHtml(payload?.exception)?.replace(/^[a-zA-Z_.]*(?:Error|Exception):\s*/, ''),
      ]

      return candidates.find((candidate) => candidate) || 'Unable to create account. Please try again.'
    },

    validateForm() {
      const fullName = this.form.full_name.trim()
      const email = this.form.email.trim()
      const password = this.form.password
      const confirmPassword = this.form.confirm_password

      if (!fullName || !email || !password || !confirmPassword) {
        return 'All fields are required.'
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email)) {
        return 'Please enter a valid email address.'
      }

      if (password.length < 8) {
        return 'Password must be at least 8 characters long.'
      }

      if (password !== confirmPassword) {
        return 'Passwords do not match.'
      }

      return ''
    },

    async submitSignup() {
      if (this.loading) return

      this.errorMessage = ''
      this.successMessage = ''

      const validationMessage = this.validateForm()
      if (validationMessage) {
        this.errorMessage = validationMessage
        return
      }

      this.loading = true

      try {
        const response = await fetch('/api/method/backend_custom_app.api.auth.create_user', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: this.form.full_name.trim(),
            email: this.form.email.trim(),
            password: this.form.password,
          }),
        })

        let payload = {}
        try {
          payload = await response.json()
        } catch (error) {
          payload = {}
        }

        if (!response.ok) {
          throw new Error(this.extractErrorMessage(payload))
        }

        const successText = 'Account created successfully. Please sign in.'
        const resultMessage =
          typeof payload?.message?.message === 'string' && payload.message.message.trim()
            ? payload.message.message
            : typeof payload?.message === 'string' && payload.message.trim()
              ? payload.message
              : successText

        this.successMessage = resultMessage
        this.form = {
          full_name: '',
          email: '',
          password: '',
          confirm_password: '',
        }

        setTimeout(() => {
          this.$router.push({
            path: '/login',
            query: {
              message: successText,
            },
          })
        }, 600)
      } catch (error) {
        this.errorMessage = error?.message || 'Something went wrong while creating your account.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #F8F7FC 0%, #F3EFF9 100%);
  color: #1E1B33;
}

.auth-panel {
  width: min(100%, 980px);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.brand-section {
  display: flex;
  align-items: stretch;
  background: linear-gradient(180deg, #221E45 0%, #2A2552 52%, #332D66 100%);
  color: #ffffff;
}

.brand-content {
  width: 100%;
  box-sizing: border-box;
  padding: 52px 42px;
}

.brand-logo{
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  font-size: 24px;
  font-weight: 800;
}

.brand-text {
  margin-top: 18px;
}

.brand-text h1{
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
}

.brand-text p{
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.brand-message {
  margin-top: 34px;
}

.brand-label{
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.9);
}

.brand-message h2 {
  margin: 18px 0 14px;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.15;
}

.brand-message p{
  margin: 0;
  max-width: 420px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
  font-size: 14px;
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: min(100%, 440px);
  box-sizing: border-box;
  padding: 40px 34px;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mobile-logo {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #fff;
  font-weight: 800;
}

.mobile-brand h1,
.mobile-brand p{
  margin: 0;
  font-size: 14px;
}

.mobile-brand p {
  margin-top: 2px;
  color: #64748b;
}

.form-header {
  margin-bottom: 22px;
}

.form-label{
  display: inline-block;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.form-header h2{
  margin: 0;
  font-size: 36px;
  line-height: 1.1;
  color: #1E1B33;
}

.form-header p {
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.6;
}

.alert {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 18px;
}

.error-alert {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
}

.success-alert {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
}

.alert-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.08);
}

.alert strong {
  display: block;
  margin-bottom: 3px;
  color: #1E1B33;
  font-size: 13px;
}

.alert p{
  margin: 0;
  color: #334155;
  font-size: 12px;
  line-height: 1.5;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  box-sizing: border-box;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  padding: 0 12px 0 10px;
  background: #f8fafc;
}

.input-wrapper:focus-within {
  border-color: var(--theme-purple-light, #5A4FA8);
  box-shadow: 0 0 0 4px rgba(69, 61, 137, 0.1);
}

.input-icon{
  color: #64748b;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.input-wrapper input{
  flex: 1;
  height: 100%;
  border: 0;
  background: transparent;
  color: #1E1B33;
  font-size: 14px;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #94a3b8;
}

.password-toggle{
  border: none;
  background: transparent;
  color: var(--theme-purple, #453D89);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.signup-button{
  width: 100%;
  height: 46px;
  margin-top: 6px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.signup-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.signup-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.signin-section{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  color: #475569;
  font-size: 14px;
}

.signin-section a {
  color: var(--theme-purple, #453D89);
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 900px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .brand-section {
    min-height: 240px;
  }

  .brand-content {
    padding: 34px 28px;
  }

  .auth-card {
    padding: 28px 22px 32px;
  }
}

@media (max-width: 480px){
  .auth-page {
    padding: 16px;
  }

  .brand-section {
    min-height: 200px;
  }

  .brand-content {
    padding: 24px 20px;
  }

  
.form-header h2 {    font-size: 30px;
  }  .auth-card {
    padding: 22px 16px 26px;
  }

  .mobile-brand {
    display: flex;
  }

  .form-header {
    margin-bottom: 16px;
  }
}
</style>
