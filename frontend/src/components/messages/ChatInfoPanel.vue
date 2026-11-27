<template>
  <section class="info-layer" role="dialog" aria-modal="true" aria-label="Chat information">
    <button type="button" class="info-backdrop" aria-label="Close chat information" v-on:click="$emit('close')"></button>
    <aside class="info-panel">
      <button type="button" class="info-handle" aria-label="Close chat information" v-on:click="$emit('close')"></button>
      <div class="info-cover">
        <span class="info-avatar">{{ avatarText }}</span>
        <span class="info-name">{{ title }}</span>
        <span class="info-meta">{{ memberCount }} members</span>
        <span v-if="creatorName" class="info-creator">Created by {{ creatorName }}</span>
        <button type="button" class="info-close" aria-label="Close chat information" v-on:click="$emit('close')">×</button>
      </div>
      <div class="info-quick-actions">
        <button type="button" class="info-quick" aria-label="Search in chat" v-on:click="$emit('search')">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>Search</span>
        </button>
        <button type="button" class="info-quick" v-bind:aria-label="soundLabel" v-on:click="$emit('toggle-sound')">
          <svg v-if="soundMuted" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM17 9c1.6 1.6 1.6 4.4 0 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>{{ soundMuted ? 'Unmute' : 'Mute' }}</span>
        </button>
        <button type="button" class="info-quick" aria-label="View members" v-on:click="$emit('view-members')">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 19c.6-3 2.2-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 6.2c1.7.3 2.8 1.5 2.8 3.1 0 1.4-.9 2.6-2.2 3.1M17.5 14.7c2 .5 3.1 1.9 3.5 4.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>Members</span>
        </button>
      </div>
      <button v-if="canManageSendRules" type="button" class="info-send-rule-row" aria-label="Who can send messages" v-on:click="$emit('open-send-rules')">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        <span class="info-send-rule-copy">
          <span class="info-send-rule-name">Who can send messages</span>
          <span class="info-send-rule-helper">{{ sendModeLabel }}</span>
        </span>
        <span class="info-send-rule-arrow">›</span>
      </button>
      <div v-if="description" class="info-description">{{ description }}</div>
      <div class="info-tabs" role="tablist">
        <button type="button" role="tab" class="info-tab" v-bind:class="activeTab === 'media' ? 'info-tab-active' : ''" v-bind:aria-selected="activeTab === 'media' ? 'true' : 'false'" v-on:click="setTab('media')">Media <span>{{ mediaCount }}</span></button>
        <button type="button" role="tab" class="info-tab" v-bind:class="activeTab === 'files' ? 'info-tab-active' : ''" v-bind:aria-selected="activeTab === 'files' ? 'true' : 'false'" v-on:click="setTab('files')">Files <span>{{ filesCount }}</span></button>
        <button type="button" role="tab" class="info-tab" v-bind:class="activeTab === 'links' ? 'info-tab-active' : ''" v-bind:aria-selected="activeTab === 'links' ? 'true' : 'false'" v-on:click="setTab('links')">Links <span>{{ linksCount }}</span></button>
      </div>
      <div class="info-scroll">
        <div v-if="activeTab === 'media'" class="info-tab-panel">
          <div v-if="shownMedia.length === 0" class="info-empty">
            <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><rect x="6" y="10" width="36" height="28" rx="6" fill="#f1ecff"/><circle cx="17" cy="20" r="3.5" fill="#7c6ee6"/><path d="M10 33l9-9 6 6 5-5 8 8" fill="none" stroke="#453d89" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>No media yet</span>
          </div>
          <div v-else class="media-grid">
            <a v-for="item in shownMedia" v-bind:key="item.message_name + '-media-' + item.file_name" class="media-tile" v-bind:href="item.download_url" target="_blank" rel="noopener noreferrer" v-bind:title="item.file_name">
              <img v-if="item.message_type === 'image'" v-bind:src="item.preview_url || item.download_url" v-bind:alt="item.file_name" loading="lazy" />
              <span v-else class="media-video">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 7l9 5-9 5z" fill="currentColor"/></svg>
              </span>
            </a>
          </div>
          <button v-if="!showAllMedia && mediaItems.length > 6" type="button" class="view-all" v-on:click="expand">View all</button>
        </div>
        <div v-if="activeTab === 'files'" class="info-tab-panel">
          <div v-if="shownDocuments.length === 0" class="info-empty">
            <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M13 6h15l8 8v28H13z" fill="#f1ecff" stroke="#d8cef4" stroke-width="2"/><path d="M28 6v9h8M18 26h13M18 32h10" fill="none" stroke="#453d89" stroke-width="2.2" stroke-linecap="round"/></svg>
            <span>No files yet</span>
          </div>
          <div v-else>
            <div class="shared-item" v-for="item in shownDocuments" v-bind:key="item.message_name + '-file-' + item.file_name">
              <span v-bind:class="tileClass(item)" class="info-tile">{{ tileLabel(item) }}</span>
              <span class="shared-detail">
                <span class="shared-title">{{ item.file_name }}</span>
                <span class="shared-meta">{{ dateLabel(item.sent_at) }} · {{ sizeLabel(item.file_size) }}</span>
              </span>
              <a class="download-btn" v-bind:href="item.download_url" download>Download</a>
            </div>
          </div>
          <button v-if="!showAllFiles && documentItems.length > 6" type="button" class="view-all" v-on:click="expand">View all</button>
        </div>
        <div v-if="activeTab === 'links'" class="info-tab-panel">
          <div v-if="shownLinks.length === 0" class="info-empty">
            <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M20 28l-3 3a6 6 0 0 1-8-8l6-6a6 6 0 0 1 8 0M28 20l3-3a6 6 0 0 1 8 8l-6 6a6 6 0 0 1-8 0M18 30l12-12" fill="none" stroke="#453d89" stroke-width="2.2" stroke-linecap="round"/></svg>
            <span>No links yet</span>
          </div>
          <div v-else>
            <div class="shared-item" v-for="item in shownLinks" v-bind:key="item.message_name + '-link-' + item.url">
              <span class="info-tile info-tile-link">URL</span>
              <span class="shared-detail">
                <span class="shared-title">{{ item.host || host(item.url) }}</span>
                <a class="shared-url" v-bind:href="item.url" target="_blank" rel="noopener noreferrer">{{ item.url }}</a>
                <span class="shared-meta">{{ dateLabel(item.sent_at) }}</span>
              </span>
            </div>
          </div>
          <button v-if="!showAllLinks && links.length > 6" type="button" class="view-all" v-on:click="expand">View all</button>
        </div>
      </div>
      <div class="info-danger">
        <button type="button" class="info-danger-row" aria-label="Delete chat" v-on:click="$emit('delete-chat')">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>Delete chat</span>
        </button>
        <button v-if="canExitGroup" type="button" class="info-danger-row" aria-label="Exit group" v-on:click="$emit('exit-group')">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M14 5h5v14h-5M11 8l-4 4 4 4M7 12h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Exit group</span>
        </button>
        <button v-if="canDeleteGroup" type="button" class="info-danger-row" aria-label="Delete group" v-on:click="$emit('delete-group')">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>Delete group</span>
        </button>
      </div>
      <GroupSendRulesPanel
        v-if="sendRulesOpen"
        v-bind:group="group"
        v-bind:send-mode="sendMode"
        v-bind:members="members"
        v-on:back="$emit('close-send-rules')"
        v-on:toast="$emit('send-rules-toast', $event)"
        v-on:changed="$emit('send-rules-changed')"
      />
    </aside>
  </section>
