<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <i v-if="icon" :class="icon" class="empty-state__icon"></i>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__text">{{ description }}</p>
    <div class="empty-state__action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.empty-state {
  text-align: center;
  padding: $spacing-3xl;

  &__icon {
    font-size: 4rem;
    color: $text-muted;
    margin-bottom: $spacing-lg;
    display: block;
  }

  &__title {
    font-size: $font-size-xl;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }

  &__text {
    color: $text-secondary;
    margin-bottom: $spacing-xl;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  &__action {
    margin-top: $spacing-lg;
  }
}
</style>

