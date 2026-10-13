<template>
  <div class="fees-page">

    <Sidebar />

    <div class="app-layout">

      <main class="main-content">

        <div class="content-container">


          <!-- =================================================
               PAGE HEADER
          ================================================== -->
          <section class="page-header">

            <div class="page-heading">

              <div class="breadcrumb">
                <span>Education</span>
                <b>/</b>
                <span>{{ isStudent ? 'My Fees' : 'Finance' }}</span>
              </div>

              <div class="heading-row">

                <div>
                  <h1>
                    {{ isStudent ? 'My Fees & Payments' : 'Fees & Payments' }}
                  </h1>

                  <p v-if="isStudent">
                    Your invoices, payments and outstanding balance.
                  </p>

                  <p v-else>
                    Monitor student fees, collections and payment status.
                  </p>
                </div>


                <button
                  class="refresh-button"
                  type="button"
                  :disabled="loading"
                  @click="loadFees"
                >
                  <span
                    class="refresh-icon"
                    :class="{ spinning: loading }"
                  >
                    ↻
                  </span>

                  <span>
                    {{ loading ? 'Refreshing...' : 'Refresh Data' }}
                  </span>
                </button>

              </div>

            </div>

          </section>


          <!-- =================================================
               ERROR
          ================================================== -->
          <transition name="slide">
            <div
              v-if="error"
              class="error-box"
            >
              <div class="error-icon">!</div>

              <div>
                <strong>Unable to load fee data</strong>
                <p>{{ error }}</p>
              </div>

              <button
                type="button"
                @click="loadFees"
              >
                Retry
              </button>
            </div>
          </transition>


          <!-- =================================================
               SUMMARY CARDS
          ================================================== -->
          <section v-if="!isStudent" class="summary-grid">

            <!-- Total Collected -->
            <article class="summary-card collected">

              <div class="card-top">
                <div class="card-icon">
                  ₹
                </div>

                <span class="card-badge positive">
                  Collected
                </span>
              </div>

              <div class="card-label">
                Total Collected
              </div>

              <div class="card-value">
                {{ formatCurrency(summary.total_collected) }}
              </div>

              <div class="card-description">
                Total amount received
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>


            <!-- Outstanding -->
            <article class="summary-card outstanding">

              <div class="card-top">
                <div class="card-icon">
                  !
                </div>

                <span
                  class="card-badge"
                  :class="
                    summary.total_outstanding > 0
                      ? 'warning'
                      : 'positive'
                  "
                >
                  {{
                    summary.total_outstanding > 0
                      ? 'Pending'
                      : 'Clear'
                  }}
                </span>
              </div>

              <div class="card-label">
                Outstanding
              </div>

              <div class="card-value">
                {{ formatCurrency(summary.total_outstanding) }}
              </div>

              <div class="card-description">
                {{
                  summary.total_outstanding > 0
                    ? 'Amount still pending'
                    : 'No pending amount'
                }}
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>


            <!-- Paid -->
            <article class="summary-card paid">

              <div class="card-top">
                <div class="card-icon">
                  ✓
                </div>

                <span class="card-badge positive">
                  Success
                </span>
              </div>

              <div class="card-label">
                Paid Invoices
              </div>

              <div class="card-value">
                {{ summary.paid_invoices }}
              </div>

              <div class="card-description">
                Successfully paid invoices
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>


            <!-- Unpaid -->
            <article class="summary-card unpaid">

              <div class="card-top">
                <div class="card-icon">
                  ◷
                </div>

                <span
                  class="card-badge"
                  :class="
                    summary.unpaid_invoices > 0
                      ? 'warning'
                      : 'positive'
                  "
                >
                  {{
                    summary.unpaid_invoices > 0
                      ? 'Pending'
                      : 'All Clear'
                  }}
                </span>
              </div>

              <div class="card-label">
                Unpaid Invoices
              </div>

              <div class="card-value">
                {{ summary.unpaid_invoices }}
              </div>

              <div class="card-description">
                {{
                  summary.unpaid_invoices > 0
                    ? 'Invoices awaiting payment'
                    : 'No unpaid invoices'
                }}
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>

          </section>


          <!-- =================================================
               STUDENT SUMMARY CARDS
               Only the two figures that matter to a learner.
          ================================================== -->
          <section v-else class="summary-grid student-summary-grid">

            <!-- Paid Fees -->
            <article class="summary-card paid">

              <div class="card-top">
                <div class="card-icon">
                  ✓
                </div>

                <span class="card-badge positive">
                  Paid
                </span>
              </div>

              <div class="card-label">
                Paid Fees
              </div>

              <div class="card-value">
                {{ formatCurrency(summary.total_collected) }}
              </div>

              <div class="card-description">
                Total amount you have paid
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>


            <!-- Outstanding Fees -->
            <article class="summary-card outstanding">

              <div class="card-top">
                <div class="card-icon">
                  !
                </div>

                <span
                  class="card-badge"
                  :class="
                    summary.total_outstanding > 0
                      ? 'warning'
                      : 'positive'
                  "
                >
                  {{
                    summary.total_outstanding > 0
                      ? 'Pending'
                      : 'Clear'
                  }}
                </span>
              </div>

              <div class="card-label">
                Outstanding Fees
              </div>

              <div class="card-value">
                {{ formatCurrency(summary.total_outstanding) }}
              </div>

              <div class="card-description">
                {{
                  summary.total_outstanding > 0
                    ? 'Amount still pending'
                    : 'No pending amount'
                }}
              </div>

              <div class="card-line">
                <span></span>
              </div>

            </article>

          </section>


          <!-- =================================================
               COLLECTION OVERVIEW (Admin only)
          ================================================== -->
          <section v-if="!isStudent" class="overview-card">

            <div class="overview-left">

              <div class="overview-icon">
                ↗
              </div>

              <div>
                <span class="overview-label">
                  COLLECTION OVERVIEW
                </span>

                <h2>
                  {{
                    formatCurrency(summary.total_collected)
                  }}
                </h2>

                <p>
                  Total amount successfully collected from
                  student invoices.
                </p>
              </div>

            </div>


            <div class="overview-stats">

              <div class="overview-stat">
                <span>Paid</span>
                <strong>{{ summary.paid_invoices }}</strong>
              </div>

              <div class="overview-divider"></div>

              <div class="overview-stat">
                <span>Unpaid</span>
                <strong>{{ summary.unpaid_invoices }}</strong>
              </div>

              <div class="overview-divider"></div>

              <div class="overview-stat">
                <span>Outstanding</span>
                <strong>
                  {{ formatCurrency(summary.total_outstanding) }}
                </strong>
              </div>

            </div>

          </section>


          <!-- =================================================
               FEE ACCOUNT SUMMARY (Student only)
          ================================================== -->
          <section v-else class="fee-account-card">

            <div class="fee-account-left">

              <div class="fee-account-icon">
                ₹
              </div>

              <div>
                <span class="fee-account-label">
                  FEE ACCOUNT SUMMARY
                </span>

                <h2>
                  {{ formatCurrency(summary.total_collected) }}
                  <small>paid</small>
                  <span class="fee-account-sep">·</span>
                  {{ formatCurrency(summary.total_outstanding) }}
                  <small>outstanding</small>
                </h2>

                <p>
                  Your fee payment status at a glance.
                </p>
              </div>

            </div>


            <div class="fee-account-right">

              <div
                v-if="paymentStatus.outstanding_total <= 0"
                class="fee-account-state"
              >
                <span class="fee-account-state-dot ok"></span>
                <span>No Outstanding Fees</span>
              </div>

              <div
                v-else-if="!paymentStatus.gateway_configured"
                class="fee-account-state"
              >
                <span class="fee-account-state-dot warn"></span>
                <span>Online payment not configured</span>
              </div>

              <button
                type="button"
                class="pay-now-btn"
                :disabled="!paymentStatus.can_pay || payBusy"
                :title="
                  paymentStatus.can_pay
                    ? 'Pay your outstanding fee balance'
                    : (paymentStatus.config_missing[0] ||
                       'Payment is not available right now')
                "
                @click="payNow"
              >
                <span v-if="payBusy">
                  Please wait…
                </span>
                <span v-else>
                  Pay Now
                </span>
              </button>

              <p
                v-if="paymentStatus.outstanding_total > 0 &&
                      paymentStatus.config_missing.length"
                class="fee-account-config"
              >
                {{ paymentStatus.config_missing[0] }}
              </p>

              <p
                v-if="payMessage"
                class="fee-account-config"
              >
                {{ payMessage }}
              </p>

            </div>

          </section>


          <!-- =================================================
               FILTERS
          ================================================== -->
          <section class="filter-card">

            <div class="filter-heading">

              <div class="filter-title">
                <div class="filter-icon">
                  ⌕
                </div>

                <div>
                  <h2>Find Payments</h2>
                  <p>
                    Search and filter payment records.
                  </p>
                </div>
              </div>

              <span class="result-count">
                {{ filteredPayments.length }}
                {{ filteredPayments.length === 1 ? 'record' : 'records' }}
              </span>

            </div>


            <div class="filter-controls">

              <div class="search-wrapper">

                <span class="search-icon">
                  ⌕
                </span>

                <input
                  v-model="search"
                  type="text"
                  :placeholder="
                    isStudent
                      ? 'Search invoice or fee...'
                      : 'Search student, invoice or fee...'
                  "
                  @keyup.enter="applyFilters"
                />

                <button
                  v-if="search"
                  class="clear-search"
                  type="button"
                  @click="search = ''"
                >
                  ×
                </button>

              </div>


              <div class="select-wrapper">

                <select
                  v-model="statusFilter"
                  @change="applyFilters"
                >
                  <option value="All">
                    All statuses
                  </option>

                  <option value="Paid">
                    Paid
                  </option>

                  <option value="Unpaid">
                    Unpaid
                  </option>
                </select>

                <span class="select-arrow">
                  ▾
                </span>

              </div>


              <button
                class="apply-button"
                type="button"
                @click="applyFilters"
              >
                Apply Filters
              </button>

            </div>

          </section>


          <!-- =================================================
               PAYMENT RECORDS
          ================================================== -->
          <section class="payments-section">

            <div class="payments-header">

              <div>
                <div class="section-eyebrow">
                  PAYMENT ACTIVITY
                </div>

                <h2>
                  Payment Records
                </h2>

                <p>
                  {{
                    isStudent
                      ? 'Your fee transactions and payment history'
                      : 'Detailed student fee transactions'
                  }}
                </p>
              </div>

              <div class="payment-count">
                <span>{{ filteredPayments.length }}</span>
                records
              </div>

            </div>


            <!-- =================================================
                 INVOICE DOWNLOAD ERROR
            ================================================== -->
            <transition name="slide">
              <div
                v-if="downloadError"
                class="download-alert"
              >

                <div class="download-alert-icon">
                  !
                </div>

                <div>
                  <strong>Invoice download failed</strong>
                  <p>{{ downloadError }}</p>
                </div>

                <button
                  type="button"
                  @click="downloadError = ''"
                >
                  Dismiss
                </button>

              </div>
            </transition>


            <!-- =================================================
                 LOADING
            ================================================== -->
            <div
              v-if="loading"
              class="loading-state"
            >

              <div class="loading-spinner"></div>

              <strong>
                Loading payment records
              </strong>

              <p>
                Fetching the latest fee information...
              </p>

            </div>


            <!-- =================================================
                 DESKTOP TABLE
            ================================================== -->
            <div
              v-else-if="filteredPayments.length"
              class="desktop-table-wrapper record-scroll"
            >

              <table class="payments-table">

                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>INVOICE</th>
                    <th>FEE TYPE</th>
                    <th>AMOUNT</th>
                    <th>PAID</th>
                    <th>OUTSTANDING</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>LAST PAYMENT</th>
                    <th>INVOICE / ACTIONS</th>
                  </tr>
                </thead>

                <tbody>

                  <tr
                    v-for="payment in filteredPayments"
                    :key="payment.invoice"
                  >

                    <!-- Student -->
                    <td>
                      <div class="student-cell">

                        <div class="student-avatar">
                          {{ getInitials(payment.student) }}
                        </div>

                        <div class="student-info">
                          <strong>
                            {{ payment.student }}
                          </strong>

                          <span>
                            {{ payment.studentId }}
                          </span>
                        </div>

                      </div>
                    </td>


                    <!-- Invoice -->
                    <td>
                      <span class="invoice-number">
                        {{ payment.invoice }}
                      </span>
                    </td>


                    <!-- Fee -->
                    <td>
                      <span class="fee-type">
                        {{ payment.feeType }}
                      </span>
                    </td>


                    <!-- Amount -->
                    <td>
                      <strong class="amount">
                        {{ formatCurrency(payment.amount) }}
                      </strong>
                    </td>


                    <!-- Paid -->
                    <td>
                      <span class="paid-amount">
                        {{ formatCurrency(payment.paidAmount) }}
                      </span>
                    </td>


                    <!-- Outstanding -->
                    <td>
                      <span
                        class="outstanding-amount"
                        :class="{
                          pending:
                            payment.outstandingAmount > 0
                        }"
                      >
                        {{
                          formatCurrency(
                            payment.outstandingAmount
                          )
                        }}
                      </span>
                    </td>


                    <!-- Status -->
                    <td>

                      <span
                        class="status-pill"
                        :class="
                          payment.status === 'Paid'
                            ? 'status-paid'
                            : 'status-unpaid'
                        "
                      >
                        <span></span>

                        {{ payment.status }}
                      </span>

                    </td>


                    <!-- Date -->
                    <td>
                      <span class="date-value">
                        {{ formatDate(payment.date) }}
                      </span>
                    </td>


                    <!-- Last payment -->
                    <td>
                      <span class="date-value">
                        {{ formatDate(payment.lastPaymentDate) }}
                      </span>

                      <span
                        v-if="payment.payments?.length"
                        class="payment-count"
                      >
                        {{ payment.payments.length }} payment{{
                          payment.payments.length === 1 ? '' : 's'
                        }}
                      </span>
                    </td>


                    <!-- Invoice / Actions -->
                    <td class="actions-cell">

                      <button
                        type="button"
                        class="invoice-download-btn"
                        :disabled="
                          !payment.invoice ||
                          downloadingInvoice === payment.invoice
                        "
                        :title="invoiceDownloadTitle(payment)"
                        @click="downloadInvoice(payment)"
                      >

                        <span
                          v-if="downloadingInvoice === payment.invoice"
                          class="download-spinner"
                          aria-hidden="true"
                        ></span>

                        <svg
                          v-else
                          class="download-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 3v12"></path>
                          <path d="m7 11 5 5 5-5"></path>
                          <path d="M4 21h16"></path>
                        </svg>

                        <span>
                          {{
                            downloadingInvoice === payment.invoice
                              ? 'Preparing…'
                              : 'Download Invoice'
                          }}
                        </span>

                      </button>

                      <span
                        v-if="!payment.invoice"
                        class="actions-hint"
                      >
                        No invoice linked
                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>


            <!-- =================================================
                 MOBILE PAYMENT CARDS
            ================================================== -->
            <div
              v-if="!loading && filteredPayments.length"
              class="mobile-payment-list record-scroll"
            >

              <article
                v-for="payment in filteredPayments"
                :key="`mobile-${payment.invoice}`"
                class="payment-card"
              >

                <!-- Card top -->
                <div class="payment-card-top">

                  <div class="student-cell">

                    <div class="student-avatar">
                      {{ getInitials(payment.student) }}
                    </div>

                    <div class="student-info">
                      <strong>
                        {{ payment.student }}
                      </strong>

                      <span>
                        {{ payment.studentId }}
                      </span>
                    </div>

                  </div>


                  <span
                    class="status-pill"
                    :class="
                      payment.status === 'Paid'
                        ? 'status-paid'
                        : 'status-unpaid'
                    "
                  >
                    <span></span>

                    {{ payment.status }}
                  </span>

                </div>


                <!-- Invoice -->
                <div class="mobile-detail">

                  <div>
                    <span>Invoice</span>
                    <strong>
                      {{ payment.invoice }}
                    </strong>
                  </div>

                  <div>
                    <span>Fee Type</span>
                    <strong>
                      {{ payment.feeType }}
                    </strong>
                  </div>

                </div>


                <!-- Amount -->
                <div class="mobile-money">

                  <div class="money-item main">
                    <span>Amount</span>
                    <strong>
                      {{ formatCurrency(payment.amount) }}
                    </strong>
                  </div>

                  <div class="money-item">
                    <span>Paid</span>
                    <strong class="green">
                      {{ formatCurrency(payment.paidAmount) }}
                    </strong>
                  </div>

                  <div class="money-item">
                    <span>Outstanding</span>
                    <strong
                      :class="{
                        yellow:
                          payment.outstandingAmount > 0
                      }"
                    >
                      {{
                        formatCurrency(
                          payment.outstandingAmount
                        )
                      }}
                    </strong>
                  </div>

                </div>


                <!-- Bottom -->
                <div class="payment-card-footer">

                  <span>
                    Payment Date
                  </span>

                  <strong>
                    {{ formatDate(payment.date) }}
                  </strong>

                </div>


                <div
                  v-if="payment.lastPaymentDate"
                  class="payment-card-footer"
                >

                  <span>
                    Last Payment
                  </span>

                  <strong>
                    {{ formatDate(payment.lastPaymentDate) }}
                  </strong>

                </div>


                <!-- Invoice download -->
                <button
                  type="button"
                  class="mobile-invoice-download-btn"
                  :disabled="
                    !payment.invoice ||
                    downloadingInvoice === payment.invoice
                  "
                  :title="invoiceDownloadTitle(payment)"
                  @click="downloadInvoice(payment)"
                >

                  <span
                    v-if="downloadingInvoice === payment.invoice"
                    class="download-spinner"
                    aria-hidden="true"
                  ></span>

                  <svg
                    v-else
                    class="download-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12"></path>
                    <path d="m7 11 5 5 5-5"></path>
                    <path d="M4 21h16"></path>
                  </svg>

                  <span>
                    {{
                      downloadingInvoice === payment.invoice
                        ? 'Preparing invoice…'
                        : 'Download Invoice'
                    }}
                  </span>

                </button>

                <p
                  v-if="!payment.invoice"
                  class="mobile-download-hint"
                >
                  No invoice is linked to this payment record.
                </p>

              </article>

            </div>


            <!-- =================================================
                 EMPTY
            ================================================== -->
            <div
              v-if="!loading && !filteredPayments.length"
              class="empty-state"
            >

              <div class="empty-icon">
                ₹
              </div>

              <h3>
                No payment records found
              </h3>

              <p>
                Try changing your search or status filter.
              </p>

              <button
                v-if="search || statusFilter !== 'All'"
                type="button"
                @click="
                  search = '';
                  statusFilter = 'All'
                "
              >
                Clear Filters
              </button>

            </div>

          </section>


          <!-- =================================================
               FOOTER
          ================================================== -->
          <footer class="page-footer">

            <span>
              Education Management System
            </span>

            <span class="footer-dot"></span>

            <span>
              Live fee data
            </span>

          </footer>

        </div>

      </main>

    </div>

  </div>
