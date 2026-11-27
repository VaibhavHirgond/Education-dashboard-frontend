<template>
  <div class="message-rich">
    <div v-if="message.message_type === 'sticker'" class="sticker-wrap">
      <span class="sticker-emoji">{{ message.message_text }}</span>
      <ChatLinkCard v-if="firstLink(message.message_text)" v-bind:url="firstLink(message.message_text)" />
    </div>

    <div v-else-if="message.message_type === 'image' && message.attachment" class="media-wrap">
      <div class="media-card">
        <button type="button" class="image-button" v-bind:aria-label="'View image ' + message.attachment.file_name" v-on:click="viewImage">
          <img class="message-image" loading="lazy" v-bind:src="message.attachment.preview_url" v-bind:alt="message.attachment.file_name" />
        </button>
        <span v-if="time" class="media-time">{{ time }}</span>
      </div>
      <div class="rich-caption" v-if="message.message_text">
        <template v-for="(part, index) in linkParts(message.message_text)" v-bind:key="index">
          <a v-if="part.kind === 'link'" v-bind:href="part.href" target="_blank" rel="noopener noreferrer">{{ part.value }}</a>
          <span v-else>{{ part.value }}</span>
        </template>
        <ChatLinkCard v-if="firstLink(message.message_text)" v-bind:url="firstLink(message.message_text)" />
      </div>
    </div>

    <div v-else-if="message.message_type === 'video' && message.attachment" class="media-wrap">
      <div class="media-card">
        <video ref="videoEl" class="message-video" controls playsinline preload="none" v-bind:src="message.attachment.preview_url"></video>
        <button type="button" class="video-play" aria-label="Play video" title="Play video" v-on:click="playVideo">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 7l9 5-9 5z" fill="currentColor"/></svg>
        </button>
        <span v-if="time" class="media-time">{{ time }}</span>
      </div>
      <div class="file-name-line">{{ message.attachment.file_name }}</div>
      <div class="rich-caption" v-if="message.message_text">{{ message.message_text }}</div>
    </div>

    <div v-else-if="message.message_type === 'audio' && message.attachment" class="media-wrap">
      <div class="audio-card">
        <div class="audio-label">{{ message.is_voice_note ? 'Voice message' : 'Audio' }}</div>
        <audio class="message-audio" controls preload="none" v-bind:src="message.attachment.preview_url"></audio>
      </div>
      <div class="rich-caption" v-if="message.message_text">{{ message.message_text }}</div>
    </div>

    <div v-else-if="message.message_type === 'file' && message.attachment" class="file-wrap">
      <div class="file-card">
        <span class="file-icon">📄</span>
        <span class="file-info">
          <span class="file-card-name">{{ message.attachment.file_name }}</span>
          <span class="file-card-size">{{ sizeLabel(message.attachment.file_size) }}</span>
        </span>
        <a class="file-download" v-bind:href="message.attachment.download_url" aria-label="Download file" download="download">Download</a>
      </div>
      <div class="rich-caption" v-if="message.message_text">
        <template v-for="(part, index) in linkParts(message.message_text)" v-bind:key="index">
          <a v-if="part.kind === 'link'" v-bind:href="part.href" target="_blank" rel="noopener noreferrer">{{ part.value }}</a>
          <span v-else>{{ part.value }}</span>
        </template>
        <ChatLinkCard v-if="firstLink(message.message_text)" v-bind:url="firstLink(message.message_text)" />
      </div>
    </div>

    <div v-else-if="message.message_type === 'contact' && message.contact" class="contact-card">
      <span class="contact-mark">👤</span>
      <span class="contact-copy">
        <span class="contact-card-name">{{ message.contact.display_name }}</span>
        <span class="contact-card-role">{{ roleText(message.contact.role_label) }}</span>
      </span>
    </div>

    <div v-else-if="message.message_type === 'poll' && message.poll" class="poll-card">
      <div class="poll-question">{{ message.poll.question }}</div>
      <div v-if="message.poll.is_closed" class="poll-hint poll-hint-closed">Poll closed</div>
      <div v-else class="poll-hint">Select one</div>
      <div class="poll-options">
        <button
          type="button"
          class="poll-row"
          v-bind:class="message.poll.my_vote === option.index ? 'poll-row-mine' : ''"
          v-bind:disabled="message.poll.is_closed"
          v-bind:aria-label="'Vote for ' + option.text"
          v-for="option in message.poll.options"
          v-bind:key="option.index"
          v-on:click="vote(option)"
        >
          <span class="poll-radio">
            <span v-if="message.poll.my_vote === option.index" class="poll-radio-check">✓</span>
          </span>
          <span class="poll-row-body">
            <span class="poll-row-top">
              <span class="poll-option-text">{{ option.text }}</span>
              <span class="poll-count">{{ option.count }}</span>
            </span>
            <span class="poll-bar">
              <span class="poll-bar-fill" v-bind:style="{ width: percent(option.count, message.poll.total_votes) + '%' }"></span>
            </span>
          </span>
        </button>
      </div>
      <div v-if="votesOpen" class="votes-panel">
        <div class="votes-title">Votes</div>
        <div class="votes-row" v-for="option in message.poll.options" v-bind:key="'votes-' + option.index">
          <span class="votes-row-top">
            <span class="votes-option">{{ option.text }}</span>
            <span class="votes-count">{{ option.count }}</span>
          </span>
          <span v-if="message.poll.can_view_voters && option.voters && option.voters.length" class="votes-names">{{ option.voters.join(', ') }}</span>
          <span v-else-if="message.poll.can_view_voters" class="votes-names">No votes yet</span>
          <span v-else class="votes-names">Names hidden</span>
        </div>
      </div>
      <div class="poll-foot">
        <span>{{ message.poll.total_votes }} vote{{ message.poll.total_votes === 1 ? '' : 's' }}</span>
        <span class="poll-foot-actions">
          <button type="button" class="poll-view-btn" v-bind:aria-expanded="votesOpen ? 'true' : 'false'" v-on:click="toggleVotes">
            {{ votesOpen ? 'Hide votes' : 'View votes' }}
          </button>
          <button
            type="button"
            class="poll-close-btn"
            v-if="message.poll.can_close && !message.poll.is_closed"
            v-on:click="$emit('close-poll', message.poll.name)"
          >Close poll</button>
        </span>
      </div>
    </div>

    <div v-else class="rich-text">
      <template v-for="(part, index) in linkParts(message.message_text)" v-bind:key="index">
        <a v-if="part.kind === 'link'" v-bind:href="part.href" target="_blank" rel="noopener noreferrer">{{ part.value }}</a>
        <span v-else>{{ part.value }}</span>
      </template>
      <ChatLinkCard v-if="firstLink(message.message_text)" v-bind:url="firstLink(message.message_text)" />
    </div>
  </div>
