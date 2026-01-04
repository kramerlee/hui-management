/**
 * Trạng thái của dây hụi
 */
export type HuiStatus = 'active' | 'completed' | 'cancelled'

/**
 * Loại kỳ hạn
 */
export type PeriodType = 'daily' | 'weekly' | 'monthly'

/**
 * Trạng thái kỳ hụi
 */
export type PeriodStatus = 'pending' | 'bidding' | 'completed'

/**
 * Trạng thái thanh toán
 */
export type PaymentStatus = 'pending' | 'paid'

/**
 * Dây hụi - Hui Group
 */
export interface HuiGroup {
  id: string
  name: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  totalMembers: number
  amountPerPeriod: number
  periodType: PeriodType
  startDate: string
  endDate: string
  status: HuiStatus
  currentPeriod: number
  createdAt: string
  updatedAt: string
}

/**
 * Form tạo dây hụi
 */
export interface HuiGroupForm {
  name: string
  totalMembers: number
  amountPerPeriod: number
  periodType: PeriodType
  startDate: string
}

/**
 * Hụi viên - Hui Member
 */
export interface HuiMember {
  id: string
  huiGroupId: string
  userId?: string
  name: string
  email: string
  order: number
  hasReceived: boolean
  receivedPeriod?: number
  joinedAt: string
}

/**
 * Form thêm hụi viên
 */
export interface HuiMemberForm {
  name: string
  email: string
}

/**
 * Kỳ hụi - Hui Period
 */
export interface HuiPeriod {
  id: string
  huiGroupId: string
  periodNumber: number
  date: string
  winnerId?: string
  winnerName?: string
  bidAmount: number
  totalAmount: number
  status: PeriodStatus
  createdAt: string
  completedAt?: string
}

/**
 * Form khui hụi
 */
export interface PeriodBidForm {
  winnerId: string
  bidAmount: number
}

/**
 * Thanh toán - Payment
 */
export interface Payment {
  id: string
  periodId: string
  huiGroupId: string
  memberId: string
  memberName: string
  amount: number
  status: PaymentStatus
  dueDate: string
  paidAt?: string
}

/**
 * Thống kê tổng quan
 */
export interface HuiStats {
  totalGroups: number
  activeGroups: number
  totalMembers: number
  totalAmount: number
  pendingPayments: number
}

/**
 * Thông tin người dùng
 */
export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  createdAt: string
}