</template>


<script>
import Sidebar from '@/components/Sidebar.vue'
import { getContext, isStudentUser } from '@/lib/context'
import { apiGet, apiPost, extractMessage } from '@/lib/api'

export default {
  name: 'Fees',

  components: {
    Sidebar,
  },

  data() {
    return {
      search: '',

      statusFilter: 'All',

      payments: [],

      summary: {
        total_collected: 0,
        total_outstanding: 0,
        paid_invoices: 0,
        unpaid_invoices: 0,
      },

      context: null,

      mode: 'admin',

      studentName: '',

      loading: true,

      error: null,

      paymentStatus: {
        outstanding_total: 0,
        invoice_count: 0,
        gateway_configured: false,
        gateway: '',
        config_missing: [],
        can_pay: false,
        open_requests: [],
      },

      payBusy: false,

      payMessage: '',

      downloadingInvoice: '',

      downloadError: '',
    }
  },


  computed: {
    isStudent() {
      return isStudentUser(this.context) || this.mode === 'student'
    },

    filteredPayments() {
      const query = this.search
        .toLowerCase()
        .trim()

      return this.payments.filter((payment) => {
        const matchesSearch =
          !query ||
          [
            payment.student,
            payment.studentId,
            payment.invoice,
            payment.feeType,
            payment.feeSchedule,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)

        const matchesStatus =
          this.statusFilter === 'All' ||
          payment.status === this.statusFilter

        return matchesSearch && matchesStatus
      })
    },
  },


  mounted() {
    this.loadContext()

    this.loadFees()

    this.loadPaymentStatus()
  },


  methods: {

    async loadContext() {
      try {
        this.context = await getContext()
      } catch (error) {
        console.warn('Context API error:', error)
      }
    },

    /* =====================================================
       LOAD FEES
    ====================================================== */
    async loadFees() {
      this.loading = true

      this.error = null

      try {
        const response = await fetch(
          '/api/method/backend_custom_app.api.education.get_fees'
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.exception ||
            'Fees API request failed'
          )
        }

        if (result.message) {
          this.mode = result.message.mode || 'admin'

          this.studentName =
            result.message.student_name || ''

          this.summary = {
            total_collected:
              result.message.total_collected || 0,

            total_outstanding:
              result.message.total_outstanding || 0,

            paid_invoices:
              result.message.paid_invoices || 0,

            unpaid_invoices:
              result.message.unpaid_invoices || 0,
          }

          this.payments =
            result.message.fees || []
        } else {
          throw new Error(
            'Invalid fees response'
          )
        }

      } catch (error) {
        console.error(
          'Fees API error:',
          error
        )

        this.error =
          'Unable to load fee and payment data.'
      } finally {
        this.loading = false
      }
    },


    /* =====================================================
       PAYMENT STATUS (student Pay Now)
    ====================================================== */
    async loadPaymentStatus() {
      if (!isStudentUser(this.context) && this.mode !== 'student') {
        return
      }

      try {
        const status = await apiGet(
          '/api/method/backend_custom_app.api.payments.get_payment_status'
        )

        if (status) {
          this.paymentStatus = {
            outstanding_total: status.outstanding_total || 0,
            invoice_count: status.invoice_count || 0,
            gateway_configured: !!status.gateway_configured,
            gateway: status.gateway || '',
            config_missing: status.config_missing || [],
            can_pay: !!status.can_pay,
            open_requests: status.open_requests || [],
          }
        }
      } catch (error) {
        console.warn('Payment status error:', error)
      }
    },


    async payNow() {
      if (!this.paymentStatus.can_pay || this.payBusy) {
        return
      }

      this.payBusy = true
      this.payMessage = ''

      try {
        // Reuse an already-open request to avoid duplicates.
        const open = (this.paymentStatus.open_requests || [])[0]

        let result

        if (open && open.payment_url) {
          result = { payment_url: open.payment_url }
        } else {
          result = await apiPost(
            '/api/method/backend_custom_app.api.payments.create_payment_request',
            {}
          )
        }

        if (result && result.payment_url) {
          // Let the configured gateway take over. The invoice is only marked
          // paid once the gateway confirms the payment on the server.
          window.location.href = result.payment_url
          return
        }

        this.payMessage =
          (result && result.message) || 'Payment request created.'

        // Pull the latest backend state so totals reflect reality.
        await this.loadFees()
        await this.loadPaymentStatus()
      } catch (error) {
        console.error('Pay now error:', error)

        this.payMessage =
          error.message || 'Unable to start the payment.'
      } finally {
        this.payBusy = false
      }
    },


    /* =====================================================
       INVOICE DOWNLOAD
    ====================================================== */
    isDownloading(payment) {
      return (
        !!payment?.invoice &&
        this.downloadingInvoice === payment.invoice
      )
    },


    invoiceDownloadTitle(payment) {
      if (!payment?.invoice) {
        return 'No invoice is linked to this payment record'
      }

      return this.isDownloading(payment)
        ? 'Preparing your invoice PDF…'
        : `Download the invoice PDF for ${payment.invoice}`
    },


    async downloadInvoice(payment) {
      const invoice = payment?.invoice

      if (!invoice || this.downloadingInvoice) {
        return
      }

      this.downloadingInvoice = invoice
      this.downloadError = ''

      try {
        const response = await fetch(
          '/api/method/backend_custom_app.api.invoices.download_invoice' +
            `?invoice=${encodeURIComponent(invoice)}`,
          {
            credentials: 'include',
            headers: { Accept: 'application/pdf' },
          }
        )

        if (!response.ok) {
          let message = `Invoice ${invoice} could not be downloaded.`

          try {
            const body = await response.json()
            const detail = extractMessage(body)

            if (detail) {
              message = detail
            }
          } catch (parseError) {
            // Keep the fallback message.
          }

          throw new Error(message)
        }

        const blob = await response.blob()

        if (!blob || !blob.size) {
          throw new Error(
            `Invoice ${invoice} could not be generated. Please try again.`
          )
        }

        this.saveInvoicePdf(blob, this.invoiceFilename(response, invoice))
      } catch (error) {
        console.error('Invoice download error:', error)

        this.downloadError =
          error?.message ||
          'Unable to download the invoice. Please try again.'
      } finally {
        this.downloadingInvoice = ''
      }
    },


    invoiceFilename(response, invoice) {
      const header = response?.headers?.get('Content-Disposition') || ''

      const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)

      const name = match?.[1]?.trim()

      return name || `Invoice-${invoice}.pdf`
    },


    saveInvoicePdf(blob, filename) {
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url

      link.download = filename

      document.body.appendChild(link)

      link.click()

      link.remove()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },


    /* =====================================================
       FILTERS
    ====================================================== */
    applyFilters() {
      this.search =
        this.search.trim()
    },


    /* =====================================================
       CURRENCY
    ====================================================== */
    formatCurrency(value) {
      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }
      ).format(value || 0)
    },


    /* =====================================================
       DATE
    ====================================================== */
    formatDate(value) {
      if (!value) {
        return '—'
      }

      const date = new Date(value)

      if (Number.isNaN(date.getTime())) {
        return value
      }

      return date.toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    },


    /* =====================================================
       INITIALS
    ====================================================== */
    getInitials(name) {
      if (!name) {
        return '?'
      }

      const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)

      if (parts.length === 1) {
        return parts[0]
          .substring(0, 2)
          .toUpperCase()
      }

      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase()
    },
  },
}
</script>


