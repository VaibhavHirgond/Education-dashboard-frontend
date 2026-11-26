<template>
  <div class="app-message-toast" v-if="visible && toast">
    <button type="button" class="app-toast-dismiss" aria-label="Dismiss" v-on:click="dismiss">×</button>
    <button type="button" class="app-toast-open" v-on:click="openMessage">
      <span class="app-toast-kicker">NEW MESSAGE</span>
      <span class="app-toast-group">{{ toast.group_name || 'Messages' }}</span>
      <span class="app-toast-body">{{ toast.sender_name || 'New message' }}: {{ toast.preview || '' }}</span>
      <span class="app-toast-cta">Open chat →</span>
    </button>
  </div>
</template>

<script>
import { apiGet } from '@/lib/api'
import { io } from 'socket.io-client'
import { installMessageSoundUnlock, playMessageSound } from '@/lib/message_sound'

export default {
  name: 'AppMessageToast',
  data() {
    return {
      visible: false,
      toast: null,
      embed: false,
      bound: false,
      target: null,
      handler: null,
      socket: null,
      timer: null
    }
  },
  computed: {
    onMessagesPage() {
      return Boolean(this.$route && this.$route.path === '/messages')
    }
  },
  watch: {
    '$route': 'onRouteChange'
  },
  mounted() {
    var hash = window.location.hash || ''
    if (hash.indexOf('embed=1') >= 0) {
      this.embed = true
      return
    }
    this.bindRealtime()
    installMessageSoundUnlock()
  },
  beforeUnmount() {
    this.unbindRealtime()
    this.clearTimer()
  },
  methods: {
    onRouteChange() {
      if (this.onMessagesPage && this.visible) {
        this.dismiss()
      }
    },
    sessionUser() {
      if (window.parent && window.parent.frappe && window.parent.frappe.session && window.parent.frappe.session.user) {
        return String(window.parent.frappe.session.user)
      }
      if (window.frappe && window.frappe.session && window.frappe.session.user) {
        return String(window.frappe.session.user)
      }
      return ''
    },
    handleToast(data) {
      if (this.embed || this.onMessagesPage || !data) {
        return
      }
      var current = this.sessionUser()
      if (current && data.sender && data.sender === current) {
        return
      }
      playMessageSound()
      this.toast = {
        group: data.group || '',
        group_name: data.group_name || '',
        sender_name: data.sender_name || '',
        preview: data.preview || ''
      }
      this.visible = true
      var self = this
      this.clearTimer()
      this.timer = setTimeout(function() {
        self.visible = false
        self.toast = null
        self.timer = null
      }, 6000)
    },
    openMessage() {
      if (!this.toast) {
        return
      }
      var group = this.toast.group || ''
      this.dismiss()
      this.$router.push('/messages?group=' + encodeURIComponent(group)).catch(function(e) {
      })
    },
    dismiss() {
      this.visible = false
      this.toast = null
      this.clearTimer()
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    bindRealtime() {
      if (this.embed || this.bound) {
        return
      }
      var self = this
      this.handler = function(data) {
        self.handleToast(data)
      }
      var realtime = null
      if (window.parent && window.parent.frappe && window.parent.frappe.realtime) {
        realtime = window.parent.frappe.realtime
      }
      if (!realtime && window.frappe && window.frappe.realtime) {
        realtime = window.frappe.realtime
      }
      if (realtime) {
        realtime.on('messages_new_message_toast', this.handler)
        this.target = realtime
        this.bound = true
        return
      }
      apiGet('/api/method/backend_custom_app.api.messages.get_message_socket_config').then(function(config) {
        if (!config || !config.sitename) {
          return
        }
        var host = window.location.origin
        var parts = window.location.origin.split(':')
        if (config.developer_mode && parts.length > 2) {
          host = parts[0] + ':' + parts[1] + ':' + String(config.socketio_port || 9000)
        }
        self.socket = io(host + '/' + config.sitename, {
          withCredentials: true,
          reconnectionAttempts: 3
        })
        self.socket.on('messages_new_message_toast', self.handler)
        self.target = self.socket
        self.bound = true
      }).catch(function(e) {
      })
    },
    unbindRealtime() {
      if (this.target && this.target.off && this.handler) {
        this.target.off('messages_new_message_toast', this.handler)
      }
      if (this.socket && this.socket.disconnect) {
        this.socket.disconnect()
      }
      this.embed = false
      this.bound = false
      this.target = null
      this.handler = null
      this.socket = null
    }
  }
}
</script>

<style scoped>
.app-message-toast {
  position: fixed;
  z-index: 30000;
  top: 14px;
  right: 14px;
  width: 300px;
  max-width: calc(100vw - 28px);
  box-sizing: border-box;
  border-radius: 14px;
  background: linear-gradient(105deg, #453D89, #C8499A);
  color: #ffffff;
  box-shadow: 0 14px 36px rgba(69, 61, 137, 0.35);
  overflow: hidden;
}
.app-toast-dismiss {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.app-toast-open {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 34px 12px 12px;
  border: none;
  background: transparent;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
}
.app-toast-kicker {
  font-size: 9px;
  letter-spacing: 0.12em;
  font-weight: 800;
  opacity: 0.85;
}
.app-toast-group {
  font-size: 13px;
  font-weight: 800;
  word-break: break-word;
}
.app-toast-body {
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.95;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.app-toast-cta {
  margin-top: 3px;
  font-size: 10px;
  font-weight: 800;
  text-decoration: underline;
}
@media (max-width: 480px) {
  .app-message-toast {
    top: 8px;
    right: 8px;
    width: calc(100vw - 16px);
    max-width: none;
  }
}
</style>
