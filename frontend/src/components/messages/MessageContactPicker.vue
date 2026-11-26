<template>
  <div class="contact-picker">
    <div class="contact-head">
      <span class="contact-title">Share contact</span>
      <button type="button" class="contact-close" aria-label="Close contact picker" v-on:click="$emit('cancel')">×</button>
    </div>
    <div class="contact-note">Only the name and role shown in this group are shared.</div>
    <div class="contact-list">
      <button
        type="button"
        class="contact-row"
        v-for="member in members"
        v-bind:key="member.user || member.name"
        v-on:click="$emit('select', member)"
      >
        <span class="contact-avatar">{{ initials(member.display_name || member.user) }}</span>
        <span class="contact-info">
          <span class="contact-name">{{ member.display_name || member.user }}</span>
          <span class="contact-role">{{ roleLabel(member.role_label) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageContactPicker',
  props: {
    members: {
      type: Array,
      default() {
        return []
      }
    }
  },
  methods: {
    initials(name) {
      var text = String(name || '').trim()
      if (!text) {
        return 'M'
      }
      var parts = text.split(' ')
      var out = parts[0].charAt(0)
      if (parts.length > 1 && parts[1]) {
        out = out + parts[1].charAt(0)
      }
      return out.toUpperCase()
    },
    roleLabel(label) {
      if (label === 'Admin' || label === 'Instructor' || label === 'Student') {
        return label
      }
      return ''
    }
  }
}
</script>

<style scoped>
.contact-picker {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: calc(100% + 8px);
  z-index: 30;
  box-sizing: border-box;
  max-height: 300px;
  padding: 10px;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}
.contact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.contact-title {
  color: #1f2937;
  font-size: 12px;
  font-weight: 800;
}
.contact-close {
  width: 24px;
  height: 24px;
  border: 1px solid #d7deea;
  border-radius: 7px;
  color: #64748b;
  background: #f1f3f9;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.contact-note {
  margin: 6px 0 8px;
  color: #64748b;
  font-size: 10px;
}
.contact-list {
  max-height: 210px;
  overflow-y: auto;
}
.contact-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 5px;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.contact-row:hover {
  background: #f1f3f9;
}
.contact-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);
  font-size: 10px;
  font-weight: 800;
}
.contact-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.contact-name {
  color: #1f2937;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.contact-role {
  color: #7c6ee6;
  font-size: 10px;
  font-weight: 700;
}
</style>
