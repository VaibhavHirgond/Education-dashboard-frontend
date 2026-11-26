<template>
  <div class="messages-page" v-bind:class="isEmbedded ? 'messages-page-embedded' : ''">
    <Sidebar v-if="!isEmbedded" />
    <main class="main-content" v-bind:class="isEmbedded ? 'main-content-embedded' : ''">
      <section class="messages-body">
        <div class="messages-shell" v-bind:class="chatOpen ? 'chat-open' : ''">
          <aside class="groups-panel">
            <div class="groups-head">
              <div class="groups-title">Messages</div>
              <div class="groups-search-wrap">
                <span class="search-icon">⌕</span>
                <input
                  type="text"
                  class="groups-search"
                  v-model="searchText"
                  placeholder="Search groups"
                  aria-label="Search groups"
                />
              </div>
            </div>
            <div class="group-list">
              <div v-if="loadingGroups" class="state-text">Loading groups...</div>
              <div v-if="!loadingGroups && groups.length === 0" class="list-empty">You are not a member of any group yet.</div>
              <div v-if="!loadingGroups && groups.length > 0 && visibleGroups.length === 0" class="list-empty">No matching groups.</div>
              <button
                type="button"
                class="group-row"
                v-for="g in visibleGroups"
                v-bind:key="g.name"
                v-bind:class="activeGroup && g.name === activeGroup.name ? 'group-row-active' : ''"
                v-on:click="selectGroup(g)"
              >
                <span class="avatar">{{ initials(groupDisplayName(g)) }}</span>
                <span class="group-row-main">
                  <span class="group-row-top">
                    <span class="group-row-name">{{ groupDisplayName(g) }}</span>
                    <span class="group-row-time">{{ groupTime(g) }}</span>
                  </span>
                  <span class="group-row-bottom">
                    <span class="group-row-preview">{{ groupPreview(g) }}</span>
                    <span class="group-unread" v-if="g.unread_count > 0">{{ unreadLabel(g.unread_count) }}</span>
                  </span>
                </span>
              </button>
            </div>
          </aside>

          <section class="chat-panel">
            <template v-if="activeGroup">
              <header class="chat-header">
                <button type="button" class="back-btn" aria-label="Back to groups" v-on:click="backToList">←</button>
                <span class="avatar avatar-chat">{{ initials(groupDisplayName(activeGroup)) }}</span>
                  <span class="chat-header-info">
                    <span class="chat-title">{{ groupDisplayName(activeGroup) }}</span>
                    <span class="chat-meta">{{ memberCountText }} members</span>
                  </span>
                  <button type="button" class="sound-btn" v-bind:aria-label="soundLabel" v-bind:title="soundLabel" v-on:click="toggleSound">
                    <svg v-if="!soundMuted" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5c1.2 1 1.2 6 0 7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M18.5 6c2.4 2.2 2.4 9.8 0 12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
                    <svg v-else viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
                  </button>
                  <button type="button" class="members-btn" v-on:click="openMembers">Members</button>

              </header>
              <div class="chat-banner">{{ bannerText }}</div>
              <div class="messages-list" ref="messagesListRef">
                <div v-if="loadingMessages" class="state-text">Loading messages...</div>
                <div v-if="!loadingMessages && messages.length === 0" class="empty-state">
                  <div class="empty-title">No messages yet</div>
                  <div class="empty-sub">Start the conversation by sending a message.</div>
                </div>
                <template v-for="(m, idx) in messages" v-bind:key="m.name">
                  <div v-if="showDaySeparator(idx)" class="day-separator">
                    <span class="day-separator-text">{{ dayLabel(m.sent_at) }}</span>
                  </div>
                  <div class="msg-row" v-bind:class="m.is_own ? 'msg-row-own' : 'msg-row-other'">
                    <div class="msg-bubble" v-bind:class="m.is_own ? 'msg-bubble-own' : 'msg-bubble-other'">
                      <div class="msg-meta-line">
                        <span class="msg-sender">{{ m.sender_name }}</span>
                        <span class="msg-role">{{ roleLabelText(m.role_label) }}</span>
                      </div>
                      <MessageRich
                        v-bind:message="m"
                        v-on:view-image="openImageViewer"
                        v-on:vote="votePoll"
                        v-on:close-poll="closePoll"
                      />
                      <div class="msg-time-row">
                        <span class="msg-time">{{ timeLabel(m.sent_at) }}</span>
                        <button v-if="m.is_own" type="button" class="msg-delete" v-on:click="deleteMessage(m.name)">Delete</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div class="messages-input-wrap composer-wrap">
                <div v-if="sendError" class="send-error">{{ sendError }}</div>
                <MessagePreviewStrip
                  v-if="pendingAttachment && !recording"
                  v-bind:attachment="pendingAttachment"
                  v-on:remove="removePendingAttachment"
                />
                <MessageVoiceRecorder
                  v-if="recording"
                  v-bind:seconds="recordSeconds"
                  v-on:cancel="cancelRecording"
                  v-on:send="sendVoiceRecording"
                />
                <div class="composer-panels">
                  <MessageEmojiPanel
                    v-if="emojiOpen"
                    v-on:select="insertEmoji"
                    v-on:sticker="sendSticker"
                    v-on:close="closeMenus"
                  />
                  <MessageAttachmentMenu
                    v-if="attachOpen"
                    v-on:select="onAttachmentSelect"
                    v-on:close="closeMenus"
                  />
                  <MessagePollForm
                    v-if="pollOpen"
                    v-on:create="createPoll"
                    v-on:cancel="closeMenus"
                  />
                  <MessageContactPicker
                    v-if="contactOpen"
                    v-bind:members="activeMembers"
                    v-on:select="sendContact"
                    v-on:cancel="closeMenus"
                  />
                </div>
                <div class="input-row">
                  <div class="composer-tools">
                    <button
                      type="button"
                      class="tool-btn"
                      aria-label="Emoji and stickers"
                      title="Emoji and stickers"
                      v-on:click="emojiOpen = !emojiOpen; attachOpen = false; pollOpen = false; contactOpen = false"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/><circle cx="15" cy="10" r="1.1" fill="currentColor"/><path d="M8 14.5c1.2 2 6.8 2 8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    </button>
                    <button
                      type="button"
                      class="tool-btn"
                      aria-label="Attach a file"
                      title="Attach a file"
                      v-on:click="attachOpen = !attachOpen; emojiOpen = false; pollOpen = false; contactOpen = false"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 12.5l6.2-6.2a3 3 0 0 1 4.2 4.2l-8.1 8.1a5 5 0 0 1-7-7l8-8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    </button>
                    <button
                      v-if="!pendingAttachment && !recording"
                      type="button"
                      class="tool-btn"
                      aria-label="Record a voice note"
                      title="Record a voice note"
                      v-on:click="startVoiceRecording"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    </button>
                    <button
                      type="button"
                      class="tool-btn"
                      aria-label="Create a poll"
                      title="Create a poll"
                      v-on:click="pollOpen = !pollOpen; emojiOpen = false; attachOpen = false; contactOpen = false"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 19V5M5 19h14M9 15v-4M13 15V8M17 15v-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    </button>
                    <button
                      type="button"
                      class="tool-btn"
                      aria-label="Share a contact"
                      title="Share a contact"
                      v-on:click="contactOpen = !contactOpen; emojiOpen = false; attachOpen = false; pollOpen = false"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20c.8-3.7 3.2-5.5 6.5-5.5s5.7 1.8 6.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                  <textarea
                    ref="inputRef"
                    class="msg-input"
                    v-model="inputText"
                    rows="1"
                    v-bind:placeholder="pendingAttachment ? 'Add a caption...' : 'Type a message...'"
                    v-bind:disabled="recording || activeUploading"
                    v-on:keydown="onInputKeydown"
                  ></textarea>
                  <button type="button" class="send-btn" v-on:click="sendMessage()" v-bind:disabled="!canSend">
                    {{ activeUploading ? 'Uploading...' : sending ? 'Sending...' : 'Send' }}
                  </button>
                </div>
                <div v-if="activeUpload && activeUpload.progress > 0" class="upload-progress">
                  <span class="upload-progress-fill" v-bind:style="{ width: activeUpload.progress + '%' }"></span>
                  <span class="upload-progress-label">{{ activeUpload.progress }}%</span>
                </div>
                <input ref="documentInput" type="file" class="hidden-file-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" v-on:change="onFileChosen($event, 'document')" />
                <input ref="photosInput" type="file" class="hidden-file-input" accept="image/*,video/mp4,video/webm" multiple="false" v-on:change="onFileChosen($event, 'photos')" />
                <input ref="cameraInput" type="file" class="hidden-file-input" accept="image/*" capture="environment" v-on:change="onFileChosen($event, 'camera')" />
                <input ref="audioInput" type="file" class="hidden-file-input" accept="audio/*" v-on:change="onFileChosen($event, 'audio')" />
              </div>
            </template>
            <div v-else class="chat-empty">
              <svg class="welcome-art" viewBox="0 0 240 170" aria-hidden="true">
                <defs>
                  <linearGradient id="welcomeGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#453D89" />
                    <stop offset="100%" stop-color="#C8499A" />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="84" r="70" fill="#f1f3f9" />
                <rect x="42" y="42" width="118" height="76" rx="18" fill="#ffffff" stroke="#d7deea" stroke-width="2" />
                <path d="M62 100 L58 118 L80 106 Z" fill="#ffffff" stroke="#d7deea" stroke-width="2" />
                <rect x="56" y="58" width="72" height="7" rx="3.5" fill="url(#welcomeGradient)" opacity="0.35" />
                <rect x="56" y="73" width="88" height="7" rx="3.5" fill="url(#welcomeGradient)" opacity="0.55" />
                <rect x="56" y="88" width="54" height="7" rx="3.5" fill="url(#welcomeGradient)" />
                <circle cx="178" cy="52" r="20" fill="#ffffff" stroke="#d7deea" stroke-width="2" />
                <path d="M170 52l6 6 12-13" fill="none" stroke="#7c6ee6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="190" cy="120" r="13" fill="#C8499A" opacity="0.16" />
                <circle cx="48" cy="128" r="9" fill="#7c6ee6" opacity="0.18" />
              </svg>
              <div class="chat-empty-title">Your conversations</div>
              <div class="chat-empty-sub">Pick a group to catch up on messages, polls and shared files.</div>
              <div class="chat-empty-hint">Press <kbd>Esc</kbd> to step back from a chat.</div>
            </div>
          </section>
        </div>
      </section>
    </main>

    <div class="members-overlay" v-if="membersOpen && activeGroup">
      <button type="button" class="members-backdrop" aria-label="Close members" v-on:click="closeMembers"></button>
      <aside class="members-drawer">
        <div class="drawer-header">
          <div class="drawer-heading">
            <div class="drawer-title">Group members</div>
            <div class="drawer-sub">{{ groupDisplayName(activeGroup) }}</div>
          </div>
          <button type="button" class="drawer-close" aria-label="Close members" v-on:click="closeMembers">×</button>
        </div>
        <div class="drawer-body">
          <div v-if="bulkBusy" class="drawer-message">Working...</div>
          <div v-if="actionMessage" class="drawer-message">{{ actionMessage }}</div>

          <div class="member-section">
            <div class="section-head">
              <span class="section-title">Active members</span>
              <label v-if="activeGroup.can_remove_members" class="select-all">
                <input type="checkbox" v-bind:checked="allActiveSelected" v-on:change="toggleAllActive" /> Select all
              </label>
            </div>
            <div class="member-row" v-for="m in activeMembers" v-bind:key="memberKey(m)">
              <input
                v-if="activeGroup.can_remove_members && canRemoveMember(m)"
                type="checkbox"
                class="member-check"
                v-bind:value="memberKey(m)"
                v-model="selectedMembers"
              />
              <span class="member-name">{{ m.display_name || memberKey(m) }}</span>
              <span class="member-role">{{ roleLabelText(m.role_label) }}</span>
            </div>
            <div v-if="activeGroup.can_remove_members" class="section-foot">
              <span class="selected-count">{{ selectedMembers.length }} selected</span>
              <button
                type="button"
                class="bulk-btn bulk-remove"
                v-bind:disabled="selectedMembers.length === 0 || bulkBusy"
                v-on:click="removeSelected"
              >Remove selected</button>
            </div>
          </div>

          <div v-if="activeGroup.can_remove_members" class="member-section">
            <div class="section-head">
              <span class="section-title">Removed members</span>
              <label class="select-all">
                <input type="checkbox" v-bind:checked="allRemovedSelected" v-on:change="toggleAllRemoved" /> Select all
              </label>
            </div>
            <div class="removed-empty" v-if="removedMembers.length === 0">No removed members.</div>
            <div class="member-row" v-for="r in removedMembers" v-bind:key="memberKey(r)">
              <input type="checkbox" class="member-check" v-bind:value="memberKey(r)" v-model="selectedRemoved" />
              <span class="member-name">{{ r.display_name || memberKey(r) }}</span>
            </div>
            <div class="section-foot">
              <span class="selected-count">{{ selectedRemoved.length }} selected</span>
              <button
                type="button"
                class="bulk-btn"
                v-bind:disabled="selectedRemoved.length === 0 || bulkBusy"
                v-on:click="restoreSelected"
              >Restore selected</button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <MessageImageViewer v-if="viewerUrl" v-bind:url="viewerUrl" v-bind:name="viewerName" v-on:close="closeImageViewer" />
    <MessageCameraCapture
      v-if="cameraOpen"
      v-on:captured="onCameraCaptured"
      v-on:fallback="onCameraFallback"
      v-on:error="onCameraError"
      v-on:cancel="closeCamera"
    />
    <div class="message-toast" v-if="toastText">{{ toastText }}</div>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import MessageRich from '@/components/messages/MessageRich.vue'
