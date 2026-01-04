import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { title: 'Quản Lý Hụi - Hệ thống quản lý dây hụi thông minh' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui',
    name: 'HuiList',
    component: () => import('@/views/HuiListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui/create',
    name: 'HuiCreate',
    component: () => import('@/views/HuiCreateView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui/:id',
    name: 'HuiDetail',
    component: () => import('@/views/HuiDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui/:id/members',
    name: 'HuiMembers',
    component: () => import('@/views/HuiMembersView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui/:id/periods',
    name: 'HuiPeriods',
    component: () => import('@/views/HuiPeriodsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hui/:id/payments',
    name: 'HuiPayments',
    component: () => import('@/views/HuiPaymentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/hui-management/'),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise<void>(resolve => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (requiresGuest && isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router

