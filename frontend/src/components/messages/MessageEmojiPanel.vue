<template>
  <div class="emoji-panel">
    <div class="panel-head">
      <span class="panel-title">Emoji &amp; stickers</span>
      <button type="button" class="panel-close" aria-label="Close emoji panel" v-on:click="$emit('close')">×</button>
    </div>
    <div class="emoji-tabs">
      <button
        type="button"
        class="emoji-tab"
        v-for="tab in tabs"
        v-bind:key="tab"
        v-bind:class="activeTab === tab ? 'emoji-tab-active' : ''"
        v-on:click="setTab(tab)"
      >{{ tab }}</button>
    </div>
    <div class="emoji-grid" v-if="activeTab !== 'Stickers'">
      <button
        type="button"
        class="emoji-item"
        v-for="item in items"
        v-bind:key="item"
        v-bind:aria-label="'Insert ' + item"
        v-on:click="selectItem(item)"
      >{{ item }}</button>
    </div>
    <div class="sticker-grid" v-else>
      <button
        type="button"
        class="sticker-item"
        v-for="item in stickers"
        v-bind:key="item"
        v-bind:aria-label="'Send sticker ' + item"
        v-on:click="selectSticker(item)"
      >{{ item }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageEmojiPanel',
  data() {
    return {
      activeTab: 'Smileys',
      tabs: ['Smileys', 'Hands', 'Hearts', 'Objects', 'Stickers'],
      smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤓', '🧐', '😕', '😟', '🥺', '😢', '😭', '😤', '😡', '🥳', '😴'],
      hands: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '🤝', '🙏', '💪', '👊', '✊', '🖐️', '👋'],
      hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💗', '💖', '💘'],
      objects: ['🎉', '🎊', '✨', '🌟', '🔥', '💡', '📚', '📝', '📎', '📁', '📷', '🎵', '🎧', '☕', '🍎', '🏫'],
      stickers: ['😀', '😂', '😍', '😎', '🥳', '😊', '👍', '👏', '🙏', '❤️', '🎉', '🌟']
    }
  },
  computed: {
    items() {
      if (this.activeTab === 'Smileys') {
        return this.smileys
      }
      if (this.activeTab === 'Hands') {
        return this.hands
      }
      if (this.activeTab === 'Hearts') {
        return this.hearts
      }
      return this.objects
    }
  },
  methods: {
    setTab(tab) {
      this.activeTab = tab
    },
    selectItem(value) {
      this.$emit('select', value)
    },
    selectSticker(value) {
      this.$emit('sticker', value)
    }
  }
}
</script>

<style scoped>
.emoji-panel {
  position: absolute;
  left: 8px;
  bottom: calc(100% + 8px);
  z-index: 30;
  width: min(320px, calc(100vw - 32px));
  max-height: 280px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.panel-title {
  font-size: 12px;
  font-weight: 800;
}
.panel-close {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.emoji-tabs {
  display: flex;
  gap: 4px;
  padding: 7px 8px;
  overflow-x: auto;
  border-bottom: 1px solid #e2e8f0;
}
.emoji-tab {
  flex: 0 0 auto;
  border: none;
  border-radius: 999px;
  padding: 5px 9px;
  color: #475569;
  background: #f1f3f9;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.emoji-tab-active {
  color: #ffffff;
  background: linear-gradient(105deg, #453D89, #C8499A);
}
.emoji-grid,
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px;
  padding: 8px;
  overflow-y: auto;
}
.emoji-item,
.sticker-item {
  min-width: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 20px;
  line-height: 1.2;
  cursor: pointer;
}
.emoji-item:hover,
.sticker-item:hover {
  background: #f1f3f9;
}
.sticker-grid {
  grid-template-columns: repeat(4, 1fr);
}
.sticker-item {
  font-size: 38px;
  padding: 6px 0;
}
@media (max-width: 360px) {
  .emoji-grid {
    grid-template-columns: repeat(7, 1fr);
  }
  .emoji-item {
    font-size: 18px;
  }
}
</style>
