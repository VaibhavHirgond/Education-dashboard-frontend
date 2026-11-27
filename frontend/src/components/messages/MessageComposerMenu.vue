<template>
  <div class="composer-menu" role="menu" aria-label="Message tools">
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Emoji and stickers" v-on:click="$emit('select', 'emoji')">
      <span class="composer-menu-icon icon-emoji">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/><circle cx="15" cy="10" r="1.1" fill="currentColor"/><path d="M8 14.5c1.2 2 6.8 2 8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </span>
      <span>Emoji</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Photos and videos" v-on:click="$emit('select', 'photos')">
      <span class="composer-menu-icon icon-photo">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.18"/><path d="M4 17l5-5 3 3 3-4 5 6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/></svg>
      </span>
      <span>Photos and videos</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Camera" v-on:click="$emit('select', 'camera')">
      <span class="composer-menu-icon icon-camera">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M4 7h4l2-2h4l2 2h4v12H4z" fill="currentColor" opacity="0.18"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
      </span>
      <span>Camera</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Document" v-on:click="$emit('select', 'document')">
      <span class="composer-menu-icon icon-document">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M6 2h8l5 5v15H6z" fill="currentColor" opacity="0.18"/><path d="M14 2v6h5M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
      </span>
      <span>Document</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Audio" v-on:click="$emit('select', 'audio')">
      <span class="composer-menu-icon icon-audio">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="18" r="2.5" fill="currentColor"/><circle cx="17" cy="16" r="2.5" fill="currentColor"/></svg>
      </span>
      <span>Audio</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Create a poll" v-on:click="$emit('select', 'poll')">
      <span class="composer-menu-icon icon-poll">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M5 19V5M5 19h14M9 15v-4M13 15V8M17 15v-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </span>
      <span>Poll</span>
    </button>
    <button type="button" class="composer-menu-item" role="menuitem" aria-label="Share a contact" v-on:click="$emit('select', 'contact')">
      <span class="composer-menu-icon icon-contact">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20c.8-3.7 3.2-5.5 6.5-5.5s5.7 1.8 6.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </span>
      <span>Contact</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MessageComposerMenu'
}
</script>

<style scoped>
.composer-menu {
  position: absolute;
  left: 8px;
  bottom: calc(100% + 8px);
  z-index: 35;
  width: min(280px, calc(100vw - 32px));
  max-height: min(420px, calc(100dvh - 120px));
  box-sizing: border-box;
  padding: 6px;
  border: 1px solid #d7deea;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  overflow-y: auto;
  overflow-x: hidden;
}
.composer-menu-item {
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 9px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.composer-menu-item:hover,
.composer-menu-item:focus-visible {
  background: #f8f6ff;
  outline: 2px solid #7c6ee6;
  outline-offset: 1px;
}
.composer-menu-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
}
.icon-emoji,
.icon-poll {
  color: #453d89;
  background: #f1ecff;
}
.icon-photo {
  color: #c026d3;
  background: #fbeaff;
}
.icon-camera {
  color: #059669;
  background: #e7faef;
}
.icon-document {
  color: #2563eb;
  background: #eaf1ff;
}
.icon-audio {
  color: #ea580c;
  background: #fff0e6;
}
.icon-contact {
  color: #0ea5a4;
  background: #e6faf8;
}
@media (max-width: 600px) {
  .composer-menu {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(10px + env(safe-area-inset-bottom));
    width: auto;
    max-height: 72dvh;
    border-radius: 20px 20px 12px 12px;
  }
}
</style>
