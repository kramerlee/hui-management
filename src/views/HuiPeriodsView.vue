<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import EmptyState from '@/components/common/EmptyState.vue'
import type { HuiPeriod, PeriodBidForm } from '@/types'

const route = useRoute()
const router = useRouter()
const huiStore = useHuiStore()
const toast = useToast()

const groupId = computed(() => route.params.id as string)
const showBidDialog = ref(false)
const selectedPeriod = ref<HuiPeriod | null>(null)
const bidForm = ref<PeriodBidForm>({ winnerId: '', bidAmount: 0 })
const formErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

onMounted(async () => {
  await Promise.all([
    huiStore.fetchHuiGroup(groupId.value),
    huiStore.fetchMembers(groupId.value),
    huiStore.fetchPeriods(groupId.value)
  ])
})

const group = computed(() => huiStore.currentGroup)

const eligibleMembers = computed(() => {
  return huiStore.members.filter(m => !m.hasReceived).map(m => ({
    label: m.name,
    value: m.id
  }))
})

const maxBidAmount = computed(() => {
  if (!group.value) return 0
  // Max bid is typically around 30-50% of total amount
  return Math.round(group.value.amountPerPeriod * group.value.totalMembers * 0.5)
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
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'badge--success'
    case 'bidding': return 'badge--warning'
    case 'pending': return 'badge--pending'
    default: return 'badge--pending'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Hoàn thành'
    case 'bidding': return 'Đang khui'
    case 'pending': return 'Chờ khui'
    default: return status
  }
}

function openBidDialog(period: HuiPeriod) {
  if (period.status === 'completed') return
  
  selectedPeriod.value = period
  bidForm.value = { winnerId: '', bidAmount: 0 }
  formErrors.value = {}
  showBidDialog.value = true
}

