<template>

  <div class="students-page">

    <Sidebar />

    <main class="main-content">

        <div class="content-wrap">

          <!-- =================================================

               PAGE HEADER

          ================================================== -->

          <section class="page-header">

            <div class="header-left">

              <div class="breadcrumb">

                <span>Education</span>

                <span class="breadcrumb-line">/</span>

                <span class="current">Students</span>

              </div>

              <div class="title-row">

                <div class="title-icon">

                  ♟

                </div>

                <div>

                  <h1>Students</h1>

                  <p>

                    Manage and view student information

                  </p>

                </div>

              </div>

            </div>

            <div class="header-actions">

              <button

                v-if="isStaff"

                class="desk-btn desk-btn-secondary"

                type="button"

                title="Open the Student list in Frappe Desk"

                @click="openDesk(deskListUrl)"

              >

                <span class="desk-btn-icon">

                  ☰

                </span>

                <span>

                  View All Students

                </span>

              </button>

              <button

                v-if="canAddStudent"

                class="desk-btn desk-btn-primary"

                type="button"

                title="Add a new student"

                @click="openAddStudent"

              >

                <span class="desk-btn-icon">

                  +

                </span>

                <span>

                  Add Student

                </span>

              </button>

              <button

                class="refresh-btn"

                :disabled="loading"

                @click="loadStudents"

              >

                <span

                  class="refresh-icon"

                  :class="{ spinning: loading }"

                >

                  ↻

                </span>

                <span>

                  {{ loading ? 'Refreshing...' : 'Refresh' }}

                </span>

              </button>

            </div>

          </section>

          <!-- =================================================

               ERROR

          ================================================== -->

          <div

            v-if="error"

            class="error-box"

          >

            <div class="error-icon">

              !

            </div>

            <div class="error-content">

              <strong>

                Unable to load students

              </strong>

              <p>

                {{ error }}

              </p>

            </div>

            <button

              @click="loadStudents"

              class="retry-btn"

            >

              Retry

            </button>

          </div>

          <!-- =================================================

               SUMMARY CARDS

          ================================================== -->

          <section class="summary-grid">

            <!-- Total -->

            <div class="summary-card total-card">

              <div class="summary-icon blue">

                ♟

              </div>

              <div class="summary-content">

                <span>Total Students</span>

                <strong>

                  {{ students.length }}

                </strong>

                <small>

                  All registered students

                </small>

              </div>

              <div class="summary-decoration blue-decoration"></div>

            </div>

            <!-- Enabled -->

            <div class="summary-card active-card">

              <div class="summary-icon green">

                ✓

              </div>

              <div class="summary-content">

                <span>Enabled Students</span>

                <strong>

                  {{ activeStudents }}

                </strong>

                <small>

                  Currently enabled

                </small>

              </div>

              <div class="summary-decoration green-decoration"></div>

            </div>

            <!-- Disabled -->

            <div class="summary-card disabled-card">

              <div class="summary-icon purple">

                ◎

              </div>

              <div class="summary-content">

                <span>Disabled Students</span>

                <strong>

                  {{ disabledStudents }}

                </strong>

                <small>

                  Currently disabled

                </small>

              </div>

              <div class="summary-decoration purple-decoration"></div>

            </div>

          </section>

          <!-- =================================================

               SEARCH

          ================================================== -->

          <section class="search-card">

            <div class="search-heading">

              <div class="section-title">

                <div class="section-icon">

                  ⌕

                </div>

                <div>

                  <h2>

                    Student Directory

                  </h2>

                  <p>

                    Find students quickly using their details

                  </p>

                </div>

              </div>

              <div class="result-badge">

                <span class="result-dot"></span>

                {{ filteredStudents.length }}

                {{ filteredStudents.length === 1

                  ? 'student'

                  : 'students'

                }}

              </div>

            </div>

            <div class="search-row">

              <div class="search-input-wrap">

                <span class="search-icon">

                  ⌕

                </span>

                <input

                  v-model="search"

                  type="text"

                  placeholder="Search by name, ID, program, year, email, mobile or joining date..."

                  @keyup.enter="searchStudents"

                />

                <button

                  v-if="search"

                  class="clear-btn"

                  @click="search = ''"

                  aria-label="Clear search"

                >

                  ×

                </button>

              </div>

              <button

                class="search-btn"

                @click="searchStudents"

              >

                <span>⌕</span>

                Search

              </button>

            </div>

            <div

              v-if="search"

              class="search-info"

            >

              Searching for:

              <strong>

                "{{ search }}"

              </strong>

              <button @click="search = ''">

                Clear

              </button>

            </div>

          </section>

          <!-- =================================================

               FILTERS

          ================================================== -->

          <section class="filter-panel">

            <div class="filter-header">

              <div class="section-title">

                <div class="section-icon">

                  ⚙

                </div>

                <div>

                  <h2>

                    Filters

                  </h2>

                  <p>

                    Narrow students by branch, division, standard and academics

                  </p>

                </div>

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

              <label

                v-for="field in filterFields"

                :key="field.key"

                class="filter-field"

              >

                <span class="filter-label-row">

                  <span>

                    {{ field.label }}

                  </span>

                  <button

                    v-if="field.slug && masterKnown(field.key)"

                    type="button"

                    class="filter-desk-btn"

                    :title="`Open the ${field.label} list in Frappe Desk`"

                    @click.prevent="openDesk(masterDeskUrl(field))"

                  >

                    ↗

                  </button>

                </span>

                <select

                  v-model="filters[field.key]"

                  :disabled="fieldDisabled(field.key)"

                  :title="fieldNote(field.key)"

                  @change="onFilterChange(field.key, $event.target.value)"

                >

                  <option value="">

                    {{ field.all }}

                  </option>

                  <option

                    v-for="option in optionsFor(field.key)"

                    :key="option.value"

                    :value="option.value"

                  >

                    {{ option.label }}

                  </option>

                </select>

              </label>

            </div>

            <p

              v-if="filterHint"

              class="filter-hint"

            >

              {{ filterHint }}

            </p>

            <div class="filter-footer">

              Showing

              <strong>

                {{ filteredStudents.length }}

              </strong>

              of

              <strong>

                {{ students.length }}

              </strong>

              students

              <span v-if="activeFilterCount">

                · {{ activeFilterCount }}

                {{ activeFilterCount === 1 ? 'filter' : 'filters' }}

                active

              </span>

            </div>

          </section>

          <!-- =================================================

               STUDENT LIST

          ================================================== -->

          <section class="student-card">

            <!-- Table Header -->

            <div class="table-header">

              <div>

                <div class="list-title">

                  <div class="list-icon">

                    ♟

                  </div>

                  <div>

                    <h2>

                      Student List

                    </h2>

                    <p>

                      {{ filteredStudents.length }}

                      {{ filteredStudents.length === 1

                        ? 'student'

                        : 'students'

                      }}

                      found

                    </p>

                  </div>

                </div>

              </div>

              <div class="live-badge">

                <span></span>

                Live data

              </div>

            </div>

            <!-- ===============================================

                 LOADING

            ================================================ -->

            <div

              v-if="loading || groupLoading"

              class="state-box"

            >

              <div class="loading-orbit">

                <div class="loading-ring"></div>

                <div class="loading-dot"></div>

              </div>

              <strong>

                {{ groupLoading ? 'Loading student group' : 'Loading students' }}

              </strong>

              <p>

                {{ groupLoading

                  ? 'Fetching the members of the selected student group...'

                  : 'Fetching the latest student information...'

                }}

              </p>

            </div>

            <!-- ===============================================

                 DESKTOP / TABLET TABLE

            ================================================ -->

            <div

              v-else-if="filteredStudents.length"

              class="table-scroll"

            >

              <table>

                <thead>

                  <tr>

                    <th>

                      Student

                    </th>

                    <th>

                      Status

                    </th>

                    <th>

                      Joining Date

                    </th>

                    <th>

                      Program

                    </th>

                    <th>

                      Academic Year

                    </th>

                    <th>

                      Email

                    </th>

                    <th>

                      Mobile

                    </th>

                    <th>

                      Actions

                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr

                    v-for="student in filteredStudents"

                    :key="student.id"

                  >

                    <!-- Student -->

                    <td>

                      <div class="student-cell">

                        <div

                          class="avatar"

                          :class="avatarClass(student.name)"

                        >

                          {{ initials(student.name) }}

                        </div>

                        <div class="student-info">

                          <p class="student-name">

                            {{ student.name }}

                          </p>

                          <p class="student-id">

                            {{ student.id }}

                          </p>

                        </div>

                      </div>

                    </td>

                    <!-- Status -->

                    <td>

                      <span

                        class="status-pill"

                        :class="

                          student.enabled

                            ? 'status-active'

                            : 'status-disabled'

                        "

                      >

                        <span></span>

                        {{ student.status }}

                      </span>

                    </td>

                    <!-- Joining Date -->

                    <td>

                      <span

                        v-if="student.joiningDate"

                      >

                        {{ formatDate(student.joiningDate) }}

                      </span>

                      <span

                        v-else

                        class="muted-value"

                      >

                        —

                      </span>

                    </td>

                    <!-- Program -->

                    <td>

                      <div class="program-cell">

                        <span class="program-dot"></span>

                        <span>

                          {{ student.program || '—' }}

                        </span>

                      </div>

                    </td>

                    <!-- Academic Year -->

                    <td>

                      <span

                        v-if="student.year"

                        class="year-pill"

                      >

                        {{ student.year }}

                      </span>

                      <span

                        v-else

                        class="muted-value"

                      >

                        —

                      </span>

                    </td>

                    <!-- Email -->

                    <td>

                      <a

                        v-if="student.email"

                        :href="`mailto:${student.email}`"

                        class="email-link"

                      >

                        {{ student.email }}

                      </a>

                      <span

                        v-else

                        class="muted-value"

                      >

                        —

                      </span>

                    </td>

                    <!-- Mobile -->

                    <td>

                      <a

                        v-if="student.mobile"

                        :href="`tel:${student.mobile}`"

                        class="phone-link"

                      >

                        {{ student.mobile }}

                      </a>

                      <span

                        v-else

                        class="muted-value"

                      >

                        —

                      </span>

                    </td>

                    <!-- Actions -->

                    <td>

                      <!-- Desk is read-only for instructors, so these
                           shortcuts are only offered to staff. -->

                      <div v-if="isStaff" class="row-actions">

                        <button

                          v-for="action in studentFieldActions"

                          :key="action.fieldname"

                          class="field-action-btn"

                          type="button"

                          :title="`Open ${action.label} (${action.fieldname}) in Frappe Desk`"

                          @click="openStudentField(student)"

                        >

                          {{ action.label }}

                        </button>

                      </div>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            <!-- ===============================================

                 MOBILE STUDENT CARDS

            ================================================ -->

            <div

              v-if="!loading && !groupLoading && filteredStudents.length"

              class="mobile-student-list"

            >

              <article

                v-for="student in filteredStudents"

                :key="`mobile-${student.id}`"

                class="mobile-student-card"

              >

                <div class="mobile-student-top">

                  <div

                    class="avatar large"

                    :class="avatarClass(student.name)"

                  >

                    {{ initials(student.name) }}

                  </div>

                  <div class="mobile-student-main">

                    <h3>

                      {{ student.name }}

                    </h3>

                    <p>

                      {{ student.id }}

                    </p>

                  </div>

                  <span

                    class="status-pill"

                    :class="

                      student.enabled

                        ? 'status-active'

                        : 'status-disabled'

                    "

                  >

                    <span></span>

                    {{ student.status }}

                  </span>

                </div>

                <div class="mobile-student-details">

                  <div class="detail-item">

                    <span class="detail-label">

                      PROGRAM

                    </span>

                    <span class="detail-value">

                      {{ student.program || '—' }}

                    </span>

                  </div>

                  <div class="detail-item">

                    <span class="detail-label">

                      ACADEMIC YEAR

                    </span>

                    <span class="detail-value">

                      {{ student.year || '—' }}

                    </span>

                  </div>

                  <div class="detail-item">

                    <span class="detail-label">

                      JOINING DATE

                    </span>

                    <span class="detail-value">

                      {{ formatDate(student.joiningDate) || '—' }}

                    </span>

                  </div>

                  <div class="detail-item">

                    <span class="detail-label">

                      MOBILE

                    </span>

                    <span class="detail-value">

                      {{ student.mobile || '—' }}

                    </span>

                  </div>

                  <div class="detail-item email-detail">

                    <span class="detail-label">

                      EMAIL

                    </span>

                    <a

                      v-if="student.email"

                      :href="`mailto:${student.email}`"

                      class="detail-value email-link"

                    >

                      {{ student.email }}

                    </a>

                    <span

                      v-else

                      class="detail-value"

                    >

                      —

                    </span>

                  </div>

                </div>

                <div v-if="isStaff" class="mobile-student-actions">

                  <span class="detail-label">

                    DESK ACTIONS

                  </span>

                  <div class="row-actions">

                    <button

                      v-for="action in studentFieldActions"

                      :key="`mobile-${action.fieldname}`"

                      class="field-action-btn"

                      type="button"

                      :title="`Open ${action.label} (${action.fieldname}) in Frappe Desk`"

                      @click="openStudentField(student)"

                    >

                      {{ action.label }}

                    </button>

                  </div>

                </div>

              </article>

            </div>

            <!-- ===============================================

                 EMPTY

            ================================================ -->

            <div

              v-if="!loading && !groupLoading && !filteredStudents.length"

              class="empty-state"

            >

              <div class="empty-icon">

                ⌕

              </div>

              <h3>

                No students found

              </h3>

              <p>

                We couldn't find any students matching your search and filters.

              </p>

              <button

                v-if="search || hasActiveFilters"

                @click="clearSearchAndFilters"

              >

                {{ search && hasActiveFilters

                  ? 'Clear Search & Filters'

                  : search

                    ? 'Clear Search'

                    : 'Clear Filters'

                }}

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

              Student Directory

            </span>

            <span class="footer-version">

              v1.0

            </span>

          </footer>

        </div>

      </main>

      <!-- =================================================
           ADD STUDENT MODAL
      ================================================== -->
      <div

        v-if="addStudentOpen"

        class="modal-backdrop"

        @click.self="closeAddStudent"

      >

        <div

          class="modal-card"

          role="dialog"

          aria-modal="true"

          aria-label="Add student"

        >

          <div class="modal-header">

            <div>

              <h2>Add Student</h2>

              <p>
                Creates a real Student record (and an optional
                Program Enrollment) on the backend.
              </p>

            </div>

            <button

              class="modal-close"

              type="button"

              title="Close"

              @click="closeAddStudent"

            >

              ✕

            </button>

          </div>

          <div class="modal-body">

            <div

              v-if="addStudentError"

              class="error-box modal-error"

            >

              <div class="error-icon">

                !

              </div>

              <div class="error-content">

                <strong>

                  Unable to add student

                </strong>

                <p>

                  {{ addStudentError }}

                </p>

              </div>

            </div>

            <div

              v-if="addStudentSuccess"

              class="modal-success"

            >

              ✓ {{ addStudentSuccess }}

            </div>

            <section class="modal-section">

              <h3>

                Student details

              </h3>

              <p class="modal-hint">

                First Name and Student Email Address are required.
              </p>

              <div class="modal-grid">

                <label class="modal-field">

                  <span>

                    First Name *

                  </span>

                  <input

                    v-model.trim="newStudent.first_name"

                    type="text"

                    placeholder="First name"

                  />

                </label>

                <label class="modal-field">

                  <span>

                    Last Name

                  </span>

                  <input

                    v-model.trim="newStudent.last_name"

                    type="text"

                    placeholder="Last name"

                  />

                </label>

                <label class="modal-field modal-field-wide">

                  <span>

                    Student Email Address *

                  </span>

                  <input

                    v-model.trim="newStudent.student_email_id"

                    type="email"

                    placeholder="student@example.com"

                  />

                </label>

                <label class="modal-field">

                  <span>

                    Student Mobile Number

                  </span>

                  <input

                    v-model.trim="newStudent.student_mobile_number"

                    type="tel"

                    placeholder="9000000000"

                  />

                </label>

                <label class="modal-field">

                  <span>

                    Gender

                  </span>

                  <select v-model="newStudent.gender">

                    <option value="">

                      Select gender

                    </option>

                    <option value="Male">

                      Male

                    </option>

                    <option value="Female">

                      Female

                    </option>

                    <option value="Other">

                      Other

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Date of Birth

                  </span>

                  <input

                    v-model="newStudent.date_of_birth"

                    type="date"

                  />

                </label>

                <label class="modal-field">

                  <span>

                    Joining Date

                  </span>

                  <input

                    v-model="newStudent.joining_date"

                    type="date"

                  />

                </label>

              </div>

            </section>

            <section class="modal-section">

              <h3>

                Academic details

              </h3>

              <p class="modal-hint">

                Optional — a Program Enrollment is created when both
                Program and Academic Year are provided.
              </p>

              <div class="modal-grid">

                <label class="modal-field">

                  <span>

                    Branch

                  </span>

                  <select v-model="newStudent.branch">

                    <option value="">

                      Select branch

                    </option>

                    <option

                      v-for="option in newStudentMasters.branch"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Standard

                  </span>

                  <select v-model="newStudent.standard">

                    <option value="">

                      Select standard

                    </option>

                    <option

                      v-for="option in newStudentMasters.standard"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Division

                  </span>

                  <select v-model="newStudent.division">

                    <option value="">

                      Select division

                    </option>

                    <option

                      v-for="option in newStudentMasters.division"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Program

                  </span>

                  <select v-model="newStudent.program">

                    <option value="">

                      Select program

                    </option>

                    <option

                      v-for="option in newStudentMasters.program"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Academic Year

                  </span>

                  <select v-model="newStudent.academic_year">

                    <option value="">

                      Select academic year

                    </option>

                    <option

                      v-for="option in newStudentMasters.year"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Academic Term

                  </span>

                  <select v-model="newStudent.academic_term">

                    <option value="">

                      Select academic term

                    </option>

                    <option

                      v-for="option in newStudentMasters.term"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                </label>

                <label class="modal-field">

                  <span>

                    Student Group

                  </span>

                  <select v-model="newStudent.student_group">

                    <option value="">

                      No group (optional)

                    </option>

                    <option

                      v-for="option in newStudentMasters.group"

                      :key="option"

                      :value="option"

                    >

                      {{ option }}

                    </option>

                  </select>

                  <small class="modal-hint">

                    Adds the student to this group so they can apply for
                    leave and be marked present.
                  </small>

                </label>

              </div>

            </section>

            <section class="modal-section">

              <div class="modal-section-head">

                <div>

                  <h3>

                    Guardians

                  </h3>

                  <p class="modal-hint">

                    Each row creates a real Guardian record linked to
                    the student.
                  </p>

                </div>

                <button

                  class="modal-link-btn"

                  type="button"

                  @click="addGuardianRow"

                >

                  + Add guardian

                </button>

              </div>

              <div

                v-for="(guardian, index) in newGuardians"

                :key="index"

                class="guardian-row"

              >

                <input

                  v-model.trim="guardian.guardian_name"

                  type="text"

                  placeholder="Guardian name"

                />

                <select v-model="guardian.relation">

                  <option value="">

                    Relation

                  </option>

                  <option

                    v-for="relation in guardianRelations"

                    :key="relation"

                    :value="relation"

                  >

                    {{ relation }}

                  </option>

                </select>

                <input

                  v-model.trim="guardian.mobile_number"

                  type="tel"

                  placeholder="Mobile number"

                />

                <button

                  class="guardian-remove"

                  type="button"

                  title="Remove guardian"

                  :disabled="newGuardians.length === 1"

                  @click="removeGuardianRow(index)"

                >

                  ✕

                </button>

              </div>

            </section>

          </div>

          <div class="modal-footer">

            <button

              class="desk-btn desk-btn-secondary"

              type="button"

              :disabled="addStudentSaving"

              @click="closeAddStudent"

            >

              Cancel

            </button>

            <button

              class="desk-btn desk-btn-primary"

              type="button"

              :disabled="addStudentSaving"

              @click="submitNewStudent"

            >

              {{ addStudentSaving ? 'Adding…' : 'Add Student' }}

            </button>

          </div>

        </div>

      </div>

  </div>

