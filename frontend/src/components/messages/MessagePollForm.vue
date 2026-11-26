<template>
  <div class="poll-form">
    <div class="poll-head">
      <span class="poll-title">New poll</span>
      <button type="button" class="poll-close" aria-label="Close poll form" v-on:click="$emit('cancel')">×</button>
    </div>
    <input type="text" class="poll-question" v-model="question" maxlength="200" placeholder="Ask a question" aria-label="Poll question" />
    <div class="poll-option-row" v-for="(option, index) in options" v-bind:key="index">
      <input type="text" class="poll-option" v-model="options[index]" maxlength="100" v-bind:aria-label="'Option ' + (index + 1)" placeholder="Option" />
      <button type="button" class="poll-option-remove" v-bind:aria-label="'Remove option ' + (index + 1)" v-bind:disabled="options.length <= 2" v-on:click="removeOption(index)">×</button>
    </div>
    <div v-if="errorText" class="poll-error">{{ errorText }}</div>
    <div class="poll-actions">
      <button type="button" class="poll-add" v-bind:disabled="options.length >= 6" v-on:click="addOption">+ Add option</button>
      <span class="poll-action-right">
        <button type="button" class="poll-cancel" v-on:click="$emit('cancel')">Cancel</button>
        <button type="button" class="poll-create" v-on:click="createPoll">Create poll</button>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessagePollForm',
  data() {
    return {
      question: '',
      options: ['', ''],
      errorText: ''
    }
  },
  methods: {
    addOption() {
      if (this.options.length >= 6) {
        return
      }
      this.options.push('')
      this.errorText = ''
    },
    removeOption(index) {
      if (this.options.length <= 2) {
        return
      }
      this.options.splice(index, 1)
      this.errorText = ''
    },
    createPoll() {
      var question = String(this.question || '').trim()
      var values = []
      var i = 0
      while (i < this.options.length) {
        var value = String(this.options[i] || '').trim()
        if (value) {
          values.push(value)
        }
        i = i + 1
      }
      if (!question) {
        this.errorText = 'Please enter a poll question.'
        return
      }
      if (values.length < 2) {
        this.errorText = 'Please enter at least 2 options.'
        return
      }
      this.errorText = ''
      this.$emit('create', {
        question: question,
        options: values
      })
    }
  }
}
</script>

<style scoped>
.poll-form {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: calc(100% + 8px);
  z-index: 30;
  box-sizing: border-box;
  max-height: 360px;
  padding: 11px;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: #ffffff;
  color: #1f2937;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
  overflow-y: auto;
}
.poll-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}
.poll-title {
  color: #1f2937;
  font-size: 12px;
  font-weight: 800;
}
.poll-close {
  width: 24px;
  height: 24px;
  border: 1px solid #d7deea;
  border-radius: 7px;
  color: #64748b;
  background: #f1f3f9;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.poll-question,
.poll-option {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  margin-bottom: 6px;
  padding: 8px 9px;
  border: 1px solid #d7deea;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}
.poll-question::placeholder,
.poll-option::placeholder {
  color: #94a3b8;
}
.poll-question:focus,
.poll-option:focus {
  border-color: #7c6ee6;
}
.poll-option-row {
  display: flex;
  align-items: flex-start;
  gap: 5px;
}
.poll-option-remove {
  flex: 0 0 auto;
  width: 28px;
  height: 36px;
  margin-bottom: 6px;
  border: 1px solid #d7deea;
  border-radius: 7px;
  color: #b42318;
  background: #fff1f0;
  cursor: pointer;
}
.poll-option-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.poll-error {
  margin: 2px 0 8px;
  color: #b42318;
  font-size: 10px;
  font-weight: 700;
}
.poll-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.poll-action-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.poll-add,
.poll-cancel,
.poll-create {
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}
.poll-add,
.poll-cancel {
  border: 1px solid #d7deea;
  background: #f1f3f9;
  color: #475569;
}
.poll-create {
  border: none;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
}
</style>
