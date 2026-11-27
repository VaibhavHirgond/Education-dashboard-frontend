<template>
  <div class="send-rules-layer">
    <div class="send-rules-header">
      <button type="button" class="send-rules-back" aria-label="Back to chat information" v-on:click="$emit('back')">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="send-rules-title">Who can send messages</span>
    </div>
    <div class="send-rules-scroll">
      <label class="send-rule-option" v-for="option in options" v-bind:key="option.value">
        <input type="radio" class="send-rule-radio" name="send-rule-mode" v-bind:value="option.value" v-model="selectedMode" />
        <span class="send-rule-copy">
          <span class="send-rule-name">{{ option.name }}</span>
          <span class="send-rule-helper">{{ option.helper }}</span>
        </span>
      </label>
      <div v-if="selectedMode === 'selected'" class="send-rule-pickers">
        <div class="send-rule-picker-title">Choose members</div>
        <input type="search" class="send-rule-search" v-model="searchText" placeholder="Search members" aria-label="Search members" />
        <div v-if="filteredMembers.length === 0" class="send-rule-empty">No matching members.</div>
        <label class="send-rule-member" v-for="member in filteredMembers" v-bind:key="memberKey(member)">
          <input
            type="checkbox"
            class="send-rule-checkbox"
            v-bind:checked="isSelected(member)"
            v-bind:disabled="isFixedSender(member)"
            v-on:change="toggleMember(member, $event.target.checked)"
          />
          <span class="send-rule-member-name">{{ member.display_name || memberKey(member) }}</span>
          <span v-if="isFixedSender(member)" class="send-rule-role">{{ roleText(member.role_label) }}</span>
        </label>
      </div>
      <div v-if="errorText" class="send-rule-error">{{ errorText }}</div>
    </div>
    <div class="send-rule-actions">
      <button type="button" class="send-rule-cancel" v-on:click="$emit('back')">Cancel</button>
      <button type="button" class="send-rule-save" v-bind:disabled="saving" v-on:click="save">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
</template>

<script>
import { apiPost } from '@/lib/api'