</template>


<script>

import Sidebar from '@/components/Sidebar.vue'
import { getContext, isInstructorUser, isStaffUser, isStudentUser } from '@/lib/context'
import { apiPost, extractMessage } from '@/lib/api'

export default {

  name: 'Students',

  components: {
    Sidebar,
  },

  data() {

    return {

      search: '',

      students: [],

      loading: true,

      error: null,

      deskBaseUrl: window.location.origin,

      filters: {

        branch: '',

        division: '',

        standard: '',

        year: '',

        term: '',

        program: '',

        batch: '',

        group: '',

        category: '',

        status: '',

      },

      filterFields: [

        {

          key: 'branch',

          label: 'Branch',

          all: 'All Branches',

          doctype: 'Branch',

          slug: 'branch',

        },

        {

          key: 'division',

          label: 'Division',

          all: 'All Divisions',

          doctype: 'Division',

          slug: 'division',

        },

        {

          key: 'standard',

          label: 'Standard',

          all: 'All Standards',

          doctype: 'Standard',

          slug: 'standard',

        },

        {

          key: 'year',

          label: 'Academic Year',

          all: 'All Academic Years',

          doctype: 'Academic Year',

          slug: 'academic-year',

        },

        {

          key: 'term',

          label: 'Academic Term',

          all: 'All Academic Terms',

          doctype: 'Academic Term',

          slug: 'academic-term',

        },

        {

          key: 'program',

          label: 'Program',

          all: 'All Programs',

          doctype: 'Program',

          slug: 'program',

        },

        {

          key: 'batch',

          label: 'Student Batch',

          all: 'All Batches',

          doctype: 'Student Batch Name',

          slug: 'student-batch-name',

        },

        {

          key: 'group',

          label: 'Student Group',

          all: 'All Student Groups',

          doctype: 'Student Group',

          slug: 'student-group',

        },

        {

          key: 'category',

          label: 'Student Category',

          all: 'All Categories',

          doctype: 'Student Category',

          slug: 'student-category',

        },

        {

          key: 'status',

          label: 'Status',

          all: 'All Statuses',

          doctype: '',

          slug: '',

        },

      ],

      masters: {

        branch: { known: null, readable: false, options: [] },

        division: { known: null, readable: false, options: [] },

        standard: { known: null, readable: false, options: [] },

        year: { known: null, readable: false, options: [] },

        term: { known: null, readable: false, options: [] },

        program: { known: null, readable: false, options: [] },

        batch: { known: null, readable: false, options: [] },

        group: { known: null, readable: false, options: [] },

        category: { known: null, readable: false, options: [] },

      },

      groupMembers: {},

      groupLoading: false,

      groupBlocked: false,

      groupNote: '',

      context: null,

      addStudentOpen: false,

      addStudentSaving: false,

      addStudentError: null,

      addStudentSuccess: null,

      guardianRelations: [
        'Father',
        'Mother',
        'Guardian',
        'Spouse',
        'Other',
      ],

      newStudent: {

        first_name: '',

        last_name: '',

        student_email_id: '',

        student_mobile_number: '',

        gender: '',

        date_of_birth: '',

        joining_date: '',

        branch: '',

        standard: '',

        division: '',

        program: '',

        academic_year: '',

        academic_term: '',

        student_group: '',

      },

      newGuardians: [

        {
          guardian_name: '',
          relation: '',
          mobile_number: '',
        },

      ],

      newStudentMasters: {

        branch: [],

        standard: [],

        division: [],

        program: [],

        year: [],

        term: [],

        group: [],

      },

      studentFieldsWithCustom: null,

      studentFieldActions: [

        {

          label: 'Enabled',

          fieldname: 'enabled',

        },

        {

          label: 'Student Email Address',

          fieldname: 'student_email_id',

        },

        {

          label: 'Student Mobile Number',

          fieldname: 'student_mobile_number',

        },

        {

          label: 'Date of Birth',

          fieldname: 'date_of_birth',

        },

        {

          label: 'Guardians',

          fieldname: 'guardians',

        },

      ],

    }

  },

  computed: {

    deskListUrl() {

      return `${this.deskBaseUrl}/desk/student`

    },

    deskNewUrl() {

      return `${this.deskBaseUrl}/desk/student/new`

    },

    isStaff() {

      return isStaffUser(this.context)

    },

    isStudent() {

      return isStudentUser(this.context)

    },

    isInstructor() {

      return isInstructorUser(this.context)

    },

    canAddStudent() {

      return this.isStaff && !this.isInstructor

    },

    filteredStudents() {

      const query =

        this.search

          .toLowerCase()

          .trim()

      const filters = this.filters

      const members = filters.group

        ? this.groupMembers[filters.group]

        : null

      if (filters.group && !members) {

        return []

      }

      const filterKeys = [

        'branch',

        'division',

        'standard',

        'year',

        'term',

        'program',

        'batch',

        'category',

        'status',

      ]

      return this.students.filter((student) => {

        if (query) {

          const searchable = [

            student.name,

            student.id,

            student.program,

            student.year,

            student.email,

            student.status,

            student.joiningDate,

            this.formatDate(student.joiningDate),

            student.mobile,

          ]

            .join(' ')

            .toLowerCase()

          if (!searchable.includes(query)) {

            return false

          }

        }

        for (const key of filterKeys) {

          if (filters[key] && student[key] !== filters[key]) {

            return false

          }

        }

        if (

          filters.group &&

          !members.includes(student.id)

        ) {

          return false

        }

        return true

      })

    },

    hasActiveFilters() {

      return Object.values(this.filters).some(

        (value) => value !== ''

      )

    },

    activeFilterCount() {

      return Object.values(this.filters).filter(

        (value) => value !== ''

      ).length

    },

    filterHint() {

      const parts = []

      if (this.groupNote) {

        parts.push(this.groupNote)

      }

      const missing = this.filterFields

        .filter(

          (field) =>

            field.doctype &&

            this.masters[field.key] &&

            this.masters[field.key].known === false

        )

        .map((field) => field.doctype)

      if (missing.length) {

        const singular = missing.length === 1

        parts.push(

          `${missing.join(', ')} ${singular ? 'is' : 'are'} not available in this Frappe site yet — add ${singular ? 'that master' : 'those masters'} with matching Student fields and ${singular ? 'this filter' : 'these filters'} will activate automatically.`

        )

      }

      return parts.join(' ')

    },

    activeStudents() {

      return this.students.filter(

        (student) =>

          student.enabled

      ).length

    },

    disabledStudents() {

      return this.students.filter(

        (student) =>

          !student.enabled

      ).length

    },

  },

  mounted() {

    this.loadContext()

    this.loadStudents()

    this.loadMasters()

  },

  methods: {

    async loadContext() {

      try {

        this.context = await getContext()

        if (this.isStaff) {

          this.loadNewStudentMasters()

        }

      } catch (error) {

        console.warn('Context API error:', error)

      }

    },

    async fetchMasterOptions(doctype) {

      const fields = encodeURIComponent(JSON.stringify(['name']))

      const response = await fetch(

        `/api/resource/${encodeURIComponent(doctype)}?fields=${fields}&limit_page_length=200&order_by=name%20asc`

      )

      if (!response.ok) {

        return []

      }

      const body = await response.json().catch(() => ({}))

      if (!Array.isArray(body.data)) {

        return []

      }

      return body.data.map(row => row.name).filter(Boolean)

    },

    async loadNewStudentMasters() {

      const map = {

        branch: 'Branch',

        standard: 'Standard',

        division: 'Division',

        program: 'Program',

        year: 'Academic Year',

        term: 'Academic Term',

        group: 'Student Group',

      }

      const entries = await Promise.all(

        Object.entries(map).map(async ([key, doctype]) => [

          key,

          await this.fetchMasterOptions(doctype).catch(() => []),

        ])

      )

      const next = { ...this.newStudentMasters }

      entries.forEach(([key, options]) => {

        next[key] = options

      })

      this.newStudentMasters = next

    },

    openAddStudent() {

      if (!this.isStaff) {

        return

      }

      this.addStudentError = null

      this.addStudentSuccess = null

      this.addStudentOpen = true

      if (!this.newStudentMasters.branch.length) {

        this.loadNewStudentMasters()

      }

    },

    closeAddStudent() {

      if (this.addStudentSaving) {

        return

      }

      this.addStudentOpen = false

      this.addStudentError = null

    },

    addGuardianRow() {

      this.newGuardians.push({

        guardian_name: '',

        relation: '',

        mobile_number: '',

      })

    },

    removeGuardianRow(index) {

      if (this.newGuardians.length <= 1) {

        return

      }

      this.newGuardians.splice(index, 1)

    },

    validateNewStudent() {

      if (!this.newStudent.first_name) {

        return 'First Name is required.'

      }

      const email = this.newStudent.student_email_id

      if (!email) {

        return 'Student Email Address is required.'

      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        return 'Please enter a valid Student Email Address.'

      }

      return null

    },

    async submitNewStudent() {

      this.addStudentError = null

      this.addStudentSuccess = null

      const validationError = this.validateNewStudent()

      if (validationError) {

        this.addStudentError = validationError

        return

      }

      const guardians = this.newGuardians

        .map(row => ({

          guardian_name: (row.guardian_name || '').trim(),

          relation: row.relation || '',

          mobile_number: (row.mobile_number || '').trim(),

        }))

        .filter(row => row.guardian_name)

      const payload = {

        ...this.newStudent,

        guardians,

      }

      this.addStudentSaving = true

      try {

        const message = await apiPost(

          '/api/method/backend_custom_app.api.students.create_student',

          { payload }

        )

        this.addStudentSuccess =

          message?.message ||

          `${message?.student_name || 'Student'} was added successfully.`

        this.resetNewStudent()

        await this.loadStudents()

      } catch (error) {

        this.addStudentError = extractMessage(error.body) || error.message

      } finally {

        this.addStudentSaving = false

      }

    },

    resetNewStudent() {

      Object.keys(this.newStudent).forEach((key) => {

        this.newStudent[key] = ''

      })

      this.newGuardians = [

        {

          guardian_name: '',

          relation: '',

          mobile_number: '',

        },

      ]

    },

    async loadStudents() {

      this.loading = true

      this.error = null

      const baseStudentFields = [

        'name',

        'student_name',

        'enabled',

        'joining_date',

        'student_email_id',

        'student_mobile_number',

        'date_of_birth',

        'gender',

        'student_applicant',

        'user',

        'modified',

      ]

      const customStudentFields = [

        'branch',

        'division',

        'standard',

      ]

      const fetchStudentRecords = async (fields) => {

        const fieldsParam = encodeURIComponent(

          JSON.stringify(fields)

        )

        const response = await fetch(

          `/api/resource/Student?fields=${fieldsParam}&order_by=modified%20desc&limit_page_length=500`

        )

        const body = await response.json().catch(() => ({}))

        if (!response.ok) {

          const error = new Error(

            body.exc_type ||

            body.exception ||

            `Student API request failed (${response.status})`

          )

          error.status = response.status

          throw error

        }

        return Array.isArray(body.data) ? body.data : null

      }

      const deskRecords = (async () => {

        if (this.studentFieldsWithCustom !== false) {

          try {

            const records = await fetchStudentRecords([

              ...baseStudentFields,

              ...customStudentFields,

            ])

            this.studentFieldsWithCustom = true

            return records

          } catch (error) {

            if (error.status !== 417) {

              throw error

            }

            // Custom Student fields (branch / division / standard) are not

            // added on this site yet -> retry with the core fields only.

            this.studentFieldsWithCustom = false

          }

        }

        return fetchStudentRecords(baseStudentFields)

      })()

        .catch((error) => {

          console.warn('Student REST API error:', error)

          return null

        })

      const summaries = fetch(

        '/api/method/backend_custom_app.api.education.get_students'

      )

        .then(async (response) => {

          const body = await response.json()

          if (!response.ok) {

            throw new Error(

              body.exception ||

              'Students API request failed'

            )

          }

          if (!Array.isArray(body.message)) {

            throw new Error('Invalid students response')

          }

          return body.message

        })

        .catch((error) => {

          console.error('Students API error:', error)

          return null

        })

      const enrollmentFields = [

        'student',

        'program',

        'academic_year',

        'academic_term',

        'student_batch_name',

        'student_category',

      ]

      const enrollments = fetch(

        `/api/resource/Program%20Enrollment?fields=${encodeURIComponent(

          JSON.stringify(enrollmentFields)

        )}&order_by=creation%20desc&limit_page_length=500`

      )

        .then(async (response) => {

          const body = await response.json()

          if (!response.ok) {

            throw new Error(

              body.exc_type ||

              body.exception ||

              `Program Enrollment API request failed (${response.status})`

            )

          }

          return Array.isArray(body.data) ? body.data : null

        })

        .catch((error) => {

          console.warn('Program Enrollment API error:', error)

          return null

        })

      try {

        const [records, summaryList, enrollmentList] = await Promise.all([

          deskRecords,

          summaries,

          enrollments,

        ])

        if (records) {

          const summaryById = Object.fromEntries(

            (summaryList || []).map((summary) => [

              summary.id,

              summary,

            ])

          )

          const enrollmentByStudent = {}

          for (const enrollment of enrollmentList || []) {

            if (

              enrollment.student &&

              !enrollmentByStudent[enrollment.student]

            ) {

              enrollmentByStudent[enrollment.student] = enrollment

            }

          }

          this.students = records.map((record) => {

            const summary = summaryById[record.name] || {}

            const enrollment = enrollmentByStudent[record.name] || {}

            const enabled =

              record.enabled === 1 ||

              record.enabled === '1' ||

              record.enabled === true

            return {

              id: record.name,

              name:

                record.student_name ||

                summary.name ||

                record.name,

              program:

                enrollment.program ||

                summary.program ||

                '',

              year:

                enrollment.academic_year ||

                summary.year ||

                '',

              term: enrollment.academic_term || '',

              batch: enrollment.student_batch_name || '',

              category: enrollment.student_category || '',

              branch: record.branch || '',

              division: record.division || '',

              standard: record.standard || '',

              email:

                record.student_email_id ||

                summary.email || '',

              status: enabled ? 'Enabled' : 'Disabled',

              enabled: enabled,

              joiningDate: record.joining_date || '',

              mobile: record.student_mobile_number || '',

              dob: record.date_of_birth || '',

              gender: record.gender || '',

              applicant: record.student_applicant || '',

              user: record.user || '',

              modified: record.modified || '',

            }

          })

        } else if (summaryList) {

          this.students = summaryList.map((summary) => {

            const enabled = summary.status === 'Active'

            return {

              id: summary.id,

              name: summary.name,

              program: summary.program || '',

              year: summary.year || '',

              term: '',

              batch: '',

              category: '',

              branch: summary.branch || '',

              division: summary.division || '',

              standard: summary.standard || '',

              email: summary.email || '',

              status: enabled ? 'Enabled' : 'Disabled',

              enabled: enabled,

              joiningDate: '',

              mobile: '',

              dob: '',

              gender: '',

              applicant: '',

              user: '',

              modified: '',

            }

          })

        } else {

          throw new Error('Student data could not be loaded')

        }

      } catch (error) {

        console.error(

          'Students API error:',

          error

        )

        this.error =

          'Unable to load student data.'

      } finally {

        this.loading = false

      }

    },

    async loadMasters() {

      const masterFields = this.filterFields.filter(

        (field) =>

          field.doctype &&

          field.key !== 'group'

      )

      await Promise.all(

        masterFields.map(async (field) => {

          const master = {

            known: false,

            readable: false,

            options: [],

          }

          try {

            const fieldsParam = encodeURIComponent(

              JSON.stringify(['name'])

            )

            const response = await fetch(

              `/api/resource/${encodeURIComponent(

                field.doctype

              )}?fields=${fieldsParam}&order_by=name%20asc&limit_page_length=500`

            )

            const body = await response.json().catch(() => ({}))

            if (response.ok && Array.isArray(body.data)) {

              master.known = true

              master.readable = true

              master.options = body.data

                .map((row) => row.name)

                .filter(Boolean)

                .map((name) => ({ value: name, label: name }))

            } else {

              const message = `${

                body.exception || ''

              } ${body.message || ''}`

              master.known = /Insufficient Permission for/.test(

                message

              )

            }

          } catch (error) {

            console.warn(

              `Master list failed (${field.doctype}):`,

              error

            )

            master.known = false

          }

          this.masters[field.key] = master

        })

      )

      await this.loadGroupOptions()

    },

    async loadGroupOptions() {

      try {

        const response = await fetch(

          '/api/method/backend_custom_app.api.education.get_student_groups'

        )

        const body = await response.json().catch(() => ({}))

        const groups =

          body &&

          body.message &&

          Array.isArray(body.message.student_groups)

            ? body.message.student_groups

            : null

        if (!response.ok || !groups) {

          throw new Error(

            body.exception ||

            body.message ||

            'Student group list failed'

          )

        }

        this.masters.group = {

          known: true,

          readable: true,

          options: groups

            .map((group) => ({

              value: group.id || group.name || '',

              label: group.name || group.id || '',

            }))

            .filter((option) => option.value),

        }

      } catch (error) {

        console.warn(

          'Student group options failed:',

          error

        )

        this.masters.group = {

          known: false,

          readable: false,

          options: [],

        }

      }

    },

    optionsFor(key) {

      const options = new Map()

      const master = this.masters[key]

      if (master) {

        master.options.forEach((option) =>

          options.set(option.value, option.label)

        )

      }

      if (key === 'status') {

        if (this.students.length) {

          options.set('Enabled', 'Enabled')

          options.set('Disabled', 'Disabled')

        }

      } else {

        this.students.forEach((student) => {

          const value = String(student[key] || '').trim()

          if (value && !options.has(value)) {

            options.set(value, value)

          }

        })

      }

      return [...options.entries()]

        .map(([value, label]) => ({ value, label }))

        .sort((a, b) => a.label.localeCompare(b.label))

    },

    fieldByKey(key) {

      return (

        this.filterFields.find(

          (field) => field.key === key

        ) || {}

      )

    },

    masterKnown(key) {

      const master = this.masters[key]

      return Boolean(master && master.known === true)

    },

    masterDeskUrl(field) {

      return `${this.deskBaseUrl}/desk/${field.slug}`

    },

    fieldDisabled(key) {

      if (key === 'group') {

        return (

          this.groupBlocked ||

          !this.optionsFor('group').length

        )

      }

      return this.optionsFor(key).length === 0

    },

    fieldNote(key) {

      const field = this.fieldByKey(key)

      if (!field.doctype) {

        return `Filter students by ${

          field.label.toLowerCase()

        }`

      }

      if (!this.fieldDisabled(key)) {

        return `Filter students by ${field.label}`

      }

      if (key === 'group' && this.groupBlocked) {

        return (

          this.groupNote ||

          'Student Group filtering is not available for your role.'

        )

      }

      const master = this.masters[key]

      if (!master || master.known === false) {

        return `The ${

          field.doctype

        } master is not available in this site yet`

      }

      if (master.known === true && !master.readable) {

        return `Your role cannot read ${

          field.doctype

        } records`

      }

      return `No ${field.label} records yet`

    },

    onFilterChange(key, value) {

      this.filters[key] = value

      if (key === 'group') {

        // A previous group may have failed to load; let the user try
        // another one instead of leaving the dropdown switched off.
        this.groupBlocked = false

        this.groupNote = ''

        this.ensureGroupMembers(value)

      }

    },

    async ensureGroupMembers(groupName) {

      if (

        !groupName ||

        this.groupMembers[groupName] ||

        this.groupBlocked

      ) {

        return

      }

      this.groupLoading = true

      try {

        const response = await fetch(

          `/api/resource/Student Group/${encodeURIComponent(

            groupName

          )}`

        )

        const body = await response.json().catch(() => ({}))

        if (!response.ok || !body.data) {

          throw new Error(

            body.exception ||

            body.message ||

            `Student group request failed (${response.status})`

          )

        }

        const rows = Array.isArray(body.data.students)

          ? body.data.students

          : []

        this.groupMembers = {

          ...this.groupMembers,

          [groupName]: rows

            .map((row) => row.student)

            .filter(Boolean),

        }

      } catch (error) {

        console.warn(

          'Student group members unavailable:',

          error

        )

        // Only this selection failed. Clear it and explain, but keep
        // the dropdown usable - latching groupBlocked here used to
        // disable Student Group filtering for the rest of the session.
        this.groupNote =

          'That student group could not be loaded for your account.'

        this.filters.group = ''

      } finally {

        this.groupLoading = false

      }

    },

    clearFilters() {

      Object.keys(this.filters).forEach((key) => {

        this.filters[key] = ''

      })

    },

    clearSearchAndFilters() {

      this.search = ''

      this.clearFilters()

    },

    searchStudents() {

      this.search =

        this.search.trim()

    },

    openDesk(url) {

      window.location.href = url

    },

    studentDeskUrl(student) {

      if (!student || !student.id) {

        return this.deskListUrl

      }

      return `${this.deskBaseUrl}/desk/student/${encodeURIComponent(

        student.id

      )}`

    },

    openStudentField(student) {

      this.openDesk(this.studentDeskUrl(student))

    },

    formatDate(value) {

      if (!value) {

        return ''

      }

      const parts =

        /^(\d{4})-(\d{2})-(\d{2})/

          .exec(String(value))

      if (!parts) {

        return value

      }

      return `${parts[3]}-${parts[2]}-${parts[1]}`

    },

    initials(name) {

      if (!name) {

        return 'S'

      }

      return name

        .split(' ')

        .filter(Boolean)

        .slice(0, 2)

        .map(

          (part) =>

            part

              .charAt(0)

              .toUpperCase()

        )

        .join('')

    },

    avatarClass(name) {

      if (!name) {

        return 'avatar-blue'

      }

      const first =

        name

          .charCodeAt(0)

      const variants = [

        'avatar-blue',

        'avatar-cyan',

        'avatar-indigo',

        'avatar-violet',

        'avatar-teal',

      ]

      return variants[

        first % variants.length

      ]

    },

  },

}

