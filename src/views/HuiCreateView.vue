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
import type { HuiGroupForm } from '@/types'

const router = useRouter()
const huiStore = useHuiStore()
const toast = useToast()

const form = reactive<HuiGroupForm>({
  name: '',
  totalMembers: 10,
  amountPerPeriod: 1000000,
  periodType: 'monthly',
  startDate: new Date().toISOString().split('T')[0]
})

const startDateObj = ref(new Date())
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const periodOptions = [
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' }
]

const endDate = computed(() => {
  const start = new Date(startDateObj.value)
  const end = new Date(start)
  
  switch (form.periodType) {
    case 'daily':
      end.setDate(end.getDate() + form.totalMembers - 1)
      break
    case 'weekly':
      end.setDate(end.getDate() + (form.totalMembers - 1) * 7)
      break
    case 'monthly':
      end.setMonth(end.getMonth() + form.totalMembers - 1)
      break
  }
  
  return end.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const totalValue = computed(() => {
  return form.amountPerPeriod * form.totalMembers
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
  
  if (form.totalMembers < 2) {
    errors.value.totalMembers = 'Số người tối thiểu là 2'
  }
  
  if (form.totalMembers > 100) {
    errors.value.totalMembers = 'Số người tối đa là 100'
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
    startDate: startDateObj.value.toISOString().split('T')[0]
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

          <div class="hui-create__row">
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

          <div class="hui-create__summary">
            <h3>Tổng quan</h3>
            <div class="hui-create__summary-grid">
              <div class="hui-create__summary-item">
                <span class="hui-create__summary-label">Tổng số kỳ</span>
                <span class="hui-create__summary-value">{{ form.totalMembers }} kỳ</span>
              </div>
              <div class="hui-create__summary-item">
                <span class="hui-create__summary-label">Tổng giá trị</span>
                <span class="hui-create__summary-value hui-create__summary-value--highlight">
                  {{ formatCurrency(totalValue) }}
                </span>
              </div>
              <div class="hui-create__summary-item hui-create__summary-item--full">
                <span class="hui-create__summary-label">Ngày kết thúc dự kiến</span>
                <span class="hui-create__summary-value">{{ endDate }}</span>
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
}
</style>

