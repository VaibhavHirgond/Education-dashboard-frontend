<template>
  <div class="viewer-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
    <button type="button" class="viewer-backdrop" aria-label="Close image viewer" v-on:click="$emit('close')"></button>
    <div class="viewer-panel">
      <div class="viewer-head">
        <span class="viewer-name">{{ name }}</span>
        <button type="button" class="viewer-close" aria-label="Close image viewer" v-on:click="$emit('close')">×</button>
      </div>
      <img class="viewer-image" v-bind:src="url" v-bind:alt="name" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageImageViewer',
  props: {
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'Photo'
    }
  }
}
</script>

<style scoped>
.viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 42000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}
.viewer-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(15, 23, 42, 0.78);
}
.viewer-panel {
  position: relative;
  width: min(92vw, 900px);
  max-height: 92vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}
.viewer-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.viewer-name {
  min-width: 0;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.viewer-close {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}
.viewer-image {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  object-fit: contain;
  background: #f1f5f9;
}
</style>
