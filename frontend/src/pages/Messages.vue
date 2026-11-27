<template>
  <div class="messages-page" v-bind:class="isEmbedded ? 'messages-page-embedded' : ''">
    <Sidebar v-if="!isEmbedded" />
    <main class="main-content" v-bind:class="isEmbedded ? 'main-content-embedded' : ''">
      <section class="messages-body">
        <div class="messages-shell" v-bind:class="chatOpen ? 'chat-open' : ''" v-bind:style="{ '--messages-keyboard-inset': keyboardInset + 'px' }">
          <aside class="groups-panel">
            <div class="groups-head">
              <button v-if="archivedView" type="button" class="archived-back" aria-label="Back to all chats" v-on:click="backToMain">←</button>
              <div class="groups-head-row">
                <div class="groups-title">{{ archivedView ? 'Archived' : 'Messages' }}</div>
                <button v-if="!archivedView && canCreateGroup" type="button" class="groups-add" aria-label="New group" title="New group" v-on:click="openNewGroup">+</button>
              </div>
              <div class="groups-search-wrap">
                <span class="search-icon">⌕</span>
                <input
                  type="text"
                  class="groups-search"
                  v-model="searchText"
                  v-bind:placeholder="archivedView ? 'Search archived groups' : 'Search groups'"
                  v-bind:aria-label="archivedView ? 'Search archived groups' : 'Search groups'"
                />
              </div>
            </div>
            <div class="group-list">
              <button
                v-if="!loadingGroups && !archivedView && archivedCount > 0"
                type="button"
                class="archived-row"
                aria-label="Open archived chats"
                v-on:click="openArchived"
              >
                <span class="archived-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h16v3H4zM6 10v8h12v-8M10 13h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <span class="archived-label">Archived ({{ archivedCount }})</span>
                <span v-if="archivedUnreadCount > 0" class="archived-unread">{{ unreadLabel(archivedUnreadCount) }}</span>
              </button>
              <div v-if="loadingGroups" class="state-text">Loading groups...</div>
              <div v-if="!loadingGroups && groups.length === 0" class="list-empty">You are not a member of any group yet.</div>
              <div v-if="!loadingGroups && groups.length > 0 && visibleGroups.length === 0" class="list-empty">No matching groups.</div>
              <div
                role="button"
                tabindex="0"
                class="group-row"
                v-for="g in visibleGroups"
                v-bind:key="g.name"
                v-bind:class="activeGroup && g.name === activeGroup.name ? 'group-row-active' : ''"
                v-on:click="selectGroup(g)"
                v-on:keydown.enter="selectGroup(g)"
                v-on:keydown.space.prevent="selectGroup(g)"
              >
                <span class="avatar">{{ initials(groupDisplayName(g)) }}</span>
                <span class="group-row-main">
                  <span class="group-row-top">
                    <span class="group-row-name">{{ groupDisplayName(g) }}</span>
                    <span class="group-row-time">{{ groupTime(g) }}</span>
                  </span>
                  <span class="group-row-bottom">
                    <span v-if="groupTypingText(g)" class="group-row-preview group-row-typing">{{ groupTypingText(g) }}</span>
                    <span v-else class="group-row-preview">{{ groupPreview(g) }}</span>
                    <span class="group-unread" v-if="g.unread_count > 0">{{ unreadLabel(g.unread_count) }}</span>
                  </span>
                </span>
                <button
                  type="button"
                  class="row-archive"
                  v-bind:aria-label="g.archived ? 'Unarchive chat' : 'Archive chat'"
                  v-bind:title="g.archived ? 'Unarchive chat' : 'Archive chat'"
                  v-on:click.stop="archiveFromRow(g)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h16v3H4zM6 10v8h12v-8M10 13h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          </aside>

          <section class="chat-panel">
            <template v-if="activeGroup">
              <ChatHeader
                v-bind:title="groupDisplayName(activeGroup)"
                v-bind:avatar-text="initials(groupDisplayName(activeGroup))"
                v-bind:group-type="activeGroup.group_type || ''"
                v-bind:members="activeGroup.members || []"
                v-bind:meta="headerMetaText"
                v-bind:typing="activeTypingNames.length > 0"
                v-bind:sound-muted="soundMuted"
                v-bind:sound-label="soundLabel"
                v-bind:archived="Boolean(activeGroup.archived)"
                v-bind:more-open="moreOpen"
                v-bind:search-open="chatSearchOpen"
                v-bind:search-text="chatSearchText"
                v-bind:search-count="chatSearchMatches.length"
                v-bind:search-index="chatSearchIndex"
                v-on:back="backToList"
                v-on:toggle-search="toggleChatSearch"
                v-on:toggle-more="moreOpen = !moreOpen"
                v-on:open-info="openInfo"
                v-on:open-members="openMembers"
                v-on:toggle-sound="toggleSound"
                v-on:archive="archiveChat"
                v-on:unarchive="unarchiveChat"
                v-on:delete-chat="openDeleteChatConfirm"
                v-on:add-members="openMemberPicker"
                v-on:exit-group="openExitGroupConfirm"
                v-on:delete-group="openDeleteGroupConfirm"
                v-on:search-next="moveChatSearch(1)"
                v-on:search-prev="moveChatSearch(-1)"
                v-on:update:searchText="onChatSearchInput"
              />
              <div class="messages-list" ref="messagesListRef" v-on:scroll="onMessagesScroll">
                <div v-if="messages.length > 0 && !floatingDateHidden" class="floating-date-chip">{{ currentDayLabel() }}</div>
                <div v-if="loadingMessages" class="state-text">Loading messages...</div>
                <div v-if="!loadingMessages && messages.length === 0" class="empty-state">
                  <svg class="empty-chat-art" viewBox="0 0 160 120" aria-hidden="true">
                    <rect x="12" y="18" width="104" height="66" rx="18" fill="#F3EFFB" stroke="#DCD3F5" stroke-width="2"/>
                    <path d="M39 84l-2 16 20-16z" fill="#F3EFFB" stroke="#DCD3F5" stroke-width="2"/>
                    <circle cx="42" cy="51" r="5" fill="#7C6EE6"/>
                    <circle cx="60" cy="51" r="5" fill="#7C6EE6"/>
                    <circle cx="78" cy="51" r="5" fill="#7C6EE6"/>
                    <rect x="62" y="44" width="86" height="58" rx="17" fill="url(#emptyChatGradient)" opacity="0.12"/>
                    <rect x="62" y="44" width="86" height="58" rx="17" fill="none" stroke="#C8499A" stroke-width="2" opacity="0.45"/>
                    <path d="M121 102l2 14-18-14z" fill="#F7D9EC" stroke="#C8499A" stroke-width="2" opacity="0.45"/>
                    <path d="M80 66h50M80 78h34" stroke="#7C6EE6" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
                    <defs>
                      <linearGradient id="emptyChatGradient" x1="62" y1="44" x2="148" y2="102" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#453D89"/>
                        <stop offset="1" stop-color="#C8499A"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="empty-title">No messages yet</div>
                  <div class="empty-sub">Start the conversation by sending a message.</div>
                </div>
                <template v-for="(m, idx) in messages" v-bind:key="m.client_id || m.name">
                  <div v-if="showDaySeparator(idx)" class="day-separator">
                    <span class="day-separator-text">{{ dayLabel(m.sent_at) }}</span>
                  </div>
                  <div
                    class="msg-row"
                    v-bind:data-message-name="m.name"
                    v-bind:data-sent-at="m.sent_at"
                    v-bind:class="[m.is_own ? 'msg-row-own' : 'msg-row-other', consecutiveMessage(idx) ? 'msg-row-consecutive' : '', m.sendStatus ? 'msg-row-' + m.sendStatus : '']"
                    v-on:touchstart.passive="onMessageTouchStart(m)"
                    v-on:touchend.passive="onMessageTouchEnd"
                    v-on:touchmove.passive="onMessageTouchEnd"
                  >
                    <span v-if="!m.is_own" class="msg-avatar-col">
                      <span v-if="!consecutiveMessage(idx)" class="msg-avatar" v-bind:style="{ backgroundColor: senderColor(m.sender) }">{{ initials(m.sender_name) }}</span>
                    </span>
                    <div class="msg-bubble" v-bind:class="[m.is_own ? 'msg-bubble-own' : 'msg-bubble-other', messageSearchClass(m.name)]">
                      <div v-if="!m.is_own" class="msg-meta-line">
                        <span class="msg-sender" v-bind:style="{ color: senderColor(m.sender) }">{{ m.sender_name }}</span>
                        <span class="msg-role">{{ roleLabelText(m.role_label) }}</span>
                      </div>
                      <MessageRich
                        v-bind:message="m"
                        v-bind:time="timeLabel(m.sent_at)"
                        v-on:view-image="openImageViewer"
                        v-on:vote="votePoll"
                        v-on:close-poll="closePoll"
                      />
                      <div class="msg-time-row">
                        <span class="msg-time"><span v-if="m.is_own && !m.sendStatus" class="msg-tick">✓</span> {{ timeLabel(m.sent_at) }}</span>
                        <span v-if="m.sendStatus === 'sending'" class="msg-send-state msg-send-state-sending" aria-label="Sending" title="Sending">
                          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                          <span>Sending</span>
                        </span>
                        <span v-if="m.sendStatus === 'failed'" class="msg-send-state msg-send-state-failed" role="alert">
                          <span>Failed</span>
                          <button type="button" class="msg-retry" v-on:click.stop="retryMessage(m)">Retry</button>
                        </span>
                        <span class="msg-action-wrap" v-bind:class="actionMenuName === m.name ? 'msg-action-wrap-open' : ''">
                          <button
                            type="button"
                            class="msg-action-btn"
                            aria-label="Message actions"
                            title="Message actions"
                            v-on:click.stop="toggleMessageMenu(m.name)"
                          >⋮</button>
                          <span v-if="actionMenuName === m.name" class="msg-action-menu" role="menu">
                            <button type="button" role="menuitem" v-on:click.stop="copyMessage(m)">Copy</button>
                            <button v-if="m.is_own" type="button" role="menuitem" class="msg-action-delete" v-on:click.stop="openDeleteMessageConfirm(m)">Delete</button>
                          </span>
                        </span>
                      </div>
                    </div>
                    <div v-if="m.is_own && m.name && showSentLabel(idx)" class="msg-sent">✓ Sent</div>
                  </div>
                </template>
              </div>
              <button
                v-if="showJumpLatest"
                type="button"
                class="jump-latest"
                aria-label="Jump to latest message"
                title="Jump to latest message"
                v-on:click="jumpToLatest"
              >
                <span v-if="unseenBelowCount > 0" class="jump-latest-count">{{ unseenBelowCount }}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v13M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div v-if="activeTypingNames.length > 0" class="composer-typing" aria-live="polite">
                <span class="typing-dots"><span></span><span></span><span></span></span>
                <span>{{ typingLineText }}</span>
              </div>
              <div v-if="activeCanSend" class="messages-input-wrap composer-wrap">
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
                  <MessageComposerMenu
                    v-if="composerMenuOpen"
                    v-on:select="onComposerMenuSelect"
                    v-on:close="closeMenus"
                  />
                </div>
                <div class="input-row">
                  <button
                    type="button"
                    class="composer-plus"
                    aria-label="Open message tools"
                    title="Message tools"
                    v-bind:aria-expanded="composerMenuOpen ? 'true' : 'false'"
                    v-on:click="toggleComposerMenu"
                  >+</button>
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
                      v-if="!inputText && !pendingAttachment && !recording"
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
                    v-on:input="resizeInput"
                    v-on:keydown="onInputKeydown"
                  ></textarea>
                  <button
                    v-if="!inputText && !pendingAttachment && !recording"
                    type="button"
                    class="mic-btn"
                    aria-label="Record a voice note"
                    title="Record a voice note"
                    v-on:click="startVoiceRecording"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                  </button>
                  <button v-if="canSend" type="button" class="send-btn" aria-label="Send message" title="Send message" v-on:click="sendMessage()">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12l16-8-6.4 16-3.1-6.5L4 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10.5 13.5L20 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  </button>
                </div>
                <div v-if="activeUpload && activeUpload.progress > 0" class="upload-progress">
                  <span class="upload-progress-fill" v-bind:style="{ width: activeUpload.progress + '%' }"></span>
                  <span class="upload-progress-label">{{ activeUpload.progress }}%</span>
                </div>
                <input ref="documentInput" type="file" class="hidden-file-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" v-on:change="onFileChosen($event, 'document')" />
                <input ref="photosInput" type="file" class="hidden-file-input" accept="image/*,video/mp4,video/webm" v-on:change="onFileChosen($event, 'photos')" />
                <input ref="cameraInput" type="file" class="hidden-file-input" accept="image/*" capture="environment" v-on:change="onFileChosen($event, 'camera')" />
                <input ref="audioInput" type="file" class="hidden-file-input" accept="audio/mp3,audio/wav,audio/mp4,audio/ogg,audio/webm,audio/aac,.mp3,.wav,.m4a,.ogg,.webm,.aac" v-on:change="onFileChosen($event, 'audio')" />
              </div>
              <div v-else class="read-only-composer" role="status">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                <span>{{ readOnlyComposerText }}</span>
              </div>
              <transition name="info-slide">
                <ChatInfoPanel
                  v-if="infoOpen"
                  v-bind:title="groupDisplayName(activeGroup)"
                  v-bind:avatar-text="initials(groupDisplayName(activeGroup))"
                  v-bind:member-count="Number(activeGroup.members_count || 0)"
                  v-bind:description="String(activeGroup.description || activeGroup.group_description || '')"
                  v-bind:creator-name="creatorNameFor(activeGroup)"
                  v-bind:group-type="activeGroup.group_type || ''"
                  v-bind:sound-muted="soundMuted"
                  v-bind:sound-label="soundLabel"
                  v-bind:can-add-members="canAddMembers"
                  v-bind:can-delete-group="canDeleteGroup"
                  v-bind:can-exit-group="canExitGroup"
                  v-bind:group="activeGroup.name"
                  v-bind:members="activeMembers"
                  v-bind:send-mode="activeSendMode"
                  v-bind:can-manage-send-rules="canManageSendRules"
                  v-bind:send-rules-open="sendRulesOpen"
                  v-bind:files="sharedFiles"
                  v-bind:links="sharedLinks"
                  v-bind:files-count="sharedFilesCount"
                  v-bind:links-count="sharedLinksCount"
                  v-on:close="dismissInfo"
                  v-on:search="toggleChatSearch"
                  v-on:toggle-sound="toggleSound"
                  v-on:view-members="openMembersFromInfo"
                  v-on:add-members="openMemberPicker"
                  v-on:delete-chat="openDeleteChatConfirm"
                  v-on:exit-group="openExitGroupConfirm"
                  v-on:delete-group="openDeleteGroupConfirm"
                  v-on:view-all="loadSharedItems"
                  v-on:open-send-rules="openSendRules"
                  v-on:close-send-rules="dismissSendRules"
                  v-on:send-rules-toast="handleSendRulesToast"
                  v-on:send-rules-changed="handleSendRulesChanged"
                />
              </transition>
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
      <button type="button" class="members-backdrop" aria-label="Close members" v-on:click="dismissMembers"></button>
      <aside class="members-drawer">
        <div class="drawer-header">
          <div class="drawer-heading">
            <div class="drawer-title">Group members</div>
            <div class="drawer-sub">{{ groupDisplayName(activeGroup) }}</div>
          </div>
          <button type="button" class="drawer-close" aria-label="Close members" v-on:click="dismissMembers">×</button>
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
              <span v-if="m.read_only" class="member-readonly-tag">Read only</span>
              <span class="member-role">{{ roleLabelText(m.role_label) }}</span>
              <button
                v-if="canRestrictMember(m)"
                type="button"
                class="member-restrict-btn"
                v-on:click="openMemberRestrictionConfirm(m)"
              >{{ m.read_only ? 'Allow messages' : 'Restrict' }}</button>
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

    <MessageConfirmDialog
      v-if="confirmState.open"
      v-bind:key="confirmState.kind"
      v-bind:title="confirmState.title"
      v-bind:message="confirmState.message"
      v-bind:required-text="confirmState.requiredText"
      v-bind:confirm-label="confirmState.confirmLabel"
      v-bind:cancel-label="confirmState.cancelLabel"
      v-bind:danger="confirmState.danger"
      v-bind:busy="confirmBusy"
      v-on:cancel="closeConfirm"
      v-on:confirm="runConfirm"
    />
    <MessageMemberPicker
      v-if="memberPickerOpen && activeGroup"
      v-bind:group="activeGroup.name"
      title="Add members"
      submit-label="Add members"
      v-on:cancel="closeMemberPicker"
      v-on:confirm="addMembers"
    />
    <MessageNewGroupDialog
      v-if="newGroupOpen"
      v-bind:creator="sessionUser()"
      v-bind:busy="newGroupBusy"
      v-bind:error="newGroupError"
      v-on:cancel="closeNewGroup"
      v-on:create="createGroup"
    />
    <MessageImageViewer v-if="viewerUrl" v-bind:url="viewerUrl" v-bind:name="viewerName" v-on:close="closeImageViewer" />
    <MessageCameraCapture
      v-if="cameraOpen"
      v-on:captured="onCameraCaptured"
      v-on:fallback="onCameraFallback"
      v-on:error="onCameraError"
      v-on:cancel="closeCamera"
    />
    <div class="message-toast" v-bind:class="toastTone === 'error' ? 'toast-error' : ''" v-if="toastText">
      <span>{{ toastText }}</span>
      <button v-if="toastUndo" type="button" class="toast-undo" v-on:click="runToastUndo">Undo</button>
    </div>
    <div class="message-toast archive-toast" v-if="archiveToastText">
      <span>{{ archiveToastText }}</span>
      <button v-if="archiveToastUndo" type="button" class="toast-undo" v-on:click="runArchiveToastUndo">Undo</button>
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import ChatHeader from '@/components/messages/ChatHeader.vue'
import ChatInfoPanel from '@/components/messages/ChatInfoPanel.vue'
import MessageRich from '@/components/messages/MessageRich.vue'
import MessageEmojiPanel from '@/components/messages/MessageEmojiPanel.vue'
import MessageAttachmentMenu from '@/components/messages/MessageAttachmentMenu.vue'
import MessageComposerMenu from '@/components/messages/MessageComposerMenu.vue'
import MessagePreviewStrip from '@/components/messages/MessagePreviewStrip.vue'
import MessageVoiceRecorder from '@/components/messages/MessageVoiceRecorder.vue'
import MessagePollForm from '@/components/messages/MessagePollForm.vue'
import MessageContactPicker from '@/components/messages/MessageContactPicker.vue'
import MessageCameraCapture from '@/components/messages/MessageCameraCapture.vue'
import MessageImageViewer from '@/components/messages/MessageImageViewer.vue'
import MessageConfirmDialog from '@/components/messages/MessageConfirmDialog.vue'
import MessageMemberPicker from '@/components/messages/MessageMemberPicker.vue'
import MessageNewGroupDialog from '@/components/messages/MessageNewGroupDialog.vue'
import { apiGet, apiPost, apiUpload, extractMessage } from '@/lib/api'
import { io } from 'socket.io-client'
import { installMessageSoundUnlock, isMessageSoundMuted, playMessageSound, setMessageSoundMuted } from '@/lib/message_sound'

