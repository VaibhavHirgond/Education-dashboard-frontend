<template>
  <div class="app-shell">
    <Sidebar />
    <main class="main-content">
      <!-- HEADER -->
      <section class="page-header">
        <div>
          <div class="breadcrumb">
            Education
            <span>/</span>
            {{ isStudent ? 'My Attendance' : 'Attendance' }}
          </div>
          <h1>{{ isStudent ? 'My Attendance' : 'Student Attendance' }}</h1>
          <p v-if="isStudent">
            Your attendance, monthly summary and leave requests.
          </p>
          <p v-else>
            Track attendance, presence and leave records
            directly from Frappe Education.
          </p>
        </div>
        <div class="header-actions">
          <button
            v-if="isInstructor"
            class="refresh-button leave-action"
            type="button"
            @click="scrollToAttendancePanel"
          >
            <span>✓</span>
            Take Daily Attendance
          </button>
          <button
            v-if="isInstructor"
            class="refresh-button leave-action"
            type="button"
            @click="scrollToLeavePanel"
          >
            <span>✉</span>
            Manage Leave Requests
          </button>
          <button
            v-if="isStudent"
            class="refresh-button leave-action"
            type="button"
            @click="openLeaveModal"
          >
            <span>✉</span>
            Apply for Leave
          </button>
          <button
            class="refresh-button"
            @click="reloadAll"
            :disabled="loading"
          >
            <span :class="{ spinning: loading }">↻</span>
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </section>

      <!-- ERROR -->
      <div v-if="error" class="error-box">
        <div class="error-icon">!</div>
        <div>
          <strong>Unable to load attendance</strong>
          <p>{{ error }}</p>
          <button @click="reloadAll">
            Try Again
          </button>
        </div>
      </div>

      <!-- =====================================================
           STAFF FILTERS
      ====================================================== -->
      <!-- Kept visible while an error is shown: the filters own the
           "Clear" control, and a filter-triggered failure would
           otherwise trap the user in a retry loop. -->
      <section v-if="!isStudent" class="filter-panel">
        <div class="filter-header">
          <div>
            <span class="eyebrow">FILTERS</span>
            <h2>Find Attendance</h2>
            <p>
              Filter by branch, division, standard, student group,
              status, date or student name.
            </p>
          </div>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="clear-filter-btn"
            @click="clearFilters"
          >
            Clear Filters
          </button>
        </div>

        <div class="filter-grid">
          <label class="filter-field search-field">
            <span>Search</span>
            <input
              v-model.trim="filters.search"
              type="text"
              placeholder="Search student name, ID or e-mail..."
            />
          </label>

          <label v-if="!isInstructor" class="filter-field">
            <span>Branch</span>
            <select v-model="filters.branch">
              <option value="">All Branches</option>
              <option
                v-for="option in masterOptions.branch"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>

          <label v-if="!isInstructor" class="filter-field">
            <span>Division</span>
            <select v-model="filters.division">
              <option value="">All Divisions</option>
              <option
                v-for="option in masterOptions.division"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>

          <label v-if="!isInstructor" class="filter-field">
            <span>Standard</span>
            <select v-model="filters.standard">
              <option value="">All Standards</option>
              <option
                v-for="option in masterOptions.standard"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>

          <label class="filter-field">
            <span>Student Group</span>
            <select v-model="filters.group">
              <option value="">All Student Groups</option>
              <option
                v-for="option in masterOptions.group"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>

          <label class="filter-field">
            <span>Status</span>
            <select v-model="filters.status">
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
          </label>

          <label class="filter-field">
            <span>From Date</span>
            <input v-model="filters.from_date" type="date" />
          </label>

          <label class="filter-field">
            <span>To Date</span>
            <input v-model="filters.to_date" type="date" />
          </label>
        </div>

        <div class="filter-footer">
          Showing <strong>{{ attendance.records.length }}</strong> records
          <span v-if="hasActiveFilters"> (filtered)</span>
        </div>
      </section>

      <!-- =====================================================
           SUMMARY CARDS
      ====================================================== -->
      <section v-if="!error" class="summary-grid">
        <!-- Attendance -->
        <div class="summary-card attendance-card">
          <div class="card-top">
            <div class="summary-icon purple">
              ✓
            </div>
            <span class="summary-label">
              Attendance Rate
            </span>
          </div>
          <div class="summary-value">
            {{ attendance.attendance_percentage }}%
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{
                width: `${Math.min(attendance.attendance_percentage, 100)}%`
              }"
            ></div>
          </div>
          <span class="summary-note">
            Present attendance
          </span>
        </div>
        <!-- Present -->
        <div class="summary-card">
          <div class="card-top">
            <div class="summary-icon green">
              ✓
            </div>
            <span class="summary-label">
              Present
            </span>
          </div>
          <div class="summary-value">
            {{ attendance.present }}
          </div>
          <span class="summary-note">
            Attendance records
          </span>
        </div>
        <!-- Absent -->
        <div class="summary-card">
          <div class="card-top">
            <div class="summary-icon red">
              !
            </div>
            <span class="summary-label">
              Absent
            </span>
          </div>
          <div class="summary-value">
            {{ attendance.absent }}
          </div>
          <span class="summary-note">
            Attendance records
          </span>
        </div>
        <!-- Leave -->
        <div class="summary-card">
          <div class="card-top">
            <div class="summary-icon orange">
              ◷
            </div>
            <span class="summary-label">
              Leave
            </span>
          </div>
          <div class="summary-value">
            {{ attendance.leave }}
          </div>
          <span class="summary-note">
            Leave records
          </span>
        </div>
      </section>

      <!-- =====================================================
           STUDENT CALENDAR
      ====================================================== -->
      <section v-if="!error && isStudent" class="panel calendar-panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">CALENDAR</span>
            <h2>{{ calendarTitle }}</h2>
            <p>Your attendance, leave and class dates for the selected month.</p>
          </div>
          <div class="calendar-nav">
            <button type="button" @click="shiftMonth(-1)">‹</button>
            <button type="button" @click="shiftMonth(1)">›</button>
          </div>
        </div>

        <div class="calendar-weekdays">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>

        <div class="calendar-grid">
          <template v-for="(cell, index) in calendarDays" :key="index">
            <div v-if="cell.empty" class="calendar-cell is-empty" aria-hidden="true"></div>
            <button
              v-else
              type="button"
              :class="calendarCellClasses(cell)"
              :aria-label="calendarCellLabel(cell)"
              :aria-pressed="selectedCalendarDate === cell.date"
              @click="selectCalendarDate(cell.date, $event)"
            >
              <strong>{{ cell.day }}</strong>
              <span class="calendar-indicators" aria-hidden="true">
                <i
                  v-for="type in calendarEventTypes(cell)"
                  :key="type"
                  class="calendar-event-indicator"
                  :class="`event-${type}`"
                ></i>
                <span
                  v-for="type in calendarEventTypes(cell)"
                  :key="`label-${type}`"
                  class="calendar-event-label"
                  :class="`event-${type}`"
                >
                  {{ calendarEventLabel(type) }}
                </span>
              </span>
            </button>
          </template>
        </div>

        <div
          v-if="selectedCalendarDate"
          class="calendar-modal-backdrop"
          @click.self="closeCalendarDetails"
        >
          <section
            id="calendar-details"
            class="calendar-details calendar-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-details-title"
            tabindex="-1"
            @click.stop
          >
            <div class="calendar-details-header">
              <div>
                <span class="eyebrow">DAY DETAILS</span>
                <h3 id="calendar-details-title">
                  {{ calendarDateLabel(selectedCalendarDate) }}
                </h3>
              </div>
              <button
                type="button"
                class="calendar-details-close"
                aria-label="Close day details"
                @click="closeCalendarDetails"
              >
                ×
              </button>
            </div>
            <div class="calendar-event-list">
              <article
                v-for="event in selectedCalendarEvents"
                :key="event.key"
                class="calendar-event-detail"
              >
                <span class="calendar-event-type" :class="`event-${event.kind}`">
                  {{ event.type }}
                </span>
                <p>{{ event.description }}</p>
                <dl v-if="event.details.length">
                  <div v-for="detail in event.details" :key="detail.label">
                    <dt>{{ detail.label }}</dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>
        </div>

        <div class="calendar-legend">
          <span><i class="dot present"></i> Present</span>
          <span><i class="dot absent"></i> Absent</span>
          <span><i class="dot leave"></i> Leave</span>
          <span><i class="dot none"></i> Not marked</span>
          <span><i class="dot holiday"></i> Holiday</span>
          <span><i class="dot class-session"></i> Class</span>
          <span class="legend-tentative">
            <i class="dot holiday-tentative"></i> Holiday (tentative)
          </span>
        </div>

        <p
          v-if="holidaySource === 'builtin_central_2026'"
          class="calendar-holiday-note"
        >
          Holidays shown from the Central Government of India gazetted
          calendar (reference). Configure a Company Holiday List to use a
          state-specific calendar.
        </p>
      </section>


      <!-- =====================================================
           TAKE DAILY ATTENDANCE (instructor / staff)
      ====================================================== -->
      <section v-if="!isStudent" class="panel take-attendance-panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">MARK ATTENDANCE</span>
            <h2>Take Daily Attendance</h2>
            <p>
              Pick a student group and date, then mark each student
              Present, Absent or Leave.
            </p>
          </div>
        </div>

        <div class="take-controls">
          <label class="filter-field">
            <span>Student Group *</span>
            <select v-model="takeForm.group" @change="loadRoster">
              <option value="">Select a group...</option>
              <option
                v-for="option in masterOptions.group"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>

          <label class="filter-field">
            <span>Date *</span>
            <input
              v-model="takeForm.date"
              type="date"
              :max="today"
              @change="loadRoster"
            />
          </label>

          <div class="take-bulk">
            <button
              type="button"
              class="leave-btn approve"
              :disabled="!roster.length"
              @click="markAll('Present')"
            >
              All Present
            </button>
            <button
              type="button"
              class="leave-btn reject"
              :disabled="!roster.length"
              @click="markAll('Absent')"
            >
              All Absent
            </button>
          </div>
        </div>

        <div v-if="rosterLoading" class="loading-state">
          <div class="loader"></div>
          <span>Loading roster...</span>
        </div>

        <div v-else-if="rosterError" class="error-box">
          <div class="error-icon">!</div>
          <div>
            <strong>Unable to load roster</strong>
            <p>{{ rosterError }}</p>
          </div>
        </div>

        <div v-else-if="roster.length" class="roster-list">
          <div
            v-for="row in roster"
            :key="row.student"
            class="roster-row"
          >
            <div class="student-info">
              <div class="student-avatar">
                {{ getInitials(row.studentName) }}
              </div>
              <div class="student-details">
                <h3>{{ row.studentName }}</h3>
                <span>{{ row.student }}</span>
              </div>
            </div>
            <div class="roster-status">
              <button
                v-for="option in ['Present', 'Absent', 'Leave']"
                :key="option"
                type="button"
                class="roster-option"
                :class="{
                  active: row.status === option,
                  present: option === 'Present' && row.status === option,
                  absent: option === 'Absent' && row.status === option,
                  leave: option === 'Leave' && row.status === option
                }"
                @click="row.status = option"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="takeForm.group" class="empty-small">
          No students found in this group.
        </div>

        <div v-if="roster.length" class="take-footer">
          <span v-if="takeSuccess" class="modal-success">
            ✓ {{ takeSuccess }}
          </span>
          <span v-if="takeError" class="take-error">
            {{ takeError }}
          </span>
          <button
            class="refresh-button leave-action"
            type="button"
            :disabled="takeSaving"
            @click="saveRoster"
          >
            {{ takeSaving ? 'Saving…' : 'Save Attendance' }}
          </button>
        </div>
      </section>

      <!-- =====================================================
           CONTENT GRID
      ====================================================== -->
      <section v-if="!error" class="content-grid">
        <!-- =================================================
             ATTENDANCE OVERVIEW
        ================================================== -->
        <div class="panel overview-panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">
                OVERVIEW
              </span>
              <h2>Attendance Overview</h2>
              <p>
                Current attendance status from the Education
                module.
              </p>
            </div>
            <div class="total-badge">
              {{ attendance.total }} Records
            </div>
          </div>
          <!-- DONUT -->
          <div class="attendance-overview">
            <div class="donut-wrapper">
              <div
                class="donut"
                :style="donutStyle"
              >
                <div class="donut-inner">
                  <strong>
                    {{ attendance.attendance_percentage }}%
                  </strong>
                  <span>
                    Attendance
                  </span>
                </div>
              </div>
            </div>
            <div class="legend">
              <div class="legend-row">
                <div class="legend-left">
                  <span class="dot green"></span>
                  <span>Present</span>
                </div>
                <strong>
                  {{ attendance.present }}
                </strong>
              </div>
              <div class="legend-row">
                <div class="legend-left">
                  <span class="dot red"></span>
                  <span>Absent</span>
                </div>
                <strong>
                  {{ attendance.absent }}
                </strong>
              </div>
              <div class="legend-row">
                <div class="legend-left">
                  <span class="dot orange"></span>
                  <span>Leave</span>
                </div>
                <strong>
                  {{ attendance.leave }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =====================================================
           ATTENDANCE HISTORY
      ====================================================== -->
      <section v-if="!error" class="panel history-panel">
        <div class="panel-header history-header">
          <div>
            <span class="eyebrow">
              ATTENDANCE HISTORY
            </span>
            <h2>{{ isStudent ? 'My Attendance History' : 'Recent Attendance' }}</h2>
            <p>
              Latest attendance records from Frappe Education.
            </p>
          </div>
          <span class="record-count">
            {{ attendance.records.length }} records
          </span>
        </div>
        <!-- Loading -->
        <div
          v-if="loading"
          class="loading-state"
        >
          <div class="loader"></div>
          <span>
            Loading attendance records...
          </span>
        </div>
        <!-- Desktop Table -->
        <div
          v-else-if="attendance.records.length"
          class="table-wrapper record-scroll"
        >
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th v-if="!isStudent">STUDENT</th>
                <th>COURSE</th>
                <th>STUDENT GROUP</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in attendance.records"
                :key="record.id"
              >
                <td>
                  <div class="date-cell">
                    <strong>
                      {{ formatDate(record.date) }}
                    </strong>
                    <span>
                      {{ record.id }}
                    </span>
                  </div>
                </td>
                <td v-if="!isStudent">
                  <div class="student-cell">
                    <div class="table-avatar">
                      {{ getInitials(record.studentName) }}
                    </div>
                    <div>
                      <strong>
                        {{ record.studentName }}
                      </strong>
                      <span>
                        {{ record.studentId }}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="course-name">
                    {{ record.course || '—' }}
                  </span>
                  <span
                    v-if="record.courseSchedule"
                    class="schedule-id"
                  >
                    {{ record.courseSchedule }}
                  </span>
                </td>
                <td>
                  <span class="group-name">
                    {{ record.studentGroup || '—' }}
                  </span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="statusClass(record.status)"
                  >
                    <span class="status-dot"></span>
                    {{ record.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile Cards -->
        <div
          v-if="!loading && attendance.records.length"
          class="mobile-records record-scroll"
        >
          <article
            v-for="record in attendance.records"
            :key="`mobile-${record.id}`"
            class="attendance-card-row"
          >
            <div class="record-top">
              <div>
                <strong>
                  {{ formatDate(record.date) }}
                </strong>
                <span>
                  {{ record.id }}
                </span>
              </div>
              <span
                class="status-badge"
                :class="statusClass(record.status)"
              >
                <span class="status-dot"></span>
                {{ record.status }}
              </span>
            </div>
            <div v-if="!isStudent" class="mobile-student">
              <div class="table-avatar">
                {{ getInitials(record.studentName) }}
              </div>
              <div>
                <strong>
                  {{ record.studentName }}
                </strong>
                <span>
                  {{ record.studentId }}
                </span>
              </div>
            </div>
            <div class="mobile-meta">
              <div>
                <span>Course</span>
                <strong>
                  {{ record.course || '—' }}
                </strong>
              </div>
              <div>
                <span>Student Group</span>
                <strong>
                  {{ record.studentGroup || '—' }}
                </strong>
              </div>
            </div>
          </article>
        </div>
        <!-- Empty -->
        <div
          v-if="!loading && !attendance.records.length"
          class="empty-state"
        >
          <div class="empty-icon">
            ✓
          </div>
          <h3>No attendance records</h3>
          <p>
            Attendance records created in Frappe Education
            will appear here.
          </p>
        </div>
      </section>

      <!-- =====================================================
           LEAVE APPLICATIONS
      ====================================================== -->
      <!-- Leave data is loaded separately from attendance, so an
           attendance error must not hide the leave panel (it carries
           the student's Apply for Leave button). -->
      <section class="panel leave-panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">LEAVE</span>
            <h2>{{ isStudent ? 'My Leave Applications' : 'Leave Requests' }}</h2>
            <p v-if="isStudent">
              Requests you have raised. Approval updates your attendance.
            </p>
            <p v-else>
              Approve or reject leave applications. Approving marks the
              matching days as Leave in Student Attendance.
            </p>
          </div>
          <button
            v-if="isStudent"
            type="button"
            class="refresh-button leave-action"
            @click="openLeaveModal"
          >
            <span>✉</span>
            Apply for Leave
          </button>
        </div>

        <div v-if="leaveLoading" class="loading-state">
          <div class="loader"></div>
          <span>Loading leave applications...</span>
        </div>

        <div v-else-if="leaveError" class="error-box">
          <div class="error-icon">!</div>
          <div>
            <strong>Unable to load leave applications</strong>
            <p>{{ leaveError }}</p>
          </div>
        </div>

        <div v-else-if="leaveApplications.length" class="leave-list">
          <article
            v-for="row in leaveApplications"
            :key="row.name"
            class="leave-row"
          >
            <div class="leave-main">
              <strong>
                {{ formatDate(row.from_date) }} – {{ formatDate(row.to_date) }}
              </strong>
              <span>
                {{ row.student_name || row.student }}
                <template v-if="row.student_group"> · {{ row.student_group }}</template>
              </span>
              <p>{{ row.reason || '—' }}</p>
            </div>
            <div class="leave-side">
              <span
                class="status-badge"
                :class="leaveStatusClass(row.status)"
              >
                <span class="status-dot"></span>
                {{ row.status }}
              </span>
              <div v-if="!isStudent" class="leave-actions">
                <button
                  type="button"
                  class="leave-btn approve"
                  :disabled="leaveBusy === row.name || row.status !== 'Pending'"
                  @click="approveLeave(row)"
                >
                  Approve
                </button>
                <button
                  type="button"
                  class="leave-btn reject"
                  :disabled="leaveBusy === row.name || row.status === 'Rejected'"
                  @click="rejectLeave(row)"
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-small">
          No leave applications yet.
        </div>
      </section>

     

      <!-- =====================================================
           APPLY FOR LEAVE MODAL (students)
      ====================================================== -->
      <div
        v-if="leaveModalOpen"
        class="modal-backdrop"
        @click.self="closeLeaveModal"
      >
        <div class="modal-card" role="dialog" aria-modal="true" aria-label="Apply for leave">
          <div class="modal-header">
            <div>
              <h2>Apply for Leave</h2>
              <p>
                Submitting sends your request for approval. Approved
                leave marks the matching days as Leave.
              </p>
            </div>
            <button
              class="modal-close"
              type="button"
              title="Close"
              @click="closeLeaveModal"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <div v-if="leaveModalError" class="error-box modal-error">
              <div class="error-icon">!</div>
              <div>
                <strong>Unable to submit leave</strong>
                <p>{{ leaveModalError }}</p>
              </div>
            </div>

            <div v-if="leaveModalSuccess" class="modal-success">
              ✓ {{ leaveModalSuccess }}
            </div>

            <div class="modal-grid">
              <label class="modal-field">
                <span>From Date *</span>
                <input v-model="leaveForm.from_date" type="date" />
              </label>

              <label class="modal-field">
                <span>To Date *</span>
                <input v-model="leaveForm.to_date" type="date" />
              </label>

              <label class="modal-field modal-field-wide">
                <span>Reason *</span>
                <textarea
                  v-model.trim="leaveForm.reason"
                  rows="3"
                  placeholder="Why do you need time off?"
                ></textarea>
              </label>

              <label class="modal-field modal-field-wide">
                <span>Attendance is marked for</span>

                <div v-if="leaveGroupsLoading" class="field-hint">
                  Loading your student group…
                </div>

                <div v-else-if="leaveGroupsError" class="field-error">
                  {{ leaveGroupsError }}
                </div>

                <template v-else>
                  <!-- A learner in one group sees that group's real name
                       with nothing to choose. A learner in several groups
                       picks which group the leave should mark. -->
                  <select
                    v-if="leaveGroups.length > 1"
                    v-model="leaveForm.student_group"
                  >
                    <option value="" disabled>Select a student group…</option>
                    <option
                      v-for="option in leaveGroups"
                      :key="option.student_group"
                      :value="option.student_group"
                    >
                      {{ option.student_group_name }}
                    </option>
                  </select>

                  <div v-else-if="leaveGroups.length === 1" class="field-hint">
                    {{ leaveGroups[0].student_group_name }}
                  </div>

                  <div v-else class="field-error">
                    You are not attached to a Student Group yet. Ask your
                    administrator to add you to a group.
                  </div>
                </template>

                <small>
                  Half-day leave is not supported by this Education
                  DocType, so whole days are marked as Leave.
                </small>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="refresh-button"
              type="button"
              :disabled="leaveSaving"
              @click="closeLeaveModal"
            >
              Cancel
            </button>
            <button
              class="refresh-button leave-action"
              type="button"
              :disabled="leaveSaving"
              @click="submitLeave"
            >
              {{ leaveSaving ? 'Submitting…' : 'Submit Leave Request' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import {
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  watch
} from 'vue'
import { getContext, isInstructorUser, isStudentUser } from '@/lib/context'

// =========================================================
// STATE
// =========================================================
const loading = ref(true)
const error = ref('')
const context = ref(null)
const mode = ref('admin')

const attendance = ref({
  total: 0,
  present: 0,
  absent: 0,
  leave: 0,
  attendance_percentage: 0,
  records: []
})

const isStudent = computed(
  () => isStudentUser(context.value) || mode.value === 'student'
)

// The backend also reports mode: "instructor". Falling back to it keeps
// the instructor layout (and their scoped filters) when the context
// request fails or resolves late.
const isInstructor = computed(
  () =>
    isInstructorUser(context.value) || mode.value === 'instructor'
)

// Staff filters (validated server side against real masters).
const filters = ref({
  search: '',
  branch: '',
  division: '',
  standard: '',
  group: '',
  status: '',
  from_date: '',
  to_date: ''
})

const masterOptions = ref({
  branch: [],
  division: [],
  standard: [],
  group: []
})

const hasActiveFilters = computed(() =>
  Object.values(filters.value).some(Boolean)
)

function filterPayload() {
  const payload = {}

  Object.entries(filters.value).forEach(([key, value]) => {
    if (value) payload[key] = value
  })

  return payload
}

function clearFilters() {
  filters.value = {
    search: '',
    branch: '',
    division: '',
    standard: '',
    group: '',
    status: '',
    from_date: '',
    to_date: ''
  }
}

function serverMessage(body) {
  if (!body) return ''

  const raw = body._server_messages

  if (raw) {
    try {
      const list = typeof raw === 'string' ? JSON.parse(raw) : raw
      return JSON.parse(list[0])?.message || body.exception || ''
    } catch (parseError) {
      return body.exception || ''
    }
  }

  return body.exception || body.message || ''
}

// =========================================================
// MASTERS (staff filters)
// =========================================================
async function fetchMasterNames(doctype) {
  const fields = encodeURIComponent(JSON.stringify(['name']))

  const response = await fetch(
    `/api/resource/${encodeURIComponent(doctype)}?fields=${fields}&limit_page_length=200&order_by=name%20asc`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )

  if (!response.ok) return []

  const body = await response.json().catch(() => ({}))

  if (!Array.isArray(body.data)) return []

  return body.data.map((row) => row.name).filter(Boolean)
}

async function loadMasterOptions() {
  // Instructors only ever pick from their own student groups.
  if (isInstructor.value) {
    const groups = Array.isArray(context.value?.instructor?.groups)
      ? context.value.instructor.groups
      : []

    masterOptions.value = { branch: [], division: [], standard: [], group: groups }
    return
  }

  const [branch, division, standard, group] = await Promise.all([
    fetchMasterNames('Branch').catch(() => []),
    fetchMasterNames('Division').catch(() => []),
    fetchMasterNames('Standard').catch(() => []),
    fetchMasterNames('Student Group').catch(() => [])
  ])

  masterOptions.value = { branch, division, standard, group }
}

async function loadContext() {
  try {
    context.value = await getContext()

    if (!isStudent.value) {
      await loadMasterOptions()
    }
  } catch (err) {
    console.warn('Context API error:', err)
  }
}

// =========================================================
// API
// =========================================================
async function loadAttendance() {
  loading.value = true
  error.value = ''

  try {
    const payload = isStudent.value ? {} : filterPayload()

    const url =
      '/api/method/backend_custom_app.api.education.get_attendance'

    const options =
      Object.keys(payload).length > 0
        ? {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload })
          }
        : { credentials: 'include' }

    const response = await fetch(url, options)

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    if (!data.message) {
      throw new Error('Invalid response received from Frappe.')
    }

    if (data.message.mode === 'student' || data.message.mode === 'instructor') {
      mode.value = data.message.mode
    }

    attendance.value = {
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      attendance_percentage: 0,
      records: [],
      ...data.message
    }
  } catch (err) {
    console.error('Attendance API Error:', err)
    error.value = err.message || 'Unable to load attendance data.'
  } finally {
    loading.value = false
  }
}

// =========================================================
// LEAVE APPLICATIONS
// =========================================================
const leaveApplications = ref([])
const leaveLoading = ref(false)
const leaveError = ref('')
const leaveBusy = ref('')

async function loadLeave() {
  leaveLoading.value = true
  leaveError.value = ''

  try {
    const response = await fetch(
      '/api/method/backend_custom_app.api.leave.get_leave_applications',
      { credentials: 'include' }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    leaveApplications.value = Array.isArray(data.message?.applications)
      ? data.message.applications
      : []
  } catch (err) {
    leaveError.value =
      err.message || 'Unable to load leave applications.'
  } finally {
    leaveLoading.value = false
  }
}

async function postLeaveAction(row, action) {
  leaveBusy.value = row.name
  leaveError.value = ''

  try {
    const method =
      action === 'approve' ? 'approve_leave' : 'reject_leave'

    const response = await fetch(
      `/api/method/backend_custom_app.api.leave.${method}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: row.name })
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    await Promise.all([loadLeave(), loadAttendance()])
  } catch (err) {
    leaveError.value = err.message || 'Unable to update the leave.'
  } finally {
    leaveBusy.value = ''
  }
}

function approveLeave(row) {
  return postLeaveAction(row, 'approve')
}

function rejectLeave(row) {
  return postLeaveAction(row, 'reject')
}

// =========================================================
// APPLY FOR LEAVE MODAL (students)
// =========================================================
const leaveModalOpen = ref(false)
const leaveSaving = ref(false)
const leaveModalError = ref('')
const leaveModalSuccess = ref('')

const leaveGroups = ref([])
const leaveGroupsLoading = ref(false)
const leaveGroupsError = ref('')

const leaveForm = ref({
  from_date: '',
  to_date: '',
  reason: '',
  attendance_based_on: 'Student Group',
  student_group: ''
})

async function loadMyGroups() {
  leaveGroupsLoading.value = true
  leaveGroupsError.value = ''

  try {
    const response = await fetch(
      '/api/method/backend_custom_app.api.leave.get_my_groups',
      { credentials: 'include', headers: { Accept: 'application/json' } }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    leaveGroups.value = Array.isArray(data.message?.groups)
      ? data.message.groups
      : []

    // A learner in exactly one group has nothing to pick: preselect it so
    // the hidden field and the visible name stay in sync.
    if (leaveGroups.value.length === 1) {
      leaveForm.value.student_group = leaveGroups.value[0].student_group
    }
  } catch (err) {
    leaveGroups.value = []
    leaveGroupsError.value =
      err.message || 'Unable to load your student group.'
  } finally {
    leaveGroupsLoading.value = false
  }
}

async function openLeaveModal() {
  leaveModalError.value = ''
  leaveModalSuccess.value = ''
  leaveModalOpen.value = true

  await loadMyGroups()
}

function scrollToLeavePanel() {
  const panel = document.querySelector('.leave-panel')

  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function closeLeaveModal() {
  if (leaveSaving.value) return

  leaveModalOpen.value = false
}

async function submitLeave() {
  if (leaveSaving.value) return

  leaveModalError.value = ''
  leaveModalSuccess.value = ''

  if (!leaveForm.value.from_date || !leaveForm.value.to_date) {
    leaveModalError.value = 'Please choose the leave dates.'
    return
  }

  if (leaveForm.value.to_date < leaveForm.value.from_date) {
    leaveModalError.value = 'To Date cannot be before From Date.'
    return
  }

  if (!leaveForm.value.reason) {
    leaveModalError.value = 'Please provide a reason for the leave.'
    return
  }

  if (!leaveGroupsLoading.value && leaveGroups.value.length === 0) {
    leaveModalError.value =
      'You are not attached to a Student Group yet. Ask your administrator to add you to a group.'
    return
  }

  if (leaveGroups.value.length > 1 && !leaveForm.value.student_group) {
    leaveModalError.value = 'Please choose the student group for this leave.'
    return
  }

  leaveSaving.value = true

  try {
    const response = await fetch(
      '/api/method/backend_custom_app.api.leave.apply_leave',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: {
            ...leaveForm.value,
            student_group: leaveForm.value.student_group || undefined
          }
        })
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    leaveModalSuccess.value =
      data.message?.message ||
      'Leave application submitted for approval.'

    leaveForm.value = {
      from_date: '',
      to_date: '',
      reason: '',
      attendance_based_on: 'Student Group',
      student_group: ''
    }

    // Re-read the list so the new request appears immediately.
    await loadLeave()

    // Keep the confirmation on screen for a moment: closing the modal
    // in the same tick destroyed the success message before it ever
    // rendered, so students never saw that the request was filed.
    setTimeout(() => {
      leaveModalOpen.value = false
    }, 1600)
  } catch (err) {
    // Form values are intentionally left untouched on failure so the
    // learner does not have to re-enter the dates and reason.
    leaveModalError.value =
      err.message || 'Unable to submit the leave application.'
  } finally {
    leaveSaving.value = false
  }
}

// =========================================================
// TAKE DAILY ATTENDANCE (instructor / staff)
// =========================================================
const today = new Date().toISOString().slice(0, 10)

const takeForm = ref({ group: '', date: today })
const roster = ref([])
const rosterLoading = ref(false)
const rosterError = ref('')
const takeSaving = ref(false)
const takeError = ref('')
const takeSuccess = ref('')

function scrollToAttendancePanel() {
  const panel = document.querySelector('.take-attendance-panel')

  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function loadRoster() {
  rosterError.value = ''
  takeSuccess.value = ''
  takeError.value = ''
  roster.value = []

  if (!takeForm.value.group) return

  rosterLoading.value = true

  try {
    const response = await fetch(
      '/api/method/backend_custom_app.api.education.get_group_attendance_roster',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: {
            student_group: takeForm.value.group,
            date: takeForm.value.date
          }
        })
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    roster.value = Array.isArray(data.message?.students)
      ? data.message.students
      : []
  } catch (err) {
    rosterError.value = err.message || 'Unable to load the roster.'
  } finally {
    rosterLoading.value = false
  }
}

function markAll(status) {
  roster.value.forEach((row) => {
    row.status = status
  })
}

async function saveRoster() {
  takeError.value = ''
  takeSuccess.value = ''

  if (!takeForm.value.group) {
    takeError.value = 'Please choose a student group.'
    return
  }

  const rows = roster.value
    .filter((row) => row.status)
    .map((row) => ({ student: row.student, status: row.status }))

  if (!rows.length) {
    takeError.value = 'Please mark at least one student.'
    return
  }

  takeSaving.value = true

  try {
    const response = await fetch(
      '/api/method/backend_custom_app.api.education.mark_attendance',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: {
            student_group: takeForm.value.group,
            date: takeForm.value.date,
            rows
          }
        })
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        serverMessage(data) || `Server returned ${response.status}`
      )
    }

    takeSuccess.value =
      data.message?.message || 'Attendance saved.'

    await Promise.all([loadRoster(), loadAttendance()])
  } catch (err) {
    takeError.value = err.message || 'Unable to save attendance.'
  } finally {
    takeSaving.value = false
  }
}

// =========================================================
// DONUT CHART
// =========================================================
const donutStyle = computed(() => {
  const total = attendance.value.total
  if (!total) {
    return {
      background:
        'conic-gradient(#e9e7f7 0deg 360deg)'
    }
  }
  const presentDegrees =
    (attendance.value.present / total) * 360
  const absentDegrees =
    (attendance.value.absent / total) * 360
  const leaveDegrees =
    (attendance.value.leave / total) * 360
  const presentEnd =
    presentDegrees
  const absentEnd =
    presentDegrees + absentDegrees
  return {
    background: `
      conic-gradient(
        #5b5ce2 0deg ${presentEnd}deg,
        #ef4444 ${presentEnd}deg ${absentEnd}deg,
        #f59e0b ${absentEnd}deg 360deg
      )
    `
  }
})

// =========================================================
// STUDENT SUMMARY
// =========================================================
const uniqueStudents = computed(() => {
  const students = new Map()
  for (const record of attendance.value.records || []) {
    const key = record.studentId || record.studentName || record.id
    if (!students.has(key)) {
      students.set(key, {
        studentId: record.studentId || '',
        studentName: record.studentName || 'Unknown Student',
        studentGroup: record.studentGroup || '',
        course: record.course || '',
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        percentage: 0
      })
    }
    const student = students.get(key)
    student.total += 1
    if (record.status === 'Present') student.present += 1
    if (record.status === 'Absent') student.absent += 1
    if (record.status === 'Leave') student.leave += 1
    if (!student.studentGroup && record.studentGroup) student.studentGroup = record.studentGroup
    if (!student.course && record.course) student.course = record.course
  }
  return Array.from(students.values()).map(student => ({
    ...student,
    percentage: student.total
      ? Math.round((student.present / student.total) * 10000) / 100
      : 0
  }))
})

// =========================================================
// CALENDAR (students)
// =========================================================
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const calendarMonth = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
)

const calendarTitle = computed(() =>
  calendarMonth.value.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  })
)

const selectedCalendarDate = ref('')
const calendarTrigger = ref(null)

function shiftMonth(delta) {
  calendarMonth.value = new Date(
    calendarMonth.value.getFullYear(),
    calendarMonth.value.getMonth() + delta,
    1
  )
  selectedCalendarDate.value = ''
}

// =========================================================
// HOLIDAYS (display-only calendar overlay)
// =========================================================
const holidays = ref([])
const calendarSchedules = ref([])
const holidayYear = ref(null)
const holidaySource = ref('')
const holidayNote = ref('')

async function loadHolidays(year) {
  try {
    const response = await fetch(
      `/api/method/backend_custom_app.api.holidays.get_holidays?year=${year}`,
      { credentials: 'include', headers: { Accept: 'application/json' } }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.message) {
      return
    }

    holidayYear.value = data.message.year
    holidays.value = data.message.holidays || []
    holidaySource.value = data.message.source || ''
    holidayNote.value = data.message.note || ''
  } catch (err) {
    console.warn('Holidays API error:', err)
  }
}

async function loadCalendarSchedules() {
  if (!isStudent.value) {
    calendarSchedules.value = []
    return
  }

  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const fromDate = `${year}-${pad(month + 1)}-01`
  const toDate = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
  const query = new URLSearchParams({
    payload: JSON.stringify({ from_date: fromDate, to_date: toDate })
  })

  try {
    const response = await fetch(
      `/api/method/backend_custom_app.api.education.get_course_schedules?${query}`,
      { credentials: 'include', headers: { Accept: 'application/json' } }
    )
    const data = await response.json().catch(() => ({}))

    if (!response.ok) return
    calendarSchedules.value = Array.isArray(data.message?.schedules)
      ? data.message.schedules
      : []
  } catch (err) {
    console.warn('Calendar schedule API error:', err)
  }
}

watch(
  calendarMonth,
  value => {
    const year = value.getFullYear()

    if (holidayYear.value !== year) {
      loadHolidays(year)
    }

    loadCalendarSchedules()
  },
  { immediate: false }
)

const holidayByDate = computed(() => {
  const map = {}

  for (const row of holidays.value) {
    if (row && row.date) {
      map[String(row.date).slice(0, 10)] = row
    }
  }

  return map
})

function pad(value) {
  return String(value).padStart(2, '0')
}

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const statusByDate = {}
  const statusesByDate = {}

  for (const record of attendance.value.records || []) {
    if (!record.date) continue

    const key = String(record.date).slice(0, 10)
    const status = String(record.status || '').trim()
    const statuses = statusesByDate[key] || []

    if (status && !statuses.includes(status)) {
      statuses.push(status)
      statusesByDate[key] = statuses
    }

    const score = { Present: 3, Leave: 2, Absent: 1 }[status] || 0
    const current = { Present: 3, Leave: 2, Absent: 1 }[statusByDate[key]] || 0

    if (score > current) {
      statusByDate[key] = status
    }
  }

  const cells = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ empty: true })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${year}-${pad(month + 1)}-${pad(day)}`

    cells.push({
      empty: false,
      day,
      date,
      status: statusByDate[date] || '',
      statuses: statusesByDate[date] || [],
      schedules: calendarSchedules.value.filter(
        schedule => String(schedule.date || '').slice(0, 10) === date
      ),
      leaveApplications: leaveApplications.value.filter(row => {
        const fromDate = String(row.from_date || '').slice(0, 10)
        const toDate = String(row.to_date || row.from_date || '').slice(0, 10)

        return fromDate && toDate && fromDate <= date && date <= toDate
      }),
      holiday: holidayByDate.value[date] || null
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ empty: true })
  }

  return cells
})

function calendarEventTypes(cell) {
  const types = new Set()

  for (const status of cell.statuses || []) {
    const normalized = String(status).toLowerCase()

    if (['present', 'absent', 'leave'].includes(normalized)) {
      types.add(normalized)
    }
  }

  if (cell.leaveApplications?.length) {
    types.add('leave')
  }

  if (cell.schedules?.length) {
    types.add('class')
  }

  if (cell.holiday) {
    types.add(
      String(cell.holiday.status || '').toLowerCase() === 'tentative'
        ? 'tentative-holiday'
        : 'holiday'
    )
  }

  return [...types]
}

function calendarCellClasses(cell) {
  const statuses = cell.statuses || []
  const classes = [
    'calendar-cell',
    ...(statuses.length ? statuses.map(statusCellClass) : ['is-none'])
  ]

  if (cell.leaveApplications?.length && !statuses.includes('Leave')) {
    classes.push('is-leave')
  }

  if (cell.holiday) {
    classes.push('is-holiday')

    if (String(cell.holiday.status || '').toLowerCase() === 'tentative') {
      classes.push('is-holiday-tentative')
    }
  }

  if (selectedCalendarDate.value === cell.date) {
    classes.push('is-selected')
  }

  return classes
}

function calendarEventLabel(type) {
  const labels = {
    present: 'Present',
    absent: 'Absent',
    leave: 'Leave',
    class: 'Class',
    holiday: 'Holiday',
    'tentative-holiday': 'Tentative'
  }

  return labels[type] || type
}

function calendarCellLabel(cell) {
  const labels = calendarEventTypes(cell).map(calendarEventLabel)
  const holidayName = cell.holiday?.name
  const events = labels.length ? labels.join(', ') : 'Not marked'

  return `${formatDate(cell.date)}: ${events}${holidayName ? `. ${holidayName}` : ''}. Show day details.`
}

function selectCalendarDate(date, event) {
  calendarTrigger.value = event?.currentTarget || null
  selectedCalendarDate.value = date
  nextTick(() => {
    document.querySelector('.calendar-details-dialog .calendar-details-close')?.focus()
  })
}

function closeCalendarDetails() {
  selectedCalendarDate.value = ''
  nextTick(() => calendarTrigger.value?.focus())
}

function handleCalendarKeydown(event) {
  if (!selectedCalendarDate.value) return

  if (event.key === 'Escape') {
    closeCalendarDetails()
    return
  }

  if (event.key === 'Tab') {
    const dialog = document.querySelector('.calendar-details-dialog')
    const focusable = dialog?.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

function calendarDateLabel(date) {
  const value = new Date(`${date}T00:00:00`)

  return value.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function calendarEventsForDate(date) {
  const events = []
  const records = (attendance.value.records || []).filter(
    record => String(record.date || '').slice(0, 10) === date
  )

  records.forEach((record, index) => {
    const status = String(record.status || 'Attendance').trim()
    const course = record.course || ''
    const studentGroup = record.studentGroup || record.student_group || ''
    const details = [
      { label: 'Course', value: course },
      { label: 'Student group', value: studentGroup },
      { label: 'Student', value: record.studentName || record.student_name || '' },
      { label: 'Record', value: record.id || record.name || '' }
    ].filter(detail => detail.value)

    events.push({
      key: `attendance-${record.id || record.name || index}`,
      kind: status.toLowerCase(),
      type: status,
      description:
        record.description ||
        record.reason ||
        record.remarks ||
        `${status} attendance${course ? ` for ${course}` : ''}.`,
      details
    })
  })

  const schedules = calendarSchedules.value.filter(
    schedule => String(schedule.date || '').slice(0, 10) === date
  )

  schedules.forEach((schedule, index) => {
    const time = [schedule.fromTime, schedule.toTime].filter(Boolean).join(' - ')
    const details = [
      { label: 'Course', value: schedule.course || '' },
      { label: 'Student group', value: schedule.studentGroup || '' },
      { label: 'Instructor', value: schedule.instructor || '' },
      { label: 'Time', value: time },
      { label: 'Room', value: schedule.room || '' },
      { label: 'Status', value: schedule.status || '' }
    ].filter(detail => detail.value)

    events.push({
      key: `schedule-${schedule.id || index}`,
      kind: 'class',
      type: 'Class session',
      description: `${schedule.course || 'Class'}${time ? ` is scheduled from ${time}` : ' is scheduled'}${schedule.room ? ` in ${schedule.room}` : ''}.`,
      details
    })
  })

  const leaveRows = leaveApplications.value.filter(row => {
    const fromDate = String(row.from_date || '').slice(0, 10)
    const toDate = String(row.to_date || row.from_date || '').slice(0, 10)

    return fromDate && toDate && fromDate <= date && date <= toDate
  })

  leaveRows.forEach((row, index) => {
    const fromDate = String(row.from_date || '').slice(0, 10)
    const toDate = String(row.to_date || row.from_date || '').slice(0, 10)
    const details = [
      { label: 'Status', value: row.status || '' },
      {
        label: 'Dates',
        value: fromDate
          ? `${formatDate(fromDate)}${toDate && toDate !== fromDate ? ` – ${formatDate(toDate)}` : ''}`
          : ''
      },
      { label: 'Student group', value: row.student_group || '' },
      { label: 'Student', value: row.student_name || row.student || '' },
      { label: 'Application', value: row.name || '' }
    ].filter(detail => detail.value)

    events.push({
      key: `leave-${row.name || index}`,
      kind: 'leave',
      type: 'Leave application',
      description: row.reason || `Leave application${row.status ? ` (${row.status})` : ''}.`,
      details
    })
  })

  const holiday = holidayByDate.value[date]

  if (holiday) {
    const tentative = String(holiday.status || '').toLowerCase() === 'tentative'

    events.push({
      key: `holiday-${date}`,
      kind: tentative ? 'tentative-holiday' : 'holiday',
      type: tentative ? 'Tentative holiday' : 'Holiday',
      description: holiday.description || holiday.name || 'Holiday',
      details: [
        { label: 'Status', value: holiday.status || 'Confirmed' },
        { label: 'Name', value: holiday.name || '' }
      ].filter(detail => detail.value)
    })
  }

  if (!events.length) {
    events.push({
      key: `not-marked-${date}`,
      kind: 'none',
      type: 'No events',
      description: 'No events for this date.',
      details: []
    })
  }

  return events
}

const selectedCalendarEvents = computed(() =>
  selectedCalendarDate.value
    ? calendarEventsForDate(selectedCalendarDate.value)
    : []
)

function statusCellClass(status) {
  if (status === 'Present') return 'is-present'
  if (status === 'Absent') return 'is-absent'
  if (status === 'Leave') return 'is-leave'

  return 'is-none'
}

function leaveStatusClass(status) {
  if (status === 'Approved') return 'status-present'
  if (status === 'Rejected') return 'status-absent'

  return 'status-leave'
}

// HELPERS
// =========================================================
function getInitials(name) {
  if (!name) {
    return 'ST'
  }
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
}
function formatDate(date) {
  if (!date) {
    return '—'
  }
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) {
    return date
  }
  return value.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )
}
function statusClass(status) {
  if (status === 'Present') {
    return 'status-present'
  }
  if (status === 'Absent') {
    return 'status-absent'
  }
  if (status === 'Leave') {
    return 'status-leave'
  }
  return ''
}

// =========================================================
// RELOAD + WATCHERS
// =========================================================
function reloadAll() {
  loadAttendance()
  loadLeave()
}

let filterTimer = null

watch(
  filters,
  () => {
    if (isStudent.value) return

    if (filterTimer) clearTimeout(filterTimer)

    filterTimer = setTimeout(() => {
      loadAttendance()
    }, 250)
  },
  { deep: true }
)

// =========================================================
// INITIAL LOAD
// =========================================================
onMounted(() => {
  document.addEventListener('keydown', handleCalendarKeydown)
  loadContext().then(loadCalendarSchedules)
  reloadAll()
  loadHolidays(calendarMonth.value.getFullYear())
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleCalendarKeydown)
})
</script>

<style scoped>















/* =========================================================







   BASE







========================================================= */















* {







  box-sizing: border-box;







}















.app-shell {







  min-height: 100vh;







  background: #f6f7fb;







  color: #20213a;







  font-family:







    Inter,







    -apple-system,







    BlinkMacSystemFont,







    "Segoe UI",







    sans-serif;







}























/* =========================================================







   MAIN







========================================================= */















.main-content {







  margin-left: 255px;















  width: calc(100% - 255px);















  min-height: 100vh;















  padding: 34px 38px 50px;







}























/* =========================================================







   PAGE HEADER







========================================================= */















.page-header {







  display: flex;







  align-items: flex-end;







  justify-content: space-between;







  gap: 25px;















  margin-bottom: 30px;







}























.breadcrumb{







  display: flex;







  gap: 8px;















  margin-bottom: 9px;















  font-size: 11px;







  color: #9999aa;







}























.breadcrumb span {







  color: #c4c4d0;







}























.page-header h1{







  margin: 0;















  font-size: 30px;







  line-height: 1.15;















  letter-spacing: -1px;















  color: #20213a;







}























.page-header p {







  margin: 8px 0 0;















  color: #8d8ea1;















  font-size: 13px;







}























.refresh-button{







  display: flex;







  align-items: center;







  gap: 8px;















  height: 40px;















  padding: 0 16px;















  border: 1px solid #deddf0;







  border-radius: 10px;















  background: #ffffff;















  color: #5556d5;















  font-size: 12px;







  font-weight: 700;















  cursor: pointer;















  transition: 0.2s ease;







}























.refresh-button:hover {







  background: #f5f5ff;







  border-color: #c9c9eb;







}























.refresh-button:disabled {







  opacity: 0.65;







  cursor: wait;







}























.refresh-button span{







  font-size: 17px;







}























.spinning {







  animation: spin 0.8s linear infinite;







}























@keyframes spin {















  to {







    transform: rotate(360deg);







  }















}























/* =========================================================







   SUMMARY CARDS







========================================================= */















.summary-grid {







  display: grid;















  grid-template-columns:







    repeat(4, minmax(0, 1fr));















  gap: 17px;















  margin-bottom: 20px;







}























.summary-card {







  min-height: 145px;















  padding: 20px;















  background: #ffffff;















  border: 1px solid #ecebf3;







  border-radius: 16px;















  box-shadow:







    0 5px 20px rgba(42, 43, 72, 0.035);







}























.card-top {







  display: flex;







  align-items: center;







  gap: 10px;







}























.summary-icon{







  width: 36px;







  height: 36px;















  display: flex;







  align-items: center;







  justify-content: center;















  border-radius: 10px;















  font-size: 15px;







  font-weight: 800;







}























.summary-icon.purple {







  background: #eeedff;







  color: #5b5ce2;







}























.summary-icon.green {







  background: #e9f9f1;







  color: #21a366;







}























.summary-icon.red {







  background: #ffeded;







  color: #e34b4b;







}























.summary-icon.orange {







  background: #fff4df;







  color: #e59616;







}























.summary-label{







  color: #85869b;















  font-size: 11px;







  font-weight: 700;







}























.summary-value{







  margin-top: 17px;















  color: #252640;















  font-size: 27px;







  line-height: 1;















  font-weight: 800;















  letter-spacing: -0.8px;







}























.summary-note{







  display: block;















  margin-top: 8px;















  color: #a0a0b0;















  font-size: 10px;







}























.progress-track {







  height: 6px;















  margin-top: 15px;















  overflow: visible;















  border-radius: 999px;















  background: #eeeeF7;







}























.progress-fill {







  height: 100%;















  border-radius: inherit;















  background:







    linear-gradient(







      90deg,







      #6d6ee9,







      #4f50c9







    );















  transition: width 0.5s ease;







}























/* =========================================================







   CONTENT GRID







========================================================= */















.content-grid {







  display: grid;















  grid-template-columns: minmax(0, 1fr);















  gap: 20px;















  margin-bottom: 20px;







}























.panel {







  background: #ffffff;















  border: 1px solid #ecebf3;







  border-radius: 17px;















  box-shadow:







    0 5px 20px rgba(42, 43, 72, 0.035);







}























.panel-header {







  display: flex;







  align-items: flex-start;







  justify-content: space-between;







  gap: 20px;















  padding: 23px 24px 0;







}























.eyebrow{







  font-size: 9px;







  font-weight: 800;















  letter-spacing: 1.1px;















  color: #8889a0;







}























.panel-header h2{







  margin: 5px 0 0;















  color: #27283f;















  font-size: 17px;







  font-weight: 800;







}























.panel-header p{







  margin: 5px 0 0;















  color: #9999a9;















  font-size: 11px;







}























.total-badge,







.record-count{







  flex-shrink: 0;















  padding: 7px 10px;















  border-radius: 8px;















  background: #f4f4fc;















  color: #6768a4;















  font-size: 10px;







  font-weight: 700;







}























/* =========================================================







   ATTENDANCE OVERVIEW







========================================================= */















.attendance-overview {







  min-height: 245px;















  display: flex;







  align-items: center;







  justify-content: center;















  gap: 55px;















  padding: 25px;







}























.donut-wrapper {







  display: flex;







  align-items: center;







  justify-content: center;







}























.donut {







  width: 175px;







  height: 175px;















  display: flex;







  align-items: center;







  justify-content: center;















  border-radius: 50%;















  position: relative;







}























.donut::before {







  content: "";















  position: absolute;















  inset: 14px;















  background: #ffffff;















  border-radius: 50%;







}























.donut-inner {







  position: relative;







  z-index: 1;















  display: flex;







  flex-direction: column;







  align-items: center;







}























.donut-inner strong{







  color: #292a43;















  font-size: 25px;







  font-weight: 800;







}























.donut-inner span{







  margin-top: 3px;















  color: #9999aa;















  font-size: 9px;







}























.legend {







  min-width: 180px;







}























.legend-row{







  display: flex;







  align-items: center;







  justify-content: space-between;















  padding: 12px 0;















  border-bottom: 1px solid #f0eff5;















  font-size: 12px;







}























.legend-row:last-child {







  border-bottom: 0;







}























.legend-left {







  display: flex;







  align-items: center;







  gap: 9px;















  color: #77788d;







}























.legend-row strong {







  color: #34354d;







}























.dot,







.status-dot {







  width: 8px;







  height: 8px;















  flex-shrink: 0;















  border-radius: 50%;







}























.dot.green,







.status-present .status-dot {







  background: #21a366;







}























.dot.red,







.status-absent .status-dot {







  background: #e34b4b;







}























.dot.orange,







.status-leave .status-dot {







  background: #e59616;







}























/* =========================================================







   STUDENT PANEL







========================================================= */















.student-panel {
  min-height: 100%;
}

.student-count-badge{
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 8px;
  background: #f4f4fc;
  color: #6768a4;
  font-size: 10px;
  font-weight: 700;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px 24px;
  max-height: 510px;
  overflow-y: auto;
}

.student-list::-webkit-scrollbar { width: 6px; }
.student-list::-webkit-scrollbar-thumb { background: #d9d9e8; border-radius: 999px; }

.student-list-item {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) minmax(150px, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid #efeff5;
  border-radius: 13px;
  background: #fbfbfe;
}

.student-list-item:hover { background: #f8f8ff; border-color: #e5e4f4; }

.student-info { display: flex; align-items: center; gap: 11px; min-width: 0; }

.student-avatar{
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #EDEBFA, #F3EFF9);
  color: #5b5ce2;
  font-size: 12px;
  font-weight: 800;
}

.student-details { min-width: 0; display: flex; flex-direction: column; }
.student-details h3{ margin: 0; color: #303149; font-size: 12px; font-weight: 800; line-height: 1.35; overflow-wrap: anywhere; }
.student-details span{ margin-top: 3px; color: #a0a0af; font-size: 9px; overflow-wrap: anywhere; }

.student-meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; min-width: 0; }
.student-meta > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.student-meta span{ color: #a0a0af; font-size: 8px; text-transform: uppercase; letter-spacing: .4px; }
.student-meta strong{ color: #55566c; font-size: 9px; line-height: 1.35; overflow-wrap: anywhere; }

.student-attendance { display: grid; grid-template-columns: repeat(4,auto); align-items: center; gap: 8px; }
.student-stat,.student-rate { min-width: 42px; padding: 7px 8px; border-radius: 8px; text-align: center; }
.student-stat { display: flex; flex-direction: column; gap: 2px; }
.student-stat span,.student-rate span{ font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: .25px; }
.student-stat strong,.student-rate strong{ font-size: 12px; font-weight: 800; }
.present-stat { background:#eaf8f1; color:#258f5e; }
.absent-stat { background:#ffeded; color:#d64a4a; }
.leave-stat { background:#fff4df; color:#c88411; }
.student-rate { background:#eeeeff; color:#5b5ce2; display:flex; flex-direction:column; gap:2px; }

.empty-small{ padding: 30px 24px; color:#9a9aaa; font-size: 11px; text-align:center; }

/* =========================================================







   HISTORY







========================================================= */




































.history-header {







  padding-bottom: 22px;







}























.table-wrapper {







  width: 100%;















  overflow-x: auto;















  border-top: 1px solid #efeff4;







}

/* Internal scroll for My Attendance History (heading stays outside).
   Height is viewport-aware so every record stays reachable via the
   list's own scrollbar on desktop and touch scrolling on mobile. */
.record-scroll {
  max-height: min(65vh, 560px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #c7cbe0 transparent;
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

/* Sticky header inside the scroll container. */
.record-scroll thead th {
  position: sticky;
  top: 0;
  z-index: 1;

  background: #ffffff;
}























table {







  width: 100%;















  border-collapse: collapse;















  min-width: 850px;







}























thead {







  background: #fafafd;







}























th{







  padding: 13px 20px;















  color: #9999aa;















  font-size: 9px;







  font-weight: 800;















  letter-spacing: 0.7px;















  text-align: left;







}























td {







  padding: 15px 20px;















  border-top: 1px solid #f0eff5;















  vertical-align: middle;







}























tbody tr {







  transition: background 0.15s ease;







}























tbody tr:hover {







  background: #fafaff;







}























.date-cell,







.student-cell,







.mobile-student {







  display: flex;







  align-items: center;







}























.date-cell {







  flex-direction: column;







  align-items: flex-start;







}























.date-cell strong{







  color: #34354c;















  font-size: 11px;







}























.date-cell span{







  margin-top: 4px;















  color: #a1a1b0;















  font-size: 9px;







}























.student-cell {







  gap: 10px;







}























.table-avatar{







  width: 32px;







  height: 32px;















  display: flex;







  align-items: center;







  justify-content: center;















  flex-shrink: 0;















  border-radius: 9px;















  background: #eeeeff;







  color: #5c5dd9;















  font-size: 9px;







  font-weight: 800;







}























.student-cell > div:last-child {







  display: flex;







  flex-direction: column;















  min-width: 120px;







}























.student-cell strong,







.mobile-student strong{







  color: #383950;















  font-size: 11px;







}























.student-cell span,







.mobile-student span{







  margin-top: 3px;















  color: #a0a0af;















  font-size: 9px;







}























.course-name,







.group-name{







  display: block;















  max-width: 220px;















  color: #55566d;















  font-size: 10px;







  line-height: 1.4;















  overflow-wrap: anywhere;







}























.schedule-id{







  display: block;















  margin-top: 4px;















  color: #aaaaba;















  font-size: 8px;







}























.status-badge{







  display: inline-flex;







  align-items: center;







  gap: 6px;















  padding: 6px 9px;















  border-radius: 7px;















  font-size: 9px;







  font-weight: 700;







}























.status-present {







  background: #eaf8f1;







  color: #258f5e;







}























.status-absent {







  background: #ffeded;







  color: #d64a4a;







}























.status-leave {







  background: #fff4df;







  color: #c88411;







}























.mobile-records {







  display: none;







}























/* =========================================================







   LOADING







========================================================= */















.loading-state{







  min-height: 250px;















  display: flex;







  align-items: center;







  justify-content: center;







  flex-direction: column;















  gap: 12px;















  border-top: 1px solid #efeff4;















  color: #9696a8;















  font-size: 11px;







}























.loader {







  width: 30px;







  height: 30px;















  border: 3px solid #e9e9f4;







  border-top-color: #5b5ce2;















  border-radius: 50%;















  animation: spin 0.8s linear infinite;







}























/* =========================================================







   EMPTY







========================================================= */















.empty-state {







  padding: 55px 20px;















  border-top: 1px solid #efeff4;















  text-align: center;







}























.empty-icon{







  width: 48px;







  height: 48px;















  display: flex;







  align-items: center;







  justify-content: center;















  margin: 0 auto 13px;















  border-radius: 14px;















  background: #eeeeff;















  color: #5b5ce2;















  font-size: 18px;







  font-weight: 800;







}























.empty-state h3{







  margin: 0;















  color: #45465e;















  font-size: 14px;







}























.empty-state p{







  max-width: 400px;















  margin: 7px auto 0;















  color: #9999aa;















  font-size: 11px;







  line-height: 1.6;







}























/* =========================================================







   ERROR







========================================================= */















.error-box {







  display: flex;







  align-items: flex-start;







  gap: 14px;















  margin-bottom: 20px;







  padding: 17px 19px;















  border: 1px solid #f2caca;







  border-radius: 13px;















  background: #fff7f7;







}























.error-icon {







  width: 32px;







  height: 32px;















  display: flex;







  align-items: center;







  justify-content: center;















  flex-shrink: 0;















  border-radius: 9px;















  background: #ffe3e3;







  color: #d84a4a;















  font-weight: 800;







}























.error-box strong{







  color: #a83e3e;















  font-size: 12px;







}























.error-box p{







  margin: 5px 0 9px;















  color: #b36a6a;















  font-size: 10px;







}























.error-box button{







  padding: 6px 10px;















  border: 0;







  border-radius: 7px;















  background: #d84a4a;















  color: white;















  font-size: 9px;







  font-weight: 700;















  cursor: pointer;







}























/* =========================================================







   BACKEND STATUS







========================================================= */















.backend-status {







  display: flex;







  align-items: center;







  gap: 13px;















  margin-top: 20px;







  padding: 15px 18px;















  border: 1px solid #dcefe5;







  border-radius: 13px;















  background: #f7fcf9;







}























.connection-icon {







  width: 32px;







  height: 32px;















  display: flex;







  align-items: center;







  justify-content: center;















  flex-shrink: 0;















  border-radius: 9px;















  background: #e3f7eb;







  color: #24955e;















  font-size: 13px;







  font-weight: 800;







}























.backend-status > div:nth-child(2) {







  display: flex;







  flex-direction: column;







  min-width: 0;







}























.backend-status strong{







  color: #317250;















  font-size: 11px;







}























.backend-status span{







  margin-top: 3px;















  color: #77a28b;















  font-size: 9px;







}























.connected-badge{







  margin-left: auto;















  padding: 5px 9px;















  border-radius: 7px;















  background: #e5f8ed;















  color: #258f5e !important;















  font-size: 8px !important;







  font-weight: 800;







}























/* =========================================================







   LARGE DESKTOP







========================================================= */















@media (min-width: 1400px) {















  .main-content {







    padding-left: 48px;







    padding-right: 48px;







  }















}























/* =========================================================







   TABLET / SMALL DESKTOP







========================================================= */















@media (max-width: 1100px) {



  .main-content {

    width: 100%;

    margin-left: 0;

    padding: 27px 24px 40px;

  }



  .summary-grid {

    grid-template-columns: repeat(2, minmax(0, 1fr));

  }



  .content-grid {

    grid-template-columns: 1fr;

  }



}







/* =========================================================







   TABLET







========================================================= */















@media (max-width: 820px) {

  .student-list-item { grid-template-columns: 1fr; }
  .student-attendance { grid-template-columns: repeat(4,minmax(0,1fr)); }
















  .main-content {







    padding: 24px 18px 35px;







  }























  .page-header {







    align-items: flex-start;







  }























  .page-header h1 {







    font-size: 26px;







  }























  .summary-grid {







    gap: 13px;







  }























  .attendance-overview {







    gap: 35px;







  }























  .donut {







    width: 155px;







    height: 155px;







  }























  .donut::before {







    inset: 13px;







  }























  .legend {







    min-width: 150px;







  }















}























/* =========================================================







   MOBILE







========================================================= */















@media (max-width: 640px){















  .main-content {







    padding: 21px 13px 30px;







  }























  .page-header {







    flex-direction: column;







    gap: 14px;















    margin-bottom: 20px;







  }























  







.page-header h1 {
    font-size: 23px;
  }

  .page-header p {
    max-width: 430px;
    font-size: 11px;
    line-height: 1.5;
  }  .refresh-button {







    width: 100%;







    justify-content: center;







  }























  .summary-grid {







    grid-template-columns:







      repeat(2, minmax(0, 1fr));















    gap: 10px;







  }























  .summary-card {







    min-height: 125px;















    padding: 15px;







  }























  







.summary-icon {
    width: 31px;
    height: 31px;
    border-radius: 9px;
    font-size: 12px;
  }

  .summary-label {
    font-size: 9px;
  }

  .summary-value {
    margin-top: 13px;
    font-size: 23px;
  }

  .summary-note {
    font-size: 8px;
  }  .panel-header {







    padding: 18px 17px 0;







  }























  







.panel-header h2 {
    font-size: 15px;
  }

  .panel-header p {
    font-size: 10px;
    line-height: 1.45;
  }  .attendance-overview {







    min-height: auto;















    flex-direction: column;















    gap: 24px;















    padding: 24px 18px 27px;







  }























  .donut {







    width: 155px;







    height: 155px;







  }























  .legend {







    width: 100%;







    min-width: 0;







  }























  .student-info {







    margin-left: 17px;







    margin-right: 17px;







  }























  .info-list {







    padding-left: 17px;







    padding-right: 17px;







  }























  .info-item {







    align-items: flex-start;







    flex-direction: column;















    gap: 5px;







  }























  .info-item strong {







    max-width: 100%;















    text-align: left;







  }























  .student-list {
    padding: 17px;
    max-height: 560px;
  }

  .student-list-item {
    gap: 12px;
    padding: 13px;
  }

  .student-meta {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #f0eff5;
  }

  .student-attendance {
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid #f0eff5;
  }

  .student-stat,.student-rate { min-width:0; padding:7px 4px; }
.student-stat span,.student-rate span {
    font-size: 6px;
  }

  .student-stat strong,.student-rate strong {
    font-size: 11px;
  }  .history-header {







    padding-bottom: 18px;







  }























  .record-count {







    display: none;







  }























  .table-wrapper {







    display: none;







  }























  .mobile-records {







    display: flex;







    flex-direction: column;















    border-top: 1px solid #efeff4;







  }























  .attendance-card-row {







    padding: 16px;















    border-bottom: 1px solid #efeff4;







  }























  .attendance-card-row:last-child {







    border-bottom: 0;







  }























  .record-top {







    display: flex;







    align-items: flex-start;







    justify-content: space-between;















    gap: 10px;







  }























  .record-top > div {







    display: flex;







    flex-direction: column;







  }























  







.record-top strong {
    color: #36374f;
    font-size: 11px;
  }

  .record-top span {
    margin-top: 3px;
    color: #a0a0af;
    font-size: 8px;
  }  .mobile-student {







    gap: 9px;















    margin-top: 15px;







  }























  .mobile-meta {







    display: grid;















    grid-template-columns: 1fr;















    gap: 11px;















    margin-top: 15px;







    padding-top: 13px;















    border-top: 1px solid #f0eff5;







  }























  .mobile-meta > div {







    display: flex;







    flex-direction: column;







  }























  







.mobile-meta span {
    color: #a0a0af;
    font-size: 8px;
  }

  .mobile-meta strong {
    margin-top: 3px;
    color: #55566c;
    font-size: 10px;
    overflow-wrap: anywhere;
  }  .backend-status {







    align-items: flex-start;















    padding: 13px;







  }























  .backend-status > div:nth-child(2) {







    flex: 1;







  }























  .connected-badge {







    display: none;







  }















}























/* =========================================================







   SMALL MOBILE







========================================================= */















@media (max-width: 420px){

  .brand-icon.small {







    width: 34px;







    height: 34px;







  }























  .main-content {







    padding-left: 10px;







    padding-right: 10px;







  }























  .summary-grid {







    gap: 8px;







  }























  .summary-card {







    padding: 13px;







  }























  







.summary-value {    font-size: 21px;
  }  .summary-icon {







    width: 29px;







    height: 29px;







  }























  .panel {







    border-radius: 14px;







  }























  







.summary-value {    font-size: 21px;
  }  .donut {







    width: 140px;







    height: 140px;







  }























  







.donut-inner strong {    font-size: 22px;
  }}























/* =========================================================







   VERY SMALL PHONES







========================================================= */















@media (max-width: 340px){















  .summary-grid {







    grid-template-columns: 1fr;







  }























  .summary-card {







    min-height: 115px;







  }

  







.page-header h1 {    font-size: 20px;
  }}























/* =========================================================







   REDUCED MOTION







========================================================= */















@media (prefers-reduced-motion: reduce) {















  *,







  *::before,







  *::after {







    animation-duration: 0.01ms !important;







    transition-duration: 0.01ms !important;







  }















}
















/* =====================================================
   ROLE-BASED ATTENDANCE: FILTERS / CALENDAR / LEAVE
===================================================== */

.filter-panel {
  background: #fff;
  border: 1px solid #e8e6f0;
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 24px;
}

.filter-panel .filter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.filter-panel .filter-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 4px 0 2px;
}

.filter-panel .filter-header p {
  font-size: 13px;
  color: #6b6b80;
}

.clear-filter-btn {
  padding: 8px 14px;
  border: 1px solid #e8e6f0;
  border-radius: 10px;
  background: #f8f7fc;
  color: #5b5ce2;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.clear-filter-btn:hover {
  background: #edeafd;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px 14px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-field.search-field {
  grid-column: 1 / -1;
}

.filter-field > span {
  font-size: 13px;
  font-weight: 600;
  color: #6b6b80;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-field input,
.filter-field select {
  padding: 9px 12px;
  border: 1px solid #e8e6f0;
  border-radius: 10px;
  background: #f8f7fc;
  font-size: 13px;
  color: #1a1a2e;
  transition: all 0.15s ease;
}

.filter-field input:focus,
.filter-field select:focus {
  outline: none;
  border-color: #5b5ce2;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(91, 92, 226, 0.12);
}

.filter-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f0eef8;
  font-size: 13px;
  color: #6b6b80;
}

.filter-footer strong {
  color: #1a1a2e;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.leave-action {
  background: #5b5ce2;
  color: #fff;
  border: none;
}

.leave-action:hover:not(:disabled) {
  background: #4a4bd0;
}

/* =====================================================
   CALENDAR
===================================================== */
.calendar-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.calendar-nav {
  display: flex;
  gap: 6px;
}

.calendar-nav button {
  width: 34px;
  height: 34px;
  border: 1px solid #e8e6f0;
  border-radius: 9px;
  background: #f8f7fc;
  color: #5b5ce2;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.calendar-nav button:hover {
  background: #edeafd;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 8px;
  min-width: 0;
}

.calendar-weekdays span {
  min-width: 0;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #6b6b80;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: minmax(64px, auto);
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.calendar-cell {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 64px;
  border: 1px solid #e8e6f0;
  border-radius: 10px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
  background: #fafafd;
  color: #1a1a2e;
  font: inherit;
  text-align: left;
}

button.calendar-cell {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

button.calendar-cell:hover {
  border-color: #a89de0;
  box-shadow: 0 2px 8px rgba(69, 61, 137, 0.12);
}

button.calendar-cell:focus-visible {
  outline: 2px solid #453D89;
  outline-offset: 1px;
}

.calendar-cell.is-selected {
  border-color: #453D89;
  box-shadow: 0 0 0 2px rgba(69, 61, 137, 0.18);
}

.calendar-cell.is-empty {
  border-color: transparent;
  background: transparent;
  pointer-events: none;
}

.calendar-cell strong {
  align-self: flex-start;
  font-size: 13px;
  line-height: 1.1;
  color: #1a1a2e;
}

.calendar-indicators {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  min-width: 0;
  margin-top: auto;
  padding: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
}

.calendar-event-indicator {
  display: inline-block;
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.calendar-event-label {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 4px;
  border-radius: 5px;
  font-size: 8px;
  font-weight: 600;
}

.calendar-cell.is-present {
  background: #ecfdf3;
  border-color: #bbf7d0;
}

.calendar-cell.is-absent {
  background: #fef2f2;
  border-color: #fecaca;
}

.calendar-cell.is-leave {
  background: #fffbeb;
  border-color: #fde68a;
}

.calendar-event-label.event-present {
  color: #166534;
  background: #dcfce7;
}

.calendar-event-label.event-absent {
  color: #991b1b;
  background: #fee2e2;
}

.calendar-event-label.event-leave {
  color: #9a3412;
  background: #ffedd5;
}

.calendar-event-label.event-holiday {
  color: #5b21b6;
  background: #ede9fe;
}

.calendar-event-label.event-tentative-holiday {
  color: #7e22ce;
  background: #faf5ff;
}

.calendar-event-indicator.event-present {
  background: #16a34a;
}

.calendar-event-indicator.event-absent {
  background: #dc2626;
}

.calendar-event-indicator.event-leave {
  background: #d97706;
}

.calendar-event-indicator.event-holiday {
  background: #7c3aed;
}

.calendar-event-indicator.event-tentative-holiday {
  background: #c084fc;
}

.calendar-cell.is-holiday {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.calendar-cell.is-holiday-tentative {
  background: #faf5ff;
  border-color: #e9d5ff;
}

.calendar-holiday-note {
  margin: 10px 0 0;
  font-size: 13px;
  color: #8b8ba7;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 14px;
  font-size: 13px;
  color: #6b6b80;
  min-width: 0;
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.calendar-legend .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.calendar-legend .dot.present {
  background: #16a34a;
}

.calendar-legend .dot.absent {
  background: #dc2626;
}

.calendar-legend .dot.leave {
  background: #d97706;
}

.calendar-legend .dot.none {
  background: #d6d3e4;
}

.calendar-legend .dot.holiday {
  background: #7c3aed;
}

.calendar-legend .dot.holiday-tentative {
  background: #a855f7;
}

.calendar-legend .legend-tentative {
  opacity: 0.85;
}

.calendar-details {
  min-width: 0;
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #e5e1f3;
  border-radius: 12px;
  background: #ffffff;
}

.calendar-details-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar-details-header h3 {
  margin: 0;
  color: #1a1a2e;
  font-size: 15px;
}

.calendar-details-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border: 1px solid #e8e6f0;
  border-radius: 9px;
  color: #453D89;
  background: #f8f7fc;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.calendar-event-list {
  display: grid;
  gap: 10px;
}

.calendar-event-detail {
  min-width: 0;
  padding: 12px;
  border: 1px solid #eeedf4;
  border-radius: 10px;
  background: #fafafd;
}

.calendar-event-type {
  display: inline-flex;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.calendar-event-type.event-present {
  color: #166534;
  background: #dcfce7;
}

.calendar-event-type.event-absent {
  color: #991b1b;
  background: #fee2e2;
}

.calendar-event-type.event-leave {
  color: #9a3412;
  background: #ffedd5;
}

.calendar-event-type.event-holiday {
  color: #5b21b6;
  background: #ede9fe;
}

.calendar-event-type.event-tentative-holiday {
  color: #7e22ce;
  background: #faf5ff;
}

.calendar-event-type.event-none {
  color: #475569;
  background: #f1f5f9;
}

.calendar-event-detail p {
  margin: 8px 0 0;
  color: #44445c;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.calendar-event-detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin: 10px 0 0;
}

.calendar-event-detail dl > div {
  min-width: 0;
}

.calendar-event-detail dt {
  color: #73738a;
  font-size: 10px;
  font-weight: 700;
}

.calendar-event-detail dd {
  margin: 2px 0 0;
  color: #29283f;
  font-size: 12px;
  overflow-wrap: anywhere;
}

/* =====================================================
   LEAVE PANEL
===================================================== */
.leave-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.leave-panel {
  margin-top: 20px;
}

.leave-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(55vh, 480px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #c7cbe0 transparent;
}

.leave-list::-webkit-scrollbar {
  width: 8px;
}

.leave-list::-webkit-scrollbar-track {
  background: transparent;
}

.leave-list::-webkit-scrollbar-thumb {
  background: #c7cbe0;

  border-radius: 999px;
}

.leave-list::-webkit-scrollbar-thumb:hover {
  background: #b0b5d2;
}

.leave-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e8e6f0;
  border-radius: 12px;
  background: #fafafd;
}

.leave-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.leave-main strong {
  font-size: 13px;
  color: #1a1a2e;
}

.leave-main span {
  font-size: 13px;
  color: #6b6b80;
}

.leave-main p {
  font-size: 13px;
  color: #44445c;
  margin: 2px 0 0;
  white-space: pre-wrap;
}

.leave-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.leave-actions {
  display: flex;
  gap: 6px;
}

.leave-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.leave-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.leave-btn.approve {
  background: #ecfdf3;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.leave-btn.approve:hover:not(:disabled) {
  background: #d1fae5;
}

.leave-btn.reject {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.leave-btn.reject:hover:not(:disabled) {
  background: #fee2e2;
}

.empty-small {
  padding: 26px 0;
  text-align: center;
  font-size: 13px;
  color: #6b6b80;
}

/* =====================================================
   LEAVE MODAL
===================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 80;
  backdrop-filter: blur(3px);
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 24px 64px rgba(18, 18, 40, 0.28);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid #f0eef8;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.modal-header p {
  font-size: 13px;
  color: #6b6b80;
  margin: 0;
}

.modal-close {
  width: 30px;
  height: 30px;
  border: 1px solid #e8e6f0;
  border-radius: 8px;
  background: #f8f7fc;
  color: #6b6b80;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #edeafd;
  color: #5b5ce2;
}

.modal-body {
  padding: 16px 22px;
}

.modal-error {
  margin-bottom: 14px;
}

.modal-error strong {
  display: block;
  font-size: 13px;
}

.modal-error p {
  margin: 3px 0 0;
  font-size: 13px;
}

.modal-success {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.modal-field.modal-field-wide {
  grid-column: 1 / -1;
}

.modal-field > span {
  font-size: 13px;
  font-weight: 600;
  color: #6b6b80;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.modal-field input,
.modal-field select,
.modal-field textarea {
  padding: 9px 12px;
  border: 1px solid #e8e6f0;
  border-radius: 10px;
  background: #f8f7fc;
  font-size: 13px;
  color: #1a1a2e;
  font-family: inherit;
  resize: vertical;
}

.modal-field input:focus,
.modal-field select:focus,
.modal-field textarea:focus {
  outline: none;
  border-color: #5b5ce2;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(91, 92, 226, 0.12);
}

.modal-field small {
  font-size: 13px;
  color: #8a8aa0;
}

.field-hint {
  font-size: 13px;
  color: #525252;
  background: #f3f3f3;
  border: 1px solid #c7c7c7;
  border-radius: 8px;
  padding: 9px 11px;
}

.field-error {
  font-size: 13px;
  color: #b52a2a;
  background: #fff0f0;
  border: 1px solid #f0c2c2;
  border-radius: 8px;
  padding: 9px 11px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 20px;
  border-top: 1px solid #f0eef8;
}

/* =========================================================
   TAKE DAILY ATTENDANCE
========================================================= */

.take-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.take-controls .filter-field {
  min-width: 220px;
}

.take-bulk {
  display: flex;
  gap: 8px;
  padding-bottom: 2px;
}

.roster-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.roster-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid #eeecf6;
  border-radius: 12px;
  background: #fbfbfe;
}

.roster-status {
  display: flex;
  gap: 6px;
}

.roster-option {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e4e2f0;
  background: #fff;
  color: #6b6b80;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.roster-option:hover {
  border-color: #c9c6e6;
}

.roster-option.present.active {
  background: #e7f8ef;
  border-color: #22c55e;
  color: #16a34a;
}

.roster-option.absent.active {
  background: #fdecec;
  border-color: #ef4444;
  color: #dc2626;
}

.roster-option.leave.active {
  background: #fef3e2;
  border-color: #f59e0b;
  color: #d97706;
}

.take-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.take-error {
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 640px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .leave-row {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .leave-side {
    align-items: flex-start;
  }

  .leave-panel {
    margin-top: 20px;
  }

  .leave-panel .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .leave-panel .panel-header > .refresh-button {
    width: 100%;
    min-height: 44px;
    justify-content: center;
  }

  .mobile-records,
  .attendance-card-row,
  .mobile-meta > div {
    min-width: 0;
  }

  .mobile-meta strong,
  .leave-main strong,
  .leave-main span,
  .leave-main p {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
    gap: 8px;
  }

  .header-actions .refresh-button {
    flex: 1 1 145px;
    width: auto;
    min-width: 0;
    min-height: 44px;
    padding: 10px 12px;
    white-space: normal;
  }

  .calendar-grid,
  .calendar-weekdays {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px;
  }

  .calendar-grid {
    grid-auto-rows: minmax(54px, auto);
  }

  .calendar-weekdays span {
    font-size: 10px;
  }

  .calendar-cell {
    min-height: 54px;
    padding: 5px 3px;
    border-radius: 8px;
  }

  .calendar-cell strong {
    font-size: 12px;
  }

  .calendar-event-label {
    display: none;
  }

  .calendar-event-indicator {
    flex-basis: 7px;
    width: 7px;
    height: 7px;
  }

  .calendar-panel .panel-header {
    align-items: center;
    gap: 10px;
  }

  .calendar-legend {
    gap: 8px 12px;
    font-size: 12px;
  }

  .calendar-details {
    padding: 12px;
  }

  .calendar-event-detail dl {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .app-shell {
    padding-top: 0;
  }

  .main-content {
    padding-top: 76px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding-top: 72px;
  }
}

.calendar-panel {
  margin-bottom: 24px;
}

.overview-panel {
  margin-top: 24px;
}

.calendar-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 21001;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(24, 24, 39, 0.48);
}

.calendar-details-dialog {
  width: min(620px, 100%);
  max-height: min(80vh, 720px);
  margin: 0;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(24, 24, 39, 0.24);
}

.calendar-event-label.event-class {
  color: #115e59;
  background: #ccfbf1;
}

.calendar-event-indicator.event-class,
.calendar-legend .dot.class-session {
  background: #0f766e;
}

.calendar-event-type.event-class {
  color: #115e59;
  background: #ccfbf1;
}

@media (max-width: 640px) {
  .calendar-modal-backdrop {
    align-items: end;
    padding: 12px;
  }

  .calendar-details-dialog {
    max-height: min(82vh, 720px);
  }
}
</style>
