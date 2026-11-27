<template>
  <div class="new-group-layer" role="dialog" aria-modal="true" aria-label="Create a new group">
    <button type="button" class="new-group-backdrop" aria-label="Close new group dialog" v-on:click="$emit('cancel')"></button>
    <section class="new-group-modal" role="document">
      <div class="new-group-head">
        <span class="new-group-heading">
          <span class="new-group-title">New group</span>
          <span class="new-group-subtitle">Name it, then choose people.</span>
        </span>
        <button type="button" class="new-group-close" aria-label="Close new group dialog" v-on:click="$emit('cancel')">×</button>
      </div>
      <div class="new-group-scroll">
        <label class="new-group-field">
          <span>Group name</span>
          <input
            type="text"
            ref="nameInput"
            class="new-group-input"
            v-model="name"
            maxlength="60"
            placeholder="Enter a group name"
            aria-label="Group name"
            autocomplete="off"
            v-on:input="clearError"
          />
          <span class="new-group-count">{{ name.length }}/60</span>
          <span class="new-group-hint" v-bind:class="name.length >= 2 ? 'new-group-hint-ok' : ''">{{ name.length >= 2 ? 'Looks good' : 'Use at least 2 characters' }}</span>
        </label>
        <label class="new-group-field">
          <span>Description (optional)</span>
          <textarea
            class="new-group-textarea"
            v-model="description"
            rows="2"
            placeholder="What is this group for?"
            aria-label="Group description"
          ></textarea>
        </label>
        <div class="new-group-section">
          <span class="new-group-label">Members</span>
          <MessageMemberPicker
            v-bind:inline="true"
            v-bind:creator="creator"
            v-on:update:selected="onSelected"
          />
        </div>
        <div v-if="error || localError" class="new-group-error">{{ error || localError }}</div>
      </div>
      <div class="new-group-actions">
        <button type="button" class="new-group-cancel" v-on:click="$emit('cancel')">Cancel</button>
        <button type="button" class="new-group-submit" v-bind:disabled="busy" v-on:click="submit">{{ busy ? 'Creating...' : 'Create' }}</button>
      </div>
    </section>
  </div>
</template>

<script>
import MessageMemberPicker from '@/components/messages/MessageMemberPicker.vue'

export default {
  name: 'MessageNewGroupDialog',
  components: {
    MessageMemberPicker
  },
  props: {
    creator: {
      type: String,
      default: ''
    },
    busy: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      name: '',
      description: '',
      members: [],
      localError: '',
      previousFocus: null
    }
  },
  mounted() {
    var self = this
    this.previousFocus = document.activeElement
    this.$nextTick(function() {
      if (self.$refs.nameInput) {
        self.$refs.nameInput.focus()
      }
    })
  },
  beforeUnmount() {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus()
    }
  },
  methods: {
    clearError() {
      this.localError = ''
    },
    onSelected(users) {
      var list = []
      for (var i = 0; i < users.length; i = i + 1) {
        list.push(users[i])
      }
      this.members = list
    },
    submit() {
      var value = String(this.name || '').trim()
      if (value.length < 2 || value.length > 60) {
        this.localError = 'Group name must be between 2 and 60 characters.'
        return
      }
      this.localError = ''
      this.$emit('create', {
        name: value,
        description: String(this.description || '').trim(),
        members: this.members.slice()
      })
    }
  }
}
</script>

<style scoped>
.new-group-layer {
  position: fixed;
  z-index: 57000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.new-group-backdrop {
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
.new-group-modal {
  position: relative;
  z-index: 1;
  width: min(460px, 100%);
  max-height: calc(100dvh - 32px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e7dff8;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(69, 61, 137, 0.24);
}
.new-group-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #eee9f8;
  background: linear-gradient(105deg, #f8f6ff, #fff7fc);
}
.new-group-heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.new-group-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 800;
}
.new-group-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}
.new-group-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 16px;
}
.new-group-close {
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
.new-group-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  margin-bottom: 10px;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}
.new-group-input,
.new-group-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d7deea;
  border-radius: 9px;
  outline: none;
  background: #ffffff;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
}
.new-group-input {
  height: 36px;
  padding: 0 42px 0 10px;
}
.new-group-textarea {
  padding: 8px 10px;
  resize: vertical;
}
.new-group-input:focus,
.new-group-textarea:focus {
  border-color: #7c6ee6;
}
.new-group-count {
  position: absolute;
  right: 10px;
  top: 25px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
}
.new-group-hint {
  color: #b42318;
  font-size: 10px;
  font-weight: 700;
}
.new-group-hint-ok {
  color: #0f9d76;
}
.new-group-section {
  margin-top: 4px;
}
.new-group-label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}
.new-group-error {
  margin-top: 10px;
  padding: 7px 9px;
  border-radius: 8px;
  background: #fff1f0;
  color: #b42318;
  font-size: 11px;
  word-break: break-word;
}
.new-group-actions {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #eee9f8;
  background: #ffffff;
}
.new-group-cancel,
.new-group-submit {
  min-height: 34px;
  box-sizing: border-box;
  padding: 7px 13px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.new-group-cancel {
  border: 1px solid #d7deea;
  background: #ffffff;
  color: #475569;
}
.new-group-submit {
  border: 1px solid transparent;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.new-group-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.new-group-close:focus-visible,
.new-group-input:focus-visible,
.new-group-textarea:focus-visible,
.new-group-cancel:focus-visible,
.new-group-submit:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
@media (max-width: 768px) {
  .new-group-layer {
    align-items: flex-end;
    padding: 0;
  }
  .new-group-modal {
    width: 100%;
    max-height: calc(100dvh - 20px);
    border-radius: 18px 18px 0 0;
    border-bottom: none;
  }
  .new-group-head {
    padding: 14px 14px 12px;
  }
  .new-group-scroll {
    padding: 12px 14px;
  }
  .new-group-actions {
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  }
}
</style>
