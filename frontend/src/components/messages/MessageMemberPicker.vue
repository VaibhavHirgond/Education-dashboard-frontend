<template>
  <div
    v-bind:class="inline ? 'member-picker-inline' : 'picker-layer'"
    v-bind:role="inline ? null : 'dialog'"
    v-bind:aria-modal="inline ? null : 'true'"
    v-bind:aria-label="inline ? null : title"
  >
    <button v-if="!inline" type="button" class="picker-backdrop" aria-label="Close member picker" v-on:click="$emit('cancel')"></button>
    <section v-bind:class="inline ? 'member-picker-body' : 'picker-modal'" v-bind:role="inline ? null : 'document'">
      <div v-if="!inline" class="picker-head">
        <span class="picker-heading">
          <span class="picker-title">{{ title }}</span>
          <span class="picker-sub">Select people to add to this group.</span>
        </span>
        <button type="button" class="picker-close" aria-label="Close member picker" v-on:click="$emit('cancel')">×</button>
      </div>
      <div class="picker-search-wrap">
        <span class="picker-search-icon">⌕</span>
        <input
          type="text"
          class="picker-search"
          v-bind:value="searchText"
          placeholder="Search name or email"
          aria-label="Search people"
          v-on:input="onSearchInput"
        />
      </div>
      <div class="picker-filters" role="group" aria-label="Filter people by role">
        <button type="button" class="picker-filter" v-bind:class="roleFilter === 'All' ? 'picker-filter-active' : ''" v-bind:aria-pressed="roleFilter === 'All' ? 'true' : 'false'" v-on:click="roleFilter = 'All'">All</button>
        <button type="button" class="picker-filter" v-bind:class="roleFilter === 'Admins' ? 'picker-filter-active' : ''" v-bind:aria-pressed="roleFilter === 'Admins' ? 'true' : 'false'" v-on:click="roleFilter = 'Admins'">Admins</button>
        <button type="button" class="picker-filter" v-bind:class="roleFilter === 'Instructors' ? 'picker-filter-active' : ''" v-bind:aria-pressed="roleFilter === 'Instructors' ? 'true' : 'false'" v-on:click="roleFilter = 'Instructors'">Instructors</button>
        <button type="button" class="picker-filter" v-bind:class="roleFilter === 'Students' ? 'picker-filter-active' : ''" v-bind:aria-pressed="roleFilter === 'Students' ? 'true' : 'false'" v-on:click="roleFilter = 'Students'">Students</button>
      </div>
      <div v-if="error" class="picker-error">{{ error }}</div>
      <div class="picker-chips" v-if="creator || selected.length > 0">
        <span v-if="creator" class="picker-chip picker-chip-fixed">{{ creatorLabel }}</span>
        <span class="picker-chip" v-for="item in selected" v-bind:key="'chip-' + item.user">
          {{ item.full_name || item.user }}
          <button type="button" class="picker-chip-remove" v-bind:aria-label="'Remove ' + (item.full_name || item.user)" v-on:click="removeSelected(item.user)">×</button>
        </span>
      </div>
      <div v-if="loading" class="picker-state">Loading people...</div>
      <div v-else-if="visibleCandidates.length === 0" class="picker-state">No people found for this filter.</div>
      <div v-else class="picker-results">
        <button
          type="button"
          class="picker-row"
          v-for="candidate in visibleCandidates"
          v-bind:key="candidate.user"
          v-bind:disabled="isDisabled(candidate)"
          v-bind:aria-pressed="isSelected(candidate) ? 'true' : 'false'"
          v-on:click="toggleCandidate(candidate)"
        >
          <span class="picker-avatar" v-bind:style="{ backgroundColor: colorFor(candidate.user) }">{{ initials(candidate.full_name || candidate.user) }}</span>
          <span class="picker-row-main">
            <span class="picker-row-name">{{ candidate.full_name || candidate.user }}</span>
            <span class="picker-row-sub">{{ candidate.email || candidate.user }}<span v-if="candidate.role_label"> · {{ candidate.role_label }}</span></span>
          </span>
          <span v-if="creator && candidate.user === creator" class="picker-row-tag">Creator</span>
          <span v-else-if="candidate.already_member" class="picker-row-tag">Already a member</span>
          <span v-else class="picker-row-mark">{{ isSelected(candidate) ? '✓' : '' }}</span>
        </button>
      </div>
      <div v-if="!inline" class="picker-actions">
        <button type="button" class="picker-cancel" v-on:click="$emit('cancel')">Cancel</button>
        <button type="button" class="picker-submit" v-on:click="confirmSelection">{{ submitLabel }}</button>
      </div>
    </section>
  </div>