<style scoped>

/* =========================================================
   GLOBAL
========================================================= */

:global(*) {
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
  overflow-x: hidden;
  background: #f5f7fb;
}

:global(#app) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}


/* =========================================================
   PAGE
========================================================= */

.fees-page {
  min-height: 100vh;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;

  color: #1E1B33;

  background:
    radial-gradient(
      circle at 85% 0%,
      rgba(69, 61, 137, 0.08),
      transparent 28%
    ),
    radial-gradient(
      circle at 10% 35%,
      rgba(69, 61, 137, 0.045),
      transparent 25%
    ),
    #f6f8fc;
}


/* =========================================================
   DESKTOP LAYOUT
========================================================= */

.app-layout {
  display: flex;
  width: 100%;
  min-width: 0;
}


/* =========================================================
   MAIN
========================================================= */

.main-content {
  width: calc(100% - 250px);

  min-width: 0;

  margin-left: 250px;

  overflow-x: hidden;
}

.content-container {
  width: 100%;

  max-width: 1380px;

  margin: 0 auto;

  padding:
    34px 38px 25px;
}


/* =========================================================
   HEADER
========================================================= */

.page-header {
  margin-bottom: 22px;
}

.breadcrumb{
  display: flex;

  align-items: center;

  gap: 7px;

  margin-bottom: 9px;

  color: #94a3b8;

  font-size: 9px;
}

.breadcrumb b {
  color: #cbd5e1;
}

.heading-row {
  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 20px;
}

.heading-row h1{
  margin: 0;

  color: #1E1B33;

  font-size: 30px;
  font-weight: 800;

  letter-spacing: -0.035em;
}

.heading-row p{
  margin:
    7px 0 0;

  color: #64748b;

  font-size: 12px;
}

.refresh-button{
  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  min-height: 40px;

  padding:
    0 15px;

  border:
    1px solid
    #dbe5ef;

  border-radius: 10px;

  color: #334155;

  background: white;

  font-size: 11px;
  font-weight: 650;

  cursor: pointer;

  box-shadow:
    0 4px 12px
    rgba(69, 61, 137, 0.035);

  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-1px);

  border-color: #C4B5E8;

  box-shadow:
    0 7px 18px
    rgba(69, 61, 137, 0.08);
}

