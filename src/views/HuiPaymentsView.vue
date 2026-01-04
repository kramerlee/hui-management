<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Payment } from '@/types'

const route = useRoute()
const router = useRouter()
const huiStore = useHuiStore()
const toast = useToast()

const groupId = computed(() => route.params.id as string)
const statusFilter = ref<string>('')

const statusOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ thanh toán', value: 'pending' },
  { label: 'Đã thanh toán', value: 'paid' }
]

onMounted(async () => {
  await Promise.all([
    huiStore.fetchHuiGroup(groupId.value),
    huiStore.fetchPayments(groupId.value)
  ])
})

const group = computed(() => huiStore.currentGroup)

const filteredPayments = computed(() => {
  if (!statusFilter.value) return huiStore.payments
  return huiStore.payments.filter(p => p.status === statusFilter.value)
})

const pendingCount = computed(() => {
  return huiStore.payments.filter(p => p.status === 'pending').length
})

const totalPending = computed(() => {
  return huiStore.payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
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
  return status === 'paid' ? 'badge--success' : 'badge--warning'
}

function getStatusLabel(status: string): string {
  return status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'
}

async function markAsPaid(payment: Payment) {
  await huiStore.markPaymentPaid(payment.id)
  toast.add({
    severity: 'success',
    summary: 'Thành công',
    detail: `Đã xác nhận thanh toán của ${payment.memberName}`,
    life: 3000
  })
}

function getPeriodNumber(periodId: string): number {
  const period = huiStore.periods.find(p => p.id === periodId)
  return period?.periodNumber || 0
}
</script>

<template>
  <div class="hui-payments">
    <div class="container">
      <div class="hui-payments__header">
        <button class="hui-payments__back" @click="router.push(`/hui/${groupId}`)">
          <i class="pi pi-arrow-left"></i>
          {{ group?.name || 'Quay lại' }}
        </button>
        
        <div class="hui-payments__title-row">
          <div>
            <h1>Thanh toán</h1>
            <p>
              {{ pendingCount }} khoản chờ thanh toán
              <span v-if="pendingCount > 0">
                ({{ formatCurrency(totalPending) }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="hui-payments__stats">
        <div class="hui-payments__stat card">
          <div class="hui-payments__stat-icon hui-payments__stat-icon--pending">
            <i class="pi pi-clock"></i>
          </div>
          <div>
            <div class="hui-payments__stat-value">{{ pendingCount }}</div>
            <div class="hui-payments__stat-label">Chờ thanh toán</div>
          </div>
        </div>
        <div class="hui-payments__stat card">
          <div class="hui-payments__stat-icon hui-payments__stat-icon--amount">
            <i class="pi pi-wallet"></i>
          </div>
          <div>
            <div class="hui-payments__stat-value">{{ formatCurrency(totalPending) }}</div>
            <div class="hui-payments__stat-label">Tổng tiền chờ</div>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="hui-payments__filter card">
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Lọc theo trạng thái"
        />
      </div>

      <div v-if="huiStore.loading && huiStore.payments.length === 0" class="loading">
        <div class="loading__spinner"></div>
      </div>

      <template v-else>
        <div v-if="filteredPayments.length > 0" class="card">
          <DataTable
            :value="filteredPayments"
            :paginator="filteredPayments.length > 10"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            responsiveLayout="scroll"
          >
            <Column header="Kỳ" style="width: 80px">
              <template #body="{ data }">
                <span class="hui-payments__period">{{ getPeriodNumber(data.periodId) }}</span>
              </template>
            </Column>
            <Column field="memberName" header="Hụi viên" sortable />
            <Column field="amount" header="Số tiền" sortable>
              <template #body="{ data }">
                <span class="hui-payments__amount">
                  {{ formatCurrency(data.amount) }}
                </span>
              </template>
            </Column>
            <Column field="dueDate" header="Hạn thanh toán" sortable>
              <template #body="{ data }">
                {{ formatDate(data.dueDate) }}
              </template>
            </Column>
            <Column field="status" header="Trạng thái" sortable>
              <template #body="{ data }">
                <span class="badge" :class="getStatusClass(data.status)">
                  {{ getStatusLabel(data.status) }}
                </span>
              </template>
            </Column>
            <Column field="paidAt" header="Ngày thanh toán">
              <template #body="{ data }">
                <template v-if="data.paidAt">
                  {{ formatDate(data.paidAt) }}
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column header="Thao tác" style="width: 150px">
              <template #body="{ data }">
                <Button
                  v-if="data.status === 'pending'"
                  label="Xác nhận"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  @click="markAsPaid(data)"
                />
                <span v-else class="hui-payments__paid-icon">
                  <i class="pi pi-check-circle"></i>
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <EmptyState
          v-else
          icon="pi pi-wallet"
          :title="statusFilter ? 'Không có khoản thanh toán' : 'Chưa có thanh toán'"
          :description="statusFilter 
            ? 'Thử thay đổi bộ lọc' 
            : 'Thanh toán sẽ được tạo khi các kỳ hụi được khui'"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-payments {
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
    h1 {
      font-size: $font-size-3xl;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    @include md {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__stat-icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    @include flex-center;
    font-size: 1.25rem;

    &--pending {
      background: rgba($warning, 0.15);
      color: darken($warning, 10%);
    }

    &--amount {
      background: rgba($primary, 0.1);
      color: $primary;
    }
  }

  &__stat-value {
    font-size: $font-size-xl;
    font-weight: 700;
  }

  &__stat-label {
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  &__filter {
    margin-bottom: $spacing-lg;
    
    :deep(.p-dropdown) {
      min-width: 200px;
    }
  }

  &__period {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: $surface-alt;
    border-radius: $radius-full;
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__amount {
    font-weight: 600;
    color: $primary;
  }

  &__paid-icon {
    color: $success;
    font-size: 1.25rem;
  }

  .text-muted {
    color: $text-muted;
  }
}
</style>

