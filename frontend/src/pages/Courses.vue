<template>

  <div class="app-shell">



    <!-- =====================================================

         SIDEBAR

    ====================================================== -->



    <Sidebar />






    <!-- =====================================================

         MAIN

    ====================================================== -->



    <main class="main">



      <div class="content">





        <!-- =================================================

             PAGE HEADER

        ================================================== -->



        <header class="page-header">



          <div>



            <div class="breadcrumb">



              <span>Education</span>



              <span class="breadcrumb-line">

                /

              </span>



              <span class="current">

                Courses

              </span>



            </div>





            <div class="title-row">



              <div class="title-icon">

                ▣

              </div>



              <div>



                <h1>

                  Courses

                </h1>



                <p>

                  Manage and view academic courses

                </p>



              </div>



            </div>



          </div>


          <div class="header-actions">

            <button

              v-if="isStaff"

              class="desk-btn desk-btn-secondary"

              type="button"

              title="Open the Course list in Frappe Desk"

              @click="openDesk(deskListUrl)"

            >

              View All

            </button>




            <button

              v-if="isStaff"

              class="desk-btn desk-btn-primary"

              type="button"

              title="Create a new Course in Frappe Desk"

              @click="openDesk(deskNewUrl)"

            >

              Add

            </button>




            <button

              class="refresh-btn"

              :disabled="loading"

              @click="loadCourses"

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



        </header>





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



          <div>



            <strong>

              Unable to load courses

            </strong>



            <p>

              {{ error }}

            </p>



          </div>



        </div>





        <!-- =================================================

             SUMMARY

        ================================================== -->



        <section class="summary-grid">



          <!-- Total Courses -->



          <div class="summary-card">



            <div class="summary-icon blue">

              ▣

            </div>



            <div>



              <span>

                Total Courses

              </span>



              <strong>

                {{ courses.length }}

              </strong>



            </div>



          </div>





          <!-- Departments -->



          <div class="summary-card">



            <div class="summary-icon purple">

              ◈

            </div>



            <div>



              <span>

                Departments

              </span>



              <strong>

                {{ departmentCount }}

              </strong>



            </div>



          </div>





          <!-- With Description -->



          <div class="summary-card">



            <div class="summary-icon green">

              ✓

            </div>



            <div>



              <span>

                Documented Courses

              </span>



              <strong>

                {{ documentedCourses }}

              </strong>



            </div>



          </div>





          <!-- Without Description -->



          <div class="summary-card">



            <div class="summary-icon orange">

              !

            </div>



            <div>



              <span>

                Needs Description

              </span>



              <strong>

                {{ coursesWithoutDescription }}

              </strong>



            </div>



          </div>



        </section>





        <!-- =================================================

             SEARCH / FILTER

        ================================================== -->



        <section class="search-card">



          <div class="search-heading">



            <div>



              <h2>

                Course Directory

              </h2>



              <p>

                Search courses by name, department or description.

              </p>



            </div>



            <span class="result-badge">

              {{ filteredCourses.length }} found

            </span>



          </div>





          <div class="filter-row">



            <div class="search-wrapper">



              <span class="search-icon">

                ⌕

              </span>



              <input

                v-model="searchQuery"

                type="text"

                placeholder="Search courses..."

              />



            </div>





            <div class="select-wrapper">



              <select v-model="departmentFilter">



                <option value="">

                  All Departments

                </option>



                <option

                  v-for="department in departments"

                  :key="department"

                  :value="department"

                >

                  {{ department }}

                </option>



              </select>



              <span class="select-arrow">

                ▾

              </span>



            </div>





            <button

              v-if="searchQuery || departmentFilter"

              type="button"

              class="clear-button"

              @click="clearFilters"

            >

              Clear

            </button>



          </div>



        </section>





        <!-- =================================================

             COURSE RECORDS

        ================================================== -->



        <section class="records-section">



          <div class="records-header">



            <div>



              <div class="section-eyebrow">

                ACADEMIC CATALOG

              </div>



              <h2>

                Course Records

              </h2>



              <p>

                Courses available in the Frappe Education system.

              </p>



            </div>





            <div class="records-count">



              <span>

                {{ filteredCourses.length }}

              </span>



              records



            </div>



          </div>





          <!-- Loading -->



          <div

            v-if="loading"

            class="loading-state"

          >



            <div class="loader"></div>



            <p>

              Loading courses...

            </p>



          </div>





          <!-- Empty -->



          <div

            v-else-if="!filteredCourses.length"

            class="empty-state"

          >



            <div class="empty-icon">

              ▣

            </div>



            <strong>

              No courses found

            </strong>



            <p>

              Try changing your search or department filter.

            </p>



          </div>





          <!-- Course Grid -->



          <div

            v-else

            class="course-grid"

          >



            <article

              v-for="course in filteredCourses"

              :key="course.id"

              class="course-card"

            >



              <div class="course-card-top">



                <div class="course-icon">

                  ▣

                </div>



                <span class="course-id">

                  {{ course.id }}

                </span>



              </div>





              <div class="course-body">



                <h3>

                  {{ course.name || 'Unnamed Course' }}

                </h3>





                <div

                  v-if="course.department"

                  class="course-department"

                >



                  <span>

                    Department

                  </span>



                  <strong>

                    {{ course.department }}

                  </strong>



                </div>





                <p

                  v-if="course.description"

                  class="course-description"

                >

                  {{ course.description }}

                </p>



                <p

                  v-else

                  class="course-description empty-description"

                >

                  No course description available.

                </p>



              </div>





              <div class="course-footer">



                <span

                  class="course-status"

                  :class="{

                    documented: !!course.description

                  }"

                >



                  <span></span>



                  {{

                    course.description

                      ? 'Documented'

                      : 'Needs Description'

                  }}



                </span>



              </div>



            </article>



          </div>



        </section>





        <!-- =================================================

             FOOTER

        ================================================== -->



        <footer class="footer">



          <span>

            © 2026 Education Management System

          </span>



          <span>

            Powered by Frappe

          </span>



        </footer>



      </div>



    </main>



  </div>