</script>


<style scoped>

/* =========================================================

   GLOBAL PAGE

========================================================= */

.students-page {

  min-height: 100vh;

  background:

    radial-gradient(

      circle at 70% 0%,

      rgba(69, 61, 137, 0.08),

      transparent 28%

    ),

    radial-gradient(

      circle at 20% 70%,

      rgba(200, 73, 154, 0.045),

      transparent 25%

    ),

    #f5f8fc;

  color: #1E1B33;

}

/* =========================================================

   APP

========================================================= */

.app-shell {

  min-height: 100vh;

}

/* =========================================================

   SIDEBAR

========================================================= */

.main-content {
  min-height: 100vh;
  margin-left: 255px;
}

.content-wrap {

  width: min(

    100%,

    1240px

  );

  margin: 0 auto;

  padding:

    29px 32px 40px;

}

/* =========================================================

   HEADER

========================================================= */

.page-header {

  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 24px;

  margin-bottom: 25px;

}

.breadcrumb{

  display: flex;

  align-items: center;

  gap: 9px;

  margin-bottom: 9px;

  color: #8b9bb0;

  font-size: 11px;

}

.breadcrumb-line {

  color: #c5cfda;

}

.breadcrumb .current {

  color: #4c6280;

  font-weight: 600;

}

.title-row {

  display: flex;

  align-items: center;

  gap: 13px;

}

