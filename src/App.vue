<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import { useAuthStore } from '@/stores'

const route = useRoute()
const authStore = useAuthStore()

const showHeader = computed(() => {
  return route.name !== 'Login' && authStore.isAuthenticated
})
</script>

<template>
  <div class="app-layout">
    <Toast position="top-right" />
    <ConfirmDialog />
    
    <AppLoading v-if="authStore.loading" />
    
    <template v-else>
      <AppHeader v-if="showHeader" />
      
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>
  </div>
</template>

<style lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>