</template>





<script>



import Sidebar from '@/components/Sidebar.vue'

import { getContext, isStaffUser } from '@/lib/context'

export default {



  name: 'Courses',

  components: {
    Sidebar,
  },





  data() {



    return {



      loading: true,



      error: null,



      courses: [],

      // Desk shortcuts are staff-only; hidden until the role is known.
      isStaff: false,



      searchQuery: '',



      departmentFilter: '',

      deskBaseUrl: window.location.origin,



    }



  },




  computed: {




    deskListUrl() {

      return `${this.deskBaseUrl}/desk/course`

    },




    deskNewUrl() {

      return `${this.deskBaseUrl}/desk/course/new`

    },




    departments() {



      const values = this.courses



        .map(course =>

          String(course.department || '').trim()

        )



        .filter(Boolean)





      return [...new Set(values)].sort()



    },





    departmentCount() {



      return this.departments.length



    },





    documentedCourses() {



      return this.courses.filter(

        course =>

          String(course.description || '').trim()

      ).length



    },





    coursesWithoutDescription() {



      return this.courses.filter(

        course =>

          !String(course.description || '').trim()

      ).length



    },





    filteredCourses() {



      const query =

        this.searchQuery

          .trim()

          .toLowerCase()





      return this.courses.filter(course => {



        const matchesSearch =

          !query ||

          String(course.id || '')

            .toLowerCase()

            .includes(query) ||

          String(course.name || '')

            .toLowerCase()

            .includes(query) ||

          String(course.department || '')

            .toLowerCase()

            .includes(query) ||

          String(course.description || '')

            .toLowerCase()

            .includes(query)





        const matchesDepartment =

          !this.departmentFilter ||

          String(course.department || '').trim() === this.departmentFilter





        return (

          matchesSearch &&

          matchesDepartment

        )



      })



    },



  },





  async mounted() {

    this.loadCourses()

    try {
      const ctx = await getContext()
      this.isStaff = isStaffUser(ctx)
    } catch (e) {
      console.warn('Role check failed:', e)
      this.isStaff = false
    }

  },





  methods: {



    async loadCourses() {



      this.loading = true



      this.error = null





      try {



        const response = await fetch(

          '/api/method/backend_custom_app.api.education.get_courses',

          {

            credentials: 'include',

          }

        )





        const result =

          await response.json()





        if (!response.ok) {



          throw new Error(

            result.exception ||

            'Courses API request failed'

          )



        }





        if (!result.message) {



          this.courses = []



          return



        }





        /*

         * Backend response:

         *

         * {

         *   total: ...,

         *   courses: [...]

         * }

         */



        this.courses =

          Array.isArray(result.message.courses)

            ? result.message.courses

            : []



      }



      catch (error) {



        console.error(

          'Courses API error:',

          error

        )





        this.error =

          error?.message ||

          'Unable to load course data.'



      }



      finally {



        this.loading = false



      }



    },





    clearFilters() {



      this.searchQuery = ''



      this.departmentFilter = ''



    },



    openDesk(url) {

      window.location.href = url

    },



  },



}