.title-icon {

  width: 45px;

  height: 45px;

  display: grid;

  place-items: center;

  border-radius: 13px;

  color: #0369a1;

  background:

    linear-gradient(

      135deg,

      #e0f7ff,

      #eaf2ff

    );

  box-shadow:

    inset 0 0 0 1px

    rgba(200, 73, 154, 0.08);

  font-size: 19px;

}

.page-header h1{

  margin: 0;

  color: #0b1930;

  font-size: 30px;

  line-height: 1.1;

  font-weight: 800;

  letter-spacing: -0.035em;

}

.page-header p {

  margin:

    6px 0 0;

  color: #718198;

  font-size: 13px;

}

.refresh-btn{

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  min-width: 112px;

  height: 42px;

  padding:

    0 16px;

  border: 0;

  border-radius: 10px;

  color: #fff;

  background:

    linear-gradient(

      135deg,

      #C8499A,

      #453D89

    );

  box-shadow:

    0 9px 22px

    rgba(69, 61, 137, 0.2);

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition:

    transform 0.2s ease,

    box-shadow 0.2s ease;

}

.refresh-btn:hover:not(:disabled) {

  transform:

    translateY(-2px);

  box-shadow:

    0 13px 27px

    rgba(69, 61, 137, 0.27);

}