import MessageEmojiPanel from '@/components/messages/MessageEmojiPanel.vue'
import MessageAttachmentMenu from '@/components/messages/MessageAttachmentMenu.vue'
import MessagePreviewStrip from '@/components/messages/MessagePreviewStrip.vue'
import MessageVoiceRecorder from '@/components/messages/MessageVoiceRecorder.vue'
import MessagePollForm from '@/components/messages/MessagePollForm.vue'
import MessageContactPicker from '@/components/messages/MessageContactPicker.vue'
import MessageCameraCapture from '@/components/messages/MessageCameraCapture.vue'
import MessageImageViewer from '@/components/messages/MessageImageViewer.vue'
import { apiGet, apiPost, apiUpload } from '@/lib/api'
import { io } from 'socket.io-client'
import { installMessageSoundUnlock, isMessageSoundMuted, playMessageSound, setMessageSoundMuted } from '@/lib/message_sound'

export default {
  name: 'Messages',
  components: {
    Sidebar,
    MessageRich,
    MessageEmojiPanel,
    MessageAttachmentMenu,
    MessagePreviewStrip,
    MessageVoiceRecorder,
    MessagePollForm,
    MessageContactPicker,
    MessageCameraCapture,
    MessageImageViewer
  },
  data() {
    return {
      isEmbedded: false,
      loadingGroups: true,
      loadingMessages: false,
      sending: false,
      bulkBusy: false,
      emojiOpen: false,
      attachOpen: false,
      pollOpen: false,
      contactOpen: false,
      viewerUrl: '',
      viewerName: '',
      cameraOpen: false,
      recording: false,
      recordSeconds: 0,
      recordTimer: null,
      recorder: null,
      recordStream: null,
      recordChunks: [],
      recordMime: '',
      pendingVoiceGroup: '',
      uploadingByGroup: {},
      composerClickHandler: null,
      groups: [],
      activeGroup: null,
      drafts: {},
      messagesByGroup: {},
      scrollByGroup: {},
      lastPreviewByGroup: {},
      lastOwnTextByGroup: {},
      soundMuted: false,
      popHandler: null,
      overlayHistoryPushed: false,
      chatHistoryPushed: false,
      sendError: '',
      actionMessage: '',
      searchText: '',
      chatOpen: false,
      membersOpen: false,
      selectedMembers: [],
      selectedRemoved: [],
      removedMembers: [],
      pollTimer: null,
      realtimeHandlerBound: false,
      realtimeTarget: null,
      messageHandler: null,
      toastHandler: null,
      accessHandler: null,
      pollHandler: null,
      socket: null,
      toastText: '',
      toastTimer: null
    }
  },
  computed: {
    inputText: {
      get() {
        if (!this.activeGroup) {
          return ''
        }
        return this.draftFor(this.activeGroup.name).text || ''
      },
      set(value) {
        if (!this.activeGroup) {
          return
        }
        this.draftFor(this.activeGroup.name).text = String(value || '')
      }
    },
    messages() {
      if (!this.activeGroup) {
        return []
      }
      return this.messagesByGroup[this.activeGroup.name] || []
    },
    pendingAttachment() {
      if (!this.activeGroup) {
        return null
      }
      return this.draftFor(this.activeGroup.name).attachment || null
    },
    activeUpload() {
      if (!this.activeGroup) {
        return null
      }
      return this.draftFor(this.activeGroup.name).upload || null
    },
    activeUploading() {
      if (!this.activeGroup) {
        return false
      }
      return Boolean(this.uploadingByGroup[this.activeGroup.name])
    },
    canSend() {
      if (!this.activeGroup || this.sending || this.activeUploading || this.recording) {
        return false
      }
      var draft = this.draftFor(this.activeGroup.name)
      return Boolean(String(draft.text || '').trim() || draft.attachment)
    },
    soundLabel() {
      if (this.soundMuted) {
        return 'Turn message sound on'
      }
      return 'Turn message sound off'
    },
    visibleGroups() {
      var list = []
      var term = String(this.searchText || '').trim().toLowerCase()
      for (var i = 0; i < this.groups.length; i = i + 1) {
        var g = this.groups[i]
        var name = String(this.groupDisplayName(g) || '').toLowerCase()
        if (!term || name.indexOf(term) >= 0) {
          list.push(g)
        }
      }
      return list
    },
    activeMembers() {
      var list = []
      if (this.activeGroup && this.activeGroup.members) {
        for (var j = 0; j < this.activeGroup.members.length; j = j + 1) {
          list.push(this.activeGroup.members[j])
        }
      }
      return list
    },
    memberCountText() {
      if (!this.activeGroup) {
        return '0'
      }
      var c = this.activeGroup.members_count
      if (typeof c === 'number') {
        return String(c)
      }
      if (this.activeGroup.members && this.activeGroup.members.length) {
        return String(this.activeGroup.members.length)
      }
      return '0'
    },
    bannerText() {
      if (!this.activeGroup) {
        return ''
      }
      var desc = this.activeGroup.description || this.activeGroup.group_description || ''
      if (desc) {
        return String(desc)
      }
      return 'A shared space for ' + this.groupDisplayName(this.activeGroup) + '.'
    },
    allActiveSelected() {
      var list = this.selectableActive()
      if (list.length === 0) {
        return false
      }
      for (var i = 0; i < list.length; i = i + 1) {
        if (this.selectedMembers.indexOf(list[i]) < 0) {
          return false
        }
      }
      return true
    },
    allRemovedSelected() {
      var list = this.selectableRemoved()
      if (list.length === 0) {
        return false
      }
      for (var j = 0; j < list.length; j = j + 1) {
        if (this.selectedRemoved.indexOf(list[j]) < 0) {
          return false
        }
      }
      return true
    }
  },
  watch: {
    '$route.query.group': function(value) {
      if (!value || this.groups.length === 0) {
        return
      }
      var found = this.findGroup(String(value))
      if (found && (!this.activeGroup || this.activeGroup.name !== found.name)) {
        this.selectGroup(found, true)
      }
    }
  },
  mounted() {
    var hash = window.location.hash || ''
    if (hash.indexOf('embed=1') >= 0) {
      this.isEmbedded = true
    }
    this.soundMuted = isMessageSoundMuted()
    installMessageSoundUnlock()
    var self = this
    this.popHandler = function() {
      self.onBrowserBack()
    }
    window.addEventListener('popstate', this.popHandler)
    document.addEventListener('keydown', this.onEscapeKey)
    this.composerClickHandler = function(event) {
      self.onDocumentClick(event)
    }
    document.addEventListener('click', this.composerClickHandler)
    this.loadGroups()
    this.bindRealtime()
    this.startPolling()
  },
  beforeUnmount() {
    if (this.popHandler) {
      window.removeEventListener('popstate', this.popHandler)
    }
    document.removeEventListener('keydown', this.onEscapeKey)
    if (this.composerClickHandler) {
      document.removeEventListener('click', this.composerClickHandler)
    }
    this.cancelRecording()
    this.closeCamera()
    this.stopPolling()
    this.unbindRealtime()
    this.clearToastTimer()
  },
  methods: {
    onEscapeKey(e) {
      if (!e || e.key !== 'Escape') {
        return
      }
      if (this.pollOpen || this.emojiOpen || this.attachOpen || this.contactOpen || this.cameraOpen) {
        this.closeMenus()
        this.closeCamera()
        return
      }
      if (this.viewerUrl) {
        this.closeImageViewer()
        return
      }
      if (this.membersOpen) {
        this.closeMembers()
        return
      }
      if (this.activeGroup) {
        this.backToList()
      }
    },
    draftFor(name) {
      if (!name) {
        return { text: '', attachment: null, upload: null }
      }
      if (!this.drafts[name] || typeof this.drafts[name] === 'string') {
        this.drafts[name] = {
          text: typeof this.drafts[name] === 'string' ? this.drafts[name] : '',
          attachment: null,
          upload: null
        }
      }
      var draft = this.drafts[name]
      if (!draft.attachment) {
        draft.attachment = null
      }
      if (!draft.upload) {
        draft.upload = null
      }
      return draft
    },
    closeMenus() {
      this.emojiOpen = false
      this.attachOpen = false
      this.pollOpen = false
      this.contactOpen = false
    },
    onDocumentClick(event) {
      var target = event && event.target
      if (!target || !target.closest) {
        return
      }
      if (target.closest('.composer-wrap') || target.closest('.viewer-overlay') || target.closest('.camera-overlay')) {
        return
      }
      this.closeMenus()
    },
    revokePreviewUrl(attachment) {
      if (attachment && attachment.previewUrl && window.URL && window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(attachment.previewUrl)
      }
    },
    clearDraftAttachment(draft) {
      if (!draft) {
        return
      }
      this.revokePreviewUrl(draft.attachment)
      draft.attachment = null
      draft.upload = null
    },
    removePendingAttachment() {
      if (!this.activeGroup) {
        return
      }
      this.clearDraftAttachment(this.draftFor(this.activeGroup.name))
    },
    validateSelectedFile(file, kind) {
      if (!file) {
        return 'Please choose a file.'
      }
      var name = String(file.name || '').toLowerCase()
      var parts = name.split('.')
      var ext = parts.length > 1 ? parts[parts.length - 1] : ''
      var blocked = ['exe', 'bat', 'cmd', 'sh', 'js', 'html', 'svg', 'php', 'py', 'jar', 'msi']
      var i = 0
      while (i < blocked.length) {
        if (ext === blocked[i]) {
          return 'This file type is not allowed.'
        }
        i = i + 1
      }
      var images = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      var videos = ['mp4', 'webm']
      var audios = ['mp3', 'wav', 'm4a', 'ogg', 'webm']
      var docs = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip']
      var allowed = docs
      var maxSize = 15 * 1024 * 1024
      if (kind === 'photos') {
        allowed = images.concat(videos)
        maxSize = 25 * 1024 * 1024
      } else if (kind === 'audio' || kind === 'voice') {
        allowed = audios
        maxSize = 10 * 1024 * 1024
      } else if (kind === 'camera') {
        allowed = images
        maxSize = 10 * 1024 * 1024
      }
      var found = false
      i = 0
      while (i < allowed.length) {
        if (ext === allowed[i]) {
          found = true
          break
        }
        i = i + 1
      }
      if (!found) {
        return 'This file type is not allowed.'
      }
      if (Number(file.size || 0) > maxSize) {
        return 'File is too large.'
      }
      return ''
    },
    stageAttachment(file, group, kind) {
      var error = this.validateSelectedFile(file, kind)
      if (error) {
        this.sendError = error
        return false
      }
      var draft = this.draftFor(group)
      this.clearDraftAttachment(draft)
      var mime = String(file.type || '')
      var isImage = kind === 'camera' || mime.indexOf('image/') === 0
      draft.attachment = {
        file: file,
        name: String(file.name || 'attachment'),
        size: Number(file.size || 0),
        mime: mime,
        previewUrl: isImage && window.URL && window.URL.createObjectURL ? window.URL.createObjectURL(file) : '',
        isImage: isImage,
        kind: kind,
        progress: 0
      }
      draft.upload = { progress: 0 }
      this.sendError = ''
      this.closeMenus()
      return true
    },
    onFileChosen(event, kind) {
      var input = event && event.target
      if (!input || !input.files || input.files.length === 0) {
        return
      }
      var group = this.activeGroup ? this.activeGroup.name : ''
      if (!group) {
        input.value = ''
        return
      }
      this.stageAttachment(input.files[0], group, kind)
      input.value = ''
    },
    onAttachmentSelect(kind) {
      if (kind === 'camera') {
        this.openCamera()
        return
      }
      this.openFilePicker(kind)
    },
    openFilePicker(kind) {
      var input = this.$refs[kind + 'Input']
      if (input) {
        input.click()
      }
    },
    isMobileCameraDevice() {
      var width = window.innerWidth || 0
      var touches = navigator.maxTouchPoints || 0
      return width <= 768 || touches > 0
    },
    closeCamera() {
      this.cameraOpen = false
    },
    openCamera() {
      this.closeMenus()
      if (this.isMobileCameraDevice()) {
        this.openFilePicker('camera')
        return
      }
      this.cameraOpen = true
    },
    onCameraCaptured(blob) {
      this.closeCamera()
      if (!this.activeGroup) {
        return
      }
      var file = new File([blob], 'camera-' + new Date().getTime() + '.jpg', { type: 'image/jpeg' })
      this.stageAttachment(file, this.activeGroup.name, 'camera')
    },
    onCameraFallback() {
      this.closeCamera()
      this.sendError = 'Camera is not available here. Please choose a photo from your device.'
      this.openFilePicker('camera')
    },
    onCameraError(message) {
      this.sendError = message || 'Unable to use the camera.'
    },
    openImageViewer(payload) {
      this.viewerUrl = payload && payload.url ? payload.url : ''
      this.viewerName = payload && payload.name ? payload.name : 'Photo'
    },
    closeImageViewer() {
      this.viewerUrl = ''
      this.viewerName = ''
    },
    insertEmoji(value) {
      if (!this.activeGroup || !value) {
        return
      }
      var draft = this.draftFor(this.activeGroup.name)
      var text = String(draft.text || '')
      var el = this.$refs.inputRef
      var start = el && typeof el.selectionStart === 'number' ? el.selectionStart : text.length
      var end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : text.length
      draft.text = text.substring(0, start) + value + text.substring(end)
      var next = start + value.length
      var self = this
      this.$nextTick(function() {
        if (el) {
          el.focus()
          if (el.setSelectionRange) {
            el.setSelectionRange(next, next)
          }
        }
      })
    },
    sendSticker(value) {
      var self = this
      var group = this.activeGroup ? this.activeGroup.name : ''
      if (!group || !value || this.sending) {
        return Promise.resolve()
      }
      this.closeMenus()
      this.sending = true
      return apiPost('/api/method/backend_custom_app.api.messages.send_group_message', {
        group: group,
        text: '',
        message_type: 'sticker',
        sticker: value
      }).then(function() {
        self.lastOwnTextByGroup[group] = 'Sticker'
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          return self.loadMessages(group).then(function() {
            return self.markRead()
          })
        }
        return Promise.resolve()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
        self.sendError = e && e.message ? e.message : 'Unable to send sticker.'
      }).then(function() {
        self.sending = false
      })
    },
    sendContact(member) {
      var self = this
      var group = this.activeGroup ? this.activeGroup.name : ''
      if (!group || !member || !member.user || this.sending) {
        return Promise.resolve()
      }
      var draft = this.draftFor(group)
      var caption = String(draft.text || '').trim()
      this.contactOpen = false
      this.sending = true
      return apiPost('/api/method/backend_custom_app.api.messages.send_group_message', {
        group: group,
        text: caption,
        message_type: 'contact',
        contact_user: member.user
      }).then(function() {
        draft.text = ''
        self.lastOwnTextByGroup[group] = 'Contact'
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          return self.loadMessages(group).then(function() {
            return self.markRead()
          })
        }
        return Promise.resolve()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
        self.sendError = e && e.message ? e.message : 'Unable to share contact.'
      }).then(function() {
        self.sending = false
      })
    },
    createPoll(payload) {
      var self = this
      var group = this.activeGroup ? this.activeGroup.name : ''
      if (!group || !payload || this.sending) {
        return Promise.resolve()
      }
      var question = String(payload.question || '').trim()
      var options = []
      var rawOptions = payload.options || []
      var i = 0
      while (i < rawOptions.length) {
        var optionText = String(rawOptions[i] || '').trim()
        if (optionText) {
          options.push(optionText)
        }
        i = i + 1
      }
      if (!question) {
        this.sendError = 'Poll question is required.'
        return Promise.resolve()
      }
      if (options.length < 2 || options.length > 6) {
        this.sendError = 'Poll must have between 2 and 6 non-empty options.'
        return Promise.resolve()
      }
      var draft = this.draftFor(group)
      var caption = String(draft.text || '').trim()
      this.pollOpen = false
      this.sending = true
      return apiPost('/api/method/backend_custom_app.api.messages.create_group_poll', {
        group: group,
        question: question,
        options: options,
        caption: caption
      }).then(function() {
        draft.text = ''
        self.lastOwnTextByGroup[group] = 'Poll: ' + question
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          return self.loadMessages(group).then(function() {
            return self.markRead()
          })
        }
        return Promise.resolve()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
        self.sendError = e && e.message ? e.message : 'Unable to create poll.'
      }).then(function() {
        self.sending = false
      })
    },
    votePoll(payload) {
      if (!payload || !payload.poll || typeof payload.index !== 'number') {
        return Promise.resolve()
      }
      var self = this
      return apiPost('/api/method/backend_custom_app.api.messages.vote_group_poll', {
        poll: payload.poll,
        option_index: payload.index
      }).then(function(result) {
        self.updatePollResult(payload.poll, result, '')
      }).catch(function(e) {
        self.sendError = e && e.message ? e.message : 'Unable to vote.'
      })
    },
    closePoll(poll) {
      if (!poll) {
        return Promise.resolve()
      }
      var self = this
      return apiPost('/api/method/backend_custom_app.api.messages.close_group_poll', { poll: poll }).then(function(result) {
        self.updatePollResult(poll, result, '')
      }).catch(function(e) {
        self.sendError = e && e.message ? e.message : 'Unable to close poll.'
      })
    },
    handlePollUpdated(data) {
      if (!data || !data.poll || !data.result) {
        return
      }
      this.updatePollResult(data.poll, data.result, data.group || '')
    },
    updatePollResult(pollName, result, groupName) {
      var names = Object.keys(this.messagesByGroup)
      var i = 0
      while (i < names.length) {
        var name = names[i]
        if (!groupName || groupName === name) {
          var list = this.messagesByGroup[name] || []
          var j = 0
          while (j < list.length) {
            if (list[j].poll && list[j].poll.name === pollName) {
              list[j].poll = result
            }
            j = j + 1
          }
        }
        i = i + 1
      }
    },
    startVoiceRecording() {
      if (this.recording) {
        return
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        this.sendError = 'Voice recording is not supported in this browser.'
        return
      }
      var self = this
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        var mime = 'audio/webm'
        if (window.MediaRecorder.isTypeSupported) {
          if (window.MediaRecorder.isTypeSupported('audio/mp4')) {
            mime = 'audio/mp4'
          } else if (window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mime = 'audio/ogg;codecs=opus'
          }
        }
        self.recordStream = stream
        self.recordChunks = []
        self.recordMime = mime
        self.recordSeconds = 0
        self.recording = true
        self.recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        self.recorder.ondataavailable = function(event) {
          if (event.data && event.data.size > 0) {
            self.recordChunks.push(event.data)
          }
        }
        self.recorder.onstop = function() {
          self.finishRecording()
        }
        self.recorder.start()
        self.recordTimer = setInterval(function() {
          self.recordSeconds = Number(self.recordSeconds || 0) + 1
        }, 1000)
      }).catch(function() {
        self.sendError = 'Microphone permission was denied. Voice notes are unavailable.'
      })
    },
    cancelRecording() {
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.onstop = null
        this.recorder.stop()
      }
      this.cleanupRecording()
    },
    cleanupRecording() {
      if (this.recordTimer) {
        clearInterval(this.recordTimer)
      }
      if (this.recordStream) {
        var tracks = this.recordStream.getTracks()
        var i = 0
        while (i < tracks.length) {
          tracks[i].stop()
          i = i + 1
        }
      }
      this.recording = false
      this.recordTimer = null
      this.recorder = null
      this.recordStream = null
      this.recordChunks = []
      this.recordSeconds = 0
      this.pendingVoiceGroup = ''
    },
    finishRecording() {
      var group = this.pendingVoiceGroup || (this.activeGroup ? this.activeGroup.name : '')
      var chunks = this.recordChunks.slice()
      var mime = this.recordMime || 'audio/webm'
      var ext = 'webm'
      if (mime.indexOf('mp4') >= 0) {
        ext = 'm4a'
      } else if (mime.indexOf('ogg') >= 0) {
        ext = 'ogg'
      }
      this.cleanupRecording()
      if (!group || chunks.length === 0) {
        return
      }
      var blob = new Blob(chunks, { type: mime })
      var file = new File([blob], 'voice-note-' + new Date().getTime() + '.' + ext, { type: mime })
      if (this.stageAttachment(file, group, 'voice')) {
        var self = this
        this.$nextTick(function() {
          self.sendMessage(group)
        })
      }
    },
    sendVoiceRecording() {
      if (!this.recording) {
        return
      }
      this.pendingVoiceGroup = this.activeGroup ? this.activeGroup.name : ''
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.stop()
      }
    },
    groupDisplayName(group) {
      if (!group) {
        return 'Messages'
      }
      return group.group_name || group.name || 'Messages'
    },
    groupActivityValue(group) {
      if (!group) {
        return ''
      }
      return String(group.last_message_at || group.last_message_sent_at || '')
    },
    groupPreview(group) {
      if (!group) {
        return 'No messages yet'
      }
      var text = String(group.last_message_text || '').replace(/\s+/g, ' ')
      if (!text) {
        return 'No messages yet'
      }
      if (text.length > 80) {
        return text.substring(0, 80) + '...'
      }
      return text
    },
    groupTime(group) {
      if (!group) {
        return ''
      }
      return this.timeLabel(group.last_message_sent_at || group.last_message_at || '')
    },
    unreadLabel(count) {
      var n = Number(count) || 0
      if (n > 99) {
        return '99+'
      }
      return String(n)
    },
    initials(name) {
      var text = String(name || '').trim()
      if (!text) {
        return 'M'
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
    roleLabelText(label) {
      if (label === 'Admin') {
        return 'Admin'
      }
      if (label === 'Instructor') {
        return 'Instructor'
      }
      if (label === 'Student') {
        return 'Student'
      }
      return ''
    },
    memberKey(member) {
      if (!member) {
        return ''
      }
      return String(member.user || member.name || '')
    },
    dayLabel(dt) {
      if (!dt) {
        return ''
      }
      var s = String(dt)
      var parts = s.split(' ')
      if (parts.length > 0) {
        return parts[0]
      }
      return s
    },
    timeLabel(dt) {
      if (!dt) {
        return ''
      }
      var s = String(dt)
      var parts = s.split(' ')
      if (parts.length >= 2) {
        var t = parts[1]
        var tparts = t.split(':')
        if (tparts.length >= 2) {
          return tparts[0] + ':' + tparts[1]
        }
        return t
      }
      return s
    },
    showDaySeparator(idx) {
      if (idx <= 0) {
        return true
      }
      var cur = this.messages[idx]
      var prev = this.messages[idx - 1]
      if (!cur || !prev) {
        return true
      }
      return this.dayLabel(cur.sent_at) !== this.dayLabel(prev.sent_at)
    },
    findGroup(name) {
      for (var i = 0; i < this.groups.length; i = i + 1) {
        if (this.groups[i].name === name) {
          return this.groups[i]
        }
      }
      return null
    },
    sortGroups(list) {
      var arr = []
      for (var k = 0; k < list.length; k = k + 1) {
        arr.push(list[k])
      }
      var self = this
      arr.sort(function(a, b) {
        var av = self.groupActivityValue(a)
        var bv = self.groupActivityValue(b)
        if (av > bv) {
          return -1
        }
        if (av < bv) {
          return 1
        }
        return 0
      })
      return arr
    },
    fetchGroups() {
      var self = this
      return apiGet('/api/method/backend_custom_app.api.messages.get_my_groups').then(function(res) {
        var raw = res || []
        var list = []
        for (var i = 0; i < raw.length; i = i + 1) {
          list.push(raw[i])
        }
        self.groups = self.sortGroups(list)
        return self.groups
      })
    },
    loadGroups() {
      var self = this
      this.loadingGroups = true
      return this.fetchGroups().then(function(groups) {
        var requested = ''
        if (self.$route && self.$route.query && self.$route.query.group) {
          requested = String(self.$route.query.group)
        }
        var chosen = self.findGroup(requested)
        if (!chosen) {
          self.activeGroup = null
          if (requested) {
            self.clearGroupQuery()
            self.clearParentGroupQuery()
          }
          return null
        }
        self.setActiveGroup(chosen, true)
        return self.loadMessages().then(function() {
          return self.markRead()
        })
      }).catch(function(e) {
        self.groups = []
        self.activeGroup = null
      }).then(function() {
        self.loadingGroups = false
      })
    },
    refreshGroups() {
      var self = this
      var previous = {}
      var pi = 0
      while (pi < self.groups.length) {
        var oldGroup = self.groups[pi]
        previous[oldGroup.name] = {
          text: oldGroup.last_message_text || '',
          at: oldGroup.last_message_at || ''
        }
        pi = pi + 1
      }
      return this.fetchGroups().then(function(groups) {
        if (!self.realtimeHandlerBound) {
          self.detectPolledMessages(previous, groups)
        }
        var activeName = self.activeGroup ? self.activeGroup.name : ''
        var found = self.findGroup(activeName)
        if (!found) {
          self.closeChat()
          return null
        }
        self.activeGroup = found
        return null
      }).catch(function(e) {
      })
    },
    setActiveGroup(group, fromQuery) {
      this.saveGroupScroll()
      this.activeGroup = group
      if (fromQuery === true) {
        this.chatOpen = true
      }
      this.membersOpen = false
      this.closeMenus()
      this.cameraOpen = false
      this.viewerUrl = ''
      this.viewerName = ''
      if (this.recording) {
        this.cancelRecording()
      }
      this.sendError = ''
      this.actionMessage = ''
      this.selectedMembers = []
      this.selectedRemoved = []
      this.removedMembers = []
      this.loadingMessages = Boolean(!this.messagesByGroup[group.name])
      var self = this
      this.$nextTick(function() {
        self.restoreGroupScroll(group.name)
      })
    },
    selectGroup(group, fromQuery) {
      if (!group) {
        return
      }
      var fromQueryFlag = fromQuery === true
      var hasGroupQuery = Boolean(this.$route && this.$route.query && this.$route.query.group)
      if (!fromQueryFlag && !hasGroupQuery && !this.chatHistoryPushed && window.history && window.history.pushState) {
        window.history.pushState({ backend_messages_chat: group.name }, '')
        this.chatHistoryPushed = true
      }
      this.setActiveGroup(group, fromQueryFlag)
      this.chatOpen = true
      if (!fromQueryFlag) {
        this.syncGroupQuery(group.name)
      }
      this.loadMessages(group.name)
      this.markRead()
    },
    closeChat() {
      this.saveGroupScroll()
      this.activeGroup = null
      this.chatOpen = false
      this.membersOpen = false
      this.closeMenus()
      this.cameraOpen = false
      this.viewerUrl = ''
      this.viewerName = ''
      if (this.recording) {
        this.cancelRecording()
      }
      this.sendError = ''
      this.actionMessage = ''
      this.selectedMembers = []
      this.selectedRemoved = []
      this.removedMembers = []
      this.chatHistoryPushed = false
      this.clearGroupQuery()
      this.clearParentGroupQuery()
    },
    backToList() {
      if (this.membersOpen) {
        this.closeMembers()
        return
      }
      var pushed = this.chatHistoryPushed
      this.closeChat()
      if (pushed && window.history && window.history.back) {
        window.history.back()
      }
    },
    isMobileLayout() {
      return window.innerWidth <= 768
    },
    saveGroupScroll() {
      var el = this.$refs.messagesListRef
      if (!el || !this.activeGroup) {
        return
      }
      this.scrollByGroup[this.activeGroup.name] = el.scrollTop
    },
    restoreGroupScroll(name) {
      if (!name) {
        return
      }
      var el = this.$refs.messagesListRef
      if (!el) {
        return
      }
      var saved = this.scrollByGroup[name]
      if (typeof saved === 'number' && saved >= 0) {
        el.scrollTop = saved
      } else {
        el.scrollTop = el.scrollHeight
      }
    },
    onBrowserBack() {
      if (this.membersOpen) {
        this.closeMembers(true)
        return
      }
      if (this.activeGroup || this.chatOpen) {
        this.closeChat()
      }
    },
    toggleSound() {
      var next = !this.soundMuted
      this.soundMuted = next
      setMessageSoundMuted(next)
    },
    shouldPlayForGroup(group) {
      if (!group) {
        return true
      }
      var current = this.activeGroup ? this.activeGroup.name : ''
      if (!current || group !== current || document.hidden) {
        return true
      }
      return false
    },
    detectPolledMessages(previous, groups) {
      var i = 0
      while (i < groups.length) {
        var group = groups[i]
        var old = previous[group.name]
        if (old && group.last_message_text && (old.text !== group.last_message_text || old.at !== group.last_message_at)) {
          var own = this.lastOwnTextByGroup[group.name] || ''
          var preview = String(group.last_message_text || '')
          if (!own || preview.indexOf(own.substring(0, 40)) !== 0) {
            if (this.shouldPlayForGroup(group.name)) {
              playMessageSound()
            }
          }
        }
        i = i + 1
      }
    },
    clearGroupQuery() {
      if (!this.$route || !this.$router || !this.$route.query || !this.$route.query.group) {
        return
      }
      var query = {}
      var keys = Object.keys(this.$route.query || {})
      for (var i = 0; i < keys.length; i = i + 1) {
        if (keys[i] !== 'group') {
          query[keys[i]] = this.$route.query[keys[i]]
        }
      }
      this.$router.replace({ query: query }).catch(function(e) {
      })
    },
    clearParentGroupQuery() {
      if (!this.isEmbedded || !window.parent || window.parent === window) {
        return
      }
      var parentWindow = window.parent
      if (!parentWindow.location || !parentWindow.location.href) {
        return
      }
      var href = String(parentWindow.location.href)
      var hash = ''
      var hashIndex = href.indexOf('#')
      if (hashIndex >= 0) {
        hash = href.substring(hashIndex)
        href = href.substring(0, hashIndex)
      }
      var path = href
      var query = ''
      var queryIndex = href.indexOf('?')
      if (queryIndex >= 0) {
        path = href.substring(0, queryIndex)
        query = href.substring(queryIndex + 1)
      }
      var kept = []
      var pairs = query ? query.split('&') : []
      for (var i = 0; i < pairs.length; i = i + 1) {
        if (!pairs[i]) {
          continue
        }
        if (pairs[i].split('=')[0] !== 'group') {
          kept.push(pairs[i])
        }
      }
      var next = path
      if (kept.length > 0) {
        next = next + '?' + kept.join('&')
      }
      next = next + hash
      if (parentWindow.history && parentWindow.history.replaceState) {
        parentWindow.history.replaceState(parentWindow.history.state, '', next)
      }
    },
    syncGroupQuery(name) {
      if (!this.$route) {
        return
      }
      var query = {}
      var keys = Object.keys(this.$route.query || {})
      for (var i = 0; i < keys.length; i = i + 1) {
        query[keys[i]] = this.$route.query[keys[i]]
      }
      if (query.group === name) {
        return
      }
      query.group = name
      this.$router.replace({ query: query }).catch(function(e) {
      })
    },
    loadMessages(groupName) {
      var name = groupName || (this.activeGroup && this.activeGroup.name)
      if (!name) {
        return Promise.resolve()
      }
      var self = this
      if (this.activeGroup && this.activeGroup.name === name) {
        this.loadingMessages = true
      }
      var url = '/api/method/backend_custom_app.api.messages.get_group_messages?group=' + encodeURIComponent(name) + '&limit=50'
      return apiGet(url).then(function(res) {
        var rows = res || []
        self.messagesByGroup[name] = rows
        if (rows.length > 0) {
          var last = rows[rows.length - 1]
          self.lastPreviewByGroup[name] = String(last.message_text || '')
        }
        if (self.activeGroup && self.activeGroup.name === name) {
          self.$nextTick(function() {
            self.restoreGroupScroll(name)
          })
        }
      }).catch(function(e) {
        if (!self.messagesByGroup[name]) {
          self.messagesByGroup[name] = []
        }
        if (self.activeGroup && self.activeGroup.name === name) {
          self.$nextTick(function() {
            self.restoreGroupScroll(name)
          })
        }
      }).then(function() {
        if (self.activeGroup && self.activeGroup.name === name) {
          self.loadingMessages = false
        }
      })
    },
    scrollToBottom() {
      var el = this.$refs.messagesListRef
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    },
    markRead() {
      if (!this.activeGroup) {
        return Promise.resolve()
      }
      var self = this
      var groupName = this.activeGroup.name
      return apiPost('/api/method/backend_custom_app.api.messages.mark_group_read', { group: groupName }).then(function(res) {
        if (self.activeGroup && self.activeGroup.name === groupName) {
          self.activeGroup.unread_count = 0
        }
        window.dispatchEvent(new Event('messages-updated'))
        var parentFrappe = window.parent && window.parent.frappe
        var parentNotifications = parentFrappe && parentFrappe.app && parentFrappe.app.sidebar && parentFrappe.app.sidebar.notifications && parentFrappe.app.sidebar.notifications.tabs && parentFrappe.app.sidebar.notifications.tabs.notifications
        if (res && typeof res.notification_unread_count === 'number' && parentNotifications && parentNotifications.update_count_badge) {
          parentNotifications.update_count_badge(res.notification_unread_count)
        }
      }).catch(function(e) {
      })
    },
    onInputKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    },
    sendMessage(groupName) {
      var self = this
      this.closeCamera()
      this.sendError = ''
      var group = groupName || (this.activeGroup ? this.activeGroup.name : '')
      if (!group) {
        this.sendError = 'You are not a member of any group yet.'
        return Promise.resolve()
      }
      if (this.sending || this.uploadingByGroup[group]) {
        return Promise.resolve()
      }
      var draft = this.draftFor(group)
      var text = String(draft.text || '').trim()
      var attachment = draft.attachment
      if (!text && !attachment) {
        this.sendError = 'Message cannot be empty.'
        return Promise.resolve()
      }
      if (text.length > 2000) {
        this.sendError = 'Message is too long (max 2000).'
        return Promise.resolve()
      }
      if (attachment) {
        return this.uploadPendingAttachment(group, text)
      }
      this.sending = true
      return apiPost('/api/method/backend_custom_app.api.messages.send_group_message', {
        group: group,
        text: text
      }).then(function() {
        draft.text = ''
        self.lastOwnTextByGroup[group] = text
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          return self.loadMessages(group).then(function() {
            return self.markRead()
          })
        }
        return Promise.resolve()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
        if (self.activeGroup && self.activeGroup.name === group) {
          self.sendError = e && e.message ? e.message : 'Unable to send message.'
        }
      }).then(function() {
        self.sending = false
      })
    },
    uploadPendingAttachment(group, caption) {
      var self = this
      var draft = this.draftFor(group)
      var attachment = draft.attachment
      if (!group || !attachment || !attachment.file) {
        return Promise.resolve()
      }
      var uploadState = { progress: 0 }
      draft.upload = uploadState
      this.uploadingByGroup[group] = true
      this.sendError = ''
      var formData = new FormData()
      formData.append('group', group)
      formData.append('caption', String(caption || ''))
      formData.append('voice_note', attachment.kind === 'voice' ? '1' : '0')
      formData.append('file', attachment.file, attachment.name || 'attachment')
      return apiUpload('/api/method/backend_custom_app.api.messages.upload_group_attachment', formData, function(progress) {
        uploadState.progress = Number(progress || 0)
      }).then(function() {
        if (draft.attachment === attachment) {
          draft.text = ''
          self.clearDraftAttachment(draft)
        }
        self.lastOwnTextByGroup[group] = attachment.kind === 'voice' ? 'Voice message' : 'Photo'
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          return self.loadMessages(group).then(function() {
            return self.markRead()
          })
        }
        return Promise.resolve()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
        if (draft.attachment === attachment) {
          self.clearDraftAttachment(draft)
        }
        if (self.activeGroup && self.activeGroup.name === group) {
          self.sendError = e && e.message ? e.message : 'Unable to upload file.'
        }
      }).then(function() {
        self.uploadingByGroup[group] = false
      })
    },
    deleteMessage(name) {
      var self = this
      return apiPost('/api/method/backend_custom_app.api.messages.delete_group_message', { message_name: name }).then(function() {
        return self.loadMessages()
      }).then(function() {
        return self.refreshGroups()
      }).catch(function(e) {
      })
    },
    openMembers() {
      this.membersOpen = true
      this.actionMessage = ''
      this.selectedMembers = []
      this.selectedRemoved = []
      if (this.isMobileLayout() && !this.overlayHistoryPushed && window.history && window.history.pushState) {
        window.history.pushState({ backend_messages_members: true }, '')
        this.overlayHistoryPushed = true
      }
      this.loadRemovedMembers()
    },
    closeMembers(skipHistory) {
      this.selectedMembers = []
      this.selectedRemoved = []
      if (this.overlayHistoryPushed) {
        this.overlayHistoryPushed = false
        if (!skipHistory && window.history && window.history.back) {
          window.history.back()
          return
        }
      }
      this.membersOpen = false
    },
    loadRemovedMembers() {
      if (!this.activeGroup || !this.activeGroup.can_remove_members) {
        this.removedMembers = []
        this.selectedRemoved = []
        return Promise.resolve()
      }
      var self = this
      var url = '/api/method/backend_custom_app.api.messages.get_removed_group_members?group=' + encodeURIComponent(this.activeGroup.name)
      return apiGet(url).then(function(res) {
        var raw = res || []
        var list = []
        for (var i = 0; i < raw.length; i = i + 1) {
          list.push(raw[i])
        }
        self.removedMembers = list
        var next = []
        for (var j = 0; j < list.length; j = j + 1) {
          var key = self.memberKey(list[j])
          if (key && self.selectedRemoved.indexOf(key) >= 0) {
            next.push(key)
          }
        }
        self.selectedRemoved = next
      }).catch(function(e) {
        self.removedMembers = []
        self.selectedRemoved = []
      })
    },
    canRemoveMember(member) {
      if (!this.activeGroup || !this.activeGroup.can_remove_members || !member) {
        return false
      }
      var key = this.memberKey(member)
      if (!key) {
        return false
      }
      if (key === this.activeGroup.current_user || key === 'Administrator') {
        return false
      }
      return true
    },
    selectableActive() {
      var list = []
      var members = this.activeGroup && this.activeGroup.members ? this.activeGroup.members : []
      for (var i = 0; i < members.length; i = i + 1) {
        if (this.canRemoveMember(members[i])) {
          var key = this.memberKey(members[i])
          if (key) {
            list.push(key)
          }
        }
      }
      return list
    },
    selectableRemoved() {
      var list = []
      for (var j = 0; j < this.removedMembers.length; j = j + 1) {
        var key = this.memberKey(this.removedMembers[j])
        if (key) {
          list.push(key)
        }
      }
      return list
    },
    toggleAllActive() {
      if (this.allActiveSelected) {
        this.selectedMembers = []
        return
      }
      var list = this.selectableActive()
      var next = []
      for (var i = 0; i < list.length; i = i + 1) {
        next.push(list[i])
      }
      this.selectedMembers = next
    },
    toggleAllRemoved() {
      if (this.allRemovedSelected) {
        this.selectedRemoved = []
        return
      }
      var list = this.selectableRemoved()
      var next = []
      for (var j = 0; j < list.length; j = j + 1) {
        next.push(list[j])
      }
      this.selectedRemoved = next
    },
    copySelected(source) {
      var list = []
      for (var i = 0; i < source.length; i = i + 1) {
        list.push(source[i])
      }
      return list
    },
    removeSelected() {
      if (!this.activeGroup || this.bulkBusy || this.selectedMembers.length === 0) {
        return Promise.resolve()
      }
      var count = this.selectedMembers.length
      var suffix = count === 1 ? '' : 's'
      if (!window.confirm('Remove ' + count + ' member' + suffix + ' from ' + this.groupDisplayName(this.activeGroup) + '?')) {
        return Promise.resolve()
      }
      var self = this
      var members = this.copySelected(this.selectedMembers)
      this.bulkBusy = true
      this.actionMessage = ''
      return apiPost('/api/method/backend_custom_app.api.messages.bulk_remove_group_members', {
        group: this.activeGroup.name,
        members: members
      }).then(function(res) {
        self.selectedMembers = []
        var ok = 0
        if (res && typeof res.succeeded === 'number') {
          ok = res.succeeded
        } else if (res && res.succeeded && typeof res.succeeded.length === 'number') {
          ok = res.succeeded.length
        }
        self.actionMessage = 'Removed ' + ok + ' of ' + count + ' member' + suffix + '.'
        return self.refreshGroups()
      }).then(function() {
        return self.loadRemovedMembers()
      }).catch(function(e) {
        self.actionMessage = e && e.message ? e.message : 'Unable to remove members.'
      }).then(function() {
        self.bulkBusy = false
      })
    },
    restoreSelected() {
      if (!this.activeGroup || this.bulkBusy || this.selectedRemoved.length === 0) {
        return Promise.resolve()
      }
      var count = this.selectedRemoved.length
      var suffix = count === 1 ? '' : 's'
      var self = this
      var members = this.copySelected(this.selectedRemoved)
      this.bulkBusy = true
      this.actionMessage = ''
      return apiPost('/api/method/backend_custom_app.api.messages.bulk_restore_group_members', {
        group: this.activeGroup.name,
        members: members
      }).then(function(res) {
        self.selectedRemoved = []
        var ok = 0
        if (res && typeof res.succeeded === 'number') {
          ok = res.succeeded
        } else if (res && res.succeeded && typeof res.succeeded.length === 'number') {
          ok = res.succeeded.length
        }
        self.actionMessage = 'Restored ' + ok + ' of ' + count + ' member' + suffix + '.'
        return self.refreshGroups()
      }).then(function() {
        return self.loadRemovedMembers()
      }).catch(function(e) {
        self.actionMessage = e && e.message ? e.message : 'Unable to restore members.'
      }).then(function() {
        self.bulkBusy = false
      })
    },
    reloadGroups() {
      return this.refreshGroups()
    },
    handleRealtimeMessage(data) {
      if (!data || !data.group) {
        return
      }
      var current = this.sessionUser()
      if (current && data.sender && data.sender === current) {
        return
      }
      this.loadMessages(data.group)
      if (this.shouldPlayForGroup(data.group)) {
        playMessageSound()
      }
      if (this.activeGroup && data.group === this.activeGroup.name) {
        this.markRead()
      }
      this.refreshGroups()
    },
    handleToast(data) {
      if (!data) {
        return
      }
      var current = this.activeGroup && this.activeGroup.current_user ? this.activeGroup.current_user : this.sessionUser()
      if (current && data.sender && data.sender === current) {
        return
      }
      if (data.group && this.shouldPlayForGroup(data.group)) {
        playMessageSound()
      }
      var group = data.group_name || ''
      if (!group) {
        var found = this.findGroup(data.group)
        group = found ? this.groupDisplayName(found) : 'Messages'
      }
      var sender = data.sender_name || 'New message'
      var preview = data.preview || ''
      this.showToast(group + ' · ' + sender + ': ' + preview)
    },
    handleAccessChange(data) {
      var current = this.activeGroup && this.activeGroup.current_user ? this.activeGroup.current_user : this.sessionUser()
      if (data && data.user && data.user === current) {
        this.refreshGroups()
      }
    },
    sessionUser() {
      if (window.parent && window.parent.frappe && window.parent.frappe.session && window.parent.frappe.session.user) {
        return String(window.parent.frappe.session.user)
      }
      if (window.frappe && window.frappe.session && window.frappe.session.user) {
        return String(window.frappe.session.user)
      }
      return ''
    },
    showToast(text) {
      var self = this
      this.clearToastTimer()
      this.toastText = text
      this.toastTimer = setTimeout(function() {
        self.toastText = ''
        self.toastTimer = null
      }, 5000)
    },
    clearToastTimer() {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
        this.toastTimer = null
      }
    },
    bindRealtime() {
      if (this.realtimeHandlerBound) {
        return
      }
      var self = this
      this.messageHandler = function(data) {
        self.handleRealtimeMessage(data)
      }
      this.toastHandler = function(data) {
        self.handleToast(data)
      }
      this.accessHandler = function(data) {
        self.handleAccessChange(data)
      }
      this.pollHandler = function(data) {
        self.handlePollUpdated(data)
      }
      var bindExisting = function() {
        var realtime = null
        if (window.frappe && window.frappe.realtime) {
          realtime = window.frappe.realtime
        }
        if (window.parent && window.parent.frappe && window.parent.frappe.realtime) {
          realtime = window.parent.frappe.realtime
        }
        if (!realtime) {
          return false
        }
        realtime.on('group_message_new', self.messageHandler)
        realtime.on('messages_new_message_toast', self.toastHandler)
        realtime.on('messages_group_access_changed', self.accessHandler)
        realtime.on('group_poll_updated', self.pollHandler)
        self.realtimeHandlerBound = true
        self.realtimeTarget = realtime
        return true
      }
      apiGet('/api/method/backend_custom_app.api.messages.get_message_socket_config').then(function(config) {
        var parts = window.location.origin.split(':')
        var useDirect = Boolean(config && config.sitename && config.developer_mode && parts.length > 2)
        if (!useDirect && bindExisting()) {
          return
        }
        if (!config || !config.sitename) {
          return
        }
        var host = window.location.origin
        if (useDirect) {
          host = parts[0] + ':' + parts[1] + ':' + String(config.socketio_port || 9000)
        }
        self.socket = io(host + '/' + config.sitename, {
          withCredentials: true,
          reconnectionAttempts: 3
        })
        self.socket.on('group_message_new', self.messageHandler)
        self.socket.on('messages_new_message_toast', self.toastHandler)
        self.socket.on('messages_group_access_changed', self.accessHandler)
        self.socket.on('group_poll_updated', self.pollHandler)
        self.realtimeHandlerBound = true
        self.realtimeTarget = self.socket
      }).catch(function(e) {
        bindExisting()
      })
    },
    unbindRealtime() {
      if (this.realtimeTarget && this.realtimeTarget.off) {
        if (this.messageHandler) {
          this.realtimeTarget.off('group_message_new', this.messageHandler)
        }
        if (this.toastHandler) {
          this.realtimeTarget.off('messages_new_message_toast', this.toastHandler)
        }
        if (this.accessHandler) {
          this.realtimeTarget.off('messages_group_access_changed', this.accessHandler)
        }
        if (this.pollHandler) {
          this.realtimeTarget.off('group_poll_updated', this.pollHandler)
        }
      }
      if (this.socket && this.socket.disconnect) {
        this.socket.disconnect()
      }
      this.realtimeHandlerBound = false
      this.realtimeTarget = null
      this.socket = null
      this.messageHandler = null
      this.toastHandler = null
      this.accessHandler = null
      this.pollHandler = null
    },
    startPolling() {
      var self = this
      this.pollTimer = setInterval(function() {
        self.refreshGroups()
        if (self.activeGroup) {
          self.loadMessages(self.activeGroup.name)
        }
      }, 30000)
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    }
  }
}
</script>