export default {
  name: 'Messages',
  components: {
    Sidebar,
    ChatHeader,
    ChatInfoPanel,
    MessageRich,
    MessageEmojiPanel,
    MessageAttachmentMenu,
    MessageComposerMenu,
    MessagePreviewStrip,
    MessageVoiceRecorder,
    MessagePollForm,
    MessageContactPicker,
    MessageCameraCapture,
    MessageImageViewer,
    MessageConfirmDialog,
    MessageMemberPicker,
    MessageNewGroupDialog
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
      composerMenuOpen: false,
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
      typingByGroup: {},
      typingTimers: {},
      typingSentAt: {},
      actionMenuName: '',
      showJumpLatest: false,
      unseenBelowCount: 0,
      keyboardInset: 0,
      keyboardHandler: null,
      longPressTimer: null,
      confirmState: {
        open: false,
        kind: '',
        group: '',
        messageName: '',
        title: '',
        message: '',
        requiredText: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false
      },
      confirmBusy: false,
      newGroupOpen: false,
      newGroupBusy: false,
      newGroupError: '',
      memberPickerOpen: false,
      drafts: {},
      messagesByGroup: {},
      pendingSendsByGroup: {},
      localMessageSeq: 0,
      visibleDayDate: '',
      floatingDateHidden: false,
      messageLoadSeq: {},
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
      archivedView: false,
      moreOpen: false,
      chatSearchOpen: false,
      chatSearchText: '',
      chatSearchMatches: [],
      chatSearchIndex: 0,
      chatOpen: false,
      membersOpen: false,
      infoOpen: false,
      infoHistoryPushed: false,
      sendRulesOpen: false,
      sendRulesHistoryPushed: false,
      sharedFiles: [],
      sharedLinks: [],
      sharedFilesCount: 0,
      sharedLinksCount: 0,
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
      typingHandler: null,
      groupClearedHandler: null,
      groupDeletedHandler: null,
      groupListChangedHandler: null,
      sendRuleHandler: null,
      socket: null,
      toastText: '',
      toastTone: '',
      toastTimer: null,
      toastUndo: null,
      archiveToastText: '',
      archiveToastTimer: null,
      archiveToastUndo: null
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
        if (String(value || '').length > 0) {
          this.publishTyping()
        }
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
    activeCanSend() {
      if (!this.activeGroup) {
        return true
      }
      return this.activeGroup.current_user_can_send !== false
    },
    activeSendMode() {
      if (!this.activeGroup) {
        return 'everyone'
      }
      return String(this.activeGroup.send_mode || 'everyone')
    },
    canManageSendRules() {
      return Boolean(this.activeGroup && this.activeGroup.can_manage_send_rules)
    },
    currentUserRoleLabel() {
      if (!this.activeGroup) {
        return ''
      }
      return String(this.activeGroup.current_user_role_label || '')
    },
    readOnlyComposerText() {
      if (!this.activeGroup) {
        return 'You can only read this chat'
      }
      if (this.activeGroup.current_user_read_only || this.activeSendMode === 'selected') {
        return 'You can only read this chat'
      }
      if (this.activeSendMode === 'admins_instructors') {
        return 'Only admins and instructors can send messages'
      }
      return String(this.activeGroup.current_user_send_block_reason || 'You can only read this chat')
    },
    soundLabel() {
      if (this.soundMuted) {
        return 'Turn message sound on'
      }
      return 'Turn message sound off'
    },
    archivedGroups() {
      var list = []
      for (var i = 0; i < this.groups.length; i = i + 1) {
        if (this.groups[i].archived) {
          list.push(this.groups[i])
        }
      }
      return list
    },
    mainGroups() {
      var list = []
      for (var j = 0; j < this.groups.length; j = j + 1) {
        if (!this.groups[j].archived) {
          list.push(this.groups[j])
        }
      }
      return list
    },
    archivedCount() {
      return this.archivedGroups.length
    },
    archivedUnreadCount() {
      var list = this.archivedGroups
      var total = 0
      for (var k = 0; k < list.length; k = k + 1) {
        total = total + (Number(list[k].unread_count) || 0)
      }
      return total
    },
    visibleGroups() {
      var list = []
      var source = this.archivedView ? this.archivedGroups : this.mainGroups
      var term = String(this.searchText || '').trim().toLowerCase()
      for (var i = 0; i < source.length; i = i + 1) {
        var g = source[i]
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
    headerMetaText() {
      if (this.activeGroup) {
        var names = this.typingNames(this.activeGroup.name)
        if (names.length > 0) {
          return this.typingLabel(names)
        }
      }
      return this.chatMetaText
    },
    activeTypingNames() {
      if (!this.activeGroup) {
        return []
      }
      return this.typingNames(this.activeGroup.name)
    },
    typingLineText() {
      return this.typingLabel(this.activeTypingNames)
    },
    canCreateGroup() {
      var i = 0
      while (i < this.groups.length) {
        if (this.groups[i].can_create_group) {
          return true
        }
        i = i + 1
      }
      return false
    },
    canAddMembers() {
      if (!this.activeGroup || !this.activeGroup.is_custom) {
        return false
      }
      return Boolean(this.activeGroup.can_manage_members)
    },
    canDeleteGroup() {
      if (!this.activeGroup || !this.activeGroup.is_custom) {
        return false
      }
      return Boolean(this.activeGroup.can_delete_group)
    },
    canExitGroup() {
      if (!this.activeGroup) {
        return false
      }
      return this.activeGroup.can_exit_group !== false
    },
    chatMetaText() {
      if (!this.activeGroup) {
        return ''
      }
      var text = this.memberCountText + ' members'
      var desc = String(this.activeGroup.description || this.activeGroup.group_description || '')
      if (desc) {
        if (desc.length > 42) {
          desc = desc.substring(0, 42) + '…'
        }
        text = text + ' · ' + desc
      }
      return text
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
    },
    inputText: function() {
      var self = this
      this.$nextTick(function() {
        self.resizeInput()
      })
    },
    messages: function() {
      if (this.chatSearchOpen) {
        this.refreshChatSearch(false)
      }
      var self = this
      this.$nextTick(function() {
        self.updateScrollState()
      })
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
    if (window.visualViewport) {
      this.keyboardHandler = function() {
        self.updateKeyboardInset()
      }
      window.visualViewport.addEventListener('resize', this.keyboardHandler)
      window.visualViewport.addEventListener('scroll', this.keyboardHandler)
      this.updateKeyboardInset()
    }
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
    if (this.keyboardHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.keyboardHandler)
      window.visualViewport.removeEventListener('scroll', this.keyboardHandler)
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    this.cancelRecording()
    this.closeCamera()
    this.clearAllTyping()
    this.stopPolling()
    this.unbindRealtime()
    this.clearToastTimer()
    this.clearArchiveToastTimer()
  },
  methods: {
    closeTopMenu() {
      if (this.confirmState.open) {
        this.closeConfirm()
        return true
      }
      if (this.memberPickerOpen) {
        this.closeMemberPicker()
        return true
      }
      if (this.newGroupOpen) {
        this.closeNewGroup()
        return true
      }
      if (this.cameraOpen) {
        this.closeCamera()
        return true
      }
      if (this.moreOpen) {
        this.moreOpen = false
        return true
      }
      if (this.actionMenuName || this.pollOpen || this.emojiOpen || this.attachOpen || this.contactOpen || this.composerMenuOpen) {
        this.actionMenuName = ''
        this.closeMenus()
        return true
      }
      return false
    },
    onEscapeKey(e) {
      if (!e || e.key !== 'Escape') {
        return
      }
      this.clearAllTyping()
      if (this.closeTopMenu()) {
        return
      }
      if (this.viewerUrl) {
        this.closeImageViewer()
        return
      }
      if (this.sendRulesOpen) {
        this.dismissSendRules()
        return
      }
      if (this.infoOpen) {
        this.dismissInfo()
        return
      }
      if (this.membersOpen) {
        this.dismissMembers()
        return
      }
      if (this.chatSearchOpen) {
        this.closeChatSearch()
        return
      }
      if (!this.activeGroup && this.archivedView) {
        this.backToMain()
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
      this.composerMenuOpen = false
      this.moreOpen = false
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    },
    typingNames(group) {
      var list = []
      var entries = this.typingByGroup[group] || {}
      var keys = Object.keys(entries)
      for (var i = 0; i < keys.length; i = i + 1) {
        list.push(entries[keys[i]])
      }
      return list
    },
    typingLabel(names) {
      if (!names || names.length === 0) {
        return ''
      }
      if (names.length === 1) {
        return names[0] + ' is typing…'
      }
      if (names.length === 2) {
        return names[0] + ' and ' + names[1] + ' are typing…'
      }
      return String(names.length) + ' people are typing…'
    },
    groupTypingText(group) {
      if (!group) {
        return ''
      }
      return this.typingLabel(this.typingNames(group.name))
    },
    publishTyping() {
      var group = this.activeGroup ? this.activeGroup.name : ''
      if (!group) {
        return Promise.resolve()
      }
      var now = new Date().getTime()
      var last = Number(this.typingSentAt[group] || 0)
      if (last && now - last < 3000) {
        return Promise.resolve()
      }
      this.typingSentAt[group] = now
      return apiPost('/api/method/backend_custom_app.api.messages.publish_group_typing', { group: group }).catch(function(e) {
      })
    },
    handleTyping(data) {
      if (!data || !data.group || !data.user) {
        return
      }
      var current = this.sessionUser()
      if (current && data.user === current) {
        return
      }
      var group = String(data.group)
      var user = String(data.user)
      var key = group + '|' + user
      if (this.typingTimers[key]) {
        clearTimeout(this.typingTimers[key])
      }
      var entries = {}
      var existing = this.typingByGroup[group] || {}
      var keys = Object.keys(existing)
      for (var i = 0; i < keys.length; i = i + 1) {
        entries[keys[i]] = existing[keys[i]]
      }
      entries[user] = data.sender_name || user
      this.typingByGroup[group] = entries
      var self = this
      this.typingTimers[key] = setTimeout(function() {
        self.removeTyping(group, user)
      }, 4000)
    },
    removeTyping(group, user) {
      var key = group + '|' + user
      if (this.typingTimers[key]) {
        clearTimeout(this.typingTimers[key])
        delete this.typingTimers[key]
      }
      var entries = {}
      var existing = this.typingByGroup[group] || {}
      var keys = Object.keys(existing)
      for (var i = 0; i < keys.length; i = i + 1) {
        if (keys[i] !== user) {
          entries[keys[i]] = existing[keys[i]]
        }
      }
      this.typingByGroup[group] = entries
    },
    clearTyping(group) {
      if (!group) {
        return
      }
      var entries = this.typingByGroup[group] || {}
      var keys = Object.keys(entries)
      for (var i = 0; i < keys.length; i = i + 1) {
        var key = group + '|' + keys[i]
        if (this.typingTimers[key]) {
          clearTimeout(this.typingTimers[key])
          delete this.typingTimers[key]
        }
      }
      this.typingByGroup[group] = {}
    },
    clearAllTyping() {
      var keys = Object.keys(this.typingByGroup)
      for (var i = 0; i < keys.length; i = i + 1) {
        this.clearTyping(keys[i])
      }
    },
    senderColor(value) {
      var palette = ['#453D89', '#7c6ee6', '#C8499A', '#0ea5a4', '#d97706', '#2563eb', '#7c3aed', '#be185d']
      var text = String(value || '')
      var hash = 0
      for (var i = 0; i < text.length; i = i + 1) {
        hash = (hash * 31 + text.charCodeAt(i)) % 100000
      }
      return palette[hash % palette.length]
    },
    onDocumentClick(event) {
      var target = event && event.target
      if (!target || !target.closest) {
        return
      }
      if (target.closest('.composer-wrap') || target.closest('.viewer-overlay') || target.closest('.camera-overlay')) {
        return
      }
      if (target.closest('.msg-action-menu') || target.closest('.msg-action-btn')) {
        return
      }
      this.actionMenuName = ''
      if (target.closest('.chat-more') || target.closest('.chat-search-bar')) {
        this.emojiOpen = false
        this.attachOpen = false
        this.pollOpen = false
        this.contactOpen = false
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
        input.value = ''
        input.click()
      }
    },
    isMobileCameraDevice() {
      var agent = String(navigator.userAgent || '').toLowerCase()
      var mobile = agent.indexOf('iphone') >= 0 || agent.indexOf('ipad') >= 0 || agent.indexOf('android') >= 0 || agent.indexOf('mobile') >= 0
      var touches = navigator.maxTouchPoints || 0
      return mobile && touches > 1
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
      this.clearTyping(group)
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
      this.clearTyping(group)
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
      this.clearTyping(group)
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
    dayLabel(dt) {
      var parts = this.parseDateParts(dt)
      if (!parts) {
        return String(dt || '')
      }
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      var month = months[parts.month - 1] || ''
      return parts.day + ' ' + month + ' ' + parts.year
    },
    timeLabel(dt) {
      var parts = this.parseDateParts(dt)
      if (!parts) {
        return ''
      }
      return this.padDatePart(parts.hours) + ':' + this.padDatePart(parts.minutes)
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
          if (self.archivedView && self.archivedCount === 0) {
            self.backToMain()
          }
          return null
        }
        self.activeGroup = found
        return null
      }).catch(function(e) {
      })
    },
    setActiveGroup(group, fromQuery) {
      this.saveGroupScroll()
      var previous = this.activeGroup ? this.activeGroup.name : ''
      if (previous && previous !== group.name) {
        this.clearTyping(previous)
      }
      this.clearTyping(group.name)
      this.activeGroup = group
      if (fromQuery === true) {
        this.chatOpen = true
      }
      this.membersOpen = false
      this.infoOpen = false
      this.infoHistoryPushed = false
      this.sendRulesOpen = false
      this.sendRulesHistoryPushed = false
      this.overlayHistoryPushed = false
      this.closeMenus()
      this.closeChatSearch()
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
      this.showJumpLatest = false
      this.unseenBelowCount = 0
      var self = this
      this.$nextTick(function() {
        self.restoreGroupScroll(group.name)
        self.resizeInput()
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
      if (this.activeGroup) {
        this.clearTyping(this.activeGroup.name)
      }
      this.activeGroup = null
      this.chatOpen = false
      this.membersOpen = false
      this.infoOpen = false
      this.infoHistoryPushed = false
      this.sendRulesOpen = false
      this.sendRulesHistoryPushed = false
      this.closeMenus()
      this.closeChatSearch()
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
      this.showJumpLatest = false
      this.unseenBelowCount = 0
      this.chatHistoryPushed = false
      this.overlayHistoryPushed = false
      this.clearGroupQuery()
      this.clearParentGroupQuery()
    },
    backToList() {
      if (this.closeTopMenu()) {
        return
      }
      if (this.viewerUrl) {
        this.closeImageViewer()
        return
      }
      if (this.sendRulesOpen) {
        this.dismissSendRules()
        return
      }
      if (this.infoOpen) {
        this.dismissInfo()
        return
      }
      if (this.membersOpen) {
        this.dismissMembers()
        return
      }
      if (this.chatSearchOpen) {
        this.closeChatSearch()
        return
      }
      var pushed = this.chatHistoryPushed
      this.closeChat()
      if (pushed && window.history && window.history.back) {
        window.history.back()
      }
    },
    openArchived() {
      this.closeChat()
      this.searchText = ''
      this.archivedView = true
    },
    backToMain() {
      this.closeChat()
      this.searchText = ''
      this.archivedView = false
    },
    applyArchiveState(name, value) {
      for (var i = 0; i < this.groups.length; i = i + 1) {
        if (this.groups[i].name === name) {
          this.groups[i].archived = value
        }
      }
      if (this.activeGroup && this.activeGroup.name === name) {
        this.activeGroup.archived = value
      }
    },
    archiveFailureMessage(error) {
      var reason = ''
      if (error && error.body) {
        reason = extractMessage(error.body)
      }
      if (!reason && error && error.message) {
        reason = String(error.message)
      }
      if (reason.length > 160) {
        reason = reason.substring(0, 160)
      }
      if (!reason) {
        return 'Unable to change archive state.'
      }
      return 'Unable to change archive state. ' + reason
    },
    setArchiveValue(name, value, closeAfter) {
      var self = this
      return apiPost('/api/method/backend_custom_app.api.messages.set_group_archived', {
        group: name,
        archived: value ? 1 : 0
      }).then(function(res) {
        self.applyArchiveState(name, value)
        if (closeAfter) {
          self.closeChat()
          self.archivedView = false
        }
        self.showArchiveToast(value ? 'Chat archived' : 'Chat unarchived', value ? function() {
          self.setArchiveValue(name, false, true)
        } : null)
        return self.refreshGroups()
      }, function(e) {
        self.showToast(self.archiveFailureMessage(e))
      })
    },
    archiveChat() {
      if (!this.activeGroup) {
        return Promise.resolve()
      }
      var name = this.activeGroup.name
      this.moreOpen = false
      return this.setArchiveValue(name, true, true)
    },
    unarchiveChat() {
      if (!this.activeGroup) {
        return Promise.resolve()
      }
      var name = this.activeGroup.name
      this.moreOpen = false
      return this.setArchiveValue(name, false, true)
    },
    archiveFromRow(group) {
      if (!group) {
        return Promise.resolve()
      }
      this.moreOpen = false
      return this.setArchiveValue(group.name, !Boolean(group.archived), true)
    },
    toggleChatSearch() {
      var next = !this.chatSearchOpen
      this.chatSearchOpen = next
      if (!next) {
        this.closeChatSearch()
        return
      }
      var self = this
      this.$nextTick(function() {
        var input = document.querySelector('.chat-search-input')
        if (input && input.focus) {
          input.focus()
        }
        self.refreshChatSearch(false)
      })
    },
    closeChatSearch() {
      this.chatSearchOpen = false
      this.chatSearchText = ''
      this.chatSearchMatches = []
      this.chatSearchIndex = 0
    },
    onChatSearchInput(value) {
      this.chatSearchText = String(value || '')
      this.refreshChatSearch(false)
    },
    refreshChatSearch(scroll) {
      var matches = []
      var term = String(this.chatSearchText || '').trim().toLowerCase()
      if (term) {
        for (var i = 0; i < this.messages.length; i = i + 1) {
          var m = this.messages[i]
          var text = String(m.message_text || '').toLowerCase()
          if (text.indexOf(term) >= 0) {
            matches.push(m.name)
          }
        }
      }
      this.chatSearchMatches = matches
      this.chatSearchIndex = 0
      if (scroll && matches.length > 0) {
        this.scrollToChatMatch()
      }
    },
    moveChatSearch(delta) {
      var count = this.chatSearchMatches.length
      if (count === 0) {
        return
      }
      var next = this.chatSearchIndex + delta
      while (next < 0) {
        next = next + count
      }
      while (next >= count) {
        next = next - count
      }
      this.chatSearchIndex = next
      this.scrollToChatMatch()
    },
    scrollToChatMatch() {
      var name = this.chatSearchMatches[this.chatSearchIndex]
      if (!name) {
        return
      }
      var selector = '.msg-row[data-message-name="' + name + '"]'
      var el = document.querySelector(selector)
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    messageSearchClass(name) {
      if (!this.chatSearchOpen || !this.chatSearchText) {
        return ''
      }
      var found = false
      for (var i = 0; i < this.chatSearchMatches.length; i = i + 1) {
        if (this.chatSearchMatches[i] === name) {
          found = true
          if (i === this.chatSearchIndex) {
            return 'msg-match-current'
          }
        }
      }
      return found ? 'msg-match' : ''
    },
    consecutiveMessage(idx) {
      if (idx <= 0) {
        return false
      }
      var cur = this.messages[idx]
      var prev = this.messages[idx - 1]
      if (!cur || !prev) {
        return false
      }
      if (cur.sender !== prev.sender) {
        return false
      }
      return this.dayLabel(cur.sent_at) === this.dayLabel(prev.sent_at)
    },
    showSentLabel(idx) {
      var cur = this.messages[idx]
      if (!cur || !cur.is_own || cur.sendStatus) {
        return false
      }
      for (var i = idx + 1; i < this.messages.length; i = i + 1) {
        if (this.messages[i].is_own) {
          return false
        }
      }
      return true
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
      this.updateScrollState()
    },
    onBrowserBack() {
      if (this.sendRulesOpen) {
        this.closeSendRules(true)
        return
      }
      if (this.infoOpen) {
        this.closeInfo(true)
        return
      }
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
      this.moreOpen = false
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
      var seq = (this.messageLoadSeq[name] || 0) + 1
      this.messageLoadSeq[name] = seq
      if (this.activeGroup && this.activeGroup.name === name) {
        this.loadingMessages = true
      }
      var url = '/api/method/backend_custom_app.api.messages.get_group_messages?group=' + encodeURIComponent(name) + '&limit=50'
      return apiGet(url).then(function(res) {
        if (self.messageLoadSeq[name] !== seq) {
          return
        }
        var rows = res || []
        if (rows.length > 0) {
          var last = rows[rows.length - 1]
          self.lastPreviewByGroup[name] = String(last.message_text || '')
        }
        self.messagesByGroup[name] = self.mergePendingMessages(name, rows)
        if (self.activeGroup && self.activeGroup.name === name) {
          self.$nextTick(function() {
            self.restoreGroupScroll(name)
            self.updateVisibleDay()
          })
        }
      }).catch(function(e) {
        if (self.messageLoadSeq[name] !== seq) {
          return
        }
        if (!self.messagesByGroup[name]) {
          self.messagesByGroup[name] = []
        }
        if (self.activeGroup && self.activeGroup.name === name) {
          self.$nextTick(function() {
            self.restoreGroupScroll(name)
          })
        }
      }).then(function() {
        if (self.messageLoadSeq[name] !== seq) {
          return
        }
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
      this.showJumpLatest = false
      this.unseenBelowCount = 0
      var self = this
      this.$nextTick(function() {
        self.updateScrollState()
      })
    },
    updateScrollState() {
      var el = this.$refs.messagesListRef
      if (!el) {
        return
      }
      var remaining = el.scrollHeight - el.scrollTop - el.clientHeight
      if (remaining > 120) {
        if (!this.showJumpLatest) {
          this.showJumpLatest = true
        }
      } else {
        this.showJumpLatest = false
        this.unseenBelowCount = 0
      }
      this.updateVisibleDay()
    },
    updateVisibleDay() {
      var el = this.$refs.messagesListRef
      if (!el || this.messages.length === 0) {
        this.visibleDayDate = ''
        this.floatingDateHidden = false
        return
      }
      var rows = el.querySelectorAll('.msg-row[data-sent-at]')
      var separators = el.querySelectorAll('.day-separator-text')
      var top = el.getBoundingClientRect().top
      var edge = top + 42
      var found = ''
      var duplicate = false
      var i = 0
      for (i = 0; i < rows.length; i = i + 1) {
        var rect = rows[i].getBoundingClientRect()
        if (rect.bottom >= edge) {
          found = rows[i].getAttribute('data-sent-at') || ''
          break
        }
      }
      if (!found) {
        found = this.messages[this.messages.length - 1].sent_at
      }
      var label = this.dayLabel(found)
      for (i = 0; i < separators.length; i = i + 1) {
        if (String(separators[i].textContent || '').trim() !== label) {
          continue
        }
        var sepRect = separators[i].getBoundingClientRect()
        if (sepRect.bottom >= top && sepRect.top <= top + 52) {
          duplicate = true
          break
        }
      }
      if (found !== this.visibleDayDate) {
        this.visibleDayDate = found
      }
      if (duplicate !== this.floatingDateHidden) {
        this.floatingDateHidden = duplicate
      }
    },
    onMessagesScroll() {
      this.updateScrollState()
      if (!this.showJumpLatest) {
        this.saveGroupScroll()
      }
    },
    jumpToLatest() {
      var el = this.$refs.messagesListRef
      if (!el) {
        return
      }
      if (el.scrollTo && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } else {
        el.scrollTop = el.scrollHeight
      }
      this.showJumpLatest = false
      this.unseenBelowCount = 0
      this.scrollByGroup[this.activeGroup.name] = -1
    },
    currentDayLabel() {
      var date = this.visibleDayDate
      if (!date && this.messages.length > 0) {
        date = this.messages[this.messages.length - 1].sent_at
      }
      return this.dayLabel(date)
    },
    toggleComposerMenu() {
      var next = !this.composerMenuOpen
      this.closeMenus()
      this.composerMenuOpen = next
    },
    onComposerMenuSelect(kind) {
      if (kind === 'emoji') {
        this.emojiOpen = true
        this.attachOpen = false
        this.pollOpen = false
        this.contactOpen = false
        this.composerMenuOpen = false
        return
      }
      if (kind === 'poll') {
        this.pollOpen = true
        this.emojiOpen = false
        this.attachOpen = false
        this.contactOpen = false
        this.composerMenuOpen = false
        return
      }
      if (kind === 'contact') {
        this.contactOpen = true
        this.emojiOpen = false
        this.attachOpen = false
        this.pollOpen = false
        this.composerMenuOpen = false
        return
      }
      this.onAttachmentSelect(kind)
    },
    resizeInput() {
      var el = this.$refs.inputRef
      if (!el) {
        return
      }
      el.style.height = 'auto'
      var next = Math.min(el.scrollHeight, 96)
      el.style.height = String(next) + 'px'
      el.style.overflowY = el.scrollHeight > 96 ? 'auto' : 'hidden'
    },
    updateKeyboardInset() {
      var viewport = window.visualViewport
      if (!viewport) {
        return
      }
      var measured = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      this.keyboardInset = Math.round(measured)
      if (measured > 0) {
        this.scrollToBottom()
      }
    },
    onMessageTouchStart(message) {
      if (!message) {
        return
      }
      var self = this
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
      }
      this.longPressTimer = setTimeout(function() {
        self.actionMenuName = message.name
        self.longPressTimer = null
      }, 500)
    },
    onMessageTouchEnd() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
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
      this.clearTyping(group)
      draft.text = ''
      this.$nextTick(function() {
        self.resizeInput()
        var el = self.$refs.inputRef
        if (el && el.focus) {
          el.focus()
        }
      })
      var clientId = 'local-' + String(Date.now()) + '-' + String(this.localMessageSeq)
      this.localMessageSeq = this.localMessageSeq + 1
      this.addOptimisticMessage(group, text, clientId)
      this.sending = true
      return apiPost('/api/method/backend_custom_app.api.messages.send_group_message', {
        group: group,
        text: text
      }).then(function(payload) {
        self.lastOwnTextByGroup[group] = text
        self.scrollByGroup[group] = -1
        self.resolveOptimisticMessage(group, clientId, payload)
        self.refreshGroups()
        window.dispatchEvent(new Event('messages-updated'))
        self.sending = false
      }, function(e) {
        if (self.activeGroup && self.activeGroup.name === group) {
          self.sendError = e && e.message ? e.message : 'Unable to send message.'
        }
        self.failOptimisticMessage(group, clientId, text)
        self.sending = false
      })
    },
    localDateTimeString() {
      var d = new Date()
      var year = String(d.getFullYear())
      var month = this.padDatePart(d.getMonth() + 1)
      var day = this.padDatePart(d.getDate())
      var hours = this.padDatePart(d.getHours())
      var minutes = this.padDatePart(d.getMinutes())
      var seconds = this.padDatePart(d.getSeconds())
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
    },
    addOptimisticMessage(group, text, clientId) {
      var stamp = this.localDateTimeString()
      var user = this.sessionUser()
      var message = {
        name: clientId,
        client_id: clientId,
        sender: user,
        sender_name: user,
        role_label: '',
        message_type: 'text',
        message_text: text,
        sent_at: stamp,
        creation: stamp,
        is_own: true,
        is_voice_note: false,
        attachment: null,
        contact: null,
        poll: null,
        sendStatus: 'sending'
      }
      var pending = this.pendingSendsByGroup[group] || []
      pending.push({ client_id: clientId, name: clientId, text: text, message: message, state: 'pending', real_name: '' })
      this.pendingSendsByGroup[group] = pending
      var rows = this.messagesByGroup[group] || []
      rows.push(message)
      this.messagesByGroup[group] = rows
      if (this.activeGroup && this.activeGroup.name === group) {
        var self = this
        this.$nextTick(function() {
          self.scrollToBottom()
        })
      }
    },
    mergePendingMessages(group, rows) {
      var source = rows || []
      var pending = this.pendingSendsByGroup[group] || []
      if (pending.length === 0) {
        return source
      }
      var result = []
      var used = []
      var i = 0
      var j = 0
      var r = 0
      for (i = 0; i < source.length; i = i + 1) {
        result.push(source[i])
        used.push(false)
      }
      var user = this.sessionUser()
      for (i = 0; i < result.length; i = i + 1) {
        for (j = 0; j < pending.length; j = j + 1) {
          if (pending[j].state === 'sent' && pending[j].real_name && result[i].name === pending[j].real_name) {
            result[i].client_id = pending[j].client_id
            result[i].sendStatus = ''
          }
        }
      }
      for (i = 0; i < pending.length; i = i + 1) {
        if (pending[i].state === 'sent') {
          continue
        }
        var index = -1
        if (pending[i].state === 'pending') {
          for (r = 0; r < result.length; r = r + 1) {
            if (used[r] === false && result[r].sender === user && String(result[r].message_text || '') === pending[i].text) {
              index = r
              break
            }
          }
        }
        if (index >= 0) {
          used[index] = true
          result.splice(index, 1)
          used.splice(index, 1)
        }
        result.push(pending[i].message)
      }
      return result
    },
    resolveOptimisticMessage(group, clientId, payload) {
      var rows = this.messagesByGroup[group] || []
      var real = Object.assign({}, payload || {})
      var realName = String(real.name || '')
      real.client_id = clientId
      real.sendStatus = ''
      var localIndex = -1
      var realIndex = -1
      var i = 0
      for (i = 0; i < rows.length; i = i + 1) {
        if (rows[i].name === clientId) {
          localIndex = i
        }
        if (realName && rows[i].name === realName) {
          realIndex = i
        }
      }
      if (realIndex >= 0) {
        if (localIndex >= 0) {
          rows.splice(localIndex, 1)
          if (localIndex < realIndex) {
            realIndex = realIndex - 1
          }
        }
        rows[realIndex].client_id = clientId
        rows[realIndex].sendStatus = ''
      } else if (localIndex >= 0) {
        rows.splice(localIndex, 1, real)
      } else {
        rows.push(real)
      }
      this.messagesByGroup[group] = rows
      var pending = this.pendingSendsByGroup[group] || []
      for (i = 0; i < pending.length; i = i + 1) {
        if (pending[i].client_id === clientId) {
          pending[i].state = 'sent'
          pending[i].real_name = realName
        }
      }
      this.pendingSendsByGroup[group] = pending
      if (this.activeGroup && this.activeGroup.name === group) {
        var self = this
        this.$nextTick(function() {
          self.scrollToBottom()
        })
      }
    },
    failOptimisticMessage(group, clientId, text) {
      var rows = this.messagesByGroup[group] || []
      var found = false
      var i = 0
      for (i = 0; i < rows.length; i = i + 1) {
        if (rows[i].client_id === clientId || rows[i].name === clientId) {
          rows[i].sendStatus = 'failed'
          found = true
        }
      }
      if (!found) {
        var pending = this.pendingSendsByGroup[group] || []
        for (i = 0; i < pending.length; i = i + 1) {
          if (pending[i].client_id === clientId) {
            rows.push(pending[i].message)
          }
        }
      }
      this.messagesByGroup[group] = rows
      var pendingList = this.pendingSendsByGroup[group] || []
      for (i = 0; i < pendingList.length; i = i + 1) {
        if (pendingList[i].client_id === clientId) {
          pendingList[i].state = 'failed'
          pendingList[i].message.sendStatus = 'failed'
        }
      }
      this.pendingSendsByGroup[group] = pendingList
    },
    retryMessage(message) {
      if (!message || !this.activeGroup) {
        return
      }
      var group = this.activeGroup.name
      var clientId = message.client_id || message.name
      var rows = this.messagesByGroup[group] || []
      var next = []
      var i = 0
      for (i = 0; i < rows.length; i = i + 1) {
        if (rows[i].client_id !== clientId && rows[i].name !== clientId) {
          next.push(rows[i])
        }
      }
      this.messagesByGroup[group] = next
      var pending = this.pendingSendsByGroup[group] || []
      var remaining = []
      for (i = 0; i < pending.length; i = i + 1) {
        if (pending[i].client_id !== clientId) {
          remaining.push(pending[i])
        }
      }
      this.pendingSendsByGroup[group] = remaining
      var draft = this.draftFor(group)
      draft.text = String(message.message_text || '')
      this.sendMessage(group)
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
      this.clearTyping(group)
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
    toggleMessageMenu(name) {
      if (this.actionMenuName === name) {
        this.actionMenuName = ''
        return
      }
      this.actionMenuName = name
    },
    copyFallback(text) {
      var el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      if (document.execCommand) {
        document.execCommand('copy')
      }
      document.body.removeChild(el)
    },
    copyMessage(message) {
      this.actionMenuName = ''
      var text = message && message.message_text ? String(message.message_text) : ''
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var self = this
        var result = navigator.clipboard.writeText(text)
        if (result && result.catch) {
          result.catch(function(e) {
            self.copyFallback(text)
          })
        }
      } else {
        this.copyFallback(text)
      }
      this.showToast('Message copied')
    },
    openDeleteMessageConfirm(message) {
      if (!message || !message.is_own) {
        return
      }
      this.actionMenuName = ''
      this.openConfirm({
        kind: 'delete-message',
        title: 'Delete message?',
        message: 'This message will be removed from the conversation.',
        confirmLabel: 'Delete',
        danger: true,
        messageName: message.name
      })
    },
    openConfirm(options) {
      this.confirmState = {
        open: true,
        kind: options.kind || '',
        group: options.group || '',
        member: options.member || '',
        readOnly: options.readOnly ? 1 : 0,
        messageName: options.messageName || '',
        title: options.title || 'Are you sure?',
        message: options.message || '',
        requiredText: options.requiredText || '',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: Boolean(options.danger)
      }
    },
    closeConfirm() {
      if (this.confirmBusy) {
        return
      }
      this.confirmState.open = false
    },
    runConfirm() {
      var state = this.confirmState
      if (!state.open || this.confirmBusy) {
        return
      }
      this.confirmState.open = false
      if (state.kind === 'delete-chat') {
        this.clearGroupChat(state.group)
      } else if (state.kind === 'exit-group') {
        this.exitGroup(state.group)
      } else if (state.kind === 'delete-group') {
        this.deleteGroup(state.group)
      } else if (state.kind === 'delete-message') {
        this.deleteMessage(state.messageName)
      } else if (state.kind === 'restrict-member') {
        this.setMemberRestriction(state.group, state.member, state.readOnly)
      }
    },
    openDeleteChatConfirm() {
      if (!this.activeGroup) {
        return
      }
      this.moreOpen = false
      this.infoOpen = false
      this.openConfirm({
        kind: 'delete-chat',
        group: this.activeGroup.name,
        title: 'Delete chat?',
        message: 'Messages in ' + this.groupDisplayName(this.activeGroup) + ' will be cleared from your view. The group and its members will stay.',
        confirmLabel: 'Delete chat',
        danger: true
      })
    },
    openExitGroupConfirm() {
      if (!this.activeGroup || !this.canExitGroup) {
        return
      }
      this.moreOpen = false
      this.infoOpen = false
      this.openConfirm({
        kind: 'exit-group',
        group: this.activeGroup.name,
        title: 'Exit group?',
        message: 'You will leave ' + this.groupDisplayName(this.activeGroup) + ' and it will be removed from your list.',
        confirmLabel: 'Exit group',
        danger: true
      })
    },
    openDeleteGroupConfirm() {
      if (!this.activeGroup || !this.canDeleteGroup) {
        return
      }
      this.moreOpen = false
      this.infoOpen = false
      this.openConfirm({
        kind: 'delete-group',
        group: this.activeGroup.name,
        title: 'Delete group?',
        message: 'This permanently deletes the group, its messages and its members.',
        requiredText: this.groupDisplayName(this.activeGroup),
        confirmLabel: 'Delete group',
        danger: true
      })
    },
    clearGroupChat(group) {
      if (!group) {
        return Promise.resolve()
      }
      var self = this
      this.confirmBusy = true
      return apiPost('/api/method/backend_custom_app.api.messages.clear_group_chat', { group: group }).then(function() {
        self.messageLoadSeq[group] = (self.messageLoadSeq[group] || 0) + 1
        self.messagesByGroup[group] = []
        self.scrollByGroup[group] = -1
        if (self.activeGroup && self.activeGroup.name === group) {
          self.$nextTick(function() {
            self.scrollToBottom()
          })
        }
        return self.refreshGroups()
      }).then(function() {
        self.showToast('Chat cleared')
      }).catch(function(e) {
        self.showToast(e && e.message ? e.message : 'Unable to clear chat.')
      }).then(function() {
        self.confirmBusy = false
      })
    },
    exitGroup(group) {
      if (!group) {
        return Promise.resolve()
      }
      var self = this
      this.confirmBusy = true
      return apiPost('/api/method/backend_custom_app.api.messages.exit_message_group', { group: group }).then(function() {
        self.removeGroupLocally(group)
        return self.refreshGroups()
      }).then(function() {
        self.showToast('You left the group')
      }).catch(function(e) {
        self.showToast(e && e.message ? e.message : 'Unable to exit group.')
      }).then(function() {
        self.confirmBusy = false
      })
    },
    deleteGroup(group) {
      if (!group) {
        return Promise.resolve()
      }
      var self = this
      this.confirmBusy = true
      return apiPost('/api/method/backend_custom_app.api.messages.delete_message_group', { group: group }).then(function() {
        self.removeGroupLocally(group)
        return self.refreshGroups()
      }).then(function() {
        self.showToast('Group deleted')
      }).catch(function(e) {
        self.showToast(e && e.message ? e.message : 'Unable to delete group.')
      }).then(function() {
        self.confirmBusy = false
      })
    },
    removeGroupLocally(group) {
      var list = []
      for (var i = 0; i < this.groups.length; i = i + 1) {
        if (this.groups[i].name !== group) {
          list.push(this.groups[i])
        }
      }
      this.groups = list
      delete this.messagesByGroup[group]
      delete this.drafts[group]
      this.clearTyping(group)
      if (this.activeGroup && this.activeGroup.name === group) {
        this.closeChat()
      }
    },
    openNewGroup() {
      if (!this.canCreateGroup) {
        return
      }
      this.closeMenus()
      this.newGroupOpen = true
      this.newGroupError = ''
    },
    closeNewGroup() {
      if (this.newGroupBusy) {
        return
      }
      this.newGroupOpen = false
      this.newGroupError = ''
    },
    createGroup(payload) {
      if (!payload) {
        return Promise.resolve()
      }
      var self = this
      this.newGroupBusy = true
      this.newGroupError = ''
      return apiPost('/api/method/backend_custom_app.api.messages.create_message_group', {
        group_name: payload.name,
        description: payload.description || '',
        members: payload.members || []
      }).then(function(res) {
        var id = res && (res.group || res.name) ? String(res.group || res.name) : ''
        self.newGroupOpen = false
        return self.refreshGroups().then(function() {
          return id
        })
      }).then(function(id) {
        var found = self.findGroup(id)
        if (found) {
          self.selectGroup(found)
        }
        self.showToast('Group created')
      }).catch(function(e) {
        self.newGroupError = e && e.message ? e.message : 'Unable to create group.'
      }).then(function() {
        self.newGroupBusy = false
      })
    },
    openMemberPicker() {
      if (!this.activeGroup || !this.canAddMembers) {
        return
      }
      this.closeMenus()
      this.infoOpen = false
      this.memberPickerOpen = true
    },
    closeMemberPicker() {
      this.memberPickerOpen = false
    },
    addMembers(users) {
      if (!this.activeGroup || !this.canAddMembers) {
        return Promise.resolve()
      }
      if (!users || users.length === 0) {
        this.memberPickerOpen = false
        this.showToast('No members selected')
        return Promise.resolve()
      }
      var self = this
      var group = this.activeGroup.name
      return apiPost('/api/method/backend_custom_app.api.messages.add_message_group_members', {
        group: group,
        members: users
      }).then(function() {
        self.memberPickerOpen = false
        return self.refreshGroups()
      }).then(function() {
        self.showToast('Members added')
      }).catch(function(e) {
        self.showToast(e && e.message ? e.message : 'Unable to add members.')
      })
    },
    creatorNameFor(group) {
      if (!group || !group.created_by) {
        return ''
      }
      var owner = String(group.created_by)
      var members = group.members || []
      for (var i = 0; i < members.length; i = i + 1) {
        if (this.memberKey(members[i]) === owner) {
          return members[i].display_name || owner
        }
      }
      return owner
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
    openInfo() {
      if (!this.activeGroup) {
        return
      }
      this.moreOpen = false
      this.infoOpen = true
      if (this.isMobileLayout() && !this.infoHistoryPushed && window.history && window.history.pushState) {
        window.history.pushState({ backend_messages_info: true }, '')
        this.infoHistoryPushed = true
      }
      this.loadSharedItems('all')
    },
    dismissInfo() {
      this.infoOpen = false
      if (this.infoHistoryPushed) {
        this.infoHistoryPushed = false
        if (window.history && window.history.replaceState && this.activeGroup) {
          window.history.replaceState({ backend_messages_chat: this.activeGroup.name }, '')
        }
      }
    },
    closeInfo(skipHistory) {
      this.infoOpen = false
      if (this.infoHistoryPushed) {
        this.infoHistoryPushed = false
        if (!skipHistory && window.history && window.history.back) {
          window.history.back()
        }
      }
    },
    openSendRules() {
      if (!this.activeGroup || !this.canManageSendRules) {
        return
      }
      this.sendRulesOpen = true
      if (this.isMobileLayout() && !this.sendRulesHistoryPushed && window.history && window.history.pushState) {
        window.history.pushState({ backend_messages_send_rules: true }, '')
        this.sendRulesHistoryPushed = true
      }
    },
    dismissSendRules(skipHistory) {
      this.sendRulesOpen = false
      if (this.sendRulesHistoryPushed) {
        this.sendRulesHistoryPushed = false
        if (!skipHistory && window.history && window.history.back) {
          window.history.back()
        }
      }
    },
    closeSendRules(skipHistory) {
      this.dismissSendRules(skipHistory)
    },
    handleSendRulesToast(payload) {
      if (!payload) {
        return
      }
      this.showToast(String(payload.text || ''), null, payload.error ? 'error' : '')
    },
    handleSendRulesChanged() {
      var self = this
      this.refreshGroups().then(function() {
        if (self.infoOpen) {
          self.loadSharedItems('all')
        }
      })
    },
    openMembersFromInfo() {
      this.dismissInfo()
      this.openMembers()
    },
    loadSharedItems(kind) {
      if (!this.activeGroup) {
        return Promise.resolve()
      }
      var self = this
      var group = this.activeGroup.name
      var section = kind === 'file' ? 'file' : kind === 'link' ? 'link' : 'all'
      var url = '/api/method/backend_custom_app.api.messages.get_group_shared_items?group=' + encodeURIComponent(group) + '&limit=50&offset=0&kind=' + encodeURIComponent(section)
      return apiGet(url).then(function(res) {
        var rows = res && res.items ? res.items : []
        var files = []
        var links = []
        var i = 0
        while (i < rows.length) {
          if (rows[i].kind === 'link') {
            links.push(rows[i])
          } else {
            files.push(rows[i])
          }
          i = i + 1
        }
        if (section === 'file') {
          self.sharedFiles = files
          self.sharedFilesCount = Number(res && res.count ? res.count : files.length)
        } else if (section === 'link') {
          self.sharedLinks = links
          self.sharedLinksCount = Number(res && res.count ? res.count : links.length)
        } else {
          self.sharedFiles = files
          self.sharedLinks = links
          self.sharedFilesCount = Number(res && res.file_count ? res.file_count : files.length)
          self.sharedLinksCount = Number(res && res.link_count ? res.link_count : links.length)
        }
      }, function(e) {
        if (section === 'file') {
          self.sharedFiles = []
          self.sharedFilesCount = 0
        } else if (section === 'link') {
          self.sharedLinks = []
          self.sharedLinksCount = 0
        } else {
          self.sharedFiles = []
          self.sharedLinks = []
          self.sharedFilesCount = 0
          self.sharedLinksCount = 0
        }
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
    dismissMembers() {
      this.selectedMembers = []
      this.selectedRemoved = []
      if (this.overlayHistoryPushed) {
        this.overlayHistoryPushed = false
        if (window.history && window.history.replaceState && this.activeGroup) {
          window.history.replaceState({ backend_messages_chat: this.activeGroup.name }, '')
        }
      }
      this.membersOpen = false
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
    canRestrictMember(member) {
      if (!this.canManageSendRules || !member) {
        return false
      }
      var key = this.memberKey(member)
      if (!key || key === this.sessionUser() || key === 'Administrator') {
        return false
      }
      if (this.currentUserRoleLabel === 'Instructor' && member.role_label !== 'Student') {
        return false
      }
      return true
    },
    openMemberRestrictionConfirm(member) {
      if (!this.activeGroup || !this.canRestrictMember(member)) {
        return
      }
      var key = this.memberKey(member)
      var next = !member.read_only
      this.openConfirm({
        kind: 'restrict-member',
        group: this.activeGroup.name,
        member: key,
        readOnly: next,
        title: next ? 'Restrict member?' : 'Allow messages?',
        message: next
          ? key + ' will only be able to read messages in this group.'
          : key + ' will be able to send messages in this group again.',
        confirmLabel: next ? 'Restrict' : 'Allow messages',
        danger: next
      })
    },
    setMemberRestriction(group, member, readOnly) {
      if (!group || !member) {
        return Promise.resolve()
      }
      var self = this
      return apiPost('/api/method/backend_custom_app.api.messages.set_group_member_send_restriction', {
        group: group,
        member: member,
        read_only: readOnly ? 1 : 0
      }).then(function() {
        return self.refreshGroups()
      }).then(function() {
        self.showToast(readOnly ? 'Member set to read only.' : 'Member can send messages again.')
      }).catch(function(e) {
        self.showToast(e && e.message ? e.message : 'Unable to change member send access.', null, 'error')
      })
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
      this.clearTyping(data.group)
      if (this.activeGroup && data.group === this.activeGroup.name && this.showJumpLatest) {
        this.unseenBelowCount = this.unseenBelowCount + 1
      }
      if (this.chatOpen && this.activeGroup && data.group === this.activeGroup.name) {
        this.markRead()
      }
      this.loadMessages(data.group)
      if (this.infoOpen && this.activeGroup && data.group === this.activeGroup.name) {
        this.loadSharedItems('all')
      }
      if (this.shouldPlayForGroup(data.group)) {
        playMessageSound()
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
    handleGroupTyping(data) {
      this.handleTyping(data)
    },
    handleGroupCleared(data) {
      if (!data || !data.group) {
        return
      }
      this.messageLoadSeq[data.group] = (this.messageLoadSeq[data.group] || 0) + 1
      this.messagesByGroup[data.group] = []
      this.clearTyping(data.group)
      if (this.activeGroup && this.activeGroup.name === data.group) {
        var self = this
        this.$nextTick(function() {
          self.scrollToBottom()
        })
      }
    },
    handleGroupDeleted(data) {
      if (!data || !data.group) {
        return
      }
      this.removeGroupLocally(data.group)
      this.refreshGroups()
    },
    handleGroupListChanged(data) {
      this.refreshGroups()
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
    showToast(text, undo, tone) {
      var self = this
      this.clearToastTimer()
      this.toastText = text
      this.toastTone = tone === 'error' ? 'error' : ''
      this.toastUndo = typeof undo === 'function' ? undo : null
      this.toastTimer = setTimeout(function() {
        self.toastText = ''
        self.toastTone = ''
        self.toastUndo = null
        self.toastTimer = null
      }, 5000)
    },
    runToastUndo() {
      var undo = this.toastUndo
      this.clearToastTimer()
      this.toastText = ''
      this.toastUndo = null
      if (typeof undo === 'function') {
        undo()
      }
    },
    clearToastTimer() {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
        this.toastTimer = null
      }
      this.toastUndo = null
    },
    showArchiveToast(text, undo) {
      var self = this
      this.clearArchiveToastTimer()
      this.archiveToastText = text
      this.archiveToastUndo = typeof undo === 'function' ? undo : null
      this.archiveToastTimer = setTimeout(function() {
        self.archiveToastText = ''
        self.archiveToastUndo = null
        self.archiveToastTimer = null
      }, 5000)
    },
    runArchiveToastUndo() {
      var undo = this.archiveToastUndo
      this.clearArchiveToastTimer()
      this.archiveToastText = ''
      if (typeof undo === 'function') {
        undo()
      }
    },
    clearArchiveToastTimer() {
      if (this.archiveToastTimer) {
        clearTimeout(this.archiveToastTimer)
        this.archiveToastTimer = null
      }
      this.archiveToastUndo = null
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
      this.typingHandler = function(data) {
        self.handleGroupTyping(data)
      }
      this.groupClearedHandler = function(data) {
        self.handleGroupCleared(data)
      }
      this.groupDeletedHandler = function(data) {
        self.handleGroupDeleted(data)
      }
      this.groupListChangedHandler = function(data) {
        self.handleGroupListChanged(data)
      }
      this.sendRuleHandler = function(data) {
        self.handleSendRulesChanged(data)
      }
      var bindExisting = function() {
        var realtime = null
        if (window.frappe && window.frappe.realtime && window.frappe.realtime.socket) {
          realtime = window.frappe.realtime
        }
        if (window.parent && window.parent.frappe && window.parent.frappe.realtime && window.parent.frappe.realtime.socket) {
          realtime = window.parent.frappe.realtime
        }
        if (!realtime || !realtime.on) {
          return false
        }
        realtime.on('group_message_new', self.messageHandler)
        realtime.on('messages_new_message_toast', self.toastHandler)
        realtime.on('messages_group_access_changed', self.accessHandler)
        realtime.on('group_poll_updated', self.pollHandler)
        realtime.on('messages_group_typing', self.typingHandler)
        realtime.on('messages_group_cleared', self.groupClearedHandler)
        realtime.on('messages_group_deleted', self.groupDeletedHandler)
        realtime.on('messages_group_list_changed', self.groupListChangedHandler)
        realtime.on('messages_group_send_rules_changed', self.sendRuleHandler)
        self.realtimeHandlerBound = true
        self.realtimeTarget = realtime
        return true
      }
      if (bindExisting()) {
        return
      }
      apiGet('/api/method/backend_custom_app.api.messages.get_message_socket_config').then(function(config) {
        var parts = window.location.origin.split(':')
        var useDirect = Boolean(config && config.sitename && config.developer_mode && parts.length > 2)
        if (!config || !config.sitename) {
          bindExisting()
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
        self.socket.on('messages_group_typing', self.typingHandler)
        self.socket.on('messages_group_cleared', self.groupClearedHandler)
        self.socket.on('messages_group_deleted', self.groupDeletedHandler)
          self.socket.on('messages_group_list_changed', self.groupListChangedHandler)
          self.socket.on('messages_group_send_rules_changed', self.sendRuleHandler)
          self.socket.on('connect_error', function() {

          if (self.realtimeTarget && self.realtimeTarget !== self.socket) {
            return
          }
          self.realtimeHandlerBound = false
          self.realtimeTarget = null
          bindExisting()
        })
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
        if (this.typingHandler) {
          this.realtimeTarget.off('messages_group_typing', this.typingHandler)
        }
        if (this.groupClearedHandler) {
          this.realtimeTarget.off('messages_group_cleared', this.groupClearedHandler)
        }
        if (this.groupDeletedHandler) {
          this.realtimeTarget.off('messages_group_deleted', this.groupDeletedHandler)
        }
        if (this.groupListChangedHandler) {
          this.realtimeTarget.off('messages_group_list_changed', this.groupListChangedHandler)
        }
        if (this.sendRuleHandler) {
          this.realtimeTarget.off('messages_group_send_rules_changed', this.sendRuleHandler)
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
      this.typingHandler = null
      this.groupClearedHandler = null
      this.groupDeletedHandler = null
      this.groupListChangedHandler = null
      this.sendRuleHandler = null
    },
    startPolling() {
      var self = this
      this.pollTimer = setInterval(function() {
        self.refreshGroups()
        if (self.activeGroup) {
          self.loadMessages(self.activeGroup.name)
          if (self.infoOpen) {
            self.loadSharedItems('all')
          }
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
  position: relative;
  width: 100%;
  max-width: 1180px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  box-sizing: border-box;
  gap: 0;
  padding: 0;
  min-width: 0;
  background: #ffffff;
  border: 1px solid rgba(69, 61, 137, 0.1);
  border-radius: 22px;
  box-shadow: 0 18px 48px rgba(69, 61, 137, 0.16);
  overflow: hidden;
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
  border-radius: 0;
  background: #ffffff;
  box-shadow: inset -1px 0 0 #ece8f7;
}
.groups-head {
  flex: 0 0 auto;
  padding: 12px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.groups-head-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.groups-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.groups-add {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
}
.groups-add:hover,
.groups-add:focus-visible {
  background: rgba(255, 255, 255, 0.28);
  outline: 2px solid #ffffff;
  outline-offset: 1px;
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
.archived-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-bottom: 6px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 15px;
  cursor: pointer;
}
.archived-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  border-bottom: 1px solid #f1f4f9;
  background: #ffffff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
}
.archived-row:hover,
.archived-row:focus-visible,
.toast-undo:focus-visible {
  background: #f8f6ff;
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
.archived-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f4f1ff;
  color: #453d89;
}
.archived-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  font-weight: 800;
}
.archived-unread {
  flex: 0 0 auto;
  min-width: 18px;
  padding: 2px 5px;
  border-radius: 999px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  text-align: center;
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
.group-row:hover,
.group-row:focus-visible {
  background: #f8f6ff;
  outline: none;
}
.group-row:focus-visible {
  box-shadow: inset 0 0 0 2px #7c6ee6;
}
.row-archive {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid #d8cef4;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  opacity: 0;
  cursor: pointer;
}
.group-row:hover .row-archive,
.group-row:focus-within .row-archive {
  opacity: 1;
}
.row-archive:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
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
.group-row-typing {
  color: #7c6ee6;
  font-weight: 800;
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
  border-radius: 0;
  background: #ffffff;
  overflow: hidden;
}
.messages-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 14px;
  color-scheme: light;
  background-color: #fbfaff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='132' height='132' viewBox='0 0 132 132'%3E%3Cg fill='none' stroke='%237C6EE6' stroke-opacity='0.04' stroke-width='1.4'%3E%3Ccircle cx='20' cy='22' r='6'/%3E%3Ccircle cx='84' cy='48' r='4'/%3E%3Cpath d='M102 18h18M14 92h20M92 108h26' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(circle at 0% 0%, #FBFAFF 0%, rgba(251,250,255,0) 55%), radial-gradient(circle at 100% 100%, #FCEFF7 0%, rgba(252,239,247,0) 50%), linear-gradient(135deg, #FBFAFF 0%, #F1EBFB 52%, #FCEFF7 100%);
  background-repeat: repeat, no-repeat, no-repeat, no-repeat;
  background-size: 132px 132px, 100% 100%, 100% 100%, 100% 100%;
  scrollbar-color: #d8cef4 #faf9fe;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 12px;
  color: #64748b;
}
.empty-chat-art {
  width: 160px;
  max-width: 70%;
  height: auto;
  margin-bottom: 10px;
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
  margin: 12px 0 10px 0;
}
.day-separator-text {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  color: #5b5470;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e7dff8;
  box-shadow: 0 2px 8px rgba(69, 61, 137, 0.08);
  padding: 5px 12px;
  border-radius: 999px;
}
.floating-date-chip {
  position: sticky;
  top: 0;
  z-index: 3;
  width: fit-content;
  margin: -4px auto 6px auto;
  padding: 4px 11px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #5b5470;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(69, 61, 137, 0.09);
  backdrop-filter: blur(6px);
}
.jump-latest {
  position: absolute;
  right: 16px;
  bottom: 76px;
  z-index: 8;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid #e7dff8;
  border-radius: 50%;
  background: #ffffff;
  color: #453d89;
  box-shadow: 0 8px 20px rgba(69, 61, 137, 0.18);
  cursor: pointer;
}
.jump-latest-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
}
.messages-list > .msg-row {
  margin-top: 10px;
  animation: message-enter 180ms ease-out;
}
@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.messages-list > .msg-row:first-child,
.messages-list > .day-separator + .msg-row {
  margin-top: 0;
}
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}
.messages-list > .msg-row.msg-row-consecutive {
  margin-top: 2px;
}
.msg-row-own {
  flex-direction: column;
  align-items: flex-end;
}
.msg-row-other {
  justify-content: flex-start;
}
.msg-avatar-col {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
}
.msg-avatar {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  box-shadow: 0 0 0 2px #ffffff, 0 2px 7px rgba(69, 61, 137, 0.2);
  font-size: 10px;
  font-weight: 800;
}
.msg-bubble {
  position: relative;
  max-width: 68%;
  box-sizing: border-box;
  border-radius: 18px;
  padding: 9px 11px 7px 11px;
  min-width: 0;
  box-shadow: 0 6px 16px rgba(69, 61, 137, 0.1);
}
.msg-row .msg-bubble {
  max-width: 68%;
}
.msg-bubble-own {
  background: linear-gradient(120deg, #453D89, #7B4FA5 55%, #C8499A);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 9px 22px rgba(200, 73, 154, 0.24);
}
.msg-bubble-other {
  background: linear-gradient(180deg, #ffffff 0%, #fdfcff 100%);
  color: #1f2937;
  border: 1px solid #ece7f7;
  box-shadow: 0 6px 16px rgba(69, 61, 137, 0.09);
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
.msg-sender {
  font-weight: 800;
}
.msg-role {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  background: #f3efff;
  color: #6d5dd3;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.5;
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
  justify-content: flex-end;
  gap: 10px;
}
.msg-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  color: #8b93a5;
  white-space: nowrap;
}
.msg-tick {
  font-size: 10px;
  color: #a7f3d0;
}
.msg-send-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}
.msg-send-state-sending {
  color: rgba(255, 255, 255, 0.92);
}
.msg-send-state-failed {
  color: #ffe4e6;
}
.msg-retry {
  min-height: 22px;
  padding: 1px 7px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-family: inherit;
  font-size: 9px;
  font-weight: 800;
  cursor: pointer;
}
.msg-retry:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 1px;
}
.msg-bubble-own .msg-time {
  color: rgba(255, 255, 255, 0.9);
}
.msg-action-wrap {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
}
.msg-action-btn {
  width: 22px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  border: 1px solid #e7dff8;
  border-radius: 6px;
  background: #ffffff;
  color: #7c6ee6;
  font-size: 13px;
  line-height: 1;
  opacity: 0;
  cursor: pointer;
}
.msg-action-wrap-open .msg-action-btn {
  opacity: 1;
}
.msg-row:hover .msg-action-btn,
.msg-row:focus-within .msg-action-btn {
  opacity: 1;
}
.msg-action-btn:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 1px;
}
.msg-action-menu {
  position: absolute;
  right: 0;
  bottom: 24px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  min-width: 96px;
  box-sizing: border-box;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(69, 61, 137, 0.18);
}
.msg-action-menu button {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: none;
  border-radius: 7px;
  background: #ffffff;
  color: #1f2937;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.msg-action-menu button:hover,
.msg-action-menu button:focus-visible {
  background: #f8f6ff;
  outline: none;
}
.msg-action-delete {
  color: #b42318 !important;
}
.msg-sent {
  margin-top: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f3efff;
  font-size: 9px;
  font-weight: 800;
  color: #6d5dd3;
}
.msg-match {
  box-shadow: 0 0 0 2px #d8cef4;
}
.msg-match-current {
  box-shadow: 0 0 0 2px #7c6ee6;
}
.composer-typing {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px 0 12px;
  background: #ffffff;
  color: #7c6ee6;
  font-size: 10px;
  font-weight: 700;
  min-width: 0;
}
.typing-dots {
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
}
.typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7c6ee6;
  animation: message-typing-dot 1.1s infinite ease-in-out;
}
.typing-dots span:nth-child(2) {
  animation-delay: 0.16s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.32s;
}
@keyframes message-typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.55;
  }
  30% {
    transform: translateY(-3px);
    opacity: 1;
  }
}
.messages-input-wrap {
  flex: 0 0 auto;
  box-sizing: border-box;
  border-top: 1px solid #ece8f7;
  padding: 9px 12px calc(9px + var(--messages-keyboard-inset, 0px)) 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  color-scheme: light;
}
.send-error {
  color: #b42318;
  font-size: 11px;
  margin-bottom: 4px;
}
.input-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  box-sizing: border-box;
  padding: 4px 5px;
  border: 1px solid #e8e2f4;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 3px 12px rgba(69, 61, 137, 0.08);
}
.input-row:focus-within {
  border-color: #c9bdf0;
  box-shadow: 0 0 0 3px rgba(124, 110, 230, 0.12);
}
.msg-input {
  flex: 1 1 auto;
  min-width: 200px;
  height: 40px;
  min-height: 40px;
  max-height: 96px;
  line-height: 20px;
  resize: none;
  border: none;
  border-radius: 12px;
  padding: 10px 4px;
  background: transparent;
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
  outline: none;
}
.send-btn {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(135deg, #453D89, #C8499A);
  box-shadow: 0 4px 12px rgba(69, 61, 137, 0.28);
}
.send-btn:hover:not(:disabled),
.send-btn:focus-visible {
  transform: translateY(-1px);
  outline: none;
  box-shadow: 0 6px 16px rgba(200, 73, 154, 0.32);
}
.send-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}
.composer-wrap {
  position: relative;
}
.read-only-composer {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  box-sizing: border-box;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) 16px;
  border-top: 1px solid #ece8f7;
  background: #faf8ff;
  color: #7b718f;
  font-size: 12px;
  font-weight: 700;
}
.composer-tools {
  display: flex;
  align-items: center;
  gap: 1px;
  flex: 0 0 auto;
}
.tool-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #7c6ee6;
  cursor: pointer;
  padding: 0;
}
.tool-btn:hover {
  border-color: #e7dff8;
  background: #f4f1ff;
}
.tool-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.composer-plus,
.mic-btn {
  display: none;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: #ffffff;
  color: #453d89;
  cursor: pointer;
}
.composer-plus {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}
.composer-plus:focus-visible,
.mic-btn:focus-visible,
.tool-btn:focus-visible,
.send-btn:focus-visible,
.jump-latest:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
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
  .input-row {
    gap: 4px;
    padding: 4px;
  }
  .send-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    padding: 0;
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
.member-readonly-tag {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: #fff1f0;
  color: #b42318;
  font-size: 9px;
  font-weight: 800;
}
.member-restrict-btn {
  flex: 0 0 auto;
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid #e7dff8;
  border-radius: 999px;
  background: #ffffff;
  color: #453d89;
  font-family: inherit;
  font-size: 9px;
  font-weight: 800;
  cursor: pointer;
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
  display: flex;
  align-items: center;
  gap: 12px;
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
.toast-error {
  background: linear-gradient(105deg, #b42318, #d92d20);
  box-shadow: 0 12px 28px rgba(180, 35, 24, 0.24);
}
.archive-toast {
  left: 16px;
  right: auto;
}
.toast-undo {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 9px;
  cursor: pointer;
}
.info-slide-enter-active,
.info-slide-leave-active {
  transition: opacity 200ms ease;
}
.info-slide-enter-active :deep(.info-panel),
.info-slide-leave-active :deep(.info-panel) {
  transition: transform 200ms ease;
}
.info-slide-enter-from,
.info-slide-leave-to {
  opacity: 0;
}
.info-slide-enter-from :deep(.info-panel),
.info-slide-leave-to :deep(.info-panel) {
  transform: translateX(24px);
}
@media (max-width: 768px) {
  .info-slide-enter-from :deep(.info-panel),
  .info-slide-leave-to :deep(.info-panel) {
    transform: translateY(28px);
  }
}
@media (hover: none) {
  .row-archive {
    opacity: 1;
  }
  .msg-action-btn {
    display: none;
  }
}
@media (max-width: 900px) {
  .composer-plus,
  .mic-btn {
    display: inline-flex;
  }
  .composer-tools {
    display: none;
  }
  .msg-input {
    min-width: 0;
  }
  .composer-panels {
    max-height: 60vh;
    overflow-y: auto;
  }
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
    padding: 8px calc(8px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left));
  }
  .messages-shell {
    border-radius: 22px;
  }
  .groups-panel {
    width: 100%;
    flex: 1 1 auto;
    border-right: none;
    border-radius: 0;
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
    border-radius: 0;
  }
  .archived-row {
    padding: 9px 10px;
  }
  .groups-head {
    padding: 10px;
  }
  .group-row {
    padding: 9px 10px;
  }
  .messages-list {
    padding: 8px 10px;
  }
  .msg-bubble {
    max-width: 82%;
  }
  .msg-action-menu {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 200;
    min-width: 0;
    flex-direction: row;
    padding: 6px;
  }
  .msg-action-menu button {
    min-height: 44px;
    text-align: center;
  }
  .members-drawer {
    width: 100vw;
    height: calc(100dvh - 10px);
  }
  .drawer-header {
    padding-top: calc(12px + env(safe-area-inset-top));
  }
  .messages-input-wrap {
    padding: 8px calc(14px + env(safe-area-inset-right)) calc(68px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left));
  }
}
@media (max-width: 414px) {
  .msg-row .msg-bubble {
    max-width: calc(100% - 42px);
  }
  .messages-input-wrap {
    padding-left: 8px;
    padding-right: 8px;
  }
}
@media (max-width: 375px) {
  .archived-label {
    font-size: 11px;
  }
  .msg-bubble {
    max-width: 82%;
  }
  .msg-sent {
    font-size: 8px;
  }
}
@media (max-width: 360px) {
  .groups-title {
    font-size: 14px;
  }
  .send-btn {
    width: 44px;
    height: 44px;
  }
}
@media (max-width: 320px) {
  .groups-head {
    padding: 8px;
  }
  .group-row {
    gap: 7px;
    padding: 8px;
  }
  .avatar {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
  }
  .row-archive {
    width: 26px;
    height: 26px;
  }
  .messages-list {
    padding: 6px 7px;
  }
  .msg-bubble {
    max-width: 82%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .messages-list > .msg-row {
    animation: none;
  }
  .typing-dots span {
    animation: none;
  }
  .info-slide-enter-active,
  .info-slide-leave-active,
  .info-slide-enter-active :deep(.info-panel),
  .info-slide-leave-active :deep(.info-panel) {
    transition: none;
  }
  .floating-date-chip {
    backdrop-filter: none;
  }
  .send-btn:hover:not(:disabled),
  .send-btn:focus-visible {
    transform: none;
  }
}
</style>
