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
  const error = ref<string | null>(null)
  const isDemoMode = ref(!isFirebaseConfigured)

  const isAuthenticated = computed(() => !!user.value || !!userProfile.value)
  const userId = computed(() => user.value?.uid || userProfile.value?.uid || '')

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

  async function register(email: string, password: string) {
    error.value = null
    
    // Demo mode - simulate registration
    if (isDemoMode.value) {
      const demoProfile: UserProfile = {
        uid: 'demo-user-' + Date.now(),
        email: email,
        displayName: '',
        createdAt: new Date().toISOString()
      }
      userProfile.value = demoProfile
      localStorage.setItem('hui_demo_user', JSON.stringify(demoProfile))
      return true
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      error.value = 'Firebase không khả dụng'
      return false
    }
    
    try {
      const auth = await getFirebaseAuth()
      if (!auth) {
        throw new Error('Firebase Auth chưa được khởi tạo')
      }
      
      const result = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password)
      user.value = result.user
      
      // Create user profile
      await createUserProfile(result.user)
      
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string }
      error.value = getErrorMessage(firebaseError.code || firebaseError.message || 'Unknown error')
      return false
    }
  }

  async function login(email: string, password: string) {
    error.value = null
    
    // Demo mode - simulate login
    if (isDemoMode.value) {
      // Check if there's an existing demo user with this email
      const savedUser = localStorage.getItem('hui_demo_user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          if (parsed.email === email) {
            userProfile.value = parsed
            return true
          }
        } catch {
          // Ignore parse errors
        }
      }
      
      // For demo, any email/password works, create a new profile
      const demoProfile: UserProfile = {
        uid: 'demo-user-' + Date.now(),
        email: email,
        displayName: '',
        createdAt: new Date().toISOString()
      }
      userProfile.value = demoProfile
      localStorage.setItem('hui_demo_user', JSON.stringify(demoProfile))
      return true
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      error.value = 'Firebase không khả dụng'
      return false
    }
    
    try {
      const auth = await getFirebaseAuth()
      if (!auth) {
        throw new Error('Firebase Auth chưa được khởi tạo')
      }
      
      const result = await firebaseAuth.signInWithEmailAndPassword(auth, email, password)
      user.value = result.user
      
      // Get or create user profile
      await createUserProfile(result.user)
      
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string }
      error.value = getErrorMessage(firebaseError.code || firebaseError.message || 'Unknown error')
      return false
    }
  }

  async function loginWithGoogle() {
    error.value = null
    
    // Demo mode - simulate Google login
    if (isDemoMode.value) {
      const demoProfile: UserProfile = {
        uid: 'demo-google-user-' + Date.now(),
        email: 'demo@gmail.com',
        displayName: 'Demo User',
        createdAt: new Date().toISOString()
      }
      userProfile.value = demoProfile
      localStorage.setItem('hui_demo_user', JSON.stringify(demoProfile))
      return true
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      error.value = 'Firebase không khả dụng'
      return false
    }
    
    try {
      const auth = await getFirebaseAuth()
      if (!auth) {
        throw new Error('Firebase Auth chưa được khởi tạo')
      }
      
      const provider = new firebaseAuth.GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await firebaseAuth.signInWithPopup(auth, provider)
      user.value = result.user
      
      // Create or update user profile
      await createUserProfile(result.user)
      
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string }
      // Handle popup closed by user
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        return false
      }
      error.value = getErrorMessage(firebaseError.code || firebaseError.message || 'Unknown error')
      return false
    }
  }

  function getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Email này đã được sử dụng',
      'auth/invalid-email': 'Email không hợp lệ',
      'auth/operation-not-allowed': 'Đăng ký bằng email chưa được bật',
      'auth/weak-password': 'Mật khẩu quá yếu (ít nhất 6 ký tự)',
      'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
      'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
      'auth/wrong-password': 'Mật khẩu không đúng',
      'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
      'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau'
    }
    return messages[code] || code
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
        email: firebaseUser.email || '',
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

  async function resetPassword(email: string) {
    error.value = null
    
    if (isDemoMode.value) {
      // Demo mode - just pretend it worked
      return true
    }
    
    const loaded = await loadFirebaseModules()
    if (!loaded || !firebaseAuth) {
      error.value = 'Firebase không khả dụng'
      return false
    }
    
    try {
      const auth = await getFirebaseAuth()
      if (!auth) {
        throw new Error('Firebase Auth chưa được khởi tạo')
      }
      
      await firebaseAuth.sendPasswordResetEmail(auth, email)
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string }
      error.value = getErrorMessage(firebaseError.code || firebaseError.message || 'Unknown error')
      return false
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
        try {
          await createUserProfile(firebaseUser)
        } catch (e) {
          console.error('Failed to create/load user profile:', e)
          // Still set basic profile from auth user
          userProfile.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            createdAt: new Date().toISOString()
          }
        }
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
    register,
    login,
    loginWithGoogle,
    resetPassword,
    updateUserName,
    logout,
    initAuthListener
  }
})
