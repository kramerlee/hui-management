<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const step = ref<'phone' | 'otp' | 'name'>('phone')
const phone = ref('')
const otp = ref('')
const displayName = ref('')
const loading = ref(false)

onMounted(() => {
  authStore.initRecaptcha('recaptcha-container')
})

async function handleSendOTP() {
  if (!phone.value || phone.value.length < 9) return
  
  loading.value = true
  const success = await authStore.sendOTP(phone.value)
  loading.value = false
  
  if (success) {
    step.value = 'otp'
  }
}

async function handleVerifyOTP() {
  if (!otp.value || otp.value.length !== 6) return
  
  loading.value = true
  const success = await authStore.verifyOTP(otp.value, phone.value)
  loading.value = false
  
  if (success) {
    if (!authStore.userProfile?.displayName) {
      step.value = 'name'
    } else {
      router.push('/dashboard')
    }
  }
}

async function handleSetName() {
  if (!displayName.value.trim()) return
  
  loading.value = true
  await authStore.updateUserName(displayName.value.trim())
  loading.value = false
  
  router.push('/dashboard')
}

function goBack() {
  if (step.value === 'otp') {
    step.value = 'phone'
    otp.value = ''
  }
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
          <div class="login__logo">H</div>
          <h1 class="login__title">Quản Lý Hụi</h1>
          <p class="login__subtitle">Hệ thống quản lý dây hụi thông minh</p>
        </div>

        <!-- Phone Step -->
        <div v-if="step === 'phone'" class="login__form">
          <div class="login__form-group">
            <label class="login__label">Số điện thoại</label>
            <div class="login__phone-input">
              <span class="login__phone-prefix">+84</span>
              <InputText
                v-model="phone"
                placeholder="912 345 678"
                class="login__input"
                @keyup.enter="handleSendOTP"
              />
            </div>
          </div>

          <Button
            label="Tiếp tục"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!phone || phone.length < 9"
            @click="handleSendOTP"
          />

          <p v-if="authStore.error" class="login__error">
            {{ authStore.error }}
          </p>
        </div>

        <!-- OTP Step -->
        <div v-else-if="step === 'otp'" class="login__form">
          <button class="login__back" @click="goBack">
            <i class="pi pi-arrow-left"></i>
            Quay lại
          </button>

          <p class="login__info">
            <template v-if="authStore.isDemoMode">
              <span class="login__demo-badge">CHẾ ĐỘ DEMO</span><br>
              Nhập mã <strong>123456</strong> để đăng nhập
            </template>
            <template v-else>
              Mã xác nhận đã được gửi đến<br>
              <strong>+84 {{ phone }}</strong>
            </template>
          </p>

          <div class="login__form-group">
            <label class="login__label">Nhập mã OTP</label>
            <InputText
              v-model="otp"
              placeholder="000000"
              class="login__input login__input--otp"
              maxlength="6"
              @keyup.enter="handleVerifyOTP"
            />
          </div>

          <Button
            label="Xác nhận"
            icon="pi pi-check"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!otp || otp.length !== 6"
            @click="handleVerifyOTP"
          />

          <p v-if="authStore.error" class="login__error">
            {{ authStore.error }}
          </p>
        </div>

        <!-- Name Step -->
        <div v-else-if="step === 'name'" class="login__form">
          <p class="login__info">
            Chào mừng bạn! Hãy cho chúng tôi biết tên của bạn.
          </p>

          <div class="login__form-group">
            <label class="login__label">Họ và tên</label>
            <InputText
              v-model="displayName"
              placeholder="Nguyễn Văn A"
              class="login__input"
              @keyup.enter="handleSetName"
            />
          </div>

          <Button
            label="Bắt đầu"
            icon="pi pi-check"
            iconPos="right"
            class="login__btn"
            :loading="loading"
            :disabled="!displayName.trim()"
            @click="handleSetName"
          />
        </div>

        <div id="recaptcha-container"></div>
      </div>

      <p class="login__footer">
        Bằng việc đăng nhập, bạn đồng ý với<br>
        <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a>
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
    margin-bottom: $spacing-2xl;
  }

  &__logo {
    width: 72px;
    height: 72px;
    @include gradient-primary;
    border-radius: $radius-xl;
    @include flex-center;
    color: white;
    font-weight: 700;
    font-size: $font-size-4xl;
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

  &__form {
    @include flex-column;
    gap: $spacing-lg;
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

  &__phone-input {
    display: flex;
    align-items: center;
    background: $surface-alt;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__phone-prefix {
    padding: $spacing-md;
    background: rgba($primary, 0.1);
    color: $primary;
    font-weight: 600;
    border-right: 2px solid $surface;
  }

  &__input {
    flex: 1;
    border: none !important;
    background: transparent !important;

    &--otp {
      text-align: center;
      font-size: $font-size-2xl;
      letter-spacing: 0.5rem;
      font-weight: 600;
    }
  }

  &__btn {
    width: 100%;
    padding: $spacing-md $spacing-lg;
    @include gradient-primary;
    border: none;
    font-weight: 600;

    &:hover:not(:disabled) {
      opacity: 0.95;
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

    &:hover {
      color: $primary;
    }
  }

  &__info {
    text-align: center;
    color: $text-secondary;
    line-height: 1.6;

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

  &__demo-badge {
    display: inline-block;
    background: $warning;
    color: $text-primary;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: 700;
    margin-bottom: $spacing-sm;
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