</template>

<script>
import { apiGet } from '@/lib/api'

export default {
  name: 'MessageMemberPicker',
  props: {
    group: {
      type: String,
      default: ''
    },
    inline: {
      type: Boolean,
      default: false
    },
    creator: {
      type: String,
      default: ''
    },
    creatorLabel: {
      type: String,
      default: 'You (creator)'
    },
    title: {
      type: String,
      default: 'Add members'
    },
    submitLabel: {
      type: String,
      default: 'Add members'
    }
  },
  data() {
    return {
      searchText: '',
      candidates: [],
      selected: [],
      loading: true,
      error: '',
      roleFilter: 'All',
      searchTimer: null,
      requestId: 0
    }
  },
  computed: {
    selectedUsers() {
      var list = []
      for (var i = 0; i < this.selected.length; i = i + 1) {
        list.push(this.selected[i].user)
      }
      return list
    },
    visibleCandidates() {
      var list = []
      var i = 0
      while (i < this.candidates.length) {
        var candidate = this.candidates[i]
        if (this.matchesRoleFilter(candidate.role_label)) {
          list.push(candidate)
        }
        i = i + 1
      }
      return list
    }
  },
  watch: {
    group: function() {
      this.loadCandidates(this.searchText)
    }
  },
  mounted() {
    this.loadCandidates('')
  },
  beforeUnmount() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    }
  },
  methods: {
    loadCandidates(term) {
      var self = this
      this.requestId = Number(this.requestId || 0) + 1
      var request = this.requestId
      this.loading = true
      this.error = ''
      var url = '/api/method/backend_custom_app.api.messages.get_message_group_candidates?group=' + encodeURIComponent(this.group || '') + '&search=' + encodeURIComponent(term || '') + '&limit=50'
      return apiGet(url).then(function(res) {
        if (request !== self.requestId) {
          return
        }
        var rows = res || []
        var list = []
        for (var i = 0; i < rows.length; i = i + 1) {
          list.push(rows[i])
        }
        self.candidates = list
        self.loading = false
      }).catch(function(e) {
        if (request !== self.requestId) {
          return
        }
        self.candidates = []
        self.error = e && e.message ? e.message : 'Unable to load people.'
        self.loading = false
      })
    },
    onSearchInput(event) {
      var input = event && event.target
      this.searchText = input && input.value ? String(input.value) : ''
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      var self = this
      this.searchTimer = setTimeout(function() {
        self.searchTimer = null
        self.loadCandidates(self.searchText)
      }, 250)
    },
    matchesRoleFilter(label) {
      if (this.roleFilter === 'All') {
        return true
      }
      var value = String(label || '')
      if (this.roleFilter === 'Admins') {
        return value === 'Admin'
      }
      if (this.roleFilter === 'Instructors') {
        return value === 'Instructor'
      }
      if (this.roleFilter === 'Students') {
        return value === 'Student'
      }
      return true
    },
    isCreator(candidate) {
      if (!this.creator || !candidate) {
        return false
      }
      return candidate.user === this.creator
    },
    isDisabled(candidate) {
      if (!candidate) {
        return true
      }
      return Boolean(candidate.already_member) || this.isCreator(candidate)
    },
    isSelected(candidate) {
      if (!candidate) {
        return false
      }
      for (var i = 0; i < this.selected.length; i = i + 1) {
        if (this.selected[i].user === candidate.user) {
          return true
        }
      }
      return false
    },
    toggleCandidate(candidate) {
      if (this.isDisabled(candidate)) {
        return
      }
      for (var i = 0; i < this.selected.length; i = i + 1) {
        if (this.selected[i].user === candidate.user) {
          this.selected.splice(i, 1)
          this.emitSelection()
          return
        }
      }
      this.selected.push(candidate)
      this.emitSelection()
    },
    removeSelected(user) {
      for (var i = this.selected.length - 1; i >= 0; i = i - 1) {
        if (this.selected[i].user === user) {
          this.selected.splice(i, 1)
        }
      }
      this.emitSelection()
    },
    emitSelection() {
      this.$emit('update:selected', this.selectedUsers)
    },
    confirmSelection() {
      this.$emit('confirm', this.selectedUsers)
    },
    initials(name) {
      var text = String(name || '').trim()
      if (!text) {
        return 'U'
      }
      var parts = text.split(' ')
      var first = parts[0] || ''
      var second = ''
      for (var i = 1; i < parts.length; i = i + 1) {
        if (parts[i]) {
          second = parts[i]
          break
        }
      }
      var out = first.charAt(0)
      if (second) {
        out = out + second.charAt(0)
      } else if (first.length > 1) {
        out = out + first.charAt(1)
      }
      return out.toUpperCase()
    },
    colorFor(value) {
      var palette = ['#453D89', '#7c6ee6', '#C8499A', '#0ea5a4', '#d97706', '#2563eb', '#7c3aed', '#be185d']
      var text = String(value || '')
      var hash = 0
      for (var i = 0; i < text.length; i = i + 1) {
        hash = (hash * 31 + text.charCodeAt(i)) % 100000
      }
      return palette[hash % palette.length]
    }
  }
}
</script>