</template>

<script>
import GroupSendRulesPanel from '@/components/messages/GroupSendRulesPanel.vue'

export default {
  name: 'ChatInfoPanel',
  components: {
    GroupSendRulesPanel
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    avatarText: {
      type: String,
      default: ''
    },
    memberCount: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    creatorName: {
      type: String,
      default: ''
    },
    groupType: {
      type: String,
      default: ''
    },
    soundMuted: {
      type: Boolean,
      default: false
    },
    soundLabel: {
      type: String,
      default: 'Turn message sound off'
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
    files: {
      type: Array,
      default: function() {
        return []
      }
    },
    links: {
      type: Array,
      default: function() {
        return []
      }
    },
    filesCount: {
      type: Number,
      default: 0
    },
    linksCount: {
      type: Number,
      default: 0
    },
    group: {
      type: String,
      default: ''
    },
    members: {
      type: Array,
      default: function() {
        return []
      }
    },
    sendMode: {
      type: String,
      default: 'everyone'
    },
    canManageSendRules: {
      type: Boolean,
      default: false
    },
    sendRulesOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'media',
      showAllMedia: false,
      showAllFiles: false,
      showAllLinks: false
    }
  },
  computed: {
    sendModeLabel() {
      if (this.sendMode === 'admins_instructors') {
        return 'Only admins and instructors'
      }
      if (this.sendMode === 'selected') {
        return 'Only selected members'
      }
      return 'Everyone'
    },
    mediaItems() {
      var list = []
      var i = 0
      while (i < this.files.length) {
        var type = String(this.files[i].message_type || '')
        if (type === 'image' || type === 'video') {
          list.push(this.files[i])
        }
        i = i + 1
      }
      return list
    },
    documentItems() {
      var list = []
      var i = 0
      while (i < this.files.length) {
        var type = String(this.files[i].message_type || '')
        if (type !== 'image' && type !== 'video') {
          list.push(this.files[i])
        }
        i = i + 1
      }
      return list
    },
    mediaCount() {
      return this.mediaItems.length
    },
    shownMedia() {
      if (this.showAllMedia) {
        return this.mediaItems
      }
      return this.mediaItems.slice(0, 6)
    },
    shownDocuments() {
      if (this.showAllFiles) {
        return this.documentItems
      }
      return this.documentItems.slice(0, 6)
    },
    shownLinks() {
      if (this.showAllLinks) {
        return this.links
      }
      return this.links.slice(0, 6)
    }
  },
  methods: {
    setTab(tab) {
      this.activeTab = tab
    },
    expand() {
      if (this.activeTab === 'media') {
        this.showAllMedia = true
        this.$emit('view-all', 'file')
        return
      }
      if (this.activeTab === 'files') {
        this.showAllFiles = true
        this.$emit('view-all', 'file')
        return
      }
      this.showAllLinks = true
      this.$emit('view-all', 'link')
    },
    tileClass(item) {
      var type = String(item && item.message_type ? item.message_type : 'file')
      if (type === 'audio') {
        return 'info-tile info-tile-audio'
      }
      return 'info-tile info-tile-file'
    },
    tileLabel(item) {
      var type = String(item && item.message_type ? item.message_type : 'file')
      if (type === 'audio') {
        return 'AUD'
      }
      return 'DOC'
    },
    host(url) {
      var value = String(url || '')
      var start = value.indexOf('://')
      if (start >= 0) {
        value = value.substring(start + 3)
      }
      var end = value.indexOf('/')
      if (end > 0) {
        value = value.substring(0, end)
      }
      return value
    },
    parseDateParts(value) {
      var text = String(value || '')
      var match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(text)
      if (!match) {
        return null
      }
      return {
        year: match[1],
        month: Number(match[2]),
        day: match[3],
        hours: match[4] || '00',
        minutes: match[5] || '00'
      }
    },
    padDatePart(value) {
      var text = String(value)
      if (text.length < 2) {
        return '0' + text
      }
      return text
    },
    dateLabel(value) {
      var parts = this.parseDateParts(value)
      if (!parts) {
        return String(value || '')
      }
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      var month = months[parts.month - 1] || ''
      return parts.day + ' ' + month + ' ' + parts.year + ', ' + this.padDatePart(parts.hours) + ':' + this.padDatePart(parts.minutes)
    },
    sizeLabel(value) {
      var bytes = Number(value || 0)
      if (bytes < 1024) {
        return String(bytes) + ' B'
      }
      if (bytes < 1024 * 1024) {
        return String(Math.round(bytes / 1024)) + ' KB'
      }
      return String((bytes / (1024 * 1024)).toFixed(1)) + ' MB'
    }
  }
}
</script>