<style scoped>
.messages-page {
  width: 100%;
  max-width: 100%;
  height: 100vh;
  overflow: hidden;
}
.main-content {
  margin-left: 255px;
  height: 100vh;
  min-height: 0;
  background: #f4f6fb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.messages-page-embedded,
.messages-page-embedded .main-content,
.main-content-embedded {
  height: 100vh;
  min-height: 0;
  margin-left: 0;
  padding: 0;
  overflow: hidden;
}
.messages-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  box-sizing: border-box;
  padding: 14px 18px 16px 18px;
  overflow-x: hidden;
}
.messages-shell {
  width: 100%;
  max-width: 1180px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  box-sizing: border-box;
  gap: 6px;
  padding: 6px;
  min-width: 0;
  background: transparent;
  border-radius: 14px;
  overflow: visible;
}
.groups-panel {
  position: relative;
  z-index: 1;
  width: 320px;
  flex: 0 0 320px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 14px 0 0 14px;
  background: #ffffff;
  border-right: 1px solid #eef2f7;
  box-shadow: 0 6px 24px rgba(17, 17, 17, 0.28);
}
.groups-head {
  flex: 0 0 auto;
  padding: 12px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.groups-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 8px;
}
.groups-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  border-radius: 9px;
  padding: 0 9px;
  background: rgba(255, 255, 255, 0.94);
}
.search-icon {
  flex: 0 0 auto;
  color: #7c6ee6;
  font-size: 15px;
}
.groups-search {
  width: 100%;
  min-width: 0;
  height: 34px;
  border: none;
  outline: none;
  background: transparent;
  color: #1f2937;
  font-size: 12px;
  font-family: inherit;
  box-sizing: border-box;
}
.group-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.state-text,
.list-empty {
  padding: 12px;
  color: #64748b;
  font-size: 12px;
}
.group-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #f1f4f9;
  background: #ffffff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
}
.group-row:hover {
  background: #f8f6ff;
}
.group-row-active {
  background: #f4f1ff;
  box-shadow: inset 3px 0 0 #c8499a;
}
.avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);
  font-size: 13px;
  font-weight: 800;
}
.group-row-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.group-row-top,
.group-row-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.group-row-bottom {
  margin-top: 3px;
}
.group-row-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.group-row-time {
  flex: 0 0 auto;
  font-size: 10px;
  color: #64748b;
}
.group-row-preview {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.group-unread {
  flex: 0 0 auto;
  min-width: 18px;
  text-align: center;
  border-radius: 999px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 5px;
}
.chat-panel {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: none;
  border-radius: 0 14px 14px 0;
  background: #ffffff;
  box-shadow: 0 4px 18px rgba(69, 61, 137, 0.12);
}
.chat-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 9px 12px;
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
}
.back-btn {
  display: none;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  border: 1px solid #d7deea;
  border-radius: 9px;
  background: #ffffff;
  color: #453d89;
  font-size: 17px;
  cursor: pointer;
}
.avatar-chat {
  width: 36px;
  height: 36px;
  flex-basis: 36px;
  font-size: 12px;
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
  font-size: 10px;
  color: #64748b;
}
.members-btn {
  flex: 0 0 auto;
  border: 1px solid #d7deea;
  border-radius: 999px;
  padding: 6px 11px;
  color: #453d89;
  background: #ffffff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.sound-btn {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d7deea;
  border-radius: 9px;
  color: #7c6ee6;
  background: #ffffff;
  cursor: pointer;
}
.chat-banner {
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 6px 12px;
  background: #f8f9ff;
  border-bottom: 1px solid #eef2f7;
  color: #5b5470;
  font-size: 10px;
  line-height: 1.4;
  word-break: break-word;
}
.messages-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px;
  color-scheme: light;
  background: #ffffff;
  scrollbar-color: #cbd5e1 #ffffff;
}
.messages-list::-webkit-scrollbar {
  width: 8px;
}
.messages-list::-webkit-scrollbar-track {
  background: #ffffff;
}
.messages-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}
.chat-empty {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #64748b;
}
.welcome-art {
  width: 220px;
  max-width: 70%;
  height: auto;
}
.chat-empty-title {
  margin-top: 12px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 800;
}
.chat-empty-sub {
  margin-top: 6px;
  font-size: 12px;
}
.chat-empty-hint {
  margin-top: 12px;
  font-size: 11px;
  color: #64748b;
}
.chat-empty-hint kbd {
  display: inline-block;
  padding: 1px 5px;
  border: 1px solid #d7deea;
  border-radius: 5px;
  background: #ffffff;
  color: #453D89;
  font-family: inherit;
  font-size: 10px;
  font-weight: 800;
}
.empty-state {
  text-align: center;
  padding: 28px 12px;
  color: #64748b;
}
.empty-title {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 12px;
}
.day-separator {
  text-align: center;
  margin: 10px 0;
}
.day-separator-text {
  display: inline-block;
  font-size: 10px;
  color: #64748b;
  background: #eef2f7;
  padding: 3px 9px;
  border-radius: 999px;
}
.msg-row {
  display: flex;
  margin: 6px 0;
}
.msg-row-own {
  justify-content: flex-end;
}
.msg-row-other {
  justify-content: flex-start;
}
.msg-bubble {
  max-width: min(720px, 82%);
  border-radius: 12px;
  padding: 8px 10px;
}
.msg-bubble-own {
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.msg-bubble-other {
  background: #f1f3f9;
  color: #1f2937;
  border: 1px solid #e2e8f0;
}
.msg-meta-line {
  font-size: 10px;
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.msg-bubble-other .msg-meta-line {
  color: #64748b;
}
.msg-bubble-own .msg-meta-line {
  color: rgba(255, 255, 255, 0.9);
}
.msg-sender {
  font-weight: 700;
}
.msg-text {
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg-time-row {
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.msg-time {
  font-size: 10px;
  opacity: 0.85;
}
.msg-delete {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.9;
  text-decoration: underline;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
}
.msg-bubble-own .msg-delete {
  color: #ffffff;
}
.messages-input-wrap {
  flex: 0 0 auto;
  box-sizing: border-box;
  border-top: 1px solid #e2e8f0;
  padding: 7px 10px;
  background: #ffffff;
  color-scheme: light;
}
.send-error {
  color: #b42318;
  font-size: 11px;
  margin-bottom: 4px;
}
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.messages-page-embedded .input-row {
  padding-right: 68px;
}
.msg-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 42px;
  line-height: 20px;
  resize: none;
  border: 1px solid #d7deea;
  border-radius: 10px;
  padding: 10px;
  background: #ffffff;
  color: #1f2937;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.msg-input::placeholder {
  color: #94a3b8;
}
.msg-input:focus {
  border-color: #7c6ee6;
}
.send-btn {
  flex: 0 0 auto;
  height: 42px;
  min-width: 72px;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);
}
.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.composer-wrap {
  position: relative;
}
.composer-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.tool-btn {
  width: 32px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
}
.tool-btn:hover {
  border-color: #d7deea;
  background: #f1f3f9;
}
.tool-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hidden-file-input {
  display: none;
}
.upload-progress {
  margin-top: 4px;
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  position: relative;
}
.upload-progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(105deg, #453D89, #C8499A);
  transition: width 0.2s ease;
}
.upload-progress-label {
  position: absolute;
  right: 0;
  top: 6px;
  font-size: 10px;
  color: #64748b;
}
@media (max-width: 520px) {
  .messages-page-embedded .input-row {
    padding-right: 0;
  }
  .composer-tools {
    gap: 0;
  }
  .tool-btn {
    width: 28px;
    height: 38px;
  }
  .send-btn {
    min-width: 62px;
    padding: 8px;
  }
}
.members-overlay {
  position: fixed;
  inset: 0;
  z-index: 40000;
  display: flex;
  justify-content: flex-end;
}
.members-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  margin: 0;
  background: rgba(15, 23, 42, 0.45);
  cursor: pointer;
}
.members-drawer {
  position: relative;
  z-index: 1;
  width: 340px;
  max-width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: -12px 0 32px rgba(34, 30, 69, 0.28);
}
.drawer-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.drawer-heading {
  flex: 1 1 auto;
  min-width: 0;
}
.drawer-title {
  font-size: 14px;
  font-weight: 800;
}
.drawer-sub {
  margin-top: 2px;
  font-size: 10px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drawer-close {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
}
.drawer-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px 16px 12px;
}
.drawer-message {
  margin-bottom: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  background: #f4f1ff;
  color: #453d89;
  font-size: 11px;
  font-weight: 700;
  word-break: break-word;
}
.member-section {
  margin-bottom: 16px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.section-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #6d5fc7;
  text-transform: uppercase;
}
.select-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #453d89;
  font-weight: 700;
  cursor: pointer;
}
.member-row {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 6px 0;
  border-bottom: 1px solid #eceffa;
  font-size: 12px;
  color: #475569;
}
.member-check {
  flex: 0 0 auto;
  margin: 0;
  accent-color: #7c6ee6;
}
.member-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-role {
  flex: 0 0 auto;
  color: #7c6ee6;
  font-size: 10px;
  font-weight: 700;
}
.removed-empty {
  padding: 6px 0;
  color: #94a3b8;
  font-size: 11px;
}
.section-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.selected-count {
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
}
.bulk-btn {
  flex: 0 0 auto;
  border: 1px solid #d7deea;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-size: 10px;
  font-weight: 700;
  padding: 6px 10px;
  cursor: pointer;
}
.bulk-remove {
  color: #b42318;
}
.bulk-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.message-toast {
  position: fixed;
  z-index: 50;
  right: 16px;
  bottom: 16px;
  max-width: min(360px, calc(100vw - 32px));
  box-sizing: border-box;
  border-radius: 12px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(69, 61, 137, 0.28);
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 700;
  word-break: break-word;
}
@media (max-width: 1100px) {
  .groups-panel {
    width: 280px;
    flex-basis: 280px;
  }
}
@media (max-width: 768px) {
  .messages-page,
  .main-content {
    height: 100dvh;
  }
  .messages-body {
    padding: 10px 12px calc(12px + env(safe-area-inset-bottom)) 12px;
  }
  .messages-shell {
    border-radius: 10px;
  }
  .groups-panel {
    width: 100%;
    flex: 1 1 auto;
    border-right: none;
    border-radius: 10px;
  }
  .chat-panel {
    display: none;
  }
  .messages-shell.chat-open .groups-panel {
    display: none;
  }
  .messages-shell.chat-open .chat-panel {
    display: flex;
    width: 100%;
    border-radius: 10px;
  }
  .back-btn {
    display: inline-flex;
  }
  .groups-head {
    padding: 10px;
  }
  .group-row {
    padding: 9px 10px;
  }
  .chat-header {
    padding: 8px 10px;
  }
  .messages-list {
    padding: 8px 10px;
  }
  .msg-bubble {
    max-width: 88%;
  }
  .members-drawer {
    width: 100vw;
    height: calc(100dvh - 10px);
  }
  .drawer-header {
    padding-top: calc(12px + env(safe-area-inset-top));
  }
  .messages-input-wrap {
    padding-bottom: calc(7px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 360px) {
  .groups-title {
    font-size: 14px;
  }
  .chat-header {
    gap: 7px;
  }
  .members-btn {
    padding: 5px 8px;
    font-size: 10px;
  }
  .send-btn {
    min-width: 58px;
    padding: 8px;
  }
}
</style>
