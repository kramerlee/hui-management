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
const isDrawing = ref(false)
const drawingName = ref('')

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

function getStatusLabel(status: string, isRandom: boolean, isPast: boolean): string {
  if (status === 'completed') return 'Đã hốt'
  if (isRandom) {
    if (isPast) return 'Đã hốt'
    return 'Lên lịch'
  }
  switch (status) {
    case 'bidding': return 'Đang khui'
    case 'pending': return 'Chờ khui'
    default: return status
  }
}

function isPastDate(dateStr: string): boolean {
  const periodDate = new Date(dateStr)
  periodDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return periodDate < today
}

function isTodayDate(dateStr: string): boolean {
  const periodDate = new Date(dateStr)
  periodDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return periodDate.getTime() === today.getTime()
}

const isRandomType = computed(() => group.value?.huiType === 'random')

function openBidDialog(period: HuiPeriod) {
  if (period.status === 'completed') return
  
  selectedPeriod.value = period
  bidForm.value = { winnerId: '', bidAmount: 0 }
  formErrors.value = {}
  isDrawing.value = false
  drawingName.value = ''
  showBidDialog.value = true
}

async function handleRandomDraw() {
  if (eligibleMembers.value.length === 0) return
  
  isDrawing.value = true
  drawingName.value = ''
  
  const members = eligibleMembers.value
  const duration = 2000
  const intervalTime = 80
  const iterations = duration / intervalTime
  
  let count = 0
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * members.length)
    drawingName.value = members[randomIndex].label
    count++
    
    if (count >= iterations) {
      clearInterval(interval)
      
      // Final random selection
      const winnerIndex = Math.floor(Math.random() * members.length)
      const winner = members[winnerIndex]
      bidForm.value.winnerId = winner.value
      drawingName.value = winner.label
      isDrawing.value = false
    }
  }, intervalTime)
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
                <div class="hui-periods__date" :class="{
                  'hui-periods__date--past': isPastDate(data.date),
                  'hui-periods__date--today': isTodayDate(data.date)
                }">
                  <span v-if="isTodayDate(data.date)" class="hui-periods__date-badge">Hôm nay</span>
                  {{ formatDate(data.date) }}
                </div>
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
                  <span class="hui-periods__winner" :class="{
                    'hui-periods__winner--scheduled': isRandomType && data.status !== 'completed'
                  }">
                    <i :class="isRandomType && data.status !== 'completed' ? 'pi pi-calendar' : 'pi pi-user'"></i>
                    {{ data.winnerName }}
                    <span v-if="isRandomType && data.status !== 'completed'" class="hui-periods__scheduled-tag">
                      (Đã lên lịch)
                    </span>
                  </span>
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column v-if="isRandomType" field="date" header="Ngày hốt" sortable>
              <template #body="{ data }">
                <div class="hui-periods__collection-date" :class="{
                  'hui-periods__collection-date--past': data.status === 'completed',
                  'hui-periods__collection-date--today': isTodayDate(data.date),
                  'hui-periods__collection-date--upcoming': data.status !== 'completed' && !isPastDate(data.date)
                }">
                  <i :class="{
                    'pi pi-check-circle': data.status === 'completed',
                    'pi pi-calendar-clock': data.status !== 'completed' && isTodayDate(data.date),
                    'pi pi-calendar': data.status !== 'completed' && !isTodayDate(data.date)
                  }"></i>
                  <span>{{ formatDate(data.date) }}</span>
                  <span v-if="isTodayDate(data.date)" class="hui-periods__today-badge">Hôm nay</span>
                </div>
              </template>
            </Column>
            <Column field="status" header="Trạng thái" sortable>
              <template #body="{ data }">
                <span class="badge" :class="getStatusClass(data.status)">
                  {{ getStatusLabel(data.status, isRandomType, isPastDate(data.date)) }}
                </span>
              </template>
            </Column>
            <Column header="Thao tác" style="width: 150px">
              <template #body="{ data }">
                <!-- For random type: show scheduled info, no action needed -->
                <template v-if="isRandomType">
                  <span v-if="data.status === 'completed'" class="hui-periods__completed">
                    <i class="pi pi-check-circle"></i>
                    Đã hốt
                  </span>
                  <span v-else class="hui-periods__scheduled-status">
                    <i class="pi pi-clock"></i>
                    Chờ đến ngày
                  </span>
                </template>
                <!-- For bidding type: show khui button -->
                <template v-else>
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
        :style="{ width: '500px' }"
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
            <div class="hui-periods__bid-row">
              <span>Loại hụi:</span>
              <strong>
                <i :class="isRandomType ? 'pi pi-sync' : 'pi pi-dollar'" style="margin-right: 4px"></i>
                {{ isRandomType ? 'Xoay vòng ngẫu nhiên' : 'Đấu giá' }}
              </strong>
            </div>
          </div>

          <!-- Random Draw Section -->
          <div v-if="isRandomType" class="hui-periods__random-draw">
            <div class="hui-periods__draw-display" :class="{ 'hui-periods__draw-display--drawing': isDrawing }">
              <div class="hui-periods__draw-icon">
                <i class="pi pi-sync" :class="{ 'pi-spin': isDrawing }"></i>
              </div>
              <div class="hui-periods__draw-name">
                {{ drawingName || 'Nhấn quay để chọn người hốt' }}
              </div>
            </div>
            
            <Button
              v-if="!bidForm.winnerId || isDrawing"
              :label="isDrawing ? 'Đang quay...' : 'Quay số ngẫu nhiên'"
              icon="pi pi-sync"
              :loading="isDrawing"
              :disabled="eligibleMembers.length === 0 || isDrawing"
              class="hui-periods__draw-button"
              @click="handleRandomDraw"
            />
            
            <div v-else class="hui-periods__winner-display">
              <div class="hui-periods__winner-badge">
                <i class="pi pi-trophy"></i>
                <span>Người hốt kỳ này</span>
              </div>
              <div class="hui-periods__winner-name">{{ drawingName }}</div>
              <Button
                label="Quay lại"
                icon="pi pi-refresh"
                severity="secondary"
                text
                size="small"
                @click="bidForm.winnerId = ''; drawingName = ''"
              />
            </div>
            
            <small v-if="eligibleMembers.length === 0" class="error-text">
              Không còn hụi viên chưa hốt
            </small>
          </div>

          <!-- Bidding Section (Original) -->
          <template v-else>
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
          </template>

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
            :disabled="eligibleMembers.length === 0 || !bidForm.winnerId"
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

  &__date {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    &--past {
      color: $text-muted;
    }

    &--today {
      font-weight: 600;
      color: $primary;
    }
  }

  &__date-badge {
    display: inline-block;
    background: $primary;
    color: white;
    font-size: $font-size-xs;
    padding: 2px 8px;
    border-radius: $radius-full;
    font-weight: 500;
  }

  &__winner {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;

    i {
      color: $success;
    }

    &--scheduled {
      i {
        color: $info;
      }
    }
  }

  &__scheduled-tag {
    font-size: $font-size-xs;
    color: $info;
    font-weight: 400;
  }

  &__completed {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $success;
    font-size: $font-size-sm;
    
    i {
      font-size: 1.25rem;
    }
  }

  &__scheduled-status {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $info;
    font-size: $font-size-sm;

    i {
      font-size: 1rem;
    }
  }

  &__collection-date {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;

    i {
      font-size: 1rem;
    }

    &--past {
      color: $success;
    }

    &--today {
      color: $primary;
      font-weight: 600;
    }

    &--upcoming {
      color: $text-secondary;
    }
  }

  &__today-badge {
    background: $primary;
    color: white;
    font-size: $font-size-xs;
    padding: 2px 6px;
    border-radius: $radius-full;
    margin-left: $spacing-xs;
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

  &__random-draw {
    @include flex-column;
    align-items: center;
    gap: $spacing-lg;
    padding: $spacing-lg 0;
  }

  &__draw-display {
    @include flex-column;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-xl;
    background: $surface-alt;
    border-radius: $radius-lg;
    width: 100%;
    text-align: center;
    transition: all 0.3s ease;

    &--drawing {
      background: linear-gradient(135deg, rgba($primary, 0.1), rgba($secondary, 0.1));
      animation: pulse 0.5s ease-in-out infinite;
    }
  }

  &__draw-icon {
    width: 64px;
    height: 64px;
    @include gradient-primary;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.75rem;
      color: white;
    }
  }

  &__draw-name {
    font-size: $font-size-xl;
    font-weight: 600;
    color: $text-primary;
    min-height: 2rem;
  }

  &__draw-button {
    width: 100%;
  }

  &__winner-display {
    @include flex-column;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
  }

  &__winner-badge {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $warning;
    font-size: $font-size-sm;

    i {
      font-size: 1.25rem;
    }
  }

  &__winner-name {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $success;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
}
</style>

