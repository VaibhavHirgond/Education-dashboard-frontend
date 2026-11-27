<template>
  <header class="chat-header">
    <button type="button" class="back-btn" aria-label="Back to groups" v-on:click="$emit('back')">←</button>
    <button
      type="button"
      class="chat-avatar"
      v-bind:title="typeLabel + ' · View group details'"
      v-bind:aria-label="typeLabel + ' group type'"
      v-on:click="$emit('open-info')"
    >
      <span class="chat-avatar-text">{{ avatarText }}</span>
      <span class="type-badge" v-bind:title="typeLabel" v-bind:aria-label="typeLabel">
        <svg v-if="typeKey === 'staff'" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><circle cx="8" cy="5" r="2.4" fill="currentColor"/><path d="M3.5 13c.6-2.6 2.1-3.8 4.5-3.8s3.9 1.2 4.5 3.8" fill="currentColor"/></svg>
        <svg v-else-if="typeKey === 'class'" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2.5 5.5L8 3l5.5 2.5L8 8z" fill="currentColor"/><path d="M4.5 7.5v3c0 1 1.6 1.8 3.5 1.8s3.5-.8 3.5-1.8v-3L8 9.2z" fill="currentColor"/></svg>
        <svg v-else-if="typeKey === 'custom'" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M8 2l1.7 3.5 3.8.6-2.7 2.7.6 3.8L8 10.9 4.6 12.6l.6-3.8L2.5 6.1l3.8-.6z" fill="currentColor"/></svg>
        <svg v-else viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="11" cy="6" r="2" fill="currentColor"/><path d="M2 12c.5-2.4 1.7-3.5 3-3.5s2.5 1.1 3 3.5M8 12c.5-2.4 1.7-3.5 3-3.5s2.5 1.1 3 3.5" fill="currentColor"/></svg>
      </span>
    </button>
    <span class="chat-header-info">
      <span class="chat-title">{{ title }}</span>
      <span class="chat-meta" v-bind:class="typing ? 'chat-meta-typing' : ''">{{ meta }}</span>
    </span>
    <span v-if="visibleMembers.length > 0" class="member-stack" v-bind:title="memberTitle" v-on:click="$emit('open-members')">
      <span class="member-avatar" v-for="member in visibleMembers" v-bind:key="member.user || member.display_name">{{ memberInitials(member.display_name) }}</span>
      <span v-if="memberOverflow > 0" class="member-overflow">+{{ memberOverflow }}</span>
    </span>
    <span class="chat-header-actions">
      <span class="chat-action-group">
        <button type="button" class="round-icon-btn" v-bind:class="searchOpen ? 'round-icon-btn-active' : ''" aria-label="Search in chat" title="Search in chat" v-on:click="$emit('toggle-search')">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        </button>
        <button type="button" class="round-icon-btn" aria-label="Chat information" title="Chat information" v-on:click="$emit('open-info')">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 10.5v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/></svg>
        </button>
        <span class="chat-more">
          <button type="button" class="round-icon-btn" aria-label="More chat options" title="More chat options" v-bind:aria-expanded="moreOpen ? 'true' : 'false'" v-on:click="$emit('toggle-more')">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="5" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="19" r="1.7" fill="currentColor"/></svg>
          </button>
          <span v-if="moreOpen" class="chat-more-menu">
            <button type="button" class="chat-more-item" v-bind:aria-label="archived ? 'Unarchive chat' : 'Archive chat'" v-on:click="$emit(archived ? 'unarchive' : 'archive')">{{ archived ? 'Unarchive chat' : 'Archive chat' }}</button>
            <button type="button" class="chat-more-item" aria-label="View members" v-on:click="$emit('open-members')">Members</button>
            <button type="button" class="chat-more-item" aria-label="Clear chat" v-on:click="$emit('delete-chat')">Delete chat</button>
            <button v-if="canAddMembers" type="button" class="chat-more-item" aria-label="Add members" v-on:click="$emit('add-members')">Add members</button>
            <button v-if="canExitGroup" type="button" class="chat-more-item" aria-label="Exit group" v-on:click="$emit('exit-group')">Exit group</button>
            <button v-if="canDeleteGroup" type="button" class="chat-more-item chat-more-item-danger" aria-label="Delete group" v-on:click="$emit('delete-group')">Delete group</button>
            <button type="button" class="chat-more-item" v-bind:aria-label="soundLabel" v-on:click="$emit('toggle-sound')">{{ soundLabel }}</button>
          </span>
        </span>
      </span>
    </span>
    <span v-if="searchOpen" class="chat-search-bar">
      <input
        type="text"
        class="chat-search-input"
        aria-label="Search in loaded messages"
        placeholder="Search in this chat"
        v-bind:value="searchText"
        v-on:input="$emit('update:searchText', $event.target.value)"
      />
      <span class="chat-search-count">{{ searchCount ? searchIndex + 1 + ' of ' + searchCount : '0 of 0' }}</span>
      <button type="button" class="chat-search-btn" aria-label="Previous match" title="Previous match" v-bind:disabled="searchCount === 0" v-on:click="$emit('search-prev')">↑</button>
      <button type="button" class="chat-search-btn" aria-label="Next match" title="Next match" v-bind:disabled="searchCount === 0" v-on:click="$emit('search-next')">↓</button>
      <button type="button" class="chat-search-btn" aria-label="Close chat search" title="Close chat search" v-on:click="$emit('toggle-search')">×</button>
    </span>
  </header>
