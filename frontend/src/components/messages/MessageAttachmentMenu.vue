<template>
  <div class="attachment-menu">
    <button type="button" class="attachment-item" v-on:click="$emit('select', 'document')">
      <span class="attachment-icon icon-document">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M6 2h8l5 5v15H6z" fill="currentColor" opacity="0.18"/><path d="M14 2v6h5M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
      </span>
      <span>Document</span>
    </button>
    <button type="button" class="attachment-item" v-on:click="$emit('select', 'photos')">
      <span class="attachment-icon icon-photo">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.18"/><path d="M4 17l5-5 3 3 3-4 5 6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/></svg>
      </span>
      <span>Photos &amp; videos</span>
    </button>
    <button type="button" class="attachment-item" v-on:click="$emit('select', 'camera')">
      <span class="attachment-icon icon-camera">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M4 7h4l2-2h4l2 2h4v12H4z" fill="currentColor" opacity="0.18"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
      </span>
      <span>Camera</span>
    </button>
    <button type="button" class="attachment-item" v-on:click="$emit('select', 'audio')">
      <span class="attachment-icon icon-audio">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="18" r="2.5" fill="currentColor"/><circle cx="17" cy="16" r="2.5" fill="currentColor"/></svg>
      </span>
      <span>Audio</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MessageAttachmentMenu'
}
</script>

<style scoped>
.attachment-menu {
  position: absolute;
  left: 8px;
  bottom: calc(100% + 8px);
  z-index: 30;
  width: min(250px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 6px;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}
.attachment-item {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #1f2937;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.attachment-item:hover {
  background: #f1f3f9;
}
.attachment-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
}
.icon-document {
  color: #2563eb;
  background: #eaf1ff;
}
.icon-photo {
  color: #c026d3;
  background: #fbeaff;
}
.icon-camera {
  color: #059669;
  background: #e7faef;
}
.icon-audio {
  color: #ea580c;
  background: #fff0e6;
}
</style>