</template>

<script>
import ChatLinkCard from '@/components/messages/ChatLinkCard.vue'

export default {
  name: 'MessageRich',
  components: {
    ChatLinkCard
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    time: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      votesOpen: false
    }
  },
  methods: {
    linkParts(value) {
      var text = String(value || '')
      var pattern = /https?:\/\/[^\s<]+/g
      var result = []
      var last = 0
      var match = pattern.exec(text)
      while (match !== null) {
        var link = match[0]
        var trailing = ''
        while (link.length > 0 && '.,!?;:)]}'.indexOf(link.charAt(link.length - 1)) >= 0) {
          trailing = link.charAt(link.length - 1) + trailing
          link = link.substring(0, link.length - 1)
        }
        if (match.index > last) {
          result.push({ kind: 'text', value: text.substring(last, match.index), href: '' })
        }
        if (link) {
          result.push({ kind: 'link', value: link, href: link })
        }
        last = match.index + link.length + trailing.length
        match = pattern.exec(text)
      }
      if (last < text.length) {
        result.push({ kind: 'text', value: text.substring(last), href: '' })
      }
      return result
    },
    firstLink(value) {
      var parts = this.linkParts(value)
      var i = 0
      while (i < parts.length) {
        if (parts[i].kind === 'link') {
          return parts[i].href
        }
        i = i + 1
      }
      return ''
    },
    playVideo() {
      var video = this.$refs.videoEl
      if (video && video.play) {
        video.play()
      }
    },
    sizeLabel(size) {
      var value = Number(size || 0)
      if (value < 1024) {
        return String(value) + ' B'
      }
      if (value < 1024 * 1024) {
        return String(Math.round(value / 1024)) + ' KB'
      }
      return String((value / (1024 * 1024)).toFixed(1)) + ' MB'
    },
    percent(count, total) {
      var all = Number(total || 0)
      if (all <= 0) {
        return 0
      }
      return Math.round((Number(count || 0) * 100) / all)
    },
    roleText(label) {
      if (label === 'Admin' || label === 'Instructor' || label === 'Student') {
        return label
      }
      return ''
    },
    vote(option) {
      var poll = this.message.poll
      if (!poll || poll.is_closed || !option) {
        return
      }
      var index = Number(option.index || 0)
      if (poll.my_vote === index) {
        index = 0
      }
      this.$emit('vote', { poll: poll.name, index: index })
    },
    toggleVotes() {
      this.votesOpen = !this.votesOpen
    },
    viewImage() {
      if (this.message.attachment) {
        this.$emit('view-image', {
          url: this.message.attachment.preview_url,
          name: this.message.attachment.file_name || 'Photo'
        })
      }
    }
  }
}
</script>