</template>

<script>
export default {
  name: 'ChatHeader',
  props: {
    title: {
      type: String,
      default: ''
    },
    avatarText: {
      type: String,
      default: 'M'
    },
    groupType: {
      type: String,
      default: ''
    },
    members: {
      type: Array,
      default: function() {
        return []
      }
    },
    meta: {
      type: String,
      default: ''
    },
    typing: {
      type: Boolean,
      default: false
    },
    soundMuted: {
      type: Boolean,
      default: false
    },
    soundLabel: {
      type: String,
      default: 'Turn message sound off'
    },
    archived: {
      type: Boolean,
      default: false
    },
    canAddMembers: {
      type: Boolean,
      default: false
    },
    canDeleteGroup: {
      type: Boolean,
      default: false
    },
    canExitGroup: {
      type: Boolean,
      default: true
    },
    moreOpen: {
      type: Boolean,
      default: false
    },
    searchOpen: {
      type: Boolean,
      default: false
    },
    searchText: {
      type: String,
      default: ''
    },
    searchCount: {
      type: Number,
      default: 0
    },
    searchIndex: {
      type: Number,
      default: 0
    }
  },
  computed: {
    typeKey: function() {
      var value = String(this.groupType || '').toLowerCase()
      if (value === 'staff') {
        return 'staff'
      }
      if (value === 'class') {
        return 'class'
      }
      if (value === 'custom') {
        return 'custom'
      }
      if (value === 'all') {
        return 'all'
      }
      return 'group'
    },
    typeLabel: function() {
      var value = String(this.groupType || '').toLowerCase()
      if (value === 'staff') {
        return 'Admin & Instructors / Staff'
      }
      if (value === 'class') {
        return 'Class'
      }
      if (value === 'custom') {
        return 'Custom'
      }
      if (value === 'all') {
        return 'All Members'
      }
      return 'Group'
    },
    visibleMembers: function() {
      return this.members.slice(0, 3)
    },
    memberOverflow: function() {
      return Math.max(this.members.length - 3, 0)
    },
    memberTitle: function() {
      var names = []
      var i = 0
      while (i < this.members.length) {
        names.push(this.members[i].display_name || this.members[i].user || '')
        i = i + 1
      }
      return names.join(', ')
    }
  },
  methods: {
    memberInitials: function(value) {
      var parts = String(value || '').trim().split(/\s+/)
      var first = parts.length > 0 && parts[0] ? parts[0].charAt(0) : ''
      var second = parts.length > 1 && parts[1] ? parts[1].charAt(0) : ''
      var result = (first + second).toUpperCase()
      return result || '?'
    }
  }
}
</script>