.refresh-button:disabled {
  cursor: not-allowed;

  opacity: 0.65;
}

.refresh-icon{
  font-size: 15px;

  color: #453D89;
}

.spinning {
  animation:
    spin 0.8s linear infinite;
}


/* =========================================================
   ERROR
========================================================= */

.error-box {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 18px;

  padding: 13px 15px;

  border:
    1px solid
    #fecaca;

  border-radius: 13px;

  background:
    #fff7f7;
}

.error-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 30px;
  height: 30px;

  border-radius: 9px;

  color: #dc2626;

  font-weight: 800;

  background: #fee2e2;
}

.error-box strong{
  color: #991b1b;

  font-size: 11px;
}

.error-box p{
  margin: 2px 0 0;

  color: #b91c1c;

  font-size: 9px;
}

.error-box button{
  margin-left: auto;

  padding:
    7px 11px;

  border: 0;

  border-radius: 8px;

  color: #991b1b;

  background: #fee2e2;

  font-size: 9px;
  font-weight: 700;

  cursor: pointer;
}


/* =========================================================
   SUMMARY
========================================================= */

.summary-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 13px;

  min-width: 0;
}

.summary-card {
  position: relative;

  min-width: 0;

  overflow: hidden;

  padding: 17px;

  border:
    1px solid
    #e4eaf2;

  border-radius: 16px;

  background: rgba(255, 255, 255, 0.94);

  box-shadow:
    0 8px 25px
    rgba(69, 61, 137, 0.045);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.summary-card:hover {
  transform: translateY(-3px);

  box-shadow:
    0 14px 30px
    rgba(69, 61, 137, 0.075);
}

.summary-card::after {
  content: '';

  position: absolute;

  right: -42px;
  bottom: -55px;

  width: 125px;
  height: 125px;

  border-radius: 50%;

  opacity: 0.8;
}

.summary-card.collected::after {
  background:
    rgba(200, 73, 154, 0.08);
}

.summary-card.outstanding::after {
  background:
    rgba(245, 158, 11, 0.08);
}

.summary-card.paid::after {
  background:
    rgba(16, 185, 129, 0.08);
}

.summary-card.unpaid::after {
  background:
    rgba(69, 61, 137, 0.08);
}

.card-top {
  position: relative;

  z-index: 1;

  display: flex;

  align-items: center;

  justify-content: space-between;
}

.card-icon{
  display: flex;

  align-items: center;
  justify-content: center;

  width: 35px;
  height: 35px;

  border-radius: 10px;

  font-size: 15px;
  font-weight: 800;
}

.collected .card-icon {
  color: #0284c7;
  background: #F3EFF9;
}

.outstanding .card-icon {
  color: #d97706;
  background: #fef3c7;
}

.paid .card-icon {
  color: #059669;
  background: #d1fae5;
}

.unpaid .card-icon {
  color: #C8499A;
  background: #EDEBFA;
}

.card-badge{
  padding:
    4px 7px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 750;
}

.card-badge.positive {
  color: #047857;
  background: #ecfdf5;
}

.card-badge.warning {
  color: #b45309;
  background: #fffbeb;
}

.card-label{
  position: relative;

  z-index: 1;

  margin-top: 16px;

  color: #64748b;

  font-size: 9px;
  font-weight: 650;
}

.card-value{
  position: relative;

  z-index: 1;

  margin-top: 6px;

  overflow: hidden;

  color: #1E1B33;

  font-size: 23px;
  font-weight: 800;

  letter-spacing: -0.035em;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.card-description{
  position: relative;

  z-index: 1;

  margin-top: 4px;

  color: #94a3b8;

  font-size: 8px;
}

.card-line {
  position: relative;

  z-index: 1;

  width: 100%;

  height: 3px;

  margin-top: 15px;

  overflow: hidden;

  border-radius: 999px;

  background: #f1f5f9;
}

.card-line span {
  display: block;

  width: 48%;
  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #C8499A,
      #453D89
    );
}

.outstanding .card-line span {
  background:
    linear-gradient(
      90deg,
      #f59e0b,
      #f97316
    );
}

.paid .card-line span {
  background:
    linear-gradient(
      90deg,
      #10b981,
      #14b8a6
    );
}

.unpaid .card-line span {
  background:
    linear-gradient(
      90deg,
      #453D89,
      #5A4FA8
    );
}


/* =========================================================
   OVERVIEW
========================================================= */

.overview-card {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  margin-top: 14px;

  padding:
    19px 21px;

  overflow: hidden;

  border:
    1px solid
    rgba(90, 79, 168, 0.15);

  border-radius: 16px;

  color: white;

  background:
    linear-gradient(
      120deg,
      #0b1830,
      #102b54 54%,
      #2A2552
    );

  box-shadow:
    0 12px 30px
    rgba(30, 64, 175, 0.16);
}

.overview-left {
  display: flex;

  align-items: center;

  gap: 13px;

  min-width: 0;
}

.overview-icon{
  display: flex;

  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 40px;
  height: 40px;

  border-radius: 11px;

  color: #D96BB0;

  font-size: 18px;
  font-weight: 800;

  background:
    rgba(56, 189, 248, 0.12);

  border:
    1px solid
    rgba(125, 211, 252, 0.12);
}

.overview-label{
  color: #D96BB0;

  font-size: 7px;
  font-weight: 800;

  letter-spacing: 0.14em;
}

.overview-left h2{
  margin:
    4px 0 0;

  font-size: 20px;
  font-weight: 800;
}

.overview-left p{
  margin:
    3px 0 0;

  color: #9fb2ce;

  font-size: 8px;
}

.overview-stats {
  display: flex;

  align-items: center;

  gap: 20px;

  flex: 0 0 auto;
}

.overview-stat {
  text-align: right;
}

.overview-stat span{
  display: block;

  color: #8298b7;

  font-size: 7px;
}

.overview-stat strong {
  display: block;

  margin-top: 3px;

  color: white;

  font-size: 13px;
}

.overview-divider {
  width: 1px;
  height: 28px;

  background:
    rgba(148, 163, 184, 0.18);
}


/* =========================================================
   STUDENT SUMMARY
========================================================= */

.student-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}