.refresh-btn:disabled {

  opacity: 0.65;

  cursor: not-allowed;

}

.refresh-icon{

  display: inline-block;

  font-size: 17px;

}

.refresh-icon.spinning {

  animation:

    spin 0.8s linear infinite;

}

/* =========================================================

   ERROR

========================================================= */

.error-box {

  display: flex;

  align-items: center;

  gap: 13px;

  margin-bottom: 19px;

  padding:

    14px 16px;

  border:

    1px solid #fecaca;

  border-radius: 13px;

  background:

    linear-gradient(

      135deg,

      #fff7f7,

      #fffafa

    );

}

.error-icon {

  width: 30px;

  height: 30px;

  flex-shrink: 0;

  display: grid;

  place-items: center;

  border-radius: 9px;

  color: #b91c1c;

  background: #fee2e2;

  font-weight: 800;

}

.error-content {

  flex: 1;

}

.error-content strong{

  color: #991b1b;

  font-size: 12px;

}

.error-content p{

  margin:

    3px 0 0;

  color: #b45353;

  font-size: 10px;

}

.retry-btn{

  border: 0;

  border-radius: 8px;

  padding:

    8px 12px;

  color: #991b1b;

  background: #fee2e2;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;

}

/* =========================================================

   SUMMARY CARDS

========================================================= */