<style scoped>
.chat-header {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfbff 100%);
  border-bottom: 1px solid #ece8f7;
}
.back-btn {
  display: none;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-size: 17px;
  cursor: pointer;
}
.chat-avatar {
  position: relative;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  cursor: pointer;
}
.chat-avatar-text {
  font-size: 12px;
  font-weight: 800;
}
.type-badge {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #7c6ee6;
  color: #ffffff;
  box-shadow: 0 2px 5px rgba(69, 61, 137, 0.22);
}
.chat-avatar:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
.member-stack {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding-left: 6px;
  cursor: pointer;
}
.member-avatar {
  width: 26px;
  height: 26px;
  margin-left: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #eee9fb;
  color: #453d89;
  font-size: 8px;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(69, 61, 137, 0.12);
}
.member-overflow {
  width: 26px;
  height: 26px;
  margin-left: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #f8f6ff;
  color: #7c6ee6;
  font-size: 8px;
  font-weight: 800;
}
.chat-header-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.chat-title {
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-meta {
  margin-top: 2px;
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-meta-typing {
  color: #7c3aed;
  font-weight: 700;
}
.chat-header-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}
.chat-action-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid #ebe6f7;
  border-radius: 999px;
  background: #faf9fe;
}
.round-icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  cursor: pointer;
}
.round-icon-btn::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 999px;
}
.round-icon-btn:hover,
.round-icon-btn:focus-visible {
  background: #f8f6ff;
  border-color: #d8cef4;
  outline: none;
}
.round-icon-btn-active {
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  border-color: transparent;
}
.round-icon-btn:focus-visible,
.chat-search-btn:focus-visible,
.chat-search-input:focus-visible,
.chat-more-item:focus-visible,
.back-btn:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
.chat-more {
  position: relative;
  display: inline-flex;
}
.chat-more-menu {
  position: absolute;
  z-index: 20;
  top: 44px;
  right: 0;
  min-width: 170px;
  max-height: min(360px, calc(100dvh - 70px));
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(69, 61, 137, 0.14);
  overflow-y: auto;
  overflow-x: hidden;
}
.chat-more-item {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.chat-more-item:hover {
  background: #f8f6ff;
  color: #453d89;
}
.chat-more-item-danger {
  color: #b42318;
}
.chat-more-item-danger:hover {
  background: #fff1f0;
  color: #b42318;
}
.chat-search-bar {
  flex: 1 1 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  box-sizing: border-box;
  animation: chat-search-in 180ms ease-out;
}
@keyframes chat-search-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chat-search-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 34px;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1px solid #d7deea;
  border-radius: 999px;
  background: #fcfbff;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
  outline: none;
}
.chat-search-input:focus {
  border-color: #7c6ee6;
}
.chat-search-count {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.chat-search-btn {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-size: 14px;
  cursor: pointer;
}
.chat-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.msg-match {
  background: #f3e9ff;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #f3e9ff;
}
.msg-match-current {
  background: #e7d5ff;
  box-shadow: 0 0 0 2px #7c6ee6;
}
@media (max-width: 768px) {
  .back-btn {
    display: inline-flex;
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
  .chat-header {
    height: 60px;
    padding: 8px 10px;
    gap: 8px;
  }
  .member-stack {
    display: none;
  }
  .chat-header-actions {
    gap: 4px;
  }
  .round-icon-btn {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
  .chat-search-bar {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 8px;
    z-index: 5;
    height: 44px;
    padding: 0 8px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(69, 61, 137, 0.14);
  }
}
@media (max-width: 360px) {
  .chat-header {
    gap: 5px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .chat-header-actions {
    gap: 2px;
  }
  .chat-action-group {
    padding: 2px;
    gap: 0;
  }
  .round-icon-btn {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
  .chat-search-count {
    font-size: 9px;
  }
}
</style>
