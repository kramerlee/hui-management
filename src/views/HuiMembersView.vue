<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import EmptyState from '@/components/common/EmptyState.vue'
import type { HuiMember, HuiMemberForm } from '@/types'

const route = useRoute()
const router = useRouter()
const huiStore = useHuiStore()
const confirm = useConfirm()
const toast = useToast()

const groupId = computed(() => route.params.id as string)
const showAddDialog = ref(false)
const newMember = ref<HuiMemberForm>({ name: '', email: '' })
const formErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

onMounted(async () => {
  await Promise.all([
    huiStore.fetchHuiGroup(groupId.value),
    huiStore.fetchMembers(groupId.value)
  ])
})

const group = computed(() => huiStore.currentGroup)
const canAddMore = computed(() => {
  return group.value && huiStore.members.length < group.value.totalMembers
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function openAddDialog() {
  newMember.value = { name: '', email: '' }
  formErrors.value = {}
  showAddDialog.value = true
}

function validateForm(): boolean {
  formErrors.value = {}
  
  if (!newMember.value.name.trim()) {
    formErrors.value.name = 'Vui lòng nhập họ tên'
  }
  
  if (!newMember.value.email.trim()) {
    formErrors.value.email = 'Vui lòng nhập email'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.value.email)) {
    formErrors.value.email = 'Email không hợp lệ'
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function handleAddMember() {
  if (!validateForm()) return
  
  isSubmitting.value = true
  const success = await huiStore.addMember(groupId.value, newMember.value)
  isSubmitting.value = false
  
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã thêm hụi viên mới',
      life: 3000
    })
    showAddDialog.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: huiStore.error || 'Không thể thêm hụi viên',
      life: 5000
    })
  }
}

function confirmRemove(member: HuiMember) {
  if (member.hasReceived) {
    toast.add({
      severity: 'warn',
      summary: 'Không thể xóa',
      detail: 'Hụi viên đã hốt hụi không thể xóa',
      life: 5000
    })
    return
  }
  
  confirm.require({
    message: `Bạn có chắc muốn xóa hụi viên "${member.name}"?`,
    header: 'Xác nhận xóa',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Xóa',
    rejectLabel: 'Hủy',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await huiStore.removeMember(member.id, groupId.value)
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa hụi viên',
        life: 3000
      })
    }
  })
}
</script>

<template>
  <div class="hui-members">
    <div class="container">
      <div class="hui-members__header">
        <button class="hui-members__back" @click="router.push(`/hui/${groupId}`)">
          <i class="pi pi-arrow-left"></i>
          {{ group?.name || 'Quay lại' }}
        </button>
        
        <div class="hui-members__title-row">
          <div>
            <h1>Danh sách Hụi viên</h1>
            <p v-if="group">
              {{ huiStore.members.length }}/{{ group.totalMembers }} người
            </p>
          </div>
          <Button
            v-if="canAddMore"
            label="Thêm hụi viên"
            icon="pi pi-plus"
            @click="openAddDialog"
          />
        </div>
      </div>

      <div v-if="huiStore.loading && huiStore.members.length === 0" class="loading">
        <div class="loading__spinner"></div>
      </div>

      <template v-else>
        <div v-if="huiStore.members.length > 0" class="card">
          <DataTable
            :value="huiStore.members"
            :paginator="huiStore.members.length > 10"
            :rows="10"
            responsiveLayout="scroll"
          >
            <Column field="order" header="STT" style="width: 80px">
              <template #body="{ data }">
                <span class="hui-members__order">{{ data.order }}</span>
              </template>
            </Column>
            <Column field="name" header="Họ tên" sortable />
            <Column field="email" header="Email">
              <template #body="{ data }">
                <a :href="`mailto:${data.email}`" class="hui-members__email">
                  {{ data.email }}
                </a>
              </template>
            </Column>
            <Column field="hasReceived" header="Trạng thái">
              <template #body="{ data }">
                <span 
                  class="badge"
                  :class="data.hasReceived ? 'badge--success' : 'badge--pending'"
                >
                  {{ data.hasReceived ? `Đã hốt kỳ ${data.receivedPeriod}` : 'Chưa hốt' }}
                </span>
              </template>
            </Column>
            <Column field="joinedAt" header="Ngày tham gia" sortable>
              <template #body="{ data }">
                {{ formatDate(data.joinedAt) }}
              </template>
            </Column>
            <Column header="Thao tác" style="width: 100px">
              <template #body="{ data }">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :disabled="data.hasReceived"
                  @click="confirmRemove(data)"
                  v-tooltip="data.hasReceived ? 'Không thể xóa' : 'Xóa'"
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <EmptyState
          v-else
          icon="pi pi-users"
          title="Chưa có hụi viên"
          description="Thêm hụi viên để bắt đầu dây hụi"
        >
          <template #action>
            <Button
              label="Thêm hụi viên"
              icon="pi pi-plus"
              @click="openAddDialog"
            />
          </template>
        </EmptyState>
      </template>

      <!-- Add Member Dialog -->
      <Dialog
        v-model:visible="showAddDialog"
        header="Thêm hụi viên mới"
        :modal="true"
        :style="{ width: '400px' }"
      >
        <div class="hui-members__form">
          <div class="hui-members__form-group">
            <label class="label">Họ và tên <span class="required">*</span></label>
            <InputText
              v-model="newMember.name"
              placeholder="Nguyễn Văn A"
              :class="{ 'p-invalid': formErrors.name }"
            />
            <small v-if="formErrors.name" class="error-text">{{ formErrors.name }}</small>
          </div>

          <div class="hui-members__form-group">
            <label class="label">Email <span class="required">*</span></label>
            <InputText
              v-model="newMember.email"
              type="email"
              placeholder="email@example.com"
              :class="{ 'p-invalid': formErrors.email }"
            />
            <small v-if="formErrors.email" class="error-text">{{ formErrors.email }}</small>
          </div>
        </div>

        <template #footer>
          <Button
            label="Hủy"
            severity="secondary"
            text
            @click="showAddDialog = false"
          />
          <Button
            label="Thêm"
            icon="pi pi-check"
            :loading="isSubmitting"
            @click="handleAddMember"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-members {
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
    @include flex-between;
    flex-wrap: wrap;
    gap: $spacing-md;

    h1 {
      font-size: $font-size-3xl;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $text-secondary;
    }
  }

  &__order {
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

  &__email {
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__form {
    @include flex-column;
    gap: $spacing-lg;
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

    :deep(.p-inputtext) {
      width: 100%;
    }
  }
}
</style>