/* =========================================================
   FEE ACCOUNT SUMMARY (Student)
========================================================= */

.fee-account-card {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  margin-top: 14px;

  padding: 19px 21px;

  overflow: hidden;

  border: 1px solid rgba(90, 79, 168, 0.15);

  border-radius: 16px;

  background:
    linear-gradient(
      120deg,
      #141033 0%,
      #241c56 55%,
      #3a2a6e 100%
    );

  box-shadow: 0 12px 30px rgba(69, 61, 137, 0.16);
}

.fee-account-left {
  display: flex;

  align-items: center;

  gap: 13px;

  min-width: 0;
}

.fee-account-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 40px;
  height: 40px;

  border-radius: 11px;

  color: #D96BB0;

  font-size: 16px;
  font-weight: 800;

  background: rgba(200, 73, 154, 0.14);

  border: 1px solid rgba(217, 107, 176, 0.18);
}

.fee-account-label {
  color: #D96BB0;

  font-size: 12px;
  font-weight: 800;

  letter-spacing: 0.14em;
}

.fee-account-left h2 {
  margin: 4px 0 0;

  color: #ffffff;

  font-size: 16px;
  font-weight: 800;
}

.fee-account-left h2 small {
  color: #b6a9e6;

  font-size: 13px;
  font-weight: 600;
}

