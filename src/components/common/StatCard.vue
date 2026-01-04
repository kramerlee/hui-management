<script setup lang="ts">
defineProps<{
  icon: string
  value: string | number
  label: string
  variant?: 'primary' | 'success' | 'warning' | 'info'
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-card__icon" :class="`stat-card__icon--${variant || 'primary'}`">
      <i :class="icon"></i>
    </div>
    <div class="stat-card__value">{{ value }}</div>
    <div class="stat-card__label">{{ label }}</div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.stat-card {
  @include card;
  text-align: center;
  @include hover-lift;

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: $radius-md;
    @include flex-center;
    margin: 0 auto $spacing-md;
    font-size: 1.5rem;

    &--primary {
      background: rgba($primary, 0.1);
      color: $primary;
    }

    &--success {
      background: rgba($success, 0.1);
      color: $success;
    }

    &--warning {
      background: rgba($warning, 0.15);
      color: darken($warning, 10%);
    }

    &--info {
      background: rgba($info, 0.1);
      color: $info;
    }
  }

  &__value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $spacing-xs;
  }

  &__label {
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}
</style>

