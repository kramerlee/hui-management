<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import StatCard from '@/components/common/StatCard.vue'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const huiStore = useHuiStore()

const groupId = computed(() => route.params.id as string)

onMounted(async () => {
  await Promise.all([
    huiStore.fetchHuiGroup(groupId.value),
    huiStore.fetchMembers(groupId.value),
    huiStore.fetchPeriods(groupId.value),
    huiStore.fetchPayments(groupId.value)
  ])
})

onUnmounted(() => {
  huiStore.clearCurrentGroup()
})

const group = computed(() => huiStore.currentGroup)
const progress = computed(() => {
  if (!group.value) return 0
  return Math.round((group.value.currentPeriod / group.value.totalMembers) * 100)
})

const nextPeriod = computed(() => {
  return huiStore.periods.find(p => p.status === 'pending')
})

const pendingPaymentsCount = computed(() => {
  return huiStore.payments.filter(p => p.status === 'pending').length
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPeriodTypeLabel(type: string): string {
  switch (type) {
    case 'daily': return 'ngày'
    case 'weekly': return 'tuần'
    case 'monthly': return 'tháng'
    default: return type
  }
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
  <div class="hui-detail">
    <div class="container">
      <div v-if="huiStore.loading && !group" class="loading">
        <div class="loading__spinner"></div>
      </div>

      <template v-else-if="group">
        <div class="hui-detail__header">
          <button class="hui-detail__back" @click="router.push('/hui')">
            <i class="pi pi-arrow-left"></i>
            Danh sách dây hụi
          </button>
          
          <div class="hui-detail__title-row">
            <div>
              <h1>{{ group.name }}</h1>
              <span class="badge" :class="getStatusClass(group.status)">
                {{ getStatusLabel(group.status) }}
              </span>
            </div>
          </div>

          <p class="hui-detail__meta">
            <i class="pi pi-calendar"></i>
            {{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}
            <span class="hui-detail__sep">•</span>
            <i class="pi pi-sync"></i>
            Theo {{ getPeriodTypeLabel(group.periodType) }}
          </p>
        </div>

        <!-- Progress -->
        <div class="hui-detail__progress card">
          <div class="hui-detail__progress-header">
            <span>Tiến độ</span>
            <span class="hui-detail__progress-text">
              {{ group.currentPeriod }}/{{ group.totalMembers }} kỳ ({{ progress }}%)
            </span>
          </div>
          <div class="hui-detail__progress-bar">
            <div 
              class="hui-detail__progress-fill" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid--4">
          <StatCard
            icon="pi pi-users"
            :value="huiStore.members.length"
            :label="`/ ${group.totalMembers} hụi viên`"
            variant="primary"
          />
          <StatCard
            icon="pi pi-money-bill"
            :value="formatCurrency(group.amountPerPeriod)"
            label="Mỗi kỳ"
            variant="success"
          />
          <StatCard
            icon="pi pi-wallet"
            :value="formatCurrency(group.amountPerPeriod * group.totalMembers)"
            label="Tổng mỗi kỳ"
            variant="warning"
          />
          <StatCard
            icon="pi pi-clock"
            :value="pendingPaymentsCount"
            label="Chờ thanh toán"
            variant="info"
          />
        </div>

        <!-- Quick Actions -->
        <div class="hui-detail__section">
          <h2>Quản lý</h2>
          <div class="hui-detail__actions-grid">
            <router-link :to="`/hui/${groupId}/members`" class="hui-detail__action-card card">
              <div class="hui-detail__action-icon hui-detail__action-icon--blue">
                <i class="pi pi-users"></i>
              </div>
              <div class="hui-detail__action-content">
                <h4>Hụi viên</h4>
                <p>{{ huiStore.members.length }}/{{ group.totalMembers }} người</p>
              </div>
              <i class="pi pi-chevron-right"></i>
            </router-link>

            <router-link :to="`/hui/${groupId}/periods`" class="hui-detail__action-card card">
              <div class="hui-detail__action-icon hui-detail__action-icon--green">
                <i class="pi pi-calendar"></i>
              </div>
              <div class="hui-detail__action-content">
                <h4>Kỳ hụi</h4>
                <p>
                  <template v-if="nextPeriod">
                    Kỳ {{ nextPeriod.periodNumber }} - {{ formatDate(nextPeriod.date).split(',')[0] }}
                  </template>
                  <template v-else>
                    Đã hoàn thành tất cả
                  </template>
                </p>
              </div>
              <i class="pi pi-chevron-right"></i>
            </router-link>

            <router-link :to="`/hui/${groupId}/payments`" class="hui-detail__action-card card">
              <div class="hui-detail__action-icon hui-detail__action-icon--orange">
                <i class="pi pi-wallet"></i>
              </div>
              <div class="hui-detail__action-content">
                <h4>Thanh toán</h4>
                <p>{{ pendingPaymentsCount }} đang chờ</p>
              </div>
              <i class="pi pi-chevron-right"></i>
            </router-link>
          </div>
        </div>

        <!-- Next Period Info -->
        <div v-if="nextPeriod && group.status === 'active'" class="hui-detail__section">
          <h2>Kỳ hụi tiếp theo</h2>
          <div class="hui-detail__next-period card">
            <div class="hui-detail__next-period-info">
              <div class="hui-detail__next-period-number">
                Kỳ {{ nextPeriod.periodNumber }}
              </div>
              <div class="hui-detail__next-period-date">
                <i class="pi pi-calendar"></i>
                {{ formatDate(nextPeriod.date) }}
              </div>
              <div class="hui-detail__next-period-amount">
                Tổng: <strong>{{ formatCurrency(nextPeriod.totalAmount) }}</strong>
              </div>
            </div>
            <Button
              label="Khui hụi"
              icon="pi pi-play"
              @click="router.push(`/hui/${groupId}/periods`)"
            />
          </div>
        </div>
      </template>

      <div v-else class="hui-detail__not-found card">
        <i class="pi pi-exclamation-circle"></i>
        <h3>Không tìm thấy dây hụi</h3>
        <p>Dây hụi này không tồn tại hoặc đã bị xóa</p>
        <Button
          label="Quay lại"
          icon="pi pi-arrow-left"
          @click="router.push('/hui')"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-detail {
  padding: $spacing-xl 0;

  &__header {
    margin-bottom: $spacing-2xl;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    background: transparent;
    border: none;
    color: $text-secondary;
    cursor: pointer;
    padding: 0;
    margin-bottom: $spacing-lg;
    font-size: $font-size-sm;

    &:hover {
      color: $primary;
    }
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: $spacing-sm;

    h1 {
      font-size: $font-size-3xl;
      margin-bottom: $spacing-sm;
    }

    .badge {
      margin-left: $spacing-sm;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-sm;
    color: $text-secondary;
    font-size: $font-size-sm;

    i {
      color: $primary;
    }
  }

  &__sep {
    color: $text-muted;
  }

  &__progress {
    margin-bottom: $spacing-xl;
  }

  &__progress-header {
    @include flex-between;
    margin-bottom: $spacing-sm;
    font-size: $font-size-sm;
  }

  &__progress-text {
    color: $primary;
    font-weight: 600;
  }

  &__progress-bar {
    height: 8px;
    background: $surface-alt;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    @include gradient-primary;
    border-radius: $radius-full;
    transition: width $transition-slow;
  }

  &__section {
    margin-top: $spacing-2xl;

    h2 {
      font-size: $font-size-xl;
      margin-bottom: $spacing-lg;
    }
  }

  &__actions-grid {
    display: grid;
    gap: $spacing-md;

    @include md {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__action-card {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    text-decoration: none;
    color: inherit;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
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
    font-size: 1.25rem;
    flex-shrink: 0;

    &--blue {
      background: rgba($info, 0.1);
      color: $info;
    }

    &--green {
      background: rgba($success, 0.1);
      color: $success;
    }

    &--orange {
      background: rgba($warning, 0.15);
      color: darken($warning, 10%);
    }
  }

  &__action-content {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: $font-size-base;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin: 0;
      @include truncate;
    }
  }

  &__next-period {
    @include flex-between;
    flex-wrap: wrap;
    gap: $spacing-lg;
  }

  &__next-period-info {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__next-period-number {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $primary;
  }

  &__next-period-date {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: $text-secondary;

    i {
      color: $primary;
    }
  }

  &__next-period-amount {
    color: $text-secondary;
    font-size: $font-size-sm;

    strong {
      color: $text-primary;
      font-size: $font-size-lg;
    }
  }

  &__not-found {
    text-align: center;
    padding: $spacing-3xl;

    i {
      font-size: 4rem;
      color: $text-muted;
      margin-bottom: $spacing-lg;
    }

    h3 {
      margin-bottom: $spacing-sm;
    }

    p {
      color: $text-secondary;
      margin-bottom: $spacing-xl;
    }
  }
}
</style>