.fee-account-sep {
  margin: 0 6px;

  color: #6b5fa8;
}

.fee-account-left p {
  margin: 3px 0 0;

  color: #b3a9d6;

  font-size: 13px;
}

.fee-account-right {
  flex: 0 0 auto;

  min-width: 180px;
  max-width: 230px;
  margin-left: auto;

  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fee-account-state {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 6px;

  color: #d8d2f0;
  font-size: 13px;
  font-weight: 700;
}

.fee-account-state-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.fee-account-state-dot.ok {
  background: #6ee7b7;
}

.fee-account-state-dot.warn {
  background: #fcd34d;
}

.pay-now-btn {
  border: none;
  cursor: pointer;

  padding: 8px 18px;

  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;

  color: #ffffff;
  background: linear-gradient(90deg, #C8499A, #7c6fd6);

  box-shadow: 0 4px 12px rgba(124, 111, 214, 0.35);
  transition: transform 0.15s ease, filter 0.2s ease;
}

.pay-now-btn:not(:disabled):hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.pay-now-btn:disabled {
  cursor: not-allowed;

  color: #b6a9e6;
  background: rgba(148, 163, 184, 0.2);
  box-shadow: none;
}

.fee-account-config {
  margin: 7px 0 0;
  max-width: 210px;

  color: #c9c2ea;
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}


/* =========================================================
   INVOICE DOWNLOAD
========================================================= */

.actions-cell {
  white-space: nowrap;
}

.invoice-download-btn {
  display: inline-flex;

  align-items: center;

  gap: 6px;

  padding: 6px 10px;

  border: 0;
  border-radius: 8px;

  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);

  font-size: 12px;
  font-weight: 700;

  cursor: pointer;

  box-shadow: 0 4px 10px rgba(69, 61, 137, 0.18);
  transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease;
}

.invoice-download-btn:not(:disabled):hover {
  transform: translateY(-1px);

  filter: brightness(1.06);

  box-shadow: 0 6px 14px rgba(200, 73, 154, 0.25);
}

.invoice-download-btn:disabled {
  cursor: not-allowed;

  color: #ffffff;
  background: rgba(148, 163, 184, 0.35);

  box-shadow: none;
}

.download-icon {
  width: 11px;
  height: 11px;

  flex: 0 0 auto;
}

.download-spinner {
  width: 11px;
  height: 11px;

  flex: 0 0 auto;

  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;

  border-radius: 50%;

  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.actions-hint {
  display: block;

  margin-top: 3px;

  color: #94a3b8;

  font-size: 12px;
}

.download-alert {
  display: flex;

  align-items: center;

  gap: 12px;

  margin: 14px 19px 0;

  padding: 12px 14px;

  border: 1px solid #fecaca;

  border-radius: 12px;

  background: #fff7f7;
}

.download-alert-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 28px;
  height: 28px;

  border-radius: 8px;

  color: #dc2626;
  background: #fee2e2;

  font-size: 13px;
  font-weight: 800;
}

.download-alert strong {
  color: #991b1b;

  font-size: 13px;
}

.download-alert p {
  margin: 2px 0 0;

  color: #b91c1c;

  font-size: 13px;

  line-height: 1.45;
}

.download-alert button {
  margin-left: auto;

  padding: 6px 10px;

  border: 0;
  border-radius: 8px;

  color: #991b1b;
  background: #fee2e2;

  font-size: 12px;
  font-weight: 700;

  cursor: pointer;
}


/* =========================================================
   FILTER CARD
========================================================= */

.filter-card {
  margin-top: 14px;

  padding: 17px;

  border:
    1px solid
    #e3e9f1;

  border-radius: 16px;

  background: white;

  box-shadow:
    0 7px 22px
    rgba(69, 61, 137, 0.04);
}

.filter-heading {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  margin-bottom: 13px;
}

.filter-title {
  display: flex;

  align-items: center;

  gap: 10px;
}

.filter-icon{
  display: flex;

  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;

  border-radius: 9px;

  color: #453D89;

  background: #F3EFF9;

  font-size: 16px;
  font-weight: 700;
}

.filter-title h2{
  margin: 0;

  font-size: 12px;
  font-weight: 750;
}

.filter-title p{
  margin: 2px 0 0;

  color: #94a3b8;

  font-size: 8px;
}

.result-count{
  padding:
    5px 8px;

  border-radius: 999px;

  color: #64748b;

  background: #f8fafc;

  font-size: 8px;
  font-weight: 650;
}

.filter-controls {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    180px
    125px;

  gap: 9px;
}

.search-wrapper,
.select-wrapper {
  position: relative;

  min-width: 0;
}

.search-wrapper input,
.select-wrapper select{
  width: 100%;
  height: 40px;

  border:
    1px solid
    #dce4ed;

  border-radius: 10px;

  outline: none;

  color: #334155;

  background: #fbfcfe;

  font-size: 10px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.search-wrapper input {
  padding:
    0 34px 0 34px;
}

.search-wrapper input:focus,
.select-wrapper select:focus {
  border-color: #5A4FA8;

  background: white;

  box-shadow:
    0 0 0 3px
    rgba(69, 61, 137, 0.09);
}

.search-icon{
  position: absolute;

  top: 50%;
  left: 12px;

  transform: translateY(-50%);

  color: #94a3b8;

  font-size: 14px;

  pointer-events: none;
}

.clear-search {
  position: absolute;

  top: 50%;
  right: 9px;

  display: flex;

  align-items: center;
  justify-content: center;

  width: 20px;
  height: 20px;

  transform: translateY(-50%);

  border: 0;

  border-radius: 50%;

  color: #64748b;

  background: #e2e8f0;

  font-size: 13px;

  cursor: pointer;
}

.select-wrapper select {
  appearance: none;

  padding:
    0 32px 0 12px;

  cursor: pointer;
}

.select-arrow{
  position: absolute;

  top: 50%;
  right: 11px;

  transform: translateY(-50%);

  color: #64748b;

  font-size: 11px;

  pointer-events: none;
}

.apply-button{
  height: 40px;

  border: 0;

  border-radius: 10px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #0891b2,
      #453D89 55%,
      #C8499A
    );

  font-size: 10px;
  font-weight: 700;

  cursor: pointer;

  box-shadow:
    0 7px 16px
    rgba(69, 61, 137, 0.17);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.apply-button:hover {
  transform: translateY(-1px);

  box-shadow:
    0 10px 20px
    rgba(69, 61, 137, 0.22);
}


/* =========================================================
   PAYMENTS SECTION
========================================================= */

.payments-section {
  margin-top: 14px;

  min-width: 0;

  overflow: hidden;

  border:
    1px solid
    #e3e9f1;

  border-radius: 16px;

  background: white;

  box-shadow:
    0 7px 22px
    rgba(69, 61, 137, 0.04);
}

.payments-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  padding:
    18px 19px;

  border-bottom:
    1px solid
    #eef2f7;
}

.section-eyebrow{
  margin-bottom: 4px;

  color: #453D89;

  font-size: 7px;
  font-weight: 800;

  letter-spacing: 0.14em;
}

.payments-header h2{
  margin: 0;

  color: #1E1B33;

  font-size: 14px;
  font-weight: 780;
}

.payments-header p{
  margin: 3px 0 0;

  color: #94a3b8;

  font-size: 8px;
}

.payment-count{
  padding:
    7px 10px;

  border:
    1px solid
    #e5eaf1;

  border-radius: 9px;

  color: #64748b;

  background: #f8fafc;

  font-size: 8px;
}

.payment-count span {
  color: #1E1B33;

  font-weight: 800;
}


/* =========================================================
   TABLE
========================================================= */

.desktop-table-wrapper {
  width: 100%;

  overflow-x: auto;

  -webkit-overflow-scrolling: touch;
}

/* Internal scroll for Payment Records (header + count stay outside). */
.record-scroll {
  max-height: 340px;

  overflow-y: auto;

  scrollbar-width: thin;
  scrollbar-color: #c7cbe0 transparent;

  overscroll-behavior: auto;
}

.record-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.record-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.record-scroll::-webkit-scrollbar-thumb {
  background: #c7cbe0;

  border-radius: 999px;
}

.record-scroll::-webkit-scrollbar-thumb:hover {
  background: #b0b5d2;
}

/* Sticky header inside the payment table scroll container. */
.record-scroll .payments-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;

  background: #f8fafc;
}