</script>





<style scoped>



/* =========================================================

   GLOBAL

\========================================================= */



* {

  box-sizing: border-box;

}





.app-shell {

  min-height: 100vh;

  background: #f5f8fc;

}





/* =========================================================

   SIDEBAR

\========================================================= */



.main {

  min-height: 100vh;



  margin-left: 255px;

}





.content {

  width:

    min(

      100%,

      1240px

    );



  margin: 0 auto;



  padding:

    29px 32px 40px;

}





/* =========================================================

   PAGE HEADER

\========================================================= */



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





/* =========================================================

   REFRESH

\========================================================= */



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



  font-size: 15px;

}





.refresh-icon.spinning {

  animation:

    spin 0.8s linear infinite;

}





@keyframes spin {



  from {

    transform: rotate(0deg);

  }



  to {

    transform: rotate(360deg);

  }



}





/* =========================================================

   DESK ACTIONS (Frappe Desk Course page / form links)

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



/* =========================================================

   ERROR

\========================================================= */



.error-box {

  display: flex;

  align-items: flex-start;



  gap: 12px;



  margin-bottom: 20px;



  padding: 14px 16px;



  border:

    1px solid

    #fecaca;



  border-radius: 12px;



  background: #fff5f5;

}





.error-icon {

  width: 28px;

  height: 28px;



  display: grid;

  place-items: center;



  flex-shrink: 0;



  border-radius: 8px;



  color: #dc2626;



  background: #fee2e2;



  font-weight: 800;

}





.error-box strong{

  display: block;



  color: #991b1b;



  font-size: 11px;

}





.error-box p{

  margin:

    4px 0 0;



  color: #b45353;



  font-size: 10px;

}





/* =========================================================

   SUMMARY

\========================================================= */



.summary-grid {

  display: grid;



  grid-template-columns:

    repeat(4, minmax(0, 1fr));



  gap: 14px;



  margin-bottom: 18px;

}





.summary-card {

  display: flex;

  align-items: center;



  gap: 12px;



  min-height: 88px;



  padding: 16px;



  border:

    1px solid

    #e5eaf1;



  border-radius: 14px;



  background: #fff;



  box-shadow:

    0 4px 16px

    rgba(69, 61, 137, 0.035);

}





.summary-icon{

  width: 38px;

  height: 38px;



  display: grid;

  place-items: center;



  flex-shrink: 0;



  border-radius: 10px;



  font-size: 14px;

  font-weight: 800;

}





.summary-icon.blue {

  color: #453D89;

  background: #eaf2ff;

}





.summary-icon.purple {

  color: #C8499A;

  background: #f1eaff;

}





.summary-icon.green {

  color: #059669;

  background: #e8fbf3;

}





.summary-icon.orange {

  color: #d97706;

  background: #fff5df;

}





.summary-card span{

  display: block;



  color: #8a99ac;



  font-size: 9px;

}