<style scoped>
.info-layer {
  position: absolute;
  z-index: 40;
  inset: 0;
}
.info-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  background: rgba(15, 23, 42, 0.45);
  cursor: pointer;
}
.info-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(370px, 100%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #ece8f7;
  background: #ffffff;
  box-shadow: -10px 0 30px rgba(69, 61, 137, 0.12);
  overflow: hidden;
}
.info-handle {
  display: none;
}
.info-cover {
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 22px 44px 16px 16px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.info-avatar {
  width: 72px;
  height: 72px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(24, 18, 54, 0.24);
}
.info-name {
  max-width: 100%;
  margin-top: 6px;
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-meta {
  font-size: 11px;
  opacity: 0.92;
}
.info-creator {
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 10px;
  font-weight: 700;
}
.info-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
}
.info-quick-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  padding: 10px 12px 4px 12px;
}
.info-quick {
  min-width: 64px;
  min-height: 52px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #453d89;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.info-quick svg {
  width: 36px;
  height: 36px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 50%;
  background: #f1ecff;
}
.info-quick:hover,
.info-quick:focus-visible {
  background: #f8f6ff;
  outline: 2px solid #7c6ee6;
  outline-offset: 1px;
}
.info-send-rule-row {
  width: calc(100% - 24px);
  min-height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 12px 0 12px;
  padding: 8px 10px;
  box-sizing: border-box;
  border: 1px solid #eee9f8;
  border-radius: 14px;
  background: #fcfbff;
  box-shadow: 0 5px 14px rgba(69, 61, 137, 0.06);
  color: #453d89;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.info-send-rule-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-send-rule-name {
  color: #1f2937;
  font-size: 11px;
  font-weight: 800;
}
.info-send-rule-helper {
  color: #7b718f;
  font-size: 10px;
}
.info-send-rule-arrow {
  flex: 0 0 auto;
  color: #7c6ee6;
  font-size: 18px;
}
.info-description {
  flex: 0 0 auto;
  margin: 6px 14px 0 14px;
  padding: 9px 11px;
  border: 1px solid #f1edf9;
  border-radius: 12px;
  background: #faf8ff;
  color: #475569;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-word;
}
.info-tabs {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  padding: 10px 12px 6px 12px;
}
.info-tab {
  flex: 1 1 0;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.info-tab span {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #f1ecff;
  color: #453d89;
  font-size: 9px;
}
.info-tab-active {
  border-color: #e7dff8;
  background: #f8f6ff;
  color: #453d89;
}
.info-tab:focus-visible,
.info-send-rule-row:focus-visible,
.info-close:focus-visible,
.info-handle:focus-visible,
.view-all:focus-visible,
.download-btn:focus-visible,
.shared-url:focus-visible,
.info-danger-row:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
.info-scroll {
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 14px 12px 14px;
  overflow-y: auto;
  overflow-x: hidden;
}
.info-tab-panel {
  min-width: 0;
}
.info-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 10px;
  color: #7b718f;
  font-size: 11px;
}
.media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.media-tile {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  border: 1px solid #ece8f7;
  border-radius: 10px;
  background: #f4f1ff;
  overflow: hidden;
}
.media-tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);
}
.shared-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 0;
  border-bottom: 1px solid #f5f2fb;
  min-width: 0;
}
.info-tile {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
}
.info-tile-audio {
  background: #0ea5a4;
}
.info-tile-file {
  background: #453d89;
}
.info-tile-link {
  background: #7c6ee6;
}
.shared-detail {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.shared-title {
  color: #1f2937;
  font-size: 11px;
  font-weight: 700;
  word-break: break-word;
}
.shared-meta {
  color: #7b718f;
  font-size: 10px;
}
.shared-url {
  color: #453d89;
  font-size: 10px;
  word-break: break-all;
}
.download-btn {
  flex: 0 0 auto;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border: 1px solid #d8cef4;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-size: 10px;
  font-weight: 800;
  text-decoration: none;
}
.view-all {
  margin-top: 8px;
  min-height: 40px;
  border: none;
  background: transparent;
  color: #453d89;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.info-danger {
  flex: 0 0 auto;
  padding: 6px 14px calc(10px + env(safe-area-inset-bottom)) 14px;
  border-top: 1px solid #f1edf9;
  background: #ffffff;
}
.info-danger-row {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border: none;
  border-bottom: 1px solid #f5f2fb;
  background: transparent;
  color: #b42318;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.info-danger-row:last-child {
  border-bottom: none;
}
@media (max-width: 768px) {
  .info-layer {
    position: absolute;
    overflow: hidden;
  }
  .info-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(85dvh, 100%);
    max-height: 85dvh;
    border-left: none;
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -14px 40px rgba(34, 30, 69, 0.24);
  }
  .info-scroll {
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
  .info-danger {
    padding-right: calc(72px + env(safe-area-inset-right));
    padding-bottom: calc(76px + env(safe-area-inset-bottom));
    padding-left: calc(14px + env(safe-area-inset-left));
  }
  .info-handle {
    display: block;
    position: absolute;
    z-index: 2;
    top: 7px;
    left: 50%;
    width: 44px;
    height: 20px;
    transform: translateX(-50%);
    border: none;
    background: transparent;
    cursor: pointer;
  }
  .info-handle::after {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    margin: 8px auto 0 auto;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.75);
  }
  .info-cover {
    padding-top: calc(24px + env(safe-area-inset-top));
  }
}
@media (max-width: 375px) {
  .info-quick-actions {
    padding-left: 4px;
    padding-right: 4px;
  }
  .info-danger {
    padding-right: calc(64px + env(safe-area-inset-right));
  }
}
@media (prefers-reduced-motion: reduce) {
  .info-tab,
  .info-quick,
  .download-btn {
    transition: none;
  }
}
</style>
