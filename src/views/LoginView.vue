<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

type AuthMode = 'login' | 'register' | 'name' | 'forgot'
const mode = ref<AuthMode>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const loading = ref(false)
const resetEmailSent = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  
  loading.value = true
  const success = await authStore.login(email.value, password.value)
  loading.value = false
  
  if (success) {
    if (!authStore.userProfile?.displayName) {
      mode.value = 'name'
    } else {
      router.push('/dashboard')
    }
  }
}

async function handleRegister() {
  if (!email.value || !password.value || password.value !== confirmPassword.value) return
  
  loading.value = true
  const success = await authStore.register(email.value, password.value)
  loading.value = false
  
  if (success) {
    mode.value = 'name'
  }
}

async function handleResetPassword() {
  if (!email.value) return
  
  loading.value = true
  const success = await authStore.resetPassword(email.value)
  loading.value = false
  
  if (success) {
    resetEmailSent.value = true
  }
}

async function handleSetName() {
  if (!displayName.value.trim()) return
  
  loading.value = true
  await authStore.updateUserName(displayName.value.trim())
  loading.value = false
  
  router.push('/dashboard')
}

function switchMode(newMode: AuthMode) {
  mode.value = newMode
  authStore.error = null
  resetEmailSent.value = false
}
</script>

<template>
  <div class="login">
    <div class="login__background">
      <div class="login__pattern"></div>
    </div>
    
    <div class="login__container">
      <div class="login__card">
        <div class="login__header">
          <div class="login__logo">囍</div>
          <h1 class="login__title">{{ t('app.name') }}</h1>
          <p class="login__subtitle">{{ t('app.tagline') }}</p>
        </div>

        <!-- Demo Mode Badge -->
        <div v-if="authStore.isDemoMode" class="login__demo-notice">
          <span class="login__demo-badge">{{ t('login.demoMode') }}</span>
          <p>{{ t('login.demoInfo') }}</p>
        </div>

        <!-- Login Form -->
        <div v-if="mode === 'login'" class="login__form">
          <div class="login__form-group">
            <label class="login__label">{{ t('login.emailLabel') }}</label>
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('login.emailPlaceholder')"
              class="login__input"
              @keyup.enter="handleLogin"
            />
          </div>

          <div class="login__form-group">
            <label class="login__label">{{ t('login.passwordLabel') }}</label>
            <Password
              v-model="password"
              :placeholder="t('login.passwordPlaceholder')"
              :feedback="false"
              toggleMask
              class="login__input"
              inputClass="w-full"
              @keyup.enter="handleLogin"
            />
          </div>

          <button class="login__forgot" @click="switchMode('forgot')">
            {{ t('login.forgotPassword') }}
          </button>

          <Button
            :label="t('login.loginButton')"
            icon="pi pi-sign-in"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!email || !password"
            @click="handleLogin"
          />

          <p v-if="authStore.error" class="login__error">
            {{ authStore.error }}
          </p>

          <div class="login__switch">
            {{ t('login.noAccount') }}
            <button @click="switchMode('register')">{{ t('login.registerLink') }}</button>
          </div>
        </div>

        <!-- Register Form -->
        <div v-else-if="mode === 'register'" class="login__form">
          <div class="login__form-group">
            <label class="login__label">{{ t('login.emailLabel') }}</label>
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('login.emailPlaceholder')"
              class="login__input"
            />
          </div>

          <div class="login__form-group">
            <label class="login__label">{{ t('login.passwordLabel') }}</label>
            <Password
              v-model="password"
              :placeholder="t('login.passwordPlaceholder')"
              toggleMask
              class="login__input"
              inputClass="w-full"
            />
          </div>

          <div class="login__form-group">
            <label class="login__label">{{ t('login.confirmPasswordLabel') }}</label>
            <Password
              v-model="confirmPassword"
              :placeholder="t('login.confirmPasswordPlaceholder')"
              :feedback="false"
              toggleMask
              class="login__input"
              inputClass="w-full"
              @keyup.enter="handleRegister"
            />
            <small v-if="password && confirmPassword && password !== confirmPassword" class="login__hint-error">
              {{ t('login.passwordMismatch') }}
            </small>
          </div>

          <Button
            :label="t('login.registerButton')"
            icon="pi pi-user-plus"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!email || !password || password !== confirmPassword"
            @click="handleRegister"
          />

          <p v-if="authStore.error" class="login__error">
            {{ authStore.error }}
          </p>

          <div class="login__switch">
            {{ t('login.hasAccount') }}
            <button @click="switchMode('login')">{{ t('login.loginLink') }}</button>
          </div>
        </div>

        <!-- Forgot Password Form -->
        <div v-else-if="mode === 'forgot'" class="login__form">
          <button class="login__back" @click="switchMode('login')">
            <i class="pi pi-arrow-left"></i>
            {{ t('common.back') }}
          </button>

          <div v-if="!resetEmailSent">
            <p class="login__info">{{ t('login.forgotInfo') }}</p>

            <div class="login__form-group">
              <label class="login__label">{{ t('login.emailLabel') }}</label>
              <InputText
                v-model="email"
                type="email"
                :placeholder="t('login.emailPlaceholder')"
                class="login__input"
                @keyup.enter="handleResetPassword"
              />
            </div>

            <Button
              :label="t('login.resetButton')"
              icon="pi pi-envelope"
              iconPos="right"
              class="login__btn"
              :loading="loading"
              :disabled="!email"
              @click="handleResetPassword"
            />

            <p v-if="authStore.error" class="login__error">
              {{ authStore.error }}
            </p>
          </div>

          <div v-else class="login__success">
            <i class="pi pi-check-circle"></i>
            <p>{{ t('login.resetEmailSent') }}</p>
            <Button
              :label="t('login.backToLogin')"
              class="login__btn login__btn--outline"
              @click="switchMode('login')"
            />
          </div>
        </div>

        <!-- Name Step -->
        <div v-else-if="mode === 'name'" class="login__form">
          <p class="login__info">{{ t('login.welcome') }}</p>

          <div class="login__form-group">
            <label class="login__label">{{ t('login.nameLabel') }}</label>
            <InputText
              v-model="displayName"
              :placeholder="t('login.namePlaceholder')"
              class="login__input"
              @keyup.enter="handleSetName"
            />
          </div>

          <Button
            :label="t('login.start')"
            icon="pi pi-check"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!displayName.trim()"
            @click="handleSetName"
          />
        </div>
      </div>

      <p class="login__footer">
        {{ t('login.terms') }}<br>
        <a href="#">{{ t('login.termsLink') }}</a> {{ t('login.and') }} <a href="#">{{ t('login.privacyLink') }}</a>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.login {
  min-height: 100vh;
  @include flex-center;
  position: relative;
  padding: $spacing-lg;

  &__background {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: linear-gradient(135deg, $primary 0%, $primary-dark 50%, $accent-dark 100%);
  }

  &__pattern {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    background-image: 
      radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
      radial-gradient(circle at 75% 75%, white 2px, transparent 2px);
    background-size: 60px 60px;
  }

  &__container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
  }

  &__card {
    @include card;
    padding: $spacing-2xl;
  }

  &__header {
    text-align: center;
    margin-bottom: $spacing-xl;
  }

  &__logo {
    width: 72px;
    height: 72px;
    @include gradient-primary;
    border-radius: $radius-xl;
    @include flex-center;
    color: white;
    font-weight: 700;
    font-size: $font-size-3xl;
    margin: 0 auto $spacing-lg;
    box-shadow: $shadow-lg;
  }

  &__title {
    font-size: $font-size-2xl;
    margin-bottom: $spacing-xs;
  }

  &__subtitle {
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  &__demo-notice {
    text-align: center;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: rgba($warning, 0.1);
    border-radius: $radius-md;
    
    p {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: $spacing-xs;
    }
  }

  &__demo-badge {
    display: inline-block;
    background: $warning;
    color: $text-primary;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: 700;
  }

  &__form {
    @include flex-column;
    gap: $spacing-md;
  }

  &__form-group {
    @include flex-column;
    gap: $spacing-xs;
  }

  &__label {
    font-weight: 500;
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  &__input {
    width: 100%;
  }

  &__hint-error {
    color: $error;
    font-size: $font-size-xs;
  }

  &__btn {
    width: 100%;
    padding: $spacing-md $spacing-lg;
    @include gradient-primary;
    border: none;
    font-weight: 600;
    margin-top: $spacing-sm;

    &:hover:not(:disabled) {
      opacity: 0.95;
    }

    &--outline {
      background: transparent;
      border: 2px solid $primary;
      color: $primary;
    }
  }

  &__forgot {
    align-self: flex-end;
    background: transparent;
    border: none;
    color: $primary;
    font-size: $font-size-sm;
    cursor: pointer;
    padding: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  &__back {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    background: transparent;
    border: none;
    color: $text-secondary;
    cursor: pointer;
    font-size: $font-size-sm;
    padding: 0;
    margin-bottom: $spacing-sm;

    &:hover {
      color: $primary;
    }
  }

  &__switch {
    text-align: center;
    color: $text-secondary;
    font-size: $font-size-sm;
    margin-top: $spacing-md;

    button {
      background: transparent;
      border: none;
      color: $primary;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      margin-left: $spacing-xs;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__info {
    text-align: center;
    color: $text-secondary;
    line-height: 1.6;
    margin-bottom: $spacing-sm;

    strong {
      color: $text-primary;
    }
  }

  &__error {
    text-align: center;
    color: $error;
    font-size: $font-size-sm;
    padding: $spacing-sm;
    background: rgba($error, 0.1);
    border-radius: $radius-md;
  }

  &__success {
    text-align: center;
    padding: $spacing-lg;

    .pi-check-circle {
      font-size: 3rem;
      color: $success;
      margin-bottom: $spacing-md;
    }

    p {
      color: $text-secondary;
      margin-bottom: $spacing-lg;
    }
  }

  &__footer {
    text-align: center;
    color: rgba(white, 0.7);
    font-size: $font-size-sm;
    margin-top: $spacing-xl;
    line-height: 1.6;

    a {
      color: white;
      text-decoration: underline;

      &:hover {
        text-decoration: none;
      }
    }
  }
}
</style>
