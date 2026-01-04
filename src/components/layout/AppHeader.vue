<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'

const router = useRouter()
const authStore = useAuthStore()
const menuRef = ref()
const mobileMenuOpen = ref(false)

const userMenuItems: MenuItem[] = [
  {
    label: 'Hồ sơ',
    icon: 'pi pi-user',
    command: () => {
      // Navigate to profile
    }
  },
  {
    separator: true
  },
  {
    label: 'Đăng xuất',
    icon: 'pi pi-sign-out',
    command: async () => {
      await authStore.logout()
      router.push('/login')
    }
  }
]

const navLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: 'pi pi-home' },
  { name: 'Dây Hụi', path: '/hui', icon: 'pi pi-list' }
]

function toggleUserMenu(event: Event) {
  menuRef.value.toggle(event)
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <header class="header">
    <div class="container header__container">
      <router-link to="/dashboard" class="header__logo">
        <div class="header__logo-icon">H</div>
        <span class="header__logo-text">Quản Lý Hụi</span>
      </router-link>

      <nav class="header__nav" :class="{ 'header__nav--open': mobileMenuOpen }">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="header__nav-link"
          @click="mobileMenuOpen = false"
        >
          <i :class="link.icon"></i>
          {{ link.name }}
        </router-link>
      </nav>

      <div class="header__actions">
        <button class="header__user" @click="toggleUserMenu">
          <div class="header__avatar">
            {{ authStore.userProfile?.displayName?.[0] || 'U' }}
          </div>
          <span class="header__username">
            {{ authStore.userProfile?.displayName || 'Người dùng' }}
          </span>
          <i class="pi pi-chevron-down"></i>
        </button>
        <Menu ref="menuRef" :model="userMenuItems" :popup="true" />

        <button class="header__mobile-toggle" @click="toggleMobileMenu">
          <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.header {
  background: $surface;
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: 50;

  &__container {
    @include flex-between;
    height: 64px;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    text-decoration: none;
    color: $text-primary;
  }

  &__logo-icon {
    width: 36px;
    height: 36px;
    @include gradient-primary;
    border-radius: $radius-md;
    @include flex-center;
    color: white;
    font-weight: 700;
    font-size: $font-size-lg;
  }

  &__logo-text {
    font-weight: 600;
    font-size: $font-size-lg;
    
    @media (max-width: $breakpoint-sm) {
      display: none;
    }
  }

  &__nav {
    display: none;
    gap: $spacing-sm;

    @include md {
      display: flex;
    }

    &--open {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: $surface;
      padding: $spacing-md;
      box-shadow: $shadow-md;

      @include md {
        display: flex;
        flex-direction: row;
        position: static;
        background: transparent;
        padding: 0;
        box-shadow: none;
      }
    }
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    color: $text-secondary;
    text-decoration: none;
    border-radius: $radius-md;
    font-weight: 500;
    transition: all $transition-fast;

    &:hover {
      color: $primary;
      background: rgba($primary, 0.05);
    }

    &.router-link-active {
      color: $primary;
      background: rgba($primary, 0.1);
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__user {
    display: none;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: $radius-md;
    transition: background $transition-fast;

    @include md {
      display: flex;
    }

    &:hover {
      background: $surface-alt;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    @include gradient-accent;
    border-radius: $radius-full;
    @include flex-center;
    color: white;
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__username {
    font-weight: 500;
    color: $text-primary;
    max-width: 120px;
    @include truncate;
  }

  &__mobile-toggle {
    display: flex;
    padding: $spacing-sm;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: $font-size-xl;
    color: $text-primary;

    @include md {
      display: none;
    }
  }
}
</style>

