<template>
  <div class="auth-page">
    <div class="auth-panel">
      <div class="brand-block">
        <div class="brand-logo">E</div>
        <div>
          <h1>Education</h1>
          <p>Management System</p>
        </div>
      </div>

      <div class="auth-card">
        <span class="eyebrow">PASSWORD RESET</span>
        <h2>Forgot password</h2>
        <p class="subtext">Enter the email address associated with your account and we’ll guide you to reset it.</p>

        <div v-if="errorMessage" class="alert error-alert" role="alert">
          <span class="alert-icon">!</span>
          <div>
            <p>{{ errorMessage }}</p>
          </div>
        </div>

        <div v-if="successMessage" class="alert success-alert" role="status">
          <span class="alert-icon">✓</span>
          <div>
            <p>{{ successMessage }}</p>
          </div>
        </div>

        <form class="auth-form" @submit.prevent="submitReset">
          <div class="field-group">
            <label for="reset-email">Email</label>
            <input
              id="reset-email"
              v-model.trim="email"
              type="email"
              placeholder="Enter your email"
              :disabled="loading"
              autocomplete="email"
              required
            />
          </div>

          <button type="submit" class="primary-button" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Sending...' : 'Send Reset Link' }}</span>
          </button>
        </form>

        <div class="auth-link-row">
          <router-link to="/login">Back to Sign in</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForgotPasswordPage',

  data() {
    return {
      email: '',
      loading: false,
      errorMessage: '',
      successMessage: '',
    }
  },

  methods: {
    validateEmail() {
      const email = this.email.trim()
      if (!email) {
        return 'Email is required.'
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email)) {
        return 'Please enter a valid email address.'
      }
      return ''
    },

    async submitReset() {
      if (this.loading) return

      this.errorMessage = ''
      this.successMessage = ''

      const validationMessage = this.validateEmail()
      if (validationMessage) {
        this.errorMessage = validationMessage
        return
      }

      this.loading = true
      try {
        const response = await fetch('/api/method/frappe.core.doctype.user.user.reset_password', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: this.email.trim(),
          }),
        })

        let payload = {}
        try {
          payload = await response.json()
        } catch (error) {
          payload = {}
        }

        if (!response.ok) {
          const message =
            payload?.message?.error ||
            payload?.error ||
            payload?.exception ||
            payload?._server_messages ||
            'Failed to send password reset email.'
          throw new Error(typeof message === 'string' ? message : 'Failed to send password reset email.')
        }

        // Success - show the standard Frappe message
        this.successMessage =
          'If an account exists for this email, password reset instructions have been sent.'
      } catch (error) {
        this.errorMessage = error?.message || 'Something went wrong while sending the reset link.'
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
  background: linear-gradient(135deg, #f8fbff 0%, #edf4ff 100%);
  color: #1E1B33;
}

.auth-panel {
  width: min(100%, 980px);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.brand-block {
  padding: 52px 42px;
  background: linear-gradient(180deg, #221E45 0%, #2A2552 52%, #332D66 100%);
  color: #fff;
}

.brand-logo{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  font-size: 24px;
  font-weight: 800;
}

.brand-block h1{
  margin: 18px 0 0;
  font-size: 32px;
}

.brand-block p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.8);
}

.auth-card {
  padding: 40px 34px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.eyebrow{
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #64748b;
}

.auth-card h2{
  margin: 12px 0 0;
  font-size: 30px;
}

.subtext {
  margin: 10px 0 22px;
  color: #475569;
  line-height: 1.6;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.field-group input{
  width: 100%;
  box-sizing: border-box;
  height: 46px;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 14px;
  background: #f8fafc;
  color: #1E1B33;
}

.field-group input:focus {
  outline: 2px solid rgba(69, 61, 137, 0.24);
  border-color: var(--theme-purple-light, #5A4FA8);
}

.primary-button{
  margin-top: 10px;
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
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

.alert p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.5;
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

.auth-link-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 22px;
}

.auth-link-row a {
  color: var(--theme-purple, #453D89);
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 760px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .brand-block {
    padding: 32px 28px;
  }

  .auth-card {
    padding: 28px 20px 32px;
  }
}
</style>