.summary-grid {

  display: grid;

  grid-template-columns:

    repeat(

      3,

      minmax(0, 1fr)

    );

  gap: 16px;

  margin-bottom: 18px;

}

.summary-card {

  position: relative;

  min-height: 126px;

  overflow: hidden;

  display: flex;

  align-items: center;

  gap: 14px;

  padding:

    19px;

  border:

    1px solid #e2e9f2;

  border-radius: 16px;

  background:

    rgba(255, 255, 255, 0.95);

  box-shadow:

    0 8px 25px

    rgba(69, 61, 137, 0.045);

  transition:

    transform 0.25s ease,

    box-shadow 0.25s ease;

}

.summary-card:hover {

  transform:

    translateY(-3px);

  box-shadow:

    0 15px 35px

    rgba(69, 61, 137, 0.085);

}

.summary-icon{

  position: relative;

  z-index: 2;

  width: 47px;

  height: 47px;

  flex:

    0 0 47px;

  display: grid;

  place-items: center;

  border-radius: 13px;

  font-size: 18px;

  font-weight: 800;

}

.summary-icon.blue {

  color: #0284c7;

  background:

    linear-gradient(

      135deg,

      #e0f7ff,

      #e0efff

    );

}

.summary-icon.green {

  color: #059669;

  background:

    linear-gradient(

      135deg,

      #dcfce7,

      #dffaf0

    );

}

.summary-icon.purple {

  color: #C8499A;

  background:

    linear-gradient(

      135deg,

      #f1e8ff,

      #EDEBFA

    );

}

.summary-content {

  position: relative;

  z-index: 2;

}

.summary-content span{

  display: block;

  color: #7e8da1;

  font-size: 10px;

  font-weight: 650;

}

.summary-content strong{

  display: block;

  margin-top: 4px;

  color: #10213a;

  font-size: 25px;

  line-height: 1;

  font-weight: 800;

}

.summary-content small{

  display: block;

  margin-top: 7px;

  color: #9aa8b9;

  font-size: 9px;

}

.summary-decoration {

  position: absolute;

  right: -28px;

  bottom: -38px;

  width: 125px;

  height: 125px;

  border-radius: 50%;

  opacity: 0.65;

}

.blue-decoration {

  background:

    rgba(56, 189, 248, 0.15);

}

.green-decoration {

  background:

    rgba(45, 212, 191, 0.14);

}

.purple-decoration {

  background:

    rgba(167, 139, 250, 0.14);

}

/* =========================================================

   SEARCH CARD

========================================================= */

.search-card,

.filter-panel,

.student-card {

  border:

    1px solid #e1e8f1;

  border-radius: 16px;

  background:

    rgba(255, 255, 255, 0.96);

  box-shadow:

    0 9px 28px

    rgba(69, 61, 137, 0.045);

}

.search-card {

  margin-bottom: 18px;

  padding: 21px;

}

.search-heading {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

}

.section-title {

  display: flex;

  align-items: center;

  gap: 11px;

}

.section-icon{

  width: 36px;

  height: 36px;

  display: grid;

  place-items: center;

  border-radius: 10px;

  color: #453D89;

  background: #F3EFF9;

  font-size: 18px;

}

.search-heading h2{

  margin: 0;

  color: #12233d;

  font-size: 15px;

  font-weight: 800;

}

.search-heading p{

  margin:

    4px 0 0;

  color: #8a98ab;

  font-size: 10px;

}

.result-badge{

  display: inline-flex;

  align-items: center;

  gap: 6px;

  white-space: nowrap;

  padding:

    7px 11px;

  border-radius: 999px;

  color: #453D89;

  background: #F3EFF9;

  font-size: 10px;

  font-weight: 750;

}

.result-dot {

  width: 6px;

  height: 6px;

  border-radius: 50%;

  background: #453D89;

}

.search-row {

  display: flex;

  gap: 10px;

  margin-top: 17px;

}

.search-input-wrap {

  position: relative;

  flex: 1;

}

.search-icon {

  position: absolute;

  left: 14px;

  top: 50%;

  transform:

    translateY(-50%);

  color: #8ea0b7;

  font-size: 19px;

  pointer-events: none;

}

.search-input-wrap input{

  width: 100%;

  height: 44px;

  box-sizing: border-box;

  padding:

    0 40px;

  border:

    1px solid #dce4ee;

  border-radius: 11px;

  outline: none;

  color: #172a46;

  background: #fbfdff;

  font-size: 12px;

  transition:

    border-color 0.2s ease,

    box-shadow 0.2s ease,

    background 0.2s ease;

}

.search-input-wrap input:hover {

  background: #fff;

}

.search-input-wrap input:focus {

  border-color: #67cfe3;

  background: #fff;

  box-shadow:

    0 0 0 3px

    rgba(200, 73, 154, 0.1);

}

.search-input-wrap input::placeholder {

  color: #9aa8b9;

}

.clear-btn {

  position: absolute;

  right: 9px;

  top: 50%;

  transform:

    translateY(-50%);

  width: 26px;

  height: 26px;

  display: grid;

  place-items: center;

  border: 0;

  border-radius: 7px;

  color: #8798ad;

  background: transparent;

  font-size: 19px;

  cursor: pointer;

}

.clear-btn:hover {

  color: #334155;

  background: #f1f5f9;

}

.search-btn{

  height: 44px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 7px;

  border: 0;

  border-radius: 11px;

  padding:

    0 21px;

  color: #fff;

  background:

    linear-gradient(

      135deg,

      #10243f,

      #173b61

    );

  box-shadow:

    0 7px 17px

    rgba(15, 36, 63, 0.14);

  font-size: 11px;

  font-weight: 750;

  cursor: pointer;

  transition:

    transform 0.2s ease,

    box-shadow 0.2s ease;

}

.search-btn:hover {

  transform:

    translateY(-1px);

  box-shadow:

    0 10px 22px

    rgba(15, 36, 63, 0.2);

}

.search-info{

  margin-top: 11px;

  color: #8997aa;

  font-size: 10px;

}

.search-info strong {

  color: #3b526f;

}

.search-info button{

  margin-left: 7px;

  padding: 0;

  border: 0;

  color: #453D89;

  background: transparent;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;

}

/* =========================================================

   STUDENT CARD

========================================================= */

.student-card {

  overflow: hidden;

}

.table-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  padding:

    19px 21px;

  border-bottom:

    1px solid #e8edf4;

}

.list-title {

  display: flex;

  align-items: center;

  gap: 11px;

}

.list-icon{

  width: 35px;

  height: 35px;

  display: grid;

  place-items: center;

  border-radius: 10px;

  color: #0284c7;

  background: #F3EFF9;

  font-size: 15px;

}

.table-header h2{

  margin: 0;

  color: #12233d;

  font-size: 14px;

  font-weight: 800;

}

.table-header p{

  margin:

    4px 0 0;

  color: #8a98ab;

  font-size: 10px;

}

.live-badge{

  display: inline-flex;

  align-items: center;

  gap: 7px;

  padding:

    7px 10px;

  border-radius: 999px;

  color: #0f766e;

  background: #ecfdf5;

  font-size: 9px;

  font-weight: 750;

}

.live-badge span {

  width: 6px;

  height: 6px;

  border-radius: 50%;

  background: #10b981;

  box-shadow:

    0 0 0 4px

    rgba(16, 185, 129, 0.08);

}

/* =========================================================

   TABLE

========================================================= */

.table-scroll {

  overflow-x: auto;

}

table {

  width: 100%;

  min-width: 1240px;

  border-collapse: collapse;

  text-align: left;

}

thead {

  background:

    linear-gradient(

      90deg,

      #f8fafc,

      #f9fbfd

    );

}

th{

  padding:

    12px 21px;

  border-bottom:

    1px solid #e8edf4;

  color: #7d8da2;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: 0.06em;

  text-transform: uppercase;

}

td{

  padding:

    15px 21px;

  border-bottom:

    1px solid #edf1f6;

  color: #55667d;

  font-size: 11px;

}

tbody tr {

  transition:

    background 0.18s ease,

    transform 0.18s ease;

}

tbody tr:hover {

  background:

    linear-gradient(

      90deg,

      #f8fbff,

      #ffffff

    );

}

tbody tr:last-child td {

  border-bottom: 0;

}

/* =========================================================

   STUDENT CELL

========================================================= */

.student-cell {

  display: flex;

  align-items: center;

  gap: 11px;

}

.avatar{

  width: 38px;

  height: 38px;

  flex:

    0 0 38px;

  display: grid;

  place-items: center;

  border-radius: 11px;

  color: #fff;

  font-size: 11px;

  font-weight: 800;

  box-shadow:

    0 6px 13px

    rgba(69, 61, 137, 0.16);

}

.avatar.large{

  width: 44px;

  height: 44px;

  flex-basis: 44px;

  border-radius: 13px;

  font-size: 12px;

}

.avatar-blue {

  background:

    linear-gradient(

      135deg,

      #0891b2,

      #453D89

    );

}