<style scoped>
.member-picker-inline {
  display: block;
  min-width: 0;
}
.picker-layer {
  position: fixed;
  z-index: 58000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.picker-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  margin: 0;
  background: rgba(30, 27, 55, 0.42);
  cursor: pointer;
}
.picker-modal,
.member-picker-body {
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.picker-modal {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  border: 1px solid #e7dff8;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(69, 61, 137, 0.24);
}
.member-picker-body {
  max-height: 320px;
}
.picker-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.picker-heading {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.picker-title {
  color: #1f2937;
  font-size: 15px;
  font-weight: 800;
}
.picker-sub {
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
}
.picker-close {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-size: 18px;
  cursor: pointer;
}
.picker-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1px solid #d7deea;
  border-radius: 9px;
  background: #ffffff;
}
.picker-search-icon {
  color: #7c6ee6;
  font-size: 15px;
}
.picker-search {
  flex: 1 1 auto;
  min-width: 0;
  height: 34px;
  border: none;
  outline: none;
  background: transparent;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
}
.picker-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.picker-filter {
  min-height: 24px;
  box-sizing: border-box;
  padding: 3px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #64748b;
  font-family: inherit;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}
.picker-filter-active {
  border-color: transparent;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.picker-error,
.picker-state {
  padding: 8px 10px;
  border-radius: 9px;
  background: #faf8ff;
  color: #64748b;
  font-size: 11px;
  word-break: break-word;
}
.picker-error {
  color: #b42318;
}
.picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.picker-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border: 1px solid #d8cef4;
  border-radius: 999px;
  background: #f8f6ff;
  color: #453d89;
  font-size: 10px;
  font-weight: 800;
  word-break: break-word;
}
.picker-chip-fixed {
  border-color: #e7dff8;
  background: #f4f1ff;
}
.picker-chip-remove {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #e7dff8;
  color: #453d89;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
.picker-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.picker-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #ffffff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
}
.picker-row:hover,
.picker-row:focus-visible {
  border-color: #e7dff8;
  background: #f8f6ff;
  outline: none;
}
.picker-row:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.picker-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
}
.picker-row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.picker-row-name {
  color: #1f2937;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-row-sub {
  color: #64748b;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-row-tag,
.picker-row-mark {
  flex: 0 0 auto;
  color: #7c6ee6;
  font-size: 10px;
  font-weight: 800;
}
.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.picker-cancel,
.picker-submit {
  min-height: 34px;
  box-sizing: border-box;
  padding: 7px 13px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.picker-cancel {
  border: 1px solid #d7deea;
  background: #ffffff;
  color: #475569;
}
.picker-submit {
  border: 1px solid transparent;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.picker-close:focus-visible,
.picker-search:focus-visible,
.picker-filter:focus-visible,
.picker-chip-remove:focus-visible,
.picker-cancel:focus-visible,
.picker-submit:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
@media (max-width: 375px) {
  .picker-layer {
    padding: 10px;
  }
  .picker-modal {
    padding: 12px;
  }
}
</style>
