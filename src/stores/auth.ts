import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isFirebaseConfigured, getFirebaseAuth, getFirebaseDb } from '@/firebase'
import type { UserProfile } from '@/types'

// Dynamic imports for Firebase - only used when configured
let firebaseAuth: typeof import('firebase/auth') | null = null
let firebaseFirestore: typeof import('firebase/firestore') | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<import('firebase/auth').User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const loading = ref(true)
  const confirmationResult = ref<import('firebase/auth').ConfirmationResult | null>(null)
  const error = ref<string | null>(null)
  const isDemoMode = ref(!isFirebaseConfigured)

  const isAuthenticated = computed(() => !!user.value || !!userProfile.value)
  const userId = computed(() => user.value?.uid || userProfile.value?.uid || '')

  let recaptchaVerifier: import('firebase/auth').RecaptchaVerifier | null = null

  async function loadFirebaseModules() {
    if (!isFirebaseConfigured) return false
    
    try {
      if (!firebaseAuth) {
        firebaseAuth = await import('firebase/auth')
      }
      if (!firebaseFirestore) {
        firebaseFirestore = await import('firebase/firestore')
      }
      return true
    } catch (e) {
      console.error('Failed to load Firebase modules:', e)
      return false
    }
  }

  async function initRecaptcha(containerId: string) {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured, skipping recaptcha')
      return
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) return
    
    const auth = await getFirebaseAuth()
    if (!auth) return
    
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
    }
    recaptchaVerifier = new firebaseAuth.RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      }
    })
  }

  async function sendOTP(phoneNumber: string) {
    error.value = null
    
    // Demo mode - simulate OTP sent
    if (isDemoMode.value) {
      return true
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      error.value = 'Firebase không khả dụng'
      return false
    }
    
    try {
      const auth = await getFirebaseAuth()
      if (!auth || !recaptchaVerifier) {
        throw new Error('Recaptcha chưa được khởi tạo')
      }
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+84${phoneNumber.replace(/^0/, '')}`
      
      confirmationResult.value = await firebaseAuth.signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      )
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  async function verifyOTP(otp: string, phone?: string) {
    error.value = null
    
    // Demo mode - simulate verification
    if (isDemoMode.value) {
      if (otp === '123456') {
        const demoProfile: UserProfile = {
          uid: 'demo-user-' + Date.now(),
          phone: phone || '+84912345678',
          displayName: '',
          createdAt: new Date().toISOString()
        }
        userProfile.value = demoProfile
        localStorage.setItem('hui_demo_user', JSON.stringify(demoProfile))
        return true
      } else {
        error.value = 'Mã OTP không đúng. Sử dụng 123456 để đăng nhập demo.'
        return false
      }
    }
    
    try {
      if (!confirmationResult.value) {
        throw new Error('Chưa gửi mã OTP')
      }
      const result = await confirmationResult.value.confirm(otp)
      user.value = result.user
      
      // Create or update user profile
      await createUserProfile(result.user)
      
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  async function createUserProfile(firebaseUser: import('firebase/auth').User) {
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseFirestore) return
    
    const db = await getFirebaseDb()
    if (!db) return
    
    const userRef = firebaseFirestore.doc(db, 'users', firebaseUser.uid)
    const userSnap = await firebaseFirestore.getDoc(userRef)
    
    if (!userSnap.exists()) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || '',
        displayName: firebaseUser.displayName || '',
        createdAt: new Date().toISOString()
      }
      await firebaseFirestore.setDoc(userRef, profile)
      userProfile.value = profile
    } else {
      userProfile.value = userSnap.data() as UserProfile
    }
  }

  async function updateUserName(displayName: string) {
    // Demo mode
    if (isDemoMode.value && userProfile.value) {
      userProfile.value.displayName = displayName
      localStorage.setItem('hui_demo_user', JSON.stringify(userProfile.value))
      return
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth || !firebaseFirestore || !user.value) return
    
    const db = await getFirebaseDb()
    if (!db) return
    
    await firebaseAuth.updateProfile(user.value, { displayName })
    const userRef = firebaseFirestore.doc(db, 'users', user.value.uid)
    await firebaseFirestore.setDoc(userRef, { displayName }, { merge: true })
    
    if (userProfile.value) {
      userProfile.value.displayName = displayName
    }
  }

  async function logout() {
    // Demo mode
    if (isDemoMode.value) {
      userProfile.value = null
      localStorage.removeItem('hui_demo_user')
      return
    }
    
    const loaded = await loadFirebaseModules()
    if (loaded && firebaseAuth) {
      const auth = await getFirebaseAuth()
      if (auth) {
        await firebaseAuth.signOut(auth)
      }
    }
    user.value = null
    userProfile.value = null
    confirmationResult.value = null
  }

  async function initAuthListener() {
    // Demo mode - check localStorage
    if (isDemoMode.value) {
      const savedUser = localStorage.getItem('hui_demo_user')
      if (savedUser) {
        try {
          userProfile.value = JSON.parse(savedUser)
        } catch {
          localStorage.removeItem('hui_demo_user')
        }
      }
      loading.value = false
      return
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      loading.value = false
      return
    }
    
    const auth = await getFirebaseAuth()
    if (!auth) {
      loading.value = false
      return
    }
    
    firebaseAuth.onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        await createUserProfile(firebaseUser)
      } else {
        userProfile.value = null
      }
      loading.value = false
    })
  }

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    userId,
    isDemoMode,
    initRecaptcha,
    sendOTP,
    verifyOTP,
    updateUserName,
    logout,
    initAuthListener
  }
})
