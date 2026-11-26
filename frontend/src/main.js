import './index.css'

import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

import { Button, setConfig, frappeRequest, resourcesPlugin } from 'frappe-ui'
import { installCsrf } from './lib/csrf'
import { installMessageSoundUnlock } from './lib/message_sound'

if (window.parent && window.parent !== window && window.parent.frappe && window.parent.frappe.csrf_token) {
  window.csrf_token = window.parent.frappe.csrf_token
}

installCsrf()
installMessageSoundUnlock()

let app = createApp(App)

setConfig('resourceFetcher', frappeRequest)

app.use(router)
app.use(resourcesPlugin)

app.component('Button', Button)
app.mount('#app')