<style scoped>
.message-rich {
  min-width: 0;
}
.rich-text,
.rich-caption {
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.rich-text a,
.rich-caption a {
  color: inherit;
  text-decoration: underline;
}
.sticker-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 0;
}
.sticker-emoji {
  font-size: 44px;
  line-height: 1.1;
}
.media-wrap {
  min-width: 0;
}
.media-card {
  position: relative;
  width: fit-content;
  max-width: 100%;
  box-sizing: border-box;
  padding: 2px;
  border-radius: 18px;
  background: linear-gradient(120deg, #453D89, #7B4FA5 55%, #C8499A);
  box-shadow: 0 5px 14px rgba(69, 61, 137, 0.2);
  overflow: hidden;
}
.image-button {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
}
.message-image {
  display: block;
  width: 100%;
  max-width: 280px;
  max-height: 220px;
  object-fit: cover;
  border-radius: 14px;
}
.message-video {
  display: block;
  width: 100%;
  max-width: 280px;
  max-height: 220px;
  border-radius: 14px;
  background: #f8f6ff;
}
.video-play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  background: rgba(69, 61, 137, 0.78);
  color: #ffffff;
  cursor: pointer;
}
.video-play:hover {
  background: rgba(200, 73, 154, 0.86);
}
.media-time {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #1f2937;
  font-size: 9px;
  font-weight: 700;
}
.audio-card {
  min-width: 200px;
  max-width: 280px;
  box-sizing: border-box;
  padding: 8px 9px;
  border: 1px solid #ece7f7;
  border-left: 3px solid #7c6ee6;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  box-shadow: 0 3px 10px rgba(69, 61, 137, 0.07);
}
.msg-bubble-own .audio-card {
  border-color: rgba(255, 255, 255, 0.28);
  border-left-color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
}
.message-audio {
  display: block;
  width: 100%;
  max-width: 260px;
}
.file-name-line,
.audio-label {
  margin-top: 4px;
  font-size: 10px;
  opacity: 0.85;
  word-break: break-word;
}
.file-card,
.contact-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid #ece7f7;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  box-shadow: 0 3px 10px rgba(69, 61, 137, 0.07);
  color: #1f2937;
}
.msg-bubble-own .file-card,
.msg-bubble-own .contact-card {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}
.file-icon,
.contact-mark {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f8f6ff;
  font-size: 18px;
}
.msg-bubble-own .file-icon,
.msg-bubble-own .contact-mark {
  background: rgba(255, 255, 255, 0.18);
}
.file-info,
.contact-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.file-card-name,
.contact-card-name {
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-card-size,
.contact-card-role {
  font-size: 10px;
  opacity: 0.85;
}
.file-download {
  flex: 0 0 auto;
  padding: 5px 8px;
  border: 1px solid #d8cef4;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  text-decoration: none;
  color: #453d89;
  background: #ffffff;
}
.msg-bubble-own .file-download {
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
}
.poll-card {
  width: 100%;
  min-width: 220px;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
}
.msg-bubble-other .poll-card {
  border-color: #e7dff8;
  background: linear-gradient(180deg, #ffffff 0%, #fbf9ff 100%);
}
.poll-question {
  margin-bottom: 3px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  word-break: break-word;
}
.poll-hint {
  margin-bottom: 9px;
  font-size: 10px;
  opacity: 0.82;
}
.poll-hint-closed {
  font-weight: 800;
}
.poll-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.poll-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.msg-bubble-other .poll-row {
  border-color: #d7deea;
  background: #ffffff;
}
.poll-row-mine {
  border-color: #7c6ee6;
}
.poll-row:disabled {
  cursor: default;
  opacity: 1;
}
.poll-radio {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2px solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
}
.msg-bubble-other .poll-radio {
  border-color: #64748b;
  color: #1f2937;
}
.poll-row-mine .poll-radio {
  border-color: transparent;
  background: linear-gradient(105deg, #453D89, #C8499A);
}
.poll-radio-check {
  font-weight: 900;
}
.poll-row-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.poll-row-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.poll-option-text {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}
.poll-count {
  flex: 0 0 auto;
  min-width: 14px;
  font-size: 11px;
  font-weight: 800;
  text-align: right;
}
.poll-bar {
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(124, 110, 230, 0.2);
  overflow: hidden;
}
.msg-bubble-other .poll-bar {
  background: rgba(124, 110, 230, 0.16);
}
.poll-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(105deg, #453D89, #C8499A);
}
.votes-panel {
  margin-top: 9px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.16);
}
.msg-bubble-other .votes-panel {
  border-color: #d7deea;
  background: #ffffff;
  color: #1f2937;
}
.votes-title {
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 800;
  opacity: 0.85;
}
.votes-row {
  padding: 5px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 10px;
}
.msg-bubble-other .votes-row {
  border-top-color: #d7deea;
}
.votes-row-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.votes-option {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 700;
  word-break: break-word;
}
.votes-count {
  flex: 0 0 auto;
  font-weight: 800;
}
.votes-names {
  display: block;
  margin-top: 2px;
  opacity: 0.82;
  word-break: break-word;
}
.poll-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 10px;
}
.msg-bubble-other .poll-foot {
  border-color: #d7deea;
}
.poll-foot-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.poll-view-btn,
.poll-close-btn {
  border: none;
  padding: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 10px;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
}
@media (max-width: 360px) {
  .poll-card {
    min-width: 0;
  }
  .poll-row {
    padding: 8px 6px;
  }
}
</style>
