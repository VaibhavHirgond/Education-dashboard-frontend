<template>
  <div class="link-field" v-click-outside="close">
    <div class="link-input-wrap">
      <input
        v-model="query"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @focus="open"
        @input="open"
      />
      <span v-if="loading" class="link-spinner"></span>
      <template v-else>
        <button
          v-if="modelValue"
          class="link-icon link-open"
          type="button"
          title="Open in Desk"
          @click="openInDesk"
        >↗</button>
        <button
          v-if="modelValue"
          class="link-icon link-clear"
          type="button"
          title="Clear"
          @click="clear"
        >×</button>
        <span v-if="!modelValue" class="link-caret">▾</span>
      </template>
    </div>

    <div v-if="openState" class="link-dropdown">
      <div v-if="loading" class="link-option muted">Loading…</div>
      <template v-else>
        <button
          v-for="opt in filteredOptions"
          :key="opt.name"
          class="link-option"
          :class="{ active: opt.name === modelValue }"
          type="button"
          @click="select(opt)"
        >
          <span class="opt-label">{{ opt.label }}</span>
          <span v-if="opt.label !== opt.name" class="opt-name">{{ opt.name }}</span>
        </button>
        <div v-if="filteredOptions.length === 0" class="link-option muted">
          No matches found.
        </div>
        <button class="link-option link-create" type="button" @click="createNew">
          <span class="opt-label">+ Create new {{ doctype }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import { apiGet } from '@/lib/api'

const cache = new Map()

const DESK_BASE = 'http://erpnext.localhost:8000'

function doctypeRoute(doctype) {
  return doctype.toLowerCase().replace(/\s+/g, '-')
}

export default {
  name: 'LinkField',

  props: {
    modelValue: { type: String, default: '' },
    doctype: { type: String, required: true },
    placeholder: { type: String, default: 'Search…' },
    filters: { type: Object, default: null },
    disabled: { type: Boolean, default: false },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      query: '',
      options: [],
      loading: false,
      openState: false,
    }
  },

  computed: {
    cacheKey() {
      const f = this.filters ? JSON.stringify(this.filters) : ''
      return `${this.doctype}|${f}`
    },

    filteredOptions() {
      const q = this.query.trim().toLowerCase()
      if (!q) return this.options
      return this.options.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.label || '').toLowerCase().includes(q)
      )
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        // Keep the visible text in sync when the value is set externally
        // (e.g. loading an existing record) and we already know its label.
        if (!this.openState) {
          const hit = this.options.find((o) => o.name === val)
          this.query = hit ? hit.label : val || ''
        }
      },
    },

    cacheKey: {
      immediate: true,
      handler() {
        this.loadOptions()
      },
    },
  },

  methods: {
    async loadOptions() {
      const key = this.cacheKey
      if (cache.has(key)) {
        this.options = cache.get(key)
        this.syncQuery()
        return
      }

      this.loading = true
      try {
        const res = await apiGet(
          '/api/method/backend_custom_app.api.admissions.get_link_options',
          { doctype: this.doctype, filters: this.filters || undefined }
        )
        const options = res?.options || []
        cache.set(key, options)
        this.options = options
        this.syncQuery()
      } catch (e) {
        this.options = []
      } finally {
        this.loading = false
      }
    },

    syncQuery() {
      const hit = this.options.find((o) => o.name === this.modelValue)
      this.query = hit ? hit.label : this.modelValue || ''
    },

    open() {
      if (this.disabled) return
      this.openState = true
      this.loadOptions()
    },

    close() {
      this.openState = false
      this.syncQuery()
    },

    select(option) {
      this.$emit('update:modelValue', option.name)
      this.query = option.label
      this.openState = false
    },

    clear() {
      this.$emit('update:modelValue', '')
      this.query = ''
      this.openState = false
    },

    openInDesk() {
      if (!this.modelValue) return
      const url = `${DESK_BASE}/app/${doctypeRoute(this.doctype)}/${encodeURIComponent(this.modelValue)}`
      window.open(url, '_blank', 'noopener')
    },

    createNew() {
      const url = `${DESK_BASE}/app/${doctypeRoute(this.doctype)}/new`
      window.open(url, '_blank', 'noopener')
      this.openState = false
    },
  },

  directives: {
    clickOutside: {
      mounted(el, binding) {
        el.__clickOutside = (event) => {
          if (!el.contains(event.target)) binding.value()
        }
        document.addEventListener('mousedown', el.__clickOutside)
      },
      unmounted(el) {
        document.removeEventListener('mousedown', el.__clickOutside)
      },
    },
  },
}
</script>

<style scoped>
.link-field { position: relative; }

.link-input-wrap { position: relative; display: flex; align-items: center; }

.link-input-wrap input {
  width: 100%; height: 40px; padding: 0 58px 0 10px;
  border: 1px solid #c7c7c7; border-radius: 8px; background: #f3f3f3;
  font-size: 13px; color: #383838; box-sizing: border-box;
}
.link-input-wrap input:focus {
  outline: 0; border-color: #999999; background: #f3f3f3;
  box-shadow: 0 0 0 2px rgba(124, 124, 124, 0.25);
}

.link-caret { position: absolute; right: 12px; color: #7c7c7c; font-size: 13px; pointer-events: none; }

.link-icon {
  position: absolute; width: 22px; height: 22px;
  border: 0; border-radius: 6px; background: transparent; color: #7c7c7c;
  cursor: pointer; font-size: 13px; line-height: 1; display: grid; place-items: center;
}
.link-icon:hover { background: #e2e2e2; color: #383838; }
.link-open { right: 30px; }
.link-clear { right: 6px; font-size: 14px; }

.link-spinner {
  position: absolute; right: 12px; width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid #e2e2e2; border-top-color: #7c7c7c; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.link-dropdown {
  position: absolute; z-index: 40; top: calc(100% + 4px); left: 0; right: 0;
  max-height: 240px; overflow-y: auto; background: #fff;
  border: 1px solid #e2e2e2; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.link-option {
  display: flex; flex-direction: column; gap: 1px; width: 100%; text-align: left;
  padding: 7px 10px; border: 0; background: transparent; cursor: pointer;
  font-size: 13px; color: #383838;
}
.link-option:hover { background: #f3f3f3; }
.link-option.active { background: #edf6fd; color: #0070cc; }
.link-option.muted { color: #7c7c7c; cursor: default; }

.link-create {
  border-top: 1px solid #e2e2e2; color: #0070cc; font-weight: 500;
}
.link-create:hover { background: #f7fbfd; }

.opt-label { font-weight: 420; }
.link-option.active .opt-label { font-weight: 500; }
.opt-name { font-size: 13px; color: #7c7c7c; font-family: monospace; }
</style>