function validateForm(): boolean {
  formErrors.value = {}
  
  if (!bidForm.value.winnerId) {
    formErrors.value.winnerId = 'Vui lòng chọn người hốt'
  }
  
  if (bidForm.value.bidAmount < 0) {
    formErrors.value.bidAmount = 'Tiền chân không hợp lệ'
  }
  
  if (bidForm.value.bidAmount > maxBidAmount.value) {
    formErrors.value.bidAmount = `Tiền chân tối đa ${formatCurrency(maxBidAmount.value)}`
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function handleCompletePeriod() {
  if (!selectedPeriod.value || !validateForm()) return
  
  isSubmitting.value = true
  const success = await huiStore.completePeriod(selectedPeriod.value.id, bidForm.value)
  isSubmitting.value = false
  
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Đã hoàn thành kỳ ${selectedPeriod.value.periodNumber}`,
      life: 3000
    })
    showBidDialog.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: huiStore.error || 'Không thể hoàn thành kỳ hụi',
      life: 5000
    })
  }
}

const winnerReceiveAmount = computed(() => {
  if (!selectedPeriod.value) return 0
  return selectedPeriod.value.totalAmount - bidForm.value.bidAmount
})
</script>

<template>
  <div class="hui-periods">
    <div class="container">
      <div class="hui-periods__header">
        <button class="hui-periods__back" @click="router.push(`/hui/${groupId}`)">
          <i class="pi pi-arrow-left"></i>
          {{ group?.name || 'Quay lại' }}
        </button>
        
        <div>
          <h1>Các kỳ hụi</h1>
          <p v-if="group">
            {{ group.currentPeriod }}/{{ group.totalMembers }} kỳ đã hoàn thành
          </p>
        </div>
      </div>

      <div v-if="huiStore.loading && huiStore.periods.length === 0" class="loading">
        <div class="loading__spinner"></div>
      </div>

      <template v-else>
        <div v-if="huiStore.periods.length > 0" class="card">
          <DataTable
            :value="huiStore.periods"
            :paginator="huiStore.periods.length > 10"
            :rows="10"
            responsiveLayout="scroll"
          >
            <Column field="periodNumber" header="Kỳ" style="width: 80px" sortable>
              <template #body="{ data }">
                <span class="hui-periods__number">{{ data.periodNumber }}</span>
              </template>
            </Column>
            <Column field="date" header="Ngày" sortable>
              <template #body="{ data }">
                {{ formatDate(data.date) }}
              </template>
            </Column>
            <Column field="totalAmount" header="Tổng tiền" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.totalAmount) }}
              </template>
            </Column>
            <Column field="bidAmount" header="Tiền chân">
              <template #body="{ data }">
                <template v-if="data.status === 'completed'">
                  <span :class="{ 'text-muted': data.bidAmount === 0 }">
                    {{ data.bidAmount > 0 ? formatCurrency(data.bidAmount) : 'Không có' }}
                  </span>
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column field="winnerName" header="Người hốt">
              <template #body="{ data }">
                <template v-if="data.winnerName">
                  <span class="hui-periods__winner">
                    <i class="pi pi-user"></i>
                    {{ data.winnerName }}
                  </span>
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column field="status" header="Trạng thái" sortable>
              <template #body="{ data }">
                <span class="badge" :class="getStatusClass(data.status)">
                  {{ getStatusLabel(data.status) }}
                </span>
              </template>
            </Column>
            <Column header="Thao tác" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="data.status !== 'completed'"
                  label="Khui"
                  icon="pi pi-play"
                  size="small"
                  :disabled="eligibleMembers.length === 0"
                  @click="openBidDialog(data)"
                />
                <span v-else class="hui-periods__completed">
                  <i class="pi pi-check-circle"></i>
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <EmptyState
          v-else
          icon="pi pi-calendar"
          title="Chưa có kỳ hụi"
          description="Các kỳ hụi sẽ được tạo tự động khi bắt đầu dây hụi"
        />
      </template>

      <!-- Bid Dialog -->
      <Dialog
        v-model:visible="showBidDialog"
        :header="`Khui kỳ ${selectedPeriod?.periodNumber}`"
        :modal="true"
        :style="{ width: '450px' }"
      >
        <div v-if="selectedPeriod" class="hui-periods__bid-form">
          <div class="hui-periods__bid-info">
            <div class="hui-periods__bid-row">
              <span>Ngày:</span>
              <strong>{{ formatDate(selectedPeriod.date) }}</strong>
            </div>
            <div class="hui-periods__bid-row">
              <span>Tổng tiền:</span>
              <strong>{{ formatCurrency(selectedPeriod.totalAmount) }}</strong>
            </div>
          </div>

          <div class="hui-periods__form-group">
            <label class="label">Người hốt <span class="required">*</span></label>
            <Dropdown
              v-model="bidForm.winnerId"
              :options="eligibleMembers"
              optionLabel="label"
              optionValue="value"
              placeholder="Chọn người hốt"
              :class="{ 'p-invalid': formErrors.winnerId }"
            />
            <small v-if="formErrors.winnerId" class="error-text">{{ formErrors.winnerId }}</small>
            <small v-if="eligibleMembers.length === 0" class="error-text">
              Không còn hụi viên chưa hốt
            </small>
          </div>

          <div class="hui-periods__form-group">
            <label class="label">Tiền chân (tiền đấu giá)</label>
            <InputNumber
              v-model="bidForm.bidAmount"
              mode="currency"
              currency="VND"
              locale="vi-VN"
              :min="0"
              :max="maxBidAmount"
              :step="50000"
              :class="{ 'p-invalid': formErrors.bidAmount }"
            />
            <small v-if="formErrors.bidAmount" class="error-text">{{ formErrors.bidAmount }}</small>
            <small class="hui-periods__hint">
              Tiền chân là số tiền người hốt phải trả để được ưu tiên
            </small>
          </div>

          <div class="hui-periods__summary">
            <div class="hui-periods__summary-row">
              <span>Số tiền người hốt nhận:</span>
              <strong class="hui-periods__receive-amount">
                {{ formatCurrency(winnerReceiveAmount) }}
              </strong>
            </div>
          </div>
        </div>

        <template #footer>
          <Button
            label="Hủy"
            severity="secondary"
            text
            @click="showBidDialog = false"
          />
          <Button
            label="Xác nhận khui"
            icon="pi pi-check"
            :loading="isSubmitting"
            :disabled="eligibleMembers.length === 0"
            @click="handleCompletePeriod"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-periods {
  padding: $spacing-xl 0;

  &__header {
    margin-bottom: $spacing-2xl;

    h1 {
      font-size: $font-size-3xl;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
    }
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

  &__number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    @include gradient-primary;
    color: white;
    border-radius: $radius-full;
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__winner {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    i {
      color: $success;
    }
  }

  &__completed {
    color: $success;
    font-size: 1.25rem;
  }

  .text-muted {
    color: $text-muted;
  }

  &__bid-form {
    @include flex-column;
    gap: $spacing-lg;
  }

  &__bid-info {
    background: $surface-alt;
    border-radius: $radius-md;
    padding: $spacing-md;
  }

  &__bid-row {
    @include flex-between;
    padding: $spacing-xs 0;

    span {
      color: $text-secondary;
    }
  }

  &__form-group {
    .label {
      display: block;
      margin-bottom: $spacing-xs;
      font-weight: 500;
      color: $text-secondary;
    }

    .required {
      color: $error;
    }

    :deep(.p-dropdown),
    :deep(.p-inputnumber) {
      width: 100%;
    }
  }

  &__hint {
    display: block;
    margin-top: $spacing-xs;
    color: $text-muted;
    font-size: $font-size-xs;
  }

  &__summary {
    background: rgba($success, 0.1);
    border-radius: $radius-md;
    padding: $spacing-md;
  }

  &__summary-row {
    @include flex-between;

    span {
      color: $text-secondary;
    }
  }

  &__receive-amount {
    color: $success;
    font-size: $font-size-xl;
  }
}
</style>

