<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHuiStore, useAuthStore } from '@/stores'
import StatCard from '@/components/common/StatCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Button from 'primevue/button'

const router = useRouter()
const huiStore = useHuiStore()
const authStore = useAuthStore()

onMounted(async () => {
  await huiStore.fetchHuiGroups()
})

const recentGroups = computed(() => {
  return huiStore.huiGroups.slice(0, 5)
})

const totalAmount = computed(() => {
  return huiStore.huiGroups.reduce((sum, g) => {
    return sum + g.amountPerPeriod * g.totalMembers
  }, 0)
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'active': return 'badge--success'
    case 'completed': return 'badge--info'
    case 'cancelled': return 'badge--error'
    default: return 'badge--pending'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Đang hoạt động'
    case 'completed': return 'Hoàn thành'
    case 'cancelled': return 'Đã hủy'
    default: return status
  }
}
</script>

<template>
  <div class="dashboard">
    <div class="container">
      <div class="page-header">
        <h1 class="page-header__title">
          Xin chào, {{ authStore.userProfile?.displayName || 'Chủ hụi' }}!
        </h1>
        <p class="page-header__subtitle">
          Tổng quan về các dây hụi của bạn
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid--4 dashboard__stats">
        <StatCard
          icon="pi pi-users"
          :value="huiStore.stats.totalGroups"
          label="Tổng dây hụi"
          variant="primary"
        />
        <StatCard
          icon="pi pi-check-circle"
          :value="huiStore.stats.activeGroups"
          label="Đang hoạt động"
          variant="success"
        />
        <StatCard
          icon="pi pi-wallet"
          :value="formatCurrency(totalAmount)"
          label="Tổng giá trị"
          variant="warning"
        />
        <StatCard
          icon="pi pi-clock"
          :value="huiStore.stats.pendingPayments"
          label="Chờ thanh toán"
          variant="info"
        />
      </div>

      <!-- Recent Groups -->
      <div class="dashboard__section">
        <div class="dashboard__section-header">
          <h2>Dây hụi gần đây</h2>
          <router-link to="/hui" class="dashboard__view-all">
            Xem tất cả
            <i class="pi pi-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="huiStore.loading" class="loading">
          <div class="loading__spinner"></div>
        </div>

        <template v-else>
          <div v-if="recentGroups.length > 0" class="dashboard__groups">
            <router-link
              v-for="group in recentGroups"
              :key="group.id"
              :to="`/hui/${group.id}`"
              class="dashboard__group-card card card--hover"
            >
              <div class="dashboard__group-header">
                <h3 class="dashboard__group-name">{{ group.name }}</h3>
                <span class="badge" :class="getStatusClass(group.status)">
                  {{ getStatusLabel(group.status) }}
                </span>
              </div>
              
              <div class="dashboard__group-info">
                <div class="dashboard__group-stat">
                  <i class="pi pi-users"></i>
                  <span>{{ group.totalMembers }} người</span>
                </div>
                <div class="dashboard__group-stat">
                  <i class="pi pi-money-bill"></i>
                  <span>{{ formatCurrency(group.amountPerPeriod) }}/kỳ</span>
                </div>
                <div class="dashboard__group-stat">
                  <i class="pi pi-calendar"></i>
                  <span>Kỳ {{ group.currentPeriod }}/{{ group.totalMembers }}</span>
                </div>
              </div>

              <div class="dashboard__group-dates">
                <span>{{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}</span>
              </div>
            </router-link>
          </div>

          <EmptyState
            v-else
            icon="pi pi-folder-open"
            title="Chưa có dây hụi nào"
            description="Bắt đầu tạo dây hụi đầu tiên để quản lý"
          >
            <template #action>
              <Button
                label="Tạo dây hụi"
                icon="pi pi-plus"
                @click="router.push('/hui/create')"
              />
            </template>
          </EmptyState>
        </template>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard__section">
        <h2>Thao tác nhanh</h2>
        <div class="dashboard__actions">
          <button class="dashboard__action-card" @click="router.push('/hui/create')">
            <div class="dashboard__action-icon dashboard__action-icon--primary">
              <i class="pi pi-plus-circle"></i>
            </div>
            <div class="dashboard__action-content">
              <h4>Tạo dây hụi mới</h4>
              <p>Khởi tạo một dây hụi mới với số người và số tiền tùy chọn</p>
            </div>
            <i class="pi pi-chevron-right"></i>
          </button>

          <button class="dashboard__action-card" @click="router.push('/hui')">
            <div class="dashboard__action-icon dashboard__action-icon--success">
              <i class="pi pi-list"></i>
            </div>
            <div class="dashboard__action-content">
              <h4>Quản lý dây hụi</h4>
              <p>Xem và quản lý tất cả các dây hụi đang hoạt động</p>
            </div>
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.dashboard {
  padding: $spacing-xl 0;

  &__stats {
    margin-bottom: $spacing-2xl;
  }

  &__section {
    margin-bottom: $spacing-2xl;

    h2 {
      font-size: $font-size-xl;
      margin-bottom: $spacing-lg;
    }
  }

  &__section-header {
    @include flex-between;
    margin-bottom: $spacing-lg;

    h2 {
      margin-bottom: 0;
    }
  }

  &__view-all {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $primary;
    font-weight: 500;
    font-size: $font-size-sm;

    &:hover {
      text-decoration: underline;
    }
  }

  &__groups {
    display: grid;
    gap: $spacing-md;

    @include md {
      grid-template-columns: repeat(2, 1fr);
    }

    @include lg {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__group-card {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  &__group-header {
    @include flex-between;
    margin-bottom: $spacing-md;
  }

  &__group-name {
    font-size: $font-size-lg;
    @include truncate;
    flex: 1;
    margin-right: $spacing-sm;
  }

  &__group-info {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__group-stat {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $text-secondary;
    font-size: $font-size-sm;

    i {
      color: $primary;
    }
  }

  &__group-dates {
    font-size: $font-size-xs;
    color: $text-muted;
    padding-top: $spacing-md;
    border-top: 1px solid $surface-alt;
  }

  &__actions {
    display: grid;
    gap: $spacing-md;

    @include md {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__action-card {
    @include card;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    cursor: pointer;
    border: 2px solid transparent;
    text-align: left;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      transform: translateY(-2px);
    }

    > i:last-child {
      color: $text-muted;
      margin-left: auto;
    }
  }

  &__action-icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    @include flex-center;
    font-size: 1.5rem;
    flex-shrink: 0;

    &--primary {
      background: rgba($primary, 0.1);
      color: $primary;
    }

    &--success {
      background: rgba($success, 0.1);
      color: $success;
    }
  }

  &__action-content {
    flex: 1;

    h4 {
      font-size: $font-size-base;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin: 0;
    }
  }
}
</style>

