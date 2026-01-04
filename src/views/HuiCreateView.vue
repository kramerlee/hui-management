<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import Chip from 'primevue/chip'
import type { HuiGroupForm } from '@/types'

const router = useRouter()
const huiStore = useHuiStore()
const toast = useToast()

const form = reactive<HuiGroupForm>({
  name: '',
  totalMembers: 10,
  amountPerPeriod: 1000000,
  periodType: 'monthly',
  huiType: 'bidding',
  startDate: new Date().toISOString().split('T')[0]
})

const startDateObj = ref(new Date())
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const memberNamesInput = ref('')

// Parse member names from comma-separated input
const parsedMemberNames = computed(() => {
  if (!memberNamesInput.value.trim()) return []
  return memberNamesInput.value
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
})

// Check if using random type
const isRandomType = computed(() => form.huiType === 'random')

const periodOptions = [
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' }
]

const huiTypeOptions = [
  { label: 'Đấu giá', value: 'bidding', description: 'Người trả tiền chân cao nhất được hốt' },
  { label: 'Xoay vòng ngẫu nhiên', value: 'random', description: 'Hệ thống chọn ngẫu nhiên người hốt' }
]

// Note: endDate and totalValue have been replaced by actualEndDate and actualTotalValue

// Actual member count based on hui type
const actualMemberCount = computed(() => {
  return isRandomType.value ? parsedMemberNames.value.length : form.totalMembers
})

// Actual total value based on hui type
const actualTotalValue = computed(() => {
  return form.amountPerPeriod * actualMemberCount.value
})

// Actual end date based on hui type
const actualEndDate = computed(() => {
  const memberCount = actualMemberCount.value
  if (memberCount < 1) return 'Chưa xác định'
  
  const start = new Date(startDateObj.value)
  const end = new Date(start)
  
  switch (form.periodType) {
    case 'daily':
      end.setDate(end.getDate() + memberCount - 1)
      break
    case 'weekly':
      end.setDate(end.getDate() + (memberCount - 1) * 7)
      break
    case 'monthly':
      end.setMonth(end.getMonth() + memberCount - 1)
      break
  }
  
  return end.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value)
}

function validate(): boolean {
  errors.value = {}
  
  if (!form.name.trim()) {
    errors.value.name = 'Vui lòng nhập tên dây hụi'
  }
  
  // For random type, validate member names instead of totalMembers
  if (isRandomType.value) {
    if (parsedMemberNames.value.length < 2) {
      errors.value.memberNames = 'Vui lòng nhập ít nhất 2 thành viên'
    }
    if (parsedMemberNames.value.length > 100) {
      errors.value.memberNames = 'Số người tối đa là 100'
    }
  } else {
    if (form.totalMembers < 2) {
      errors.value.totalMembers = 'Số người tối thiểu là 2'
    }
    if (form.totalMembers > 100) {
      errors.value.totalMembers = 'Số người tối đa là 100'
    }
  }
  
  if (form.amountPerPeriod < 10000) {
    errors.value.amountPerPeriod = 'Số tiền tối thiểu là 10,000đ'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  
  const formData: HuiGroupForm = {
    ...form,
    startDate: startDateObj.value.toISOString().split('T')[0],
    // For random type, use parsed member names and set totalMembers
    ...(isRandomType.value && {
      memberNames: parsedMemberNames.value,
      totalMembers: parsedMemberNames.value.length
    })
  }
  
  const groupId = await huiStore.createHuiGroup(formData)
  
  loading.value = false
  
  if (groupId) {
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã tạo dây hụi mới',
      life: 3000
    })
    router.push(`/hui/${groupId}`)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: huiStore.error || 'Không thể tạo dây hụi',
      life: 5000
    })
  }
}
</script>