.avatar-cyan {

  background:

    linear-gradient(

      135deg,

      #0891b2,

      #453D89

    );

}

.avatar-indigo {

  background:

    linear-gradient(

      135deg,

      #C8499A,

      #453D89

    );

}

.avatar-violet {

  background:

    linear-gradient(

      135deg,

      #C8499A,

      #5A4FA8

    );

}

.avatar-teal {

  background:

    linear-gradient(

      135deg,

      #0f766e,

      #14b8a6

    );

}

.student-name{

  margin: 0;

  color: #152640;

  font-size: 12px;

  font-weight: 750;

}

.student-id{

  margin:

    4px 0 0;

  color: #91a0b2;

  font-size: 9px;

}

.program-cell {

  display: flex;

  align-items: center;

  gap: 7px;

  max-width: 230px;

}

.program-dot {

  width: 6px;

  height: 6px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #38bdf8;

}

.year-pill{

  display: inline-block;

  padding:

    6px 9px;

  border:

    1px solid #e5eaf0;

  border-radius: 7px;

  color: #475d78;

  background: #f8fafc;

  font-size: 9px;

  font-weight: 650;

}

.email-link {

  color: #526984;

  text-decoration: none;

  transition:

    color 0.2s ease;

}

.email-link:hover {

  color: #453D89;

}

.phone-link {

  color: #526984;

  text-decoration: none;

  white-space: nowrap;

  transition:

    color 0.2s ease;

}

.phone-link:hover {

  color: #453D89;

}

.muted-value {

  color: #a4afbd;

}

/* =========================================================

   STATUS

========================================================= */

.status-pill{

  display: inline-flex;

  align-items: center;

  gap: 6px;

  white-space: nowrap;

  padding:

    4.5px 8px;

  border-radius: 999px;

  font-size: 9px;

  font-weight: 420;

  letter-spacing: 0.02em;

}

.status-pill > span {

  width: 6px;

  height: 6px;

  border-radius: 50%;

}

.status-active {

  color: #16794c;

  background: #e4f5e9;

}

.status-active > span {

  background: #16794c;

}

.status-disabled {

  color: #525252;

  background: #f3f3f3;

}

.status-disabled > span {

  background: #7c7c7c;

}

/* =========================================================

   MOBILE STUDENT CARDS

========================================================= */

.mobile-student-list {

  display: none;

}

.mobile-student-card {

  padding: 16px;

  border-bottom:

    1px solid #edf1f6;

  background: #fff;

}

.mobile-student-card:last-child {

  border-bottom: 0;

}

.mobile-student-top {

  display: flex;

  align-items: center;

  gap: 11px;

}

.mobile-student-main {

  flex: 1;

  min-width: 0;

}

.mobile-student-main h3 {

  margin: 0;

  overflow: hidden;

  color: #152640;

  font-size: 13px;

  font-weight: 750;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.mobile-student-main p{

  margin:

    4px 0 0;

  overflow: hidden;

  color: #91a0b2;

  font-size: 9px;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.mobile-student-details {

  display: grid;

  grid-template-columns:

    1fr 1fr;

  gap: 11px;

  margin-top: 15px;

  padding-top: 13px;

  border-top:

    1px solid #f0f3f7;

}

.detail-item {

  min-width: 0;

}

.detail-label{

  display: block;

  margin-bottom: 4px;

  color: #9aa7b7;

  font-size: 8px;

  font-weight: 800;

  letter-spacing: 0.06em;

}

.detail-value{

  display: block;

  overflow: hidden;

  color: #526984;

  font-size: 10px;

  font-weight: 600;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.email-detail {

  grid-column:

    1 / -1;

}

/* =========================================================

   LOADING

========================================================= */

.state-box {

  min-height: 260px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 30px;

  text-align: center;

}

.loading-orbit {

  position: relative;

  width: 42px;

  height: 42px;

  margin-bottom: 14px;

}

.loading-ring {

  position: absolute;

  inset: 0;

  border:

    3px solid #FCEAF4;

  border-top-color: #453D89;

  border-right-color: #C8499A;

  border-radius: 50%;

  animation:

    spin 0.8s linear infinite;

}

.loading-dot {

  position: absolute;

  top: 50%;

  left: 50%;

  width: 7px;

  height: 7px;

  border-radius: 50%;

  background: #453D89;

  transform:

    translate(-50%, -50%);

}

.state-box strong{

  color: #344a65;

  font-size: 12px;

}

.state-box p{

  margin:

    5px 0 0;

  color: #98a5b5;

  font-size: 10px;

}

/* =========================================================

   EMPTY

========================================================= */

.empty-state {

  min-height: 290px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 30px;

  text-align: center;

}

.empty-icon{

  width: 55px;

  height: 55px;

  display: grid;

  place-items: center;

  margin-bottom: 14px;

  border-radius: 16px;

  color: #453D89;

  background:

    linear-gradient(

      135deg,

      #F3EFF9,

      #e0f7ff

    );

  font-size: 25px;

}

.empty-state h3{

  margin: 0;

  color: #172a46;

  font-size: 15px;

}

.empty-state p{

  max-width: 320px;

  margin:

    6px 0 15px;

  color: #8795a8;

  font-size: 10px;

}

.empty-state button{

  border: 0;

  border-radius: 8px;

  padding:

    9px 14px;

  color: #453D89;

  background: #F3EFF9;

  font-size: 10px;

  font-weight: 750;

  cursor: pointer;

}

/* =========================================================

   FOOTER

========================================================= */

.page-footer{

  display: flex;

  align-items: center;

  gap: 9px;

  margin-top: 20px;

  padding:

    0 4px;

  color: #9aa7b7;

  font-size: 9px;

}

.footer-dot {

  width: 3px;

  height: 3px;

  border-radius: 50%;

  background: #b5c0cd;

}

.footer-version {

  margin-left: auto;

  color: #a8b3c0;

}

/* =========================================================

   MOBILE HEADER

========================================================= */

.mobile-menu-btn span {

  width: 16px;

  height: 2px;

  border-radius: 2px;

  background: #334155;

}

/* =========================================================

   MOBILE DRAWER

========================================================= */

.__removed_mobile-overlay {

  position: fixed;

  inset: 0;

  z-index: 100;

  background:

    rgba(2, 12, 27, 0.5);

  backdrop-filter:

    blur(2px);

}

.__removed_mobile-drawer {

  width:

    min(315px, 86vw);

  height: 100%;

  padding:

    24px 17px;

  background:

    linear-gradient(

      180deg,

      #071426,

      #0c2139

    );

  color: #fff;

  box-shadow:

    18px 0 45px

    rgba(0, 0, 0, 0.25);

  animation:

    drawerIn 0.22s ease;

}

.drawer-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

}

.drawer-close{

  width: 32px;

  height: 32px;

  border: 0;

  border-radius: 8px;

  color: #9db0c8;

  background:

    rgba(255, 255, 255, 0.06);

  font-size: 21px;

  cursor: pointer;

}

.mobile-system-card {

  display: flex;

  align-items: center;

  gap: 10px;

  margin-top: 35px;

  padding: 13px;

  border:

    1px solid

    rgba(148, 163, 184, 0.12);

  border-radius: 12px;

  background:

    rgba(255, 255, 255, 0.045);

}

.system-dot {

  width: 8px;

  height: 8px;

  border-radius: 50%;

  background: #10b981;

  box-shadow:

    0 0 0 4px

    rgba(16, 185, 129, 0.1);

}

.mobile-system-card strong{

  display: block;

  font-size: 10px;

}

.mobile-system-card small{

  display: block;

  margin-top: 3px;

  color: #71859e;

  font-size: 8px;

}

/* =========================================================

   ANIMATIONS

========================================================= */

@keyframes spin {

  to {

    transform: rotate(360deg);

  }

}

@keyframes drawerIn {

  from {

    opacity: 0;

    transform:

      translateX(-18px);

  }

  to {

    opacity: 1;

    transform:

      translateX(0);

  }

}

/* =========================================================

   TABLET

========================================================= */

@media (max-width: 1050px){

  .content-wrap {

    padding:

      26px 24px 38px;

  }

  .summary-card {

    padding: 16px;

  }

  

.summary-content strong {    font-size: 22px;
  }  th,

  td {

    padding-left: 16px;

    padding-right: 16px;

  }

}

/* =========================================================

   TABLET / MOBILE

========================================================= */

@media (max-width: 900px){

  .__removed_mobile-brand {

    display: flex;

    align-items: center;

    gap: 9px;

  }

  

.mobile-brand h1 {
    margin: 0;

    color: #14243b;

    font-size: 14px;

    font-weight: 800;
  }

.mobile-brand p {
    margin: 2px 0 0;

    color: #8493a7;

    font-size: 9px;
  }

  .content-wrap {

    width: 100%;

    padding:

      23px 20px 32px;

    box-sizing: border-box;

  }

  .summary-grid {

    grid-template-columns:

      repeat(3, minmax(0, 1fr));

  }

  .summary-card {

    min-height: 115px;

  }

  .summary-content small {

    display: none;

  }

}

/* =========================================================

   SMALL TABLET

========================================================= */

@media (max-width: 760px){

  .summary-grid {

    grid-template-columns:

      1fr 1fr;

  }

  .summary-card:last-child {

    grid-column:

      1 / -1;

  }

  .page-header {

    align-items: flex-start;

  }

  .title-row {

    align-items: flex-start;

  }

  

.page-header h1 {    font-size: 27px;
  }  .search-heading {

    align-items: flex-start;

  }

  .table-scroll {

    display: none;

  }

  .mobile-student-list {

    display: block;

  }

  .student-card {

    overflow: hidden;

  }

  .page-footer {

    flex-wrap: wrap;

  }

}

/* =========================================================

   MOBILE

========================================================= */

@media (max-width: 560px){

  .content-wrap {

    padding:

      18px 13px 28px;

  }

  .page-header {

    flex-direction: column;

    gap: 15px;

    margin-bottom: 19px;

  }

  .title-icon {

    width: 40px;

    height: 40px;

    border-radius: 11px;

  }

  

.page-header h1 {
    font-size: 25px;
  }

  .page-header p {
    font-size: 11px;
  }  .refresh-btn {

    width: 100%;

    height: 42px;

  }

  .summary-grid {

    grid-template-columns:

      1fr;

    gap: 10px;

  }

  .summary-card {

    min-height: 96px;

    padding: 15px;

  }

  .summary-card:last-child {

    grid-column: auto;

  }

  .summary-icon {

    width: 42px;

    height: 42px;

    flex-basis: 42px;

  }

  

.summary-content strong {    font-size: 22px;
  }  .search-card {

    padding: 16px;

  }

  .search-heading {

    flex-direction: column;

    align-items: flex-start;

  }

  .result-badge {

    align-self: flex-start;

  }

  .search-row {

    flex-direction: column;

  }

  

.search-input-wrap input {    height: 44px;

    font-size: 11px;
  }  .search-btn {

    width: 100%;

    height: 43px;

  }

  .table-header {

    padding:

      16px;

  }

  .live-badge {

    display: none;

  }

  .mobile-student-top {

    align-items: flex-start;

  }

  .mobile-student-top .status-pill {

    margin-left: auto;

  }

  .mobile-student-details {

    grid-template-columns:

      1fr 1fr;

  }

  .page-footer {

    justify-content: center;

    text-align: center;

  }

  .footer-version {

    margin-left: 0;

  }

}

/* =========================================================

   VERY SMALL MOBILE

========================================================= */

@media (max-width: 390px){

  .content-wrap {

    padding-left: 10px;

    padding-right: 10px;

  }

  

.brand-icon.small {    width: 32px;

    height: 32px;

    font-size: 14px;
  }  .mobile-brand h1 {

    font-size: 13px;

  }

  .summary-card {

    padding: 13px;

  }

  .summary-icon {

    width: 39px;

    height: 39px;

    flex-basis: 39px;

  }

  .mobile-student-card {

    padding: 14px;

  }

  .mobile-student-top {

    gap: 8px;

  }

  .avatar.large {

    width: 40px;

    height: 40px;

    flex-basis: 40px;

  }.mobile-student-main h3 {
    font-size: 12px;
  }

  .status-pill {
    padding:
      5px 7px;
    font-size: 8px;
  }}

/* Shared Sidebar layout */
.main-content {
  margin-left: 255px;
  min-height: 100vh;
}

@media (max-width: 1100px) {
  .main-content {
    width: 100%;
    margin-left: 0;
    box-sizing: border-box;
  }
}

@media (max-width: 640px) {
  .content-wrap {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* =========================================================
   DESK ACTIONS (Frappe Desk Student page / form links)
========================================================= */

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.desk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.desk-btn-icon {
  font-size: 13px;
  line-height: 1;
}

.desk-btn-secondary {
  color: #453D89;
  background: #F3EFF9;
  border: 1px solid #cfe0fb;
}

.desk-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 20px rgba(69, 61, 137, 0.14);
}

.desk-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 9px 22px rgba(5, 150, 105, 0.2);
}

.desk-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 13px 27px rgba(5, 150, 105, 0.27);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.field-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid #e5eaf0;
  border-radius: 7px;
  color: #475d78;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
}

.field-action-btn::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #C4B5E8;
}