.payments-table {
  width: 100%;

  min-width: 940px;

  border-collapse: collapse;

  text-align: left;
}

.payments-table th{
  padding:
    10px 14px;

  color: #94a3b8;

  background: #f8fafc;

  font-size: 7px;
  font-weight: 800;

  letter-spacing: 0.07em;

  white-space: nowrap;
}

.payments-table td{
  padding:
    13px 14px;

  border-top:
    1px solid
    #f0f3f7;

  vertical-align: middle;

  font-size: 9px;
}

.payments-table tbody tr {
  transition:
    background 0.15s ease;
}

.payments-table tbody tr:hover {
  background:
    #f8fbff;
}

.student-cell {
  display: flex;

  align-items: center;

  gap: 9px;

  min-width: 160px;
}

.student-avatar{
  display: flex;

  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  width: 32px;
  height: 32px;

  border-radius: 9px;

  color: #453D89;

  background:
    linear-gradient(
      135deg,
      #FCEAF4,
      #EDEBFA
    );

  font-size: 9px;
  font-weight: 800;
}

.student-info {
  min-width: 0;
}

.student-info strong{
  display: block;

  overflow: hidden;

  max-width: 150px;

  color: #1e293b;

  font-size: 9px;
  font-weight: 700;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.student-info span{
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 7px;
}

.invoice-number{
  color: #475569;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;

  font-size: 8px;
}

.fee-type {
  display: inline-block;

  max-width: 130px;

  overflow: hidden;

  color: #64748b;

  text-overflow: ellipsis;

  white-space: nowrap;
}

.amount{
  color: #1E1B33;

  font-size: 9px;
}

.paid-amount{
  color: #059669;

  font-size: 9px;
  font-weight: 650;
}

.outstanding-amount{
  color: #64748b;

  font-size: 9px;
}

.outstanding-amount.pending {
  color: #d97706;

  font-weight: 700;
}

.status-pill{
  display: inline-flex;

  align-items: center;

  gap: 5px;

  padding:
    5px 8px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 750;

  white-space: nowrap;
}

.status-pill > span {
  width: 5px;
  height: 5px;

  border-radius: 50%;
}

.status-paid {
  color: #047857;

  background: #ecfdf5;
}

.status-paid > span {
  background: #10b981;
}

.status-unpaid {
  color: #b45309;

  background: #fffbeb;
}

.status-unpaid > span {
  background: #f59e0b;
}

.date-value{
  color: #64748b;

  font-size: 8px;

  white-space: nowrap;
}


/* =========================================================
   MOBILE PAYMENT LIST
========================================================= */

.mobile-payment-list {
  display: none;
}


/* =========================================================
   LOADING
========================================================= */

.loading-state {
  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  min-height: 270px;

  padding: 35px;

  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;

  margin-bottom: 12px;

  border:
    3px solid
    #e2e8f0;

  border-top-color:
    #453D89;

  border-radius: 50%;

  animation:
    spin 0.75s linear infinite;
}

.loading-state strong{
  color: #334155;

  font-size: 11px;
}

.loading-state p{
  margin: 4px 0 0;

  color: #94a3b8;

  font-size: 8px;
}


/* =========================================================
   EMPTY
========================================================= */

.empty-state {
  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  min-height: 270px;

  padding: 35px;

  text-align: center;
}

.empty-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 50px;
  height: 50px;

  margin-bottom: 12px;

  border-radius: 15px;

  color: #453D89;

  background:
    linear-gradient(
      135deg,
      #F3EFF9,
      #eef2ff
    );

  font-size: 19px;
  font-weight: 800;
}

.empty-state h3{
  margin: 0;

  color: #334155;

  font-size: 12px;
}

.empty-state p{
  margin:
    4px 0 12px;

  color: #94a3b8;

  font-size: 8px;
}

.empty-state button{
  padding:
    8px 12px;

  border: 0;

  border-radius: 8px;

  color: #453D89;

  background: #F3EFF9;

  font-size: 8px;
  font-weight: 700;

  cursor: pointer;
}


/* =========================================================
   FOOTER
========================================================= */

.page-footer{
  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  padding:
    20px 0 4px;

  color: #94a3b8;

  font-size: 7px;
}

.footer-dot {
  width: 3px;
  height: 3px;

  border-radius: 50%;

  background: #cbd5e1;
}


/* =========================================================
   FOOTER
========================================================= */

.page-footer {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  padding:
    20px 0 4px;

  color: #94a3b8;

  font-size: 12px;
}

.footer-dot {
  width: 3px;
  height: 3px;

  border-radius: 50%;

  background: #cbd5e1;
}


@media screen and (max-width: 1180px) {

  .main-content {
    width: calc(100% - 255px);

    margin-left: 255px;
  }

  .content-container {
    padding:
      28px 24px 22px;
  }

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .filter-controls {
    grid-template-columns:
      minmax(0, 1fr)
      160px
      120px;
  }

}


/* =========================================================
   TABLET
========================================================= */

@media screen and (max-width: 900px) {

  .main-content {
    width: 100%;
    margin-left: 0;
  }

  .content-container {
    padding:
      24px 20px;
  }

  .overview-card {
    align-items: flex-start;

    flex-direction: column;
  }

  .overview-stats {
    width: 100%;

    justify-content: space-between;
  }

  .fee-account-card {
    align-items: flex-start;

    flex-direction: column;
  }

  .fee-account-right {
    width: 100%;

    min-width: 0;
    max-width: none;
    margin-left: 0;

    align-items: flex-start;
  }

  .fee-account-config {
    max-width: none;
    text-align: left;
  }

}


/* =========================================================
   MOBILE
========================================================= */