<template>
  <div class="hui-create">
    <div class="container">
      <div class="hui-create__header">
        <button class="hui-create__back" @click="router.back()">
          <i class="pi pi-arrow-left"></i>
          Quay lại
        </button>
        <h1>Tạo Dây Hụi Mới</h1>
        <p>Điền thông tin để khởi tạo dây hụi</p>
      </div>

      <div class="hui-create__content">
        <form class="hui-create__form card" @submit.prevent="handleSubmit">
          <div class="hui-create__form-group">
            <label class="label">Tên dây hụi <span class="required">*</span></label>
            <InputText
              v-model="form.name"
              placeholder="VD: Hụi Tết 2026"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="error-text">{{ errors.name }}</small>
          </div>

          <!-- Show different input based on hui type -->
          <div v-if="!isRandomType" class="hui-create__row">
            <div class="hui-create__form-group">
              <label class="label">Số người tham gia <span class="required">*</span></label>
              <InputNumber
                v-model="form.totalMembers"
                :min="2"
                :max="100"
                showButtons
                :class="{ 'p-invalid': errors.totalMembers }"
              />
              <small v-if="errors.totalMembers" class="error-text">{{ errors.totalMembers }}</small>
            </div>

            <div class="hui-create__form-group">
              <label class="label">Số tiền mỗi kỳ <span class="required">*</span></label>
              <InputNumber
                v-model="form.amountPerPeriod"
                mode="currency"
                currency="VND"
                locale="vi-VN"
                :min="10000"
                :step="100000"
                :class="{ 'p-invalid': errors.amountPerPeriod }"
              />
              <small v-if="errors.amountPerPeriod" class="error-text">{{ errors.amountPerPeriod }}</small>
            </div>
          </div>

          <!-- Random type: Member names input -->
          <template v-else>
            <div class="hui-create__form-group">
              <label class="label">Danh sách thành viên <span class="required">*</span></label>
              <Textarea
                v-model="memberNamesInput"
                placeholder="Nhập tên thành viên, ngăn cách bởi dấu phẩy. VD: Nguyễn Văn A, Trần Thị B, Lê Văn C"
                :autoResize="true"
                rows="3"
                :class="{ 'p-invalid': errors.memberNames }"
              />
              <small v-if="errors.memberNames" class="error-text">{{ errors.memberNames }}</small>
              <small v-else class="hui-create__hint">
                Nhập tên các thành viên ngăn cách bằng dấu phẩy (,)
              </small>
            </div>

            <!-- Preview parsed members -->
            <div v-if="parsedMemberNames.length > 0" class="hui-create__members-preview">
              <div class="hui-create__members-header">
                <span>Thành viên đã nhập:</span>
                <span class="hui-create__members-count">{{ parsedMemberNames.length }} người</span>
              </div>
              <div class="hui-create__members-chips">
                <Chip
                  v-for="(name, index) in parsedMemberNames"
                  :key="index"
                  :label="name"
                  class="hui-create__member-chip"
                />
              </div>
            </div>

            <div class="hui-create__form-group">
              <label class="label">Số tiền mỗi kỳ <span class="required">*</span></label>
              <InputNumber
                v-model="form.amountPerPeriod"
                mode="currency"
                currency="VND"
                locale="vi-VN"
                :min="10000"
                :step="100000"
                :class="{ 'p-invalid': errors.amountPerPeriod }"
              />
              <small v-if="errors.amountPerPeriod" class="error-text">{{ errors.amountPerPeriod }}</small>
            </div>
          </template>

          <div class="hui-create__row">
            <div class="hui-create__form-group">
              <label class="label">Kỳ hạn</label>
              <Dropdown
                v-model="form.periodType"
                :options="periodOptions"
                optionLabel="label"
                optionValue="value"
              />
            </div>

            <div class="hui-create__form-group">
              <label class="label">Ngày bắt đầu</label>
              <Calendar
                v-model="startDateObj"
                dateFormat="dd/mm/yy"
                :minDate="new Date()"
                showIcon
              />
            </div>
          </div>

          <div class="hui-create__form-group">
            <label class="label">Loại hụi</label>
            <div class="hui-create__hui-type">
              <div
                v-for="option in huiTypeOptions"
                :key="option.value"
                class="hui-create__hui-type-option"
                :class="{ 'hui-create__hui-type-option--selected': form.huiType === option.value }"
                @click="form.huiType = option.value as 'bidding' | 'random'"
              >
                <RadioButton
                  v-model="form.huiType"
                  :inputId="option.value"
                  :value="option.value"
                />
                <div class="hui-create__hui-type-content">
                  <label :for="option.value" class="hui-create__hui-type-label">
                    <i :class="option.value === 'bidding' ? 'pi pi-dollar' : 'pi pi-sync'"></i>
                    {{ option.label }}
                  </label>
                  <p class="hui-create__hui-type-desc">{{ option.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="hui-create__summary">
            <h3>Tổng quan</h3>
            <div class="hui-create__summary-grid">
              <div class="hui-create__summary-item">
                <span class="hui-create__summary-label">Tổng số kỳ</span>
                <span class="hui-create__summary-value">
                  {{ isRandomType ? parsedMemberNames.length : form.totalMembers }} kỳ
                </span>
              </div>
              <div class="hui-create__summary-item">
                <span class="hui-create__summary-label">Tổng giá trị</span>
                <span class="hui-create__summary-value hui-create__summary-value--highlight">
                  {{ formatCurrency(actualTotalValue) }}
                </span>
              </div>
              <div class="hui-create__summary-item hui-create__summary-item--full">
                <span class="hui-create__summary-label">Ngày kết thúc dự kiến</span>
                <span class="hui-create__summary-value">{{ actualEndDate }}</span>
              </div>
            </div>
          </div>

          <div class="hui-create__actions">
            <Button
              type="button"
              label="Hủy"
              severity="secondary"
              outlined
              @click="router.back()"
            />
            <Button
              type="submit"
              label="Tạo dây hụi"
              icon="pi pi-check"
              :loading="loading"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-create {
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

  &__content {
    max-width: 600px;
  }

  &__form {
    padding: $spacing-2xl;
  }

  &__form-group {
    margin-bottom: $spacing-lg;

    .label {
      display: block;
      margin-bottom: $spacing-xs;
      font-weight: 500;
      color: $text-secondary;
    }

    .required {
      color: $error;
    }

    :deep(.p-inputtext),
    :deep(.p-inputnumber),
    :deep(.p-dropdown),
    :deep(.p-calendar) {
      width: 100%;
    }
  }

  &__row {
    display: grid;
    gap: $spacing-lg;

    @include sm {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__summary {
    background: $surface-alt;
    border-radius: $radius-md;
    padding: $spacing-lg;
    margin-bottom: $spacing-xl;

    h3 {
      font-size: $font-size-base;
      margin-bottom: $spacing-md;
      color: $text-secondary;
    }
  }

  &__summary-grid {
    display: grid;
    gap: $spacing-md;
    grid-template-columns: repeat(2, 1fr);
  }

  &__summary-item {
    &--full {
      grid-column: 1 / -1;
    }
  }

  &__summary-label {
    display: block;
    font-size: $font-size-sm;
    color: $text-muted;
    margin-bottom: $spacing-xs;
  }

  &__summary-value {
    font-weight: 600;
    font-size: $font-size-lg;

    &--highlight {
      color: $primary;
      font-size: $font-size-xl;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-md;
    justify-content: flex-end;
  }

  &__hui-type {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;

    @include sm {
      flex-direction: row;
    }
  }

  &__hui-type-option {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    padding: $spacing-lg;
    border: 2px solid $border-color;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $primary-light;
      background: rgba($primary, 0.02);
    }

    &--selected {
      border-color: $primary;
      background: rgba($primary, 0.05);
    }
  }

  &__hui-type-content {
    flex: 1;
  }

  &__hui-type-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: 600;
    cursor: pointer;

    i {
      color: $primary;
    }
  }

  &__hui-type-desc {
    margin-top: $spacing-xs;
    font-size: $font-size-sm;
    color: $text-muted;
  }

  &__hint {
    display: block;
    margin-top: $spacing-xs;
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__members-preview {
    background: $surface-alt;
    border-radius: $radius-md;
    padding: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__members-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  &__members-count {
    font-weight: 600;
    color: $primary;
  }

  &__members-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__member-chip {
    :deep(.p-chip) {
      background: $surface;
      border: 1px solid $border-color;
      font-size: $font-size-sm;
    }
  }

  :deep(.p-textarea) {
    width: 100%;
    resize: vertical;
  }
}
</style>