.field-action-btn:hover {
  border-color: #bfd6f7;
  color: #453D89;
  background: #F3EFF9;
  transform: translateY(-1px);
}

.mobile-student-actions {
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid #f0f3f7;
}

.mobile-student-actions .detail-label {
  display: block;
  margin-bottom: 8px;
}

@media (max-width: 560px) {
  .header-actions {
    width: 100%;
  }

  .header-actions .desk-btn,
  .header-actions .refresh-btn {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
}

/* =========================================================
   FILTERS
========================================================= */

.filter-panel {
  margin-bottom: 18px;
  padding: 21px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.filter-header h2 {
  margin: 0;
  color: #12233d;
  font-size: 14px;
  font-weight: 800;
}

.filter-header p {
  margin: 4px 0 0;
  color: #8a98ab;
  font-size: 13px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 13px;
  margin-top: 17px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.filter-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-desk-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border: 1px solid #dbe3ee;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.filter-desk-btn:hover {
  background: #F3EFF9;
  border-color: #bfd6f7;
  color: #453D89;
}

.filter-field select {
  width: 100%;
  height: 40px;
  border: 1px solid #e1e8f1;
  border-radius: 10px;
  background: #fff;
  color: #1e293b;
  font: inherit;
  font-size: 13px;
  padding: 0 11px;
  outline: none;
  cursor: pointer;
}

.filter-field select:hover:not(:disabled) {
  border-color: #c7d4e6;
}

.filter-field select:focus {
  border-color: #5A4FA8;
  box-shadow: 0 0 0 3px rgba(69, 61, 137, 0.1);
}

.filter-field select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.filter-hint {
  margin: 14px 0 0;
  padding: 9px 12px;
  border: 1px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
  color: #b45309;
  font-size: 13px;
  line-height: 1.55;
}

.clear-filter-btn {
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.clear-filter-btn:hover {
  background: #f8fafc;
}

.filter-footer {
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px solid #edf2f7;
  color: #64748b;
  font-size: 13px;
}

.filter-footer strong {
  color: #111827;
}

@media (max-width: 760px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-header {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-filter-btn {
    width: 100%;
  }
}

/* =========================================================
   ADD STUDENT MODAL
========================================================= */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(69, 61, 137, 0.55);

  backdrop-filter: blur(2px);
}

.modal-card {
  display: flex;
  flex-direction: column;

  width: min(760px, 100%);
  max-height: min(88vh, 860px);

  overflow: hidden;

  border-radius: 18px;

  background: #ffffff;

  box-shadow: 0 24px 60px rgba(69, 61, 137, 0.28);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 16px;

  padding: 20px 22px 14px;

  border-bottom: 1px solid #eef2f7;
}

.modal-header h2 {
  margin: 0;

  color: #1E1B33;

  font-size: 19px;
  font-weight: 700;
}

.modal-header p {
  margin: 4px 0 0;

  color: #64748b;

  font-size: 13px;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  border: 1px solid #e2e8f0;
  border-radius: 9px;

  background: #ffffff;

  color: #64748b;

  cursor: pointer;
}

.modal-close:hover {
  background: #f8fafc;
  color: #1E1B33;
}

.modal-body {
  flex: 1;

  overflow-y: auto;

  padding: 18px 22px;
}

.modal-section + .modal-section {
  margin-top: 22px;
}

.modal-section h3 {
  margin: 0;

  color: #1E1B33;

  font-size: 13px;
  font-weight: 700;
}

.modal-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 12px;
}

.modal-hint {
  margin: 4px 0 12px;

  color: #64748b;

  font-size: 13px;
}

.modal-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 12px;
}

.modal-field {
  display: flex;
  flex-direction: column;

  gap: 5px;

  min-width: 0;
}

.modal-field-wide {
  grid-column: span 2;
}

.modal-field span {
  color: #475569;

  font-size: 13px;
  font-weight: 600;
}

.modal-field input,
.modal-field select,
.guardian-row input,
.guardian-row select {
  width: 100%;

  padding: 9px 11px;

  border: 1px solid #e2e8f0;
  border-radius: 10px;

  background: #ffffff;

  color: #1E1B33;

  font-size: 13px;

  outline: none;
}

.modal-field input:focus,
.modal-field select:focus,
.guardian-row input:focus,
.guardian-row select:focus {
  border-color: #453D89;
  box-shadow: 0 0 0 3px rgba(69, 61, 137, 0.12);
}

.modal-link-btn {
  padding: 0;

  border: none;

  background: transparent;

  color: #453D89;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  white-space: nowrap;
}

.guardian-row {
  display: grid;

  grid-template-columns: 1.3fr 1fr 1.2fr 32px;

  gap: 8px;

  margin-top: 8px;
}

.guardian-remove {
  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #e2e8f0;
  border-radius: 10px;

  background: #ffffff;

  color: #94a3b8;

  cursor: pointer;
}

.guardian-remove:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

.guardian-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-error {
  margin-bottom: 14px;
}

.modal-success {
  margin-bottom: 14px;

  padding: 10px 12px;

  border: 1px solid #bbf7d0;
  border-radius: 12px;

  background: #f0fdf4;

  color: #15803d;

  font-size: 13px;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 10px;

  padding: 14px 22px;

  border-top: 1px solid #eef2f7;

  background: #fcfdff;
}

@media (max-width: 640px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .modal-field-wide {
    grid-column: span 1;
  }

  .guardian-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
