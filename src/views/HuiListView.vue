<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHuiStore } from '@/stores'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import EmptyState from '@/components/common/EmptyState.vue'
import type { HuiGroup, HuiStatus } from '@/types'

const router = useRouter()
const huiStore = useHuiStore()
const confirm = useConfirm()
const toast = useToast()

const searchQuery = ref('')
const statusFilter = ref<HuiStatus | ''>('')

const statusOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' }
]

onMounted(async () => {
  await huiStore.fetchHuiGroups()
})

const filteredGroups = computed(() => {
  return huiStore.huiGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || group.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
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

function getPeriodTypeLabel(type: string): string {
  switch (type) {
    case 'daily': return 'Ngày'
    case 'weekly': return 'Tuần'
    case 'monthly': return 'Tháng'
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
    case 'active': return 'Hoạt động'
    case 'completed': return 'Hoàn thành'
    case 'cancelled': return 'Đã hủy'
    default: return status
  }
}

function viewGroup(group: HuiGroup) {
  router.push(`/hui/${group.id}`)
}

function confirmDelete(group: HuiGroup) {
  confirm.require({
    message: `Bạn có chắc muốn xóa dây hụi "${group.name}"? Hành động này không thể hoàn tác.`,
    header: 'Xác nhận xóa',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Xóa',
    rejectLabel: 'Hủy',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await huiStore.deleteHuiGroup(group.id)
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa dây hụi',
        life: 3000
      })
    }
  })
}
</script>

<template>
  <div class="hui-list">
    <div class="container">
      <div class="page-header">
        <div class="page-header__content">
          <h1 class="page-header__title">Dây Hụi</h1>
          <p class="page-header__subtitle">Quản lý tất cả các dây hụi của bạn</p>
        </div>
        <Button
          label="Tạo mới"
          icon="pi pi-plus"
          @click="router.push('/hui/create')"
        />
      </div>

      <div class="hui-list__filters card">
        <div class="hui-list__search">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <InputText
              v-model="searchQuery"
              placeholder="Tìm kiếm dây hụi..."
              class="hui-list__search-input"
            />
          </span>
        </div>
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Trạng thái"
          class="hui-list__status-filter"
        />
      </div>

      <div v-if="huiStore.loading" class="loading">
        <div class="loading__spinner"></div>
      </div>

      <template v-else>
        <div v-if="filteredGroups.length > 0" class="card">
          <DataTable
            :value="filteredGroups"
            :paginator="filteredGroups.length > 10"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            responsiveLayout="scroll"
            class="hui-list__table"
          >
            <Column field="name" header="Tên dây hụi" sortable>
              <template #body="{ data }">
                <button class="hui-list__name-btn" @click="viewGroup(data)">
                  {{ data.name }}
                </button>
              </template>
            </Column>
            <Column field="totalMembers" header="Số người" sortable>
              <template #body="{ data }">
                <span>{{ data.totalMembers }} người</span>
              </template>
            </Column>
            <Column field="amountPerPeriod" header="Số tiền/kỳ" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.amountPerPeriod) }}
              </template>
            </Column>
            <Column field="periodType" header="Kỳ hạn" sortable>
              <template #body="{ data }">
                {{ getPeriodTypeLabel(data.periodType) }}
              </template>
            </Column>
            <Column field="currentPeriod" header="Tiến độ" sortable>
              <template #body="{ data }">
                <div class="hui-list__progress">
                  <div 
                    class="hui-list__progress-bar"
                    :style="{ width: `${(data.currentPeriod / data.totalMembers) * 100}%` }"
                  ></div>
                  <span>{{ data.currentPeriod }}/{{ data.totalMembers }}</span>
                </div>
              </template>
            </Column>
            <Column field="startDate" header="Ngày bắt đầu" sortable>
              <template #body="{ data }">
                {{ formatDate(data.startDate) }}
              </template>
            </Column>
            <Column field="status" header="Trạng thái" sortable>
              <template #body="{ data }">
                <span class="badge" :class="getStatusClass(data.status)">
                  {{ getStatusLabel(data.status) }}
                </span>
              </template>
            </Column>
            <Column header="Thao tác" :exportable="false" style="min-width: 120px">
              <template #body="{ data }">
                <div class="hui-list__actions">
                  <Button
                    icon="pi pi-eye"
                    severity="secondary"
                    text
                    rounded
                    @click="viewGroup(data)"
                    v-tooltip="'Xem chi tiết'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    @click="confirmDelete(data)"
                    v-tooltip="'Xóa'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <EmptyState
          v-else
          icon="pi pi-folder-open"
          title="Không tìm thấy dây hụi"
          :description="searchQuery || statusFilter 
            ? 'Thử thay đổi bộ lọc tìm kiếm' 
            : 'Bắt đầu tạo dây hụi đầu tiên của bạn'"
        >
          <template #action>
            <Button
              v-if="!searchQuery && !statusFilter"
              label="Tạo dây hụi"
              icon="pi pi-plus"
              @click="router.push('/hui/create')"
            />
          </template>
        </EmptyState>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.hui-list {
  padding: $spacing-xl 0;

  .page-header {
    @include flex-between;
    flex-wrap: wrap;
    gap: $spacing-md;

    &__content {
      flex: 1;
    }
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    align-items: center;
  }

  &__search {
    flex: 1;
    min-width: 200px;

    .p-input-icon-left {
      width: 100%;

      i {
        color: $text-muted;
      }
    }
  }

  &__search-input {
    width: 100%;
  }

  &__status-filter {
    min-width: 150px;
  }

  &__name-btn {
    background: none;
    border: none;
    color: $primary;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-align: left;

    &:hover {
      text-decoration: underline;
    }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    &-bar {
      height: 6px;
      background: $primary;
      border-radius: $radius-full;
      min-width: 4px;
    }

    span {
      font-size: $font-size-sm;
      color: $text-secondary;
      white-space: nowrap;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}
</style>

