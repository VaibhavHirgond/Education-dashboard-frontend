<template>
  <div class="confirm-layer" role="dialog" aria-modal="true" v-bind:aria-label="title">
    <button type="button" class="confirm-backdrop" aria-label="Close dialog" v-on:click="$emit('cancel')"></button>
    <section class="confirm-modal" role="document">
      <h2 class="confirm-title">{{ title }}</h2>
      <p class="confirm-message">{{ message }}</p>
      <label v-if="requiredText" class="confirm-field">
        <span>Type <strong>{{ requiredText }}</strong> to confirm</span>
        <input
          type="text"
          class="confirm-input"
          v-model="requiredValue"
          v-bind:placeholder="requiredText"
          autocomplete="off"
          v-on:keydown.enter="submit"
        />
      </label>
      <div class="confirm-actions">
        <button type="button" class="confirm-cancel" v-on:click="$emit('cancel')">{{ cancelLabel }}</button>
        <button
          type="button"
          class="confirm-submit"
          v-bind:class="danger ? 'confirm-submit-danger' : ''"
          v-bind:disabled="!canConfirm"
          v-on:click="submit"
        >{{ confirmLabel }}</button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'MessageConfirmDialog',
  props: {
    title: {
      type: String,
      default: 'Are you sure?'
    },
    message: {
      type: String,
      default: ''
    },
    requiredText: {
      type: String,
      default: ''
    },
    confirmLabel: {
      type: String,
      default: 'Confirm'
    },
    cancelLabel: {
      type: String,
      default: 'Cancel'
    },
    danger: {
      type: Boolean,
      default: false
    },
    busy: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      requiredValue: ''
    }
  },
  computed: {
    canConfirm() {
      if (this.busy) {
        return false
      }
      if (this.requiredText && this.requiredValue !== this.requiredText) {
        return false
      }
      return true
    }
  },
  watch: {
    requiredText: function() {
      this.requiredValue = ''
    }
  },
  methods: {
    submit() {
      if (!this.canConfirm) {
        return
      }
      this.$emit('confirm')
    }
  }
}
</script>

<style scoped>
.confirm-layer {
  position: fixed;
  z-index: 60000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.confirm-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  margin: 0;
  background: rgba(30, 27, 55, 0.42);
  cursor: pointer;
}
.confirm-modal {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
  max-height: calc(100dvh - 32px);
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px;
  border: 1px solid #e7dff8;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(69, 61, 137, 0.24);
}
.confirm-title {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 800;
}
.confirm-message {
  margin: 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}
.confirm-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  word-break: break-word;
}
.confirm-input {
  width: 100%;
  height: 36px;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1px solid #d7deea;
  border-radius: 9px;
  outline: none;
  color: #1f2937;
  font-family: inherit;
  font-size: 12px;
}
.confirm-input:focus {
  border-color: #7c6ee6;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.confirm-cancel,
.confirm-submit {
  min-height: 34px;
  box-sizing: border-box;
  padding: 7px 13px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
.confirm-cancel {
  border: 1px solid #d7deea;
  background: #ffffff;
  color: #475569;
}
.confirm-submit {
  border: 1px solid transparent;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
.confirm-submit-danger {
  background: #b42318;
}
.confirm-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.confirm-cancel:focus-visible,
.confirm-submit:focus-visible,
.confirm-input:focus-visible {
  outline: 2px solid #7c6ee6;
  outline-offset: 2px;
}
@media (max-width: 375px) {
  .confirm-layer {
    padding: 10px;
  }
  .confirm-modal {
    padding: 14px;
  }
}
</style>
