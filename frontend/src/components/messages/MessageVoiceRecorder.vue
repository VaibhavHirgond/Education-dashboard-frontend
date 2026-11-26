<template>
  <div class="voice-recorder">
    <span class="record-dot"></span>
    <span class="record-label">Recording {{ timeLabel }}</span>
    <button type="button" class="record-cancel" v-on:click="$emit('cancel')">Cancel</button>
    <button type="button" class="record-send" v-on:click="$emit('send')">Send</button>
  </div>
</template>

<script>
export default {
  name: 'MessageVoiceRecorder',
  props: {
    seconds: {
      type: Number,
      default: 0
    }
  },
  computed: {
    timeLabel() {
      var value = Number(this.seconds || 0)
      var mins = Math.floor(value / 60)
      var secs = value % 60
      if (secs < 10) {
        return String(mins) + ':0' + String(secs)
      }
      return String(mins) + ':' + String(secs)
    }
  }
}
</script>

<style scoped>
.voice-recorder {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  margin-bottom: 6px;
  padding: 7px 9px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff5f5;
}
.record-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border-radius: 50%;
  background: #dc2626;
  animation: record-pulse 1s infinite;
}
@keyframes record-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.record-label {
  flex: 1 1 auto;
  min-width: 0;
  color: #b42318;
  font-size: 11px;
  font-weight: 800;
}
.record-cancel,
.record-send {
  flex: 0 0 auto;
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}
.record-cancel {
  border: 1px solid #fecaca;
  background: #fff1f0;
  color: #b42318;
}
.record-send {
  border: none;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
</style>