export default {
  name: 'GroupSendRulesPanel',
  props: {
    group: {
      type: String,
      default: ''
    },
    sendMode: {
      type: String,
      default: 'everyone'
    },
    members: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  data() {
    return {
      selectedMode: 'everyone',
      selectedMembers: [],
      searchText: '',
      saving: false,
      errorText: ''
    }
  },
  computed: {
    options() {
      return [
        {
          value: 'everyone',
          name: 'Everyone can send',
          helper: 'All group members can send messages.'
        },
        {
          value: 'admins_instructors',
          name: 'Only admins and instructors can send',
          helper: 'Students and other members can read only.'
        },
        {
          value: 'selected',
          name: 'Only selected members can send',
          helper: 'Choose the members who are allowed to send.'
        }
      ]
    },
    filteredMembers() {
      var list = []
      var term = String(this.searchText || '').trim().toLowerCase()
      var i = 0
      while (i < this.members.length) {
        var member = this.members[i]
        var name = String(member.display_name || member.user || '')
        var user = String(member.user || '')
        if (!term || name.toLowerCase().indexOf(term) >= 0 || user.toLowerCase().indexOf(term) >= 0) {
          list.push(member)
        }
        i = i + 1
      }
      return list
    }
  },
  watch: {
    sendMode: function() {
      this.resetToProps()
    },
    members: function() {
      this.resetToProps()
    }
  },
  mounted() {
    this.resetToProps()
  },
  methods: {
    resetToProps() {
      this.selectedMode = String(this.sendMode || 'everyone')
      this.selectedMembers = []
      var i = 0
      while (i < this.members.length) {
        var member = this.members[i]
        if (!this.isFixedSender(member) && member.can_send && !member.read_only) {
          this.selectedMembers.push(String(member.user || ''))
        }
        i = i + 1
      }
      this.errorText = ''
    },
    memberKey(member) {
      return String(member && member.user ? member.user : '')
    },
    roleText(label) {
      if (label === 'Admin' || label === 'Instructor' || label === 'Student') {
        return label
      }
      return ''
    },
    isFixedSender(member) {
      if (!member || member.read_only) {
        return false
      }
      return member.role_label === 'Admin' || member.role_label === 'Instructor'
    },
    isSelected(member) {
      if (this.isFixedSender(member)) {
        return true
      }
      return this.selectedMembers.indexOf(this.memberKey(member)) >= 0
    },
    toggleMember(member, checked) {
      if (this.isFixedSender(member)) {
        return
      }
      var key = this.memberKey(member)
      if (!key) {
        return
      }
      var index = this.selectedMembers.indexOf(key)
      if (checked && index < 0) {
        this.selectedMembers.push(key)
      }
      if (!checked && index >= 0) {
        this.selectedMembers.splice(index, 1)
      }
    },
    selectedUsers() {
      var list = []
      var i = 0
      while (i < this.members.length) {
        var member = this.members[i]
        var key = this.memberKey(member)
        if (key && (this.isFixedSender(member) || this.selectedMembers.indexOf(key) >= 0) && list.indexOf(key) < 0) {
          list.push(key)
        }
        i = i + 1
      }
      return list
    },
    save() {
      if (this.saving || !this.group) {
        return
      }
      var self = this
      var oldMode = String(this.sendMode || 'everyone')
      var oldSelected = []
      var i = 0
      while (i < this.selectedMembers.length) {
        oldSelected.push(this.selectedMembers[i])
        i = i + 1
      }
      this.saving = true
      this.errorText = ''
      apiPost('/api/method/backend_custom_app.api.messages.update_group_send_rules', {
        group: this.group,
        send_mode: this.selectedMode,
        members: this.selectedUsers()
      }).then(function() {
        self.saving = false
        self.$emit('toast', { text: 'Who can send messages saved.', error: false })
        self.$emit('changed')
      }).catch(function(e) {
        self.selectedMode = oldMode
        self.selectedMembers = oldSelected
        self.errorText = e && e.message ? e.message : 'Unable to save who can send messages.'
        self.saving = false
        self.$emit('toast', { text: self.errorText, error: true })
      })
    }
  }
}
</script>

<style scoped>
.send-rules-layer {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}
.send-rules-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: calc(10px + env(safe-area-inset-top)) 12px 10px 12px;
  box-sizing: border-box;
  border-bottom: 1px solid #f1edf9;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.send-rules-back {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  cursor: pointer;
}
.send-rules-title {
  font-size: 13px;
  font-weight: 800;
}
.send-rules-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px calc(18px + env(safe-area-inset-bottom)) 14px;
}
.send-rule-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  margin-bottom: 8px;
  box-sizing: border-box;
  border: 1px solid #eee9f8;
  border-radius: 14px;
  background: #fcfbff;
  box-shadow: 0 5px 14px rgba(69, 61, 137, 0.06);
  cursor: pointer;
}
.send-rule-radio,
.send-rule-checkbox {
  flex: 0 0 auto;
  margin: 2px 0 0 0;
  accent-color: #7c6ee6;
}
.send-rule-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.send-rule-name {
  color: #1f2937;
  font-size: 12px;
  font-weight: 800;
}
.send-rule-helper {
  color: #7b718f;
  font-size: 10px;
  line-height: 1.45;
}
.send-rule-pickers {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #eee9f8;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 5px 14px rgba(69, 61, 137, 0.06);
}
.send-rule-picker-title {
  margin-bottom: 8px;
  color: #453d89;
  font-size: 11px;
  font-weight: 800;
}
.send-rule-search {
  width: 100%;
  height: 38px;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1px solid #e7e0f6;
  border-radius: 10px;
  background: #faf8ff;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
  outline: none;
}
.send-rule-search:focus {
  border-color: #7c6ee6;
  background: #ffffff;
}
.send-rule-member {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 7px 2px;
  border-bottom: 1px solid #f5f2fb;
  color: #1f2937;
  font-size: 11px;
}
.send-rule-member:last-child {
  border-bottom: none;
}
.send-rule-member-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.send-rule-role {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f1ecff;
  color: #453d89;
  font-size: 9px;
  font-weight: 800;
}
.send-rule-empty {
  padding: 14px 2px;
  color: #7b718f;
  font-size: 11px;
}
.send-rule-error {
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  background: #fff1f0;
  color: #b42318;
  font-size: 11px;
}
.send-rule-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px calc(14px + env(safe-area-inset-bottom)) 14px;
  box-sizing: border-box;
  border-top: 1px solid #f1edf9;
  background: #ffffff;
}
.send-rule-cancel,
.send-rule-save {
  min-height: 40px;
  flex: 1 1 0;
  border-radius: 999px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.send-rule-cancel {
  border: 1px solid #e7e0f6;
  background: #ffffff;
  color: #453d89;
}
.send-rule-save {
  border: none;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(69, 61, 137, 0.2);
}
.send-rule-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.send-rules-back:focus-visible,
.send-rule-search:focus-visible,
.send-rule-cancel:focus-visible,
.send-rule-save:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
@media (max-width: 375px) {
  .send-rules-scroll {
    padding-left: 10px;
    padding-right: 10px;
  }
  .send-rule-actions {
    padding-left: 10px;
    padding-right: calc(64px + env(safe-area-inset-right));
  }
}
</style>
