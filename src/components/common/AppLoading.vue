<script setup lang="ts">
</script>

<template>
  <div class="app-loading">
    <div class="app-loading__content">
      <div class="app-loading__logo">H</div>
      <div class="app-loading__spinner"></div>
      <p class="app-loading__text">Đang tải...</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.app-loading {
  position: fixed;
  inset: 0;
  @include flex-center;
  background: $background;
  z-index: 9999;

  &__content {
    text-align: center;
  }

  &__logo {
    width: 64px;
    height: 64px;
    @include gradient-primary;
    border-radius: $radius-lg;
    @include flex-center;
    color: white;
    font-weight: 700;
    font-size: $font-size-3xl;
    margin: 0 auto $spacing-lg;
    animation: pulse 2s ease-in-out infinite;
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $surface-alt;
    border-top-color: $primary;
    border-radius: 50%;
    margin: 0 auto $spacing-md;
    animation: spin 0.8s linear infinite;
  }

  &__text {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}
</style>