@media screen and (max-width: 680px) {
  .content-container {
    padding: 18px 12px 20px;
  }

  .heading-row {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .heading-row h1 {
    font-size: 24px;
  }

  .heading-row p {
    max-width: 290px;
    font-size: 9px;
  }

  .refresh-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .summary-card {
    padding: 13px;
    border-radius: 14px;
  }

  .card-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    font-size: 12px;
  }

  .card-badge {
    padding: 3px 5px;
    font-size: 6px;
  }

  .card-label {
    margin-top: 11px;
    font-size: 8px;
  }

  .card-value {
    font-size: 18px;
  }

  .card-description {
    font-size: 7px;
  }

  .card-line {
    margin-top: 11px;
  }

  .overview-card {
    gap: 14px;
    padding: 16px;
    border-radius: 14px;
  }

  .overview-left {
    align-items: flex-start;
  }

  .overview-icon {
    width: 34px;
    height: 34px;
    font-size: 15px;
  }

  .overview-left h2 {
    font-size: 18px;
  }

  .overview-stats {
    gap: 10px;
  }

  .overview-stat strong {
    font-size: 11px;
  }

  .filter-card {
    padding: 13px;
    border-radius: 14px;
  }

  .filter-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .filter-controls {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .search-wrapper input, .select-wrapper select, .apply-button {
    height: 42px;
  }

  .payments-section {
    border-radius: 14px;
  }

  .payments-header {
    padding: 15px;
    align-items: flex-start;
  }

  .payment-count {
    display: none;
  }

  .desktop-table-wrapper {
    display: none;
  }

  .mobile-payment-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 10px;
  }

  .payment-card {
    width: 100%;
    padding: 13px;
    border: 1px solid #e7edf4;
    border-radius: 13px;
    background: linear-gradient( 180deg, #ffffff, #fbfdff );
    box-shadow: 0 5px 15px rgba(69, 61, 137, 0.04);
  }

  .payment-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 11px;
    border-bottom: 1px solid #eef2f7;
  }

  .payment-card .student-cell {
    min-width: 0;
  }

  .payment-card .student-avatar {
    width: 31px;
    height: 31px;
  }

  .payment-card .student-info strong {
    max-width: 165px;
    font-size: 9px;
  }

  .payment-card .student-info span {
    font-size: 6px;
  }

  .mobile-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 11px 0;
    border-bottom: 1px solid #eef2f7;
  }

  .mobile-detail span, .money-item span {
    display: block;
    margin-bottom: 3px;
    color: #94a3b8;
    font-size: 6px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .mobile-detail strong {
    display: block;
    overflow: hidden;
    color: #475569;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-money {
    display: grid;
    grid-template-columns: 1.15fr 1fr 1fr;
    gap: 8px;
    padding: 11px 0;
    border-bottom: 1px solid #eef2f7;
  }

  .money-item {
    min-width: 0;
  }

  .money-item strong {
    display: block;
    color: #475569;
    font-size: 9px;
  }

  .money-item.main strong {
    color: #1E1B33;
    font-size: 11px;
  }

  .money-item strong.green {
    color: #059669;
  }

  .money-item strong.yellow {
    color: #d97706;
  }

  .payment-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 10px;
  }

  .payment-card-footer span {
    color: #94a3b8;
    font-size: 7px;
  }

  .payment-card-footer strong {
    color: #475569;
    font-size: 8px;
  }

  .page-footer {
    padding-top: 16px;
  }

  .record-scroll {
    max-height: 360px;
  }

  .mobile-invoice-download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    margin-top: 10px;
    padding: 9px 12px;
    border: 0;
    border-radius: 9px;
    color: #ffffff;
    background: linear-gradient(105deg, #453D89, #C8499A);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(69, 61, 137, 0.18);
  }

  .mobile-invoice-download-btn:disabled {
    cursor: not-allowed;
    color: #ffffff;
    background: rgba(148, 163, 184, 0.35);
    box-shadow: none;
  }

  .mobile-download-hint {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
  }
}


/* =========================================================
   SMALL PHONES — 375px
========================================================= */

@media screen and (max-width: 420px) {
  .content-container {
    padding: 15px 9px 18px;
  }

  .breadcrumb {
    font-size: 7px;
  }

  .heading-row h1 {
    font-size: 21px;
  }

  .heading-row p {
    font-size: 8px;
  }

  .summary-grid {
    gap: 7px;
  }

  .summary-card {
    padding: 11px;
    border-radius: 12px;
  }

  .card-icon {
    width: 27px;
    height: 27px;
    font-size: 10px;
  }

  .card-badge {
    font-size: 5px;
  }

  .card-label {
    margin-top: 9px;
    font-size: 7px;
  }

  .card-value {
    margin-top: 4px;
    font-size: 16px;
  }

  .card-description {
    font-size: 6px;
  }

  .overview-card {
    padding: 13px;
    gap: 12px;
  }

  .overview-left h2 {
    font-size: 16px;
  }

  .overview-left p {
    font-size: 7px;
  }

  .overview-stats {
    gap: 6px;
  }

  .overview-stat span {
    font-size: 6px;
  }

  .overview-stat strong {
    font-size: 9px;
  }

  .overview-divider {
    height: 22px;
  }

  .filter-card {
    padding: 11px;
  }

  .filter-title h2 {
    font-size: 10px;
  }

  .filter-title p {
    font-size: 7px;
  }

  .filter-icon {
    width: 28px;
    height: 28px;
    font-size: 13px;
  }

  .search-wrapper input, .select-wrapper select, .apply-button {
    height: 39px;
    font-size: 8px;
  }

  .payments-header {
    padding: 13px;
  }

  .payments-header h2 {
    font-size: 11px;
  }

  .payments-header p {
    font-size: 7px;
  }

  .mobile-payment-list {
    padding: 8px;
  }

  .payment-card {
    padding: 11px;
    border-radius: 11px;
  }

  .payment-card .student-info strong {
    max-width: 140px;
    font-size: 8px;
  }

  .payment-card .status-pill {
    font-size: 6px;
    padding: 4px 6px;
  }

  .mobile-detail {
    padding: 9px 0;
  }

  .mobile-money {
    padding: 9px 0;
  }

  .money-item.main strong {
    font-size: 10px;
  }

  .money-item strong {
    font-size: 8px;
  }

  .payment-card-footer {
    padding-top: 8px;
  }
}


/* =========================================================
   VERY SMALL PHONES
========================================================= */

@media screen and (max-width: 340px){

  .content-container {
    padding:
      13px 7px 16px;
  }

  .summary-card {
    padding: 9px;
  }

  
.card-value {    font-size: 14px;
  }  .overview-card {
    padding: 11px;
  }

  .overview-stats {
    gap: 4px;
  }

  
.heading-row p {    font-size: 8px;
  }  .payment-card {
    padding: 9px;
  }

  
.payment-card .student-info strong {    max-width: 110px;

    font-size: 7px;
  }  .mobile-money {
    gap: 5px;
  }

  
.overview-stat strong {    font-size: 9px;
  }}


/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;

    animation-iteration-count: 1 !important;

    transition-duration: 0.01ms !important;
  }

}

/* =========================================================
   LAST PAYMENT
========================================================= */

.payment-count {
  display: block;

  margin-top: 2px;

  color: #94a3b8;

  font-size: 13px;
}

</style>