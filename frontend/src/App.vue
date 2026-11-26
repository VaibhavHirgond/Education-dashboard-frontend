<template>
  <div>
    <router-view />
    <AppMessageToast />
  </div>
</template>

<script>
import AppMessageToast from '@/components/AppMessageToast.vue'

export default {
  name: 'App',
  components: {
    AppMessageToast
  }
}
</script>