.summary-card strong{

  display: block;



  margin-top: 4px;



  color: #1E1B33;



  font-size: 20px;

  font-weight: 800;

}





/* =========================================================

   SEARCH

\========================================================= */



.search-card {

  margin-bottom: 18px;



  padding: 18px 19px;



  border:

    1px solid

    #e5eaf1;



  border-radius: 14px;



  background: #fff;



  box-shadow:

    0 4px 16px

    rgba(69, 61, 137, 0.035);

}





.search-heading {

  display: flex;

  align-items: center;

  justify-content: space-between;



  gap: 15px;



  margin-bottom: 16px;

}





.search-heading h2{

  margin: 0;



  color: #1E1B33;



  font-size: 14px;



  font-weight: 780;

}





.search-heading p{

  margin:

    4px 0 0;



  color: #94a3b8;



  font-size: 9px;

}





.result-badge{

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





.result-badge::first-letter {

  color: #1E1B33;

}





.filter-row {

  display: flex;



  align-items: center;



  gap: 10px;

}





.search-wrapper {

  position: relative;



  flex: 1;

}





.search-icon{

  position: absolute;



  top: 50%;

  left: 13px;



  transform:

    translateY(-50%);



  color: #94a3b8;



  font-size: 15px;

}





.search-wrapper input{

  width: 100%;



  height: 40px;



  padding:

    0 13px 0 35px;



  border:

    1px solid

    #e2e8f0;



  border-radius: 9px;



  outline: none;



  color: #334155;



  background: #fff;



  font-size: 10px;



  transition:

    border 0.2s ease,

    box-shadow 0.2s ease;

}





.search-wrapper input:focus {

  border-color: #5A4FA8;



  box-shadow:

    0 0 0 3px

    rgba(69, 61, 137, 0.08);

}





.select-wrapper {

  position: relative;



  width: 190px;

}





.select-wrapper select{

  width: 100%;



  height: 40px;



  padding:

    0 30px 0 12px;



  border:

    1px solid

    #e2e8f0;



  border-radius: 9px;



  outline: none;



  color: #475569;



  background: #fff;



  appearance: none;



  font-size: 10px;

}





.select-arrow{

  position: absolute;



  top: 50%;

  right: 12px;



  transform:

    translateY(-50%);



  pointer-events: none;



  color: #94a3b8;



  font-size: 11px;

}





.clear-button{

  height: 40px;



  padding:

    0 13px;



  border:

    1px solid

    #e2e8f0;



  border-radius: 9px;



  color: #64748b;



  background: #f8fafc;



  font-size: 9px;



  cursor: pointer;

}





.clear-button:hover {

  color: #453D89;



  border-color: #DDD9F5;



  background: #F3EFF9;

}





/* =========================================================

   RECORDS

\========================================================= */



.records-section {

  overflow: hidden;



  border:

    1px solid

    #e5eaf1;



  border-radius: 14px;



  background: #fff;



  box-shadow:

    0 4px 16px

    rgba(69, 61, 137, 0.035);

}





.records-header {

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



  letter-spacing: 0.1em;

}





.records-header h2{

  margin: 0;



  color: #1E1B33;



  font-size: 14px;



  font-weight: 780;

}





.records-header p{

  margin:

    3px 0 0;



  color: #94a3b8;



  font-size: 8px;

}





.records-count{

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





.records-count span {

  color: #1E1B33;



  font-weight: 800;

}





/* =========================================================

   COURSE GRID

\========================================================= */



.course-grid {

  display: grid;



  grid-template-columns:

    repeat(3, minmax(0, 1fr));



  gap: 14px;



  padding: 18px;

}





.course-card {

  overflow: hidden;



  border:

    1px solid

    #e8edf3;



  border-radius: 13px;



  background: #fff;



  transition:

    transform 0.2s ease,

    box-shadow 0.2s ease,

    border-color 0.2s ease;

}





.course-card:hover {

  transform:

    translateY(-3px);



  border-color: #d7e3f0;



  box-shadow:

    0 12px 28px

    rgba(69, 61, 137, 0.08);

}





.course-card-top {

  display: flex;

  align-items: center;

  justify-content: space-between;



  padding: 15px;



  background:

    linear-gradient(

      135deg,

      #f7fbff,

      #eef7ff

    );



  border-bottom:

    1px solid

    #edf2f7;

}





.course-icon {

  width: 37px;

  height: 37px;



  display: grid;

  place-items: center;



  border-radius: 10px;



  color: #0369a1;



  background: #dff4ff;



  font-size: 13px;

  font-weight: 800;

}





.course-id{

  max-width: 150px;



  overflow: hidden;



  color: #94a3b8;



  font-size: 8px;



  text-overflow: ellipsis;



  white-space: nowrap;

}





.course-body {

  padding: 17px 16px 14px;

}





.course-body h3 {

  margin: 0;



  color: #172033;



  font-size: 13px;



  font-weight: 780;



  line-height: 1.4;

}





.course-department {

  display: flex;

  flex-direction: column;



  gap: 3px;



  margin-top: 13px;



  padding:

    9px 10px;



  border-radius: 8px;



  background: #f8fafc;

}





.course-department span{

  color: #94a3b8;



  font-size: 7px;



  text-transform: uppercase;



  letter-spacing: 0.06em;

}





.course-department strong{

  color: #475569;



  font-size: 9px;



  font-weight: 700;

}





.course-description{

  min-height: 42px;



  margin:

    13px 0 0;



  color: #718096;



  font-size: 9px;



  line-height: 1.6;

}





.course-description.empty-description {

  color: #a3afbf;



  font-style: italic;

}





.course-footer {

  padding:

    11px 16px;



  border-top:

    1px solid

    #f0f3f7;

}





.course-status{

  display: inline-flex;

  align-items: center;



  gap: 6px;



  color: #d97706;



  font-size: 8px;



  font-weight: 700;

}





.course-status span {

  width: 6px;

  height: 6px;



  border-radius: 50%;



  background: #f59e0b;

}





.course-status.documented {

  color: #059669;

}





.course-status.documented span {

  background: #10b981;

}





/* =========================================================

   LOADING / EMPTY

\========================================================= */



.loading-state,

.empty-state {

  min-height: 230px;



  display: flex;

  flex-direction: column;



  align-items: center;

  justify-content: center;



  text-align: center;

}





.loader {

  width: 27px;

  height: 27px;



  border:

    3px solid

    #e2e8f0;



  border-top-color:

    #453D89;



  border-radius: 50%;



  animation:

    spin 0.8s linear infinite;

}





.loading-state p{

  margin:

    12px 0 0;



  color: #94a3b8;



  font-size: 9px;

}





.empty-icon{

  width: 46px;

  height: 46px;



  display: grid;

  place-items: center;



  margin-bottom: 12px;



  border-radius: 13px;



  color: #64748b;



  background: #f1f5f9;



  font-size: 17px;

}





.empty-state strong{

  color: #334155;



  font-size: 11px;

}





.empty-state p{

  margin:

    5px 0 0;



  color: #94a3b8;



  font-size: 9px;

}





/* =========================================================

   FOOTER

\========================================================= */



.footer{

  display: flex;

  justify-content: space-between;



  gap: 15px;



  margin-top: 24px;



  padding:

    0 4px;



  color: #94a3b8;



  font-size: 8px;

}





/* =========================================================

   RESPONSIVE

\========================================================= */



@media (max-width: 1100px) {

  .main {
    margin-left: 0;
  }

  .content {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .course-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {

  .main {
    margin-left: 0;
  }

  .content {
    padding:
      22px 18px 30px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .select-wrapper {
    width: 100%;
  }
}

@media (max-width: 560px){



  .summary-grid {

    grid-template-columns: 1fr;

  }





  .course-grid {

    grid-template-columns: 1fr;

  }





  .search-heading,

  .records-header {

    align-items: flex-start;



    flex-direction: column;

  }





  .title-row {

    align-items: flex-start;

  }





  

.page-header h1 {    font-size: 25px;
  }  .footer {

    flex-direction: column;

  }



}



</style>