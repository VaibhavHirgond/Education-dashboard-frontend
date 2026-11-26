<template>
  <div class="attachment-preview">
    <span class="preview-icon" v-if="!attachment.isImage">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 2h8l5 5v15H6z" fill="currentColor" opacity="0.18"/><path d="M14 2v6h5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
    </span>
    <img class="preview-thumb" v-else v-bind:src="attachment.previewUrl" v-bind:alt="attachment.name" />
    <span class="preview-info">
      <span class="preview-name">{{ attachment.name }}</span>
      <span class="preview-size">{{ sizeLabel }}<span v-if="attachment.progress > 0"> · {{ attachment.progress }}%</span></span>
    </span>
    <button type="button" class="preview-remove" aria-label="Remove attachment" v-on:click="$emit('remove')">×</button>
  </div>
</template>

<script>
export default {
  name: 'MessagePreviewStrip',
  props: {
    attachment: {
      type: Object,
      required: true
    }
  },
  computed: {
    sizeLabel() {
      var size = Number(this.attachment.size || 0)
      if (size < 1024) {
        return String(size) + ' B'
      }
      if (size < 1024 * 1024) {
        return String(Math.round(size / 1024)) + ' KB'
      }
      return String((size / (1024 * 1024)).toFixed(1)) + ' MB'
    }
  }
}
</script>

<style scoped>
.attachment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  margin-bottom: 6px;
  padding: 6px 8px;
  border: 1px solid #d7deea;
  border-radius: 10px;
  background: #ffffff;
}
.preview-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 7px;
  background: #f1f3f9;
}
.preview-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #7c6ee6;
  background: #f1f3f9;
}
.preview-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.preview-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preview-size {
  font-size: 10px;
  color: #64748b;
}
.preview-remove {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  color: #b42318;
  background: #fff1f0;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
</style>
