<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <div class="not-found__code">404</div>
      <h1 class="not-found__title">Trang không tồn tại</h1>
      <p class="not-found__text">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <div class="not-found__actions">
        <Button
          label="Về trang chủ"
          icon="pi pi-home"
          @click="router.push('/dashboard')"
        />
        <Button
          label="Quay lại"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.back()"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.not-found {
  min-height: 80vh;
  @include flex-center;
  padding: $spacing-xl;

  &__content {
    text-align: center;
    max-width: 400px;
  }

  &__code {
    font-size: 8rem;
    font-weight: 700;
    @include gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: $spacing-lg;
  }

  &__title {
    font-size: $font-size-2xl;
    margin-bottom: $spacing-sm;
  }

  &__text {
    color: $text-secondary;
    margin-bottom: $spacing-2xl;
  }

  &__actions {
    display: flex;
    gap: $spacing-md;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>

