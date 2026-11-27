<template>
  <a class="chat-link-card" v-bind:href="url" target="_blank" rel="noopener noreferrer">
    <span class="chat-link-icon">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7L11 7.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M14 10a4 4 0 0 0-5.7 0L6 12.3a4 4 0 0 0 5.7 5.7l1.3-1.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    </span>
    <span class="chat-link-copy">
      <span class="chat-link-title">{{ host }}</span>
      <span class="chat-link-url">{{ url }}</span>
    </span>
  </a>
</template>

<script>
export default {
  name: 'ChatLinkCard',
  props: {
    url: {
      type: String,
      required: true
    }
  },
  computed: {
    host() {
      var match = /^https?:\/\/([^\/?#]+)/i.exec(String(this.url || ''))
      if (!match || !match[1]) {
        return 'Link'
      }
      return match[1]
    }
  }
}
</script>

<style scoped>
.chat-link-card {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 320px;
  box-sizing: border-box;
  margin-top: 7px;
  padding: 9px 10px;
  border: 1px solid #ece7f7;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  box-shadow: 0 3px 10px rgba(69, 61, 137, 0.07);
  color: #1f2937;
  text-decoration: none;
}
.msg-bubble-own .chat-link-card {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}
.chat-link-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #f3efff, #fbe7f4);
  color: #453d89;
}
.msg-bubble-own .chat-link-icon {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}
.chat-link-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.chat-link-title {
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-link-url {
  margin-top: 2px;
  font-size: 10px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
