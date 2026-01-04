import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase'
import { useAuthStore } from './auth'
import type {
  HuiGroup,
  HuiGroupForm,
  HuiMember,
  HuiMemberForm,
  HuiPeriod,
  PeriodBidForm,
  Payment,
  HuiStats,
  PeriodType
} from '@/types'

// Dynamic import for Firestore
let firestoreModule: typeof import('firebase/firestore') | null = null

async function getFirestore() {
  if (!firestoreModule) {
    firestoreModule = await import('firebase/firestore')
  }
  return firestoreModule
}

// Demo storage keys
const STORAGE_KEYS = {
  groups: 'hui_demo_groups',
  members: 'hui_demo_members',
  periods: 'hui_demo_periods',
  payments: 'hui_demo_payments'
}

function generateId(): string {
  return 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useHuiStore = defineStore('hui', () => {
  const huiGroups = ref<HuiGroup[]>([])
  const currentGroup = ref<HuiGroup | null>(null)
  const members = ref<HuiMember[]>([])
  const periods = ref<HuiPeriod[]>([])
  const payments = ref<Payment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const isDemoMode = computed(() => !isFirebaseConfigured)

  const stats = computed<HuiStats>(() => ({
    totalGroups: huiGroups.value.length,
    activeGroups: huiGroups.value.filter(g => g.status === 'active').length,
    totalMembers: members.value.length,
    totalAmount: huiGroups.value.reduce((sum, g) => sum + g.amountPerPeriod * g.totalMembers, 0),
    pendingPayments: payments.value.filter(p => p.status === 'pending').length
  }))

  function calculateEndDate(startDate: string, totalMembers: number, periodType: PeriodType): string {
    const start = new Date(startDate)
    const end = new Date(start)
    
    switch (periodType) {
      case 'daily':
        end.setDate(end.getDate() + totalMembers - 1)
        break
      case 'weekly':
        end.setDate(end.getDate() + (totalMembers - 1) * 7)
        break
      case 'monthly':
        end.setMonth(end.getMonth() + totalMembers - 1)
        break
    }
    
    return end.toISOString().split('T')[0]
  }

  // ============= DEMO MODE FUNCTIONS =============
  
  async function fetchHuiGroupsDemo() {
    const allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
    huiGroups.value = allGroups.filter(g => g.ownerId === authStore.userId)
  }

  async function createHuiGroupDemo(form: HuiGroupForm): Promise<string | null> {
    const endDate = calculateEndDate(form.startDate, form.totalMembers, form.periodType)
    const id = generateId()
    
    const newGroup: HuiGroup = {
      id,
      name: form.name,
      ownerId: authStore.userId,
      ownerName: authStore.userProfile?.displayName || '',
      ownerEmail: authStore.userProfile?.email || '',
      totalMembers: form.totalMembers,
      amountPerPeriod: form.amountPerPeriod,
      periodType: form.periodType,
      huiType: form.huiType,
      startDate: form.startDate,
      endDate,
      status: 'active',
      currentPeriod: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
    allGroups.push(newGroup)
    saveToStorage(STORAGE_KEYS.groups, allGroups)
    
    // Create initial periods
    await createInitialPeriodsDemo(id, form.startDate, form.totalMembers, form.periodType, form.amountPerPeriod)
    
    // If member names are provided (random type), create members
    if (form.memberNames && form.memberNames.length > 0) {
      await createMembersFromNamesDemo(id, form.memberNames)
    }
    
    await fetchHuiGroupsDemo()
    return id
  }

  async function createMembersFromNamesDemo(huiGroupId: string, memberNames: string[]) {
    const allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    
    memberNames.forEach((name, index) => {
      const member: HuiMember = {
        id: generateId(),
        huiGroupId,
        name: name.trim(),
        email: '',
        order: index + 1,
        hasReceived: false,
        joinedAt: new Date().toISOString()
      }
      allMembers.push(member)
    })
    
    saveToStorage(STORAGE_KEYS.members, allMembers)
  }

  async function createInitialPeriodsDemo(
    huiGroupId: string, 
    startDate: string, 
    totalMembers: number, 
    periodType: PeriodType,
    amountPerPeriod: number
  ) {
    const allPeriods = loadFromStorage<HuiPeriod>(STORAGE_KEYS.periods)
    const start = new Date(startDate)
    
    for (let i = 1; i <= totalMembers; i++) {
      const periodDate = new Date(start)
      
      switch (periodType) {
        case 'daily':
          periodDate.setDate(periodDate.getDate() + i - 1)
          break
        case 'weekly':
          periodDate.setDate(periodDate.getDate() + (i - 1) * 7)
          break
        case 'monthly':
          periodDate.setMonth(periodDate.getMonth() + i - 1)
          break
      }

      const period: HuiPeriod = {
        id: generateId(),
        huiGroupId,
        periodNumber: i,
        date: periodDate.toISOString().split('T')[0],
        bidAmount: 0,
        totalAmount: amountPerPeriod * totalMembers,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      allPeriods.push(period)
    }
    
    saveToStorage(STORAGE_KEYS.periods, allPeriods)
  }

  async function fetchHuiGroupDemo(id: string) {
    const allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
    currentGroup.value = allGroups.find(g => g.id === id) || null
  }

  async function deleteHuiGroupDemo(id: string) {
    // Delete group
    let allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
    allGroups = allGroups.filter(g => g.id !== id)
    saveToStorage(STORAGE_KEYS.groups, allGroups)
    
    // Delete related members
    let allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    allMembers = allMembers.filter(m => m.huiGroupId !== id)
    saveToStorage(STORAGE_KEYS.members, allMembers)
    
    // Delete related periods
    let allPeriods = loadFromStorage<HuiPeriod>(STORAGE_KEYS.periods)
    allPeriods = allPeriods.filter(p => p.huiGroupId !== id)
    saveToStorage(STORAGE_KEYS.periods, allPeriods)
    
    // Delete related payments
    let allPayments = loadFromStorage<Payment>(STORAGE_KEYS.payments)
    allPayments = allPayments.filter(p => p.huiGroupId !== id)
    saveToStorage(STORAGE_KEYS.payments, allPayments)
    
    await fetchHuiGroupsDemo()
  }

  async function fetchMembersDemo(huiGroupId: string) {
    const allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    members.value = allMembers.filter(m => m.huiGroupId === huiGroupId).sort((a, b) => a.order - b.order)
  }

  async function addMemberDemo(huiGroupId: string, form: HuiMemberForm): Promise<boolean> {
    const currentMembersCount = members.value.length
    
    if (currentGroup.value && currentMembersCount >= currentGroup.value.totalMembers) {
      error.value = 'Đã đủ số lượng hụi viên'
      return false
    }

    const newMember: HuiMember = {
      id: generateId(),
      huiGroupId,
      name: form.name,
      email: form.email,
      order: currentMembersCount + 1,
      hasReceived: false,
      joinedAt: new Date().toISOString()
    }

    const allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    allMembers.push(newMember)
    saveToStorage(STORAGE_KEYS.members, allMembers)
    
    await fetchMembersDemo(huiGroupId)
    return true
  }

  async function removeMemberDemo(id: string, huiGroupId: string) {
    let allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    allMembers = allMembers.filter(m => m.id !== id)
    saveToStorage(STORAGE_KEYS.members, allMembers)
    await fetchMembersDemo(huiGroupId)
  }

  async function fetchPeriodsDemo(huiGroupId: string) {
    const allPeriods = loadFromStorage<HuiPeriod>(STORAGE_KEYS.periods)
    periods.value = allPeriods.filter(p => p.huiGroupId === huiGroupId).sort((a, b) => a.periodNumber - b.periodNumber)
  }

  async function completePeriodDemo(periodId: string, bid: PeriodBidForm): Promise<boolean> {
    const allPeriods = loadFromStorage<HuiPeriod>(STORAGE_KEYS.periods)
    const periodIndex = allPeriods.findIndex(p => p.id === periodId)
    
    if (periodIndex === -1) {
      error.value = 'Không tìm thấy kỳ hụi'
      return false
    }
    
    const period = allPeriods[periodIndex]
    const winner = members.value.find(m => m.id === bid.winnerId)
    
    if (!winner) {
      error.value = 'Không tìm thấy hụi viên'
      return false
    }
    
    // Update period
    allPeriods[periodIndex] = {
      ...period,
      winnerId: bid.winnerId,
      winnerName: winner.name,
      bidAmount: bid.bidAmount,
      status: 'completed',
      completedAt: new Date().toISOString()
    }
    saveToStorage(STORAGE_KEYS.periods, allPeriods)
    
    // Update member
    const allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
    const memberIndex = allMembers.findIndex(m => m.id === bid.winnerId)
    if (memberIndex !== -1) {
      allMembers[memberIndex] = {
        ...allMembers[memberIndex],
        hasReceived: true,
        receivedPeriod: period.periodNumber
      }
      saveToStorage(STORAGE_KEYS.members, allMembers)
    }
    
    // Update group
    if (currentGroup.value) {
      const allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
      const groupIndex = allGroups.findIndex(g => g.id === currentGroup.value!.id)
      if (groupIndex !== -1) {
        allGroups[groupIndex] = {
          ...allGroups[groupIndex],
          currentPeriod: period.periodNumber,
          updatedAt: new Date().toISOString()
        }
        saveToStorage(STORAGE_KEYS.groups, allGroups)
      }
      
      // Create payments
      await createPaymentsForPeriodDemo(period, bid.winnerId, bid.bidAmount)
      
      await fetchPeriodsDemo(currentGroup.value.id)
      await fetchMembersDemo(currentGroup.value.id)
      await fetchHuiGroupDemo(currentGroup.value.id)
    }
    
    return true
  }

  async function createPaymentsForPeriodDemo(period: HuiPeriod, winnerId: string, bidAmount: number) {
    if (!currentGroup.value) return
    
    const allPayments = loadFromStorage<Payment>(STORAGE_KEYS.payments)
    const baseAmount = currentGroup.value.amountPerPeriod
    const bonusPerMember = members.value.length > 1 ? bidAmount / (members.value.length - 1) : 0
    
    for (const member of members.value) {
      if (member.id === winnerId) continue
      
      const amount = member.hasReceived 
        ? baseAmount - bonusPerMember 
        : baseAmount
      
      const payment: Payment = {
        id: generateId(),
        periodId: period.id,
        huiGroupId: period.huiGroupId,
        memberId: member.id,
        memberName: member.name,
        amount: Math.round(amount),
        status: 'pending',
        dueDate: period.date
      }
      
      allPayments.push(payment)
    }
    
    saveToStorage(STORAGE_KEYS.payments, allPayments)
  }

  async function fetchPaymentsDemo(huiGroupId: string) {
    const allPayments = loadFromStorage<Payment>(STORAGE_KEYS.payments)
    payments.value = allPayments.filter(p => p.huiGroupId === huiGroupId)
  }

  async function markPaymentPaidDemo(paymentId: string) {
    const allPayments = loadFromStorage<Payment>(STORAGE_KEYS.payments)
    const paymentIndex = allPayments.findIndex(p => p.id === paymentId)
    
    if (paymentIndex !== -1) {
      allPayments[paymentIndex] = {
        ...allPayments[paymentIndex],
        status: 'paid',
        paidAt: new Date().toISOString()
      }
      saveToStorage(STORAGE_KEYS.payments, allPayments)
    }
    
    if (currentGroup.value) {
      await fetchPaymentsDemo(currentGroup.value.id)
    }
  }

  // ============= FIREBASE FUNCTIONS =============
  
  async function fetchHuiGroupsFirebase() {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const q = fs.query(
      fs.collection(db, 'huiGroups'),
      fs.where('ownerId', '==', authStore.userId),
      fs.orderBy('createdAt', 'desc')
    )
    const snapshot = await fs.getDocs(q)
    huiGroups.value = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as HuiGroup[]
  }

  async function createHuiGroupFirebase(form: HuiGroupForm): Promise<string | null> {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return null
    const endDate = calculateEndDate(form.startDate, form.totalMembers, form.periodType)
    
    const newGroup: Omit<HuiGroup, 'id'> = {
      name: form.name,
      ownerId: authStore.userId,
      ownerName: authStore.userProfile?.displayName || '',
      ownerEmail: authStore.userProfile?.email || '',
      totalMembers: form.totalMembers,
      amountPerPeriod: form.amountPerPeriod,
      periodType: form.periodType,
      huiType: form.huiType,
      startDate: form.startDate,
      endDate,
      status: 'active',
      currentPeriod: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await fs.addDoc(fs.collection(db, 'huiGroups'), newGroup)
    await createInitialPeriodsFirebase(docRef.id, form.startDate, form.totalMembers, form.periodType, form.amountPerPeriod)
    
    // If member names are provided (random type), create members
    if (form.memberNames && form.memberNames.length > 0) {
      await createMembersFromNamesFirebase(docRef.id, form.memberNames)
    }
    
    await fetchHuiGroupsFirebase()
    return docRef.id
  }

  async function createMembersFromNamesFirebase(huiGroupId: string, memberNames: string[]) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    
    for (let i = 0; i < memberNames.length; i++) {
      const member: Omit<HuiMember, 'id'> = {
        huiGroupId,
        name: memberNames[i].trim(),
        email: '',
        order: i + 1,
        hasReceived: false,
        joinedAt: new Date().toISOString()
      }
      await fs.addDoc(fs.collection(db, 'huiMembers'), member)
    }
  }

  async function createInitialPeriodsFirebase(
    huiGroupId: string, 
    startDate: string, 
    totalMembers: number, 
    periodType: PeriodType,
    amountPerPeriod: number
  ) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const start = new Date(startDate)
    
    for (let i = 1; i <= totalMembers; i++) {
      const periodDate = new Date(start)
      
      switch (periodType) {
        case 'daily':
          periodDate.setDate(periodDate.getDate() + i - 1)
          break
        case 'weekly':
          periodDate.setDate(periodDate.getDate() + (i - 1) * 7)
          break
        case 'monthly':
          periodDate.setMonth(periodDate.getMonth() + i - 1)
          break
      }

      const period: Omit<HuiPeriod, 'id'> = {
        huiGroupId,
        periodNumber: i,
        date: periodDate.toISOString().split('T')[0],
        bidAmount: 0,
        totalAmount: amountPerPeriod * totalMembers,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      await fs.addDoc(fs.collection(db, 'huiPeriods'), period)
    }
  }

  async function fetchHuiGroupFirebase(id: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const docRef = fs.doc(db, 'huiGroups', id)
    const docSnap = await fs.getDoc(docRef)
    
    if (docSnap.exists()) {
      currentGroup.value = { id: docSnap.id, ...docSnap.data() } as HuiGroup
    } else {
      currentGroup.value = null
    }
  }

  async function deleteHuiGroupFirebase(id: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    // Delete all related data
    const membersQuery = fs.query(fs.collection(db, 'huiMembers'), fs.where('huiGroupId', '==', id))
    const membersSnap = await fs.getDocs(membersQuery)
    for (const memberDoc of membersSnap.docs) {
      await fs.deleteDoc(memberDoc.ref)
    }

    const periodsQuery = fs.query(fs.collection(db, 'huiPeriods'), fs.where('huiGroupId', '==', id))
    const periodsSnap = await fs.getDocs(periodsQuery)
    for (const periodDoc of periodsSnap.docs) {
      await fs.deleteDoc(periodDoc.ref)
    }

    const paymentsQuery = fs.query(fs.collection(db, 'payments'), fs.where('huiGroupId', '==', id))
    const paymentsSnap = await fs.getDocs(paymentsQuery)
    for (const paymentDoc of paymentsSnap.docs) {
      await fs.deleteDoc(paymentDoc.ref)
    }

    await fs.deleteDoc(fs.doc(db, 'huiGroups', id))
    await fetchHuiGroupsFirebase()
  }

  async function fetchMembersFirebase(huiGroupId: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const q = fs.query(
      fs.collection(db, 'huiMembers'),
      fs.where('huiGroupId', '==', huiGroupId),
      fs.orderBy('order', 'asc')
    )
    const snapshot = await fs.getDocs(q)
    members.value = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as HuiMember[]
  }

  async function addMemberFirebase(huiGroupId: string, form: HuiMemberForm): Promise<boolean> {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return false
    const currentMembersCount = members.value.length
    
    if (currentGroup.value && currentMembersCount >= currentGroup.value.totalMembers) {
      error.value = 'Đã đủ số lượng hụi viên'
      return false
    }

    const newMember: Omit<HuiMember, 'id'> = {
      huiGroupId,
      name: form.name,
      email: form.email,
      order: currentMembersCount + 1,
      hasReceived: false,
      joinedAt: new Date().toISOString()
    }

    await fs.addDoc(fs.collection(db, 'huiMembers'), newMember)
    await fetchMembersFirebase(huiGroupId)
    return true
  }

  async function removeMemberFirebase(id: string, huiGroupId: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    await fs.deleteDoc(fs.doc(db, 'huiMembers', id))
    await fetchMembersFirebase(huiGroupId)
  }

  async function fetchPeriodsFirebase(huiGroupId: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const q = fs.query(
      fs.collection(db, 'huiPeriods'),
      fs.where('huiGroupId', '==', huiGroupId),
      fs.orderBy('periodNumber', 'asc')
    )
    const snapshot = await fs.getDocs(q)
    periods.value = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as HuiPeriod[]
  }

  async function completePeriodFirebase(periodId: string, bid: PeriodBidForm): Promise<boolean> {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return false
    const periodRef = fs.doc(db, 'huiPeriods', periodId)
    const periodSnap = await fs.getDoc(periodRef)
    
    if (!periodSnap.exists()) {
      error.value = 'Không tìm thấy kỳ hụi'
      return false
    }

    const period = { id: periodSnap.id, ...periodSnap.data() } as HuiPeriod
    const winner = members.value.find(m => m.id === bid.winnerId)

    if (!winner) {
      error.value = 'Không tìm thấy hụi viên'
      return false
    }

    await fs.updateDoc(periodRef, {
      winnerId: bid.winnerId,
      winnerName: winner.name,
      bidAmount: bid.bidAmount,
      status: 'completed',
      completedAt: new Date().toISOString()
    })

    const memberRef = fs.doc(db, 'huiMembers', bid.winnerId)
    await fs.updateDoc(memberRef, {
      hasReceived: true,
      receivedPeriod: period.periodNumber
    })

    if (currentGroup.value) {
      await fs.updateDoc(fs.doc(db, 'huiGroups', currentGroup.value.id), {
        currentPeriod: period.periodNumber,
        updatedAt: new Date().toISOString()
      })

      await createPaymentsForPeriodFirebase(period, bid.winnerId, bid.bidAmount)
      await fetchPeriodsFirebase(currentGroup.value.id)
      await fetchMembersFirebase(currentGroup.value.id)
      await fetchHuiGroupFirebase(currentGroup.value.id)
    }

    return true
  }

  async function createPaymentsForPeriodFirebase(period: HuiPeriod, winnerId: string, bidAmount: number) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!currentGroup.value || !db) return

    const baseAmount = currentGroup.value.amountPerPeriod
    const bonusPerMember = members.value.length > 1 ? bidAmount / (members.value.length - 1) : 0

    for (const member of members.value) {
      if (member.id === winnerId) continue

      const amount = member.hasReceived 
        ? baseAmount - bonusPerMember 
        : baseAmount

      const payment: Omit<Payment, 'id'> = {
        periodId: period.id,
        huiGroupId: period.huiGroupId,
        memberId: member.id,
        memberName: member.name,
        amount: Math.round(amount),
        status: 'pending',
        dueDate: period.date
      }

      await fs.addDoc(fs.collection(db, 'payments'), payment)
    }
  }

  async function fetchPaymentsFirebase(huiGroupId: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const q = fs.query(
      fs.collection(db, 'payments'),
      fs.where('huiGroupId', '==', huiGroupId),
      fs.orderBy('dueDate', 'desc')
    )
    const snapshot = await fs.getDocs(q)
    payments.value = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Payment[]
  }

  async function markPaymentPaidFirebase(paymentId: string) {
    const fs = await getFirestore()
    const db = await getFirebaseDb()
    if (!db) return
    const paymentRef = fs.doc(db, 'payments', paymentId)
    await fs.updateDoc(paymentRef, {
      status: 'paid',
      paidAt: new Date().toISOString()
    })
    if (currentGroup.value) {
      await fetchPaymentsFirebase(currentGroup.value.id)
    }
  }

  // ============= UNIFIED API =============

  async function fetchHuiGroups() {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await fetchHuiGroupsDemo()
      } else {
        await fetchHuiGroupsFirebase()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createHuiGroup(form: HuiGroupForm): Promise<string | null> {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        return await createHuiGroupDemo(form)
      } else {
        return await createHuiGroupFirebase(form)
      }
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchHuiGroup(id: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await fetchHuiGroupDemo(id)
      } else {
        await fetchHuiGroupFirebase(id)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function updateHuiGroup(id: string, updates: Partial<HuiGroup>) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        const allGroups = loadFromStorage<HuiGroup>(STORAGE_KEYS.groups)
        const index = allGroups.findIndex(g => g.id === id)
        if (index !== -1) {
          allGroups[index] = { ...allGroups[index], ...updates, updatedAt: new Date().toISOString() }
          saveToStorage(STORAGE_KEYS.groups, allGroups)
        }
        await fetchHuiGroupsDemo()
      } else {
        const fs = await getFirestore()
        const db = await getFirebaseDb()
        if (!db) return
        const docRef = fs.doc(db, 'huiGroups', id)
        await fs.updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() })
        await fetchHuiGroupsFirebase()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function deleteHuiGroup(id: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await deleteHuiGroupDemo(id)
      } else {
        await deleteHuiGroupFirebase(id)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchMembers(huiGroupId: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await fetchMembersDemo(huiGroupId)
      } else {
        await fetchMembersFirebase(huiGroupId)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function addMember(huiGroupId: string, form: HuiMemberForm): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        return await addMemberDemo(huiGroupId, form)
      } else {
        return await addMemberFirebase(huiGroupId, form)
      }
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateMember(id: string, updates: Partial<HuiMember>) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        const allMembers = loadFromStorage<HuiMember>(STORAGE_KEYS.members)
        const index = allMembers.findIndex(m => m.id === id)
        if (index !== -1) {
          allMembers[index] = { ...allMembers[index], ...updates }
          saveToStorage(STORAGE_KEYS.members, allMembers)
        }
        if (currentGroup.value) {
          await fetchMembersDemo(currentGroup.value.id)
        }
      } else {
        const fs = await getFirestore()
        const db = await getFirebaseDb()
        if (!db) return
        const docRef = fs.doc(db, 'huiMembers', id)
        await fs.updateDoc(docRef, updates)
        if (currentGroup.value) {
          await fetchMembersFirebase(currentGroup.value.id)
        }
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function removeMember(id: string, huiGroupId: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await removeMemberDemo(id, huiGroupId)
      } else {
        await removeMemberFirebase(id, huiGroupId)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchPeriods(huiGroupId: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await fetchPeriodsDemo(huiGroupId)
      } else {
        await fetchPeriodsFirebase(huiGroupId)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function completePeriod(periodId: string, bid: PeriodBidForm): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        return await completePeriodDemo(periodId, bid)
      } else {
        return await completePeriodFirebase(periodId, bid)
      }
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchPayments(huiGroupId: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await fetchPaymentsDemo(huiGroupId)
      } else {
        await fetchPaymentsFirebase(huiGroupId)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function markPaymentPaid(paymentId: string) {
    loading.value = true
    error.value = null
    try {
      if (isDemoMode.value) {
        await markPaymentPaidDemo(paymentId)
      } else {
        await markPaymentPaidFirebase(paymentId)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function clearCurrentGroup() {
    currentGroup.value = null
    members.value = []
    periods.value = []
    payments.value = []
  }

  return {
    huiGroups,
    currentGroup,
    members,
    periods,
    payments,
    loading,
    error,
    stats,
    isDemoMode,
    fetchHuiGroups,
    createHuiGroup,
    fetchHuiGroup,
    updateHuiGroup,
    deleteHuiGroup,
    fetchMembers,
    addMember,
    updateMember,
    removeMember,
    fetchPeriods,
    completePeriod,
    fetchPayments,
    markPaymentPaid,
    clearCurrentGroup
  }
})
