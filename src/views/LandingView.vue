<template>
  <div class="landing">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__background">
        <div class="hero__pattern"></div>
        <div class="hero__gradient"></div>
      </div>
      
      <nav class="nav">
        <div class="nav__container">
          <div class="nav__logo">
            <img :src="logoUrl" alt="Logo" class="nav__logo-icon" />
            <span class="nav__logo-text">{{ t('app.name') }}</span>
          </div>
          <div class="nav__actions">
            <router-link 
              v-if="isAuthenticated" 
              to="/dashboard" 
              class="btn btn--primary"
              @click="handleCTAClick('cta_nav_dashboard')"
            >
              {{ t('nav.dashboard') }}
            </router-link>
            <router-link 
              v-else 
              to="/login" 
              class="btn btn--primary"
              @click="handleCTAClick('cta_nav_login')"
            >
              {{ t('nav.login') }}
            </router-link>
          </div>
        </div>
      </nav>

      <div class="hero__content">
        <div class="hero__text">
          <h1 class="hero__title">
            {{ t('landing.hero.title') }}
            <span class="hero__title-highlight">{{ t('landing.hero.titleHighlight') }}</span>
          </h1>
          <p class="hero__subtitle">{{ t('landing.hero.subtitle') }}</p>
          <div class="hero__cta">
            <router-link 
              to="/login" 
              class="btn btn--large btn--primary"
              @click="handleCTAClick('cta_hero_primary', 'bat_dau_mien_phi')"
            >
              {{ t('landing.hero.cta') }}
              <i class="pi pi-arrow-right"></i>
            </router-link>
            <a 
              href="#features" 
              class="btn btn--large btn--outline"
              @click="handleCTAClick('cta_hero_secondary', 'tim_hieu_them')"
            >
              {{ t('landing.hero.ctaSecondary') }}
            </a>
          </div>
        </div>
        
        <div class="hero__visual">
          <div class="hero__card hero__card--1">
            <div class="hero__card-icon">📊</div>
            <div class="hero__card-text">Dashboard</div>
          </div>
          <div class="hero__card hero__card--2">
            <div class="hero__card-icon">👥</div>
            <div class="hero__card-text">12 hụi viên</div>
          </div>
          <div class="hero__card hero__card--3">
            <div class="hero__card-icon">💰</div>
            <div class="hero__card-text">5.000.000₫</div>
          </div>
          <div class="hero__main-card">
            <div class="hero__main-header">
              <span class="hero__main-title">Hụi Tết 2026</span>
              <span class="hero__main-badge">Đang hoạt động</span>
            </div>
            <div class="hero__main-stats">
              <div class="hero__main-stat">
                <span class="hero__main-stat-value">12</span>
                <span class="hero__main-stat-label">Kỳ</span>
              </div>
              <div class="hero__main-stat">
                <span class="hero__main-stat-value">60tr</span>
                <span class="hero__main-stat-label">Tổng</span>
              </div>
              <div class="hero__main-stat">
                <span class="hero__main-stat-value">75%</span>
                <span class="hero__main-stat-label">Tiến độ</span>
              </div>
            </div>
            <div class="hero__main-progress">
              <div class="hero__main-progress-bar" style="width: 75%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hero__scroll">
        <i class="pi pi-chevron-down"></i>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="container">
        <div class="stats__grid">
          <div class="stats__item">
            <span class="stats__value">500+</span>
            <span class="stats__label">{{ t('landing.stats.users') }}</span>
          </div>
          <div class="stats__item">
            <span class="stats__value">2,000+</span>
            <span class="stats__label">{{ t('landing.stats.huiGroups') }}</span>
          </div>
          <div class="stats__item">
            <span class="stats__value">50K+</span>
            <span class="stats__label">{{ t('landing.stats.transactions') }}</span>
          </div>
          <div class="stats__item">
            <span class="stats__value">99%</span>
            <span class="stats__label">{{ t('landing.stats.satisfaction') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ t('landing.features.title') }}</h2>
          <p class="section-subtitle">{{ t('landing.features.subtitle') }}</p>
        </div>
        
        <div class="features__grid">
          <div 
            v-for="(feature, key) in features" 
            :key="key" 
            class="feature-card"
            :class="`feature-card--${key}`"
          >
            <div class="feature-card__icon">{{ feature.icon }}</div>
            <h3 class="feature-card__title">{{ t(`landing.features.items.${key}.title`) }}</h3>
            <p class="feature-card__description">{{ t(`landing.features.items.${key}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-header section-header--light">
          <h2 class="section-title">{{ t('landing.howItWorks.title') }}</h2>
          <p class="section-subtitle">{{ t('landing.howItWorks.subtitle') }}</p>
        </div>
        
        <div class="steps">
          <div class="step" v-for="n in 3" :key="n">
            <div class="step__number">{{ n }}</div>
            <div class="step__content">
              <h3 class="step__title">{{ t(`landing.howItWorks.steps.step${n}.title`) }}</h3>
              <p class="step__description">{{ t(`landing.howItWorks.steps.step${n}.description`) }}</p>
            </div>
            <div v-if="n < 3" class="step__connector">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <div class="cta__content">
          <h2 class="cta__title">{{ t('landing.cta.title') }}</h2>
          <p class="cta__subtitle">{{ t('landing.cta.subtitle') }}</p>
          <router-link 
            to="/login" 
            class="btn btn--large btn--white"
            @click="handleCTAClick('cta_footer_signup', 'dang_ky_mien_phi')"
          >
            {{ t('landing.cta.button') }}
            <i class="pi pi-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__content">
          <div class="footer__logo">
            <img :src="logoUrl" alt="Logo" class="footer__logo-icon" />
            <span class="footer__logo-text">{{ t('app.name') }}</span>
          </div>
          <div class="footer__info">
            <p>{{ t('landing.footer.madeWith') }} <span class="footer__heart">❤️</span> {{ t('landing.footer.inVietnam') }}</p>
            <p class="footer__copyright">{{ t('landing.footer.copyright', { year: currentYear }) }}</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores'
import { useAnalytics, type CTAEventName } from '@/composables/useAnalytics'
import logoUrl from '/favicon.svg?url'

const { t } = useI18n()
const authStore = useAuthStore()
const { trackCTAClick } = useAnalytics()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentYear = new Date().getFullYear()

const features = {
  members: { icon: '👥' },
  periods: { icon: '📅' },
  payments: { icon: '💳' },
  reports: { icon: '📊' },
  security: { icon: '🔐' },
  mobile: { icon: '📱' }
}

// CTA tracking handlers
function handleCTAClick(eventName: CTAEventName, label?: string) {
  trackCTAClick(eventName, label)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

// Typography - Use design tokens
$font-display: 'Playfair Display', 'Noto Serif', Georgia, serif;
$font-body: $font-family;

// Colors - Use design tokens from _variables.scss
$color-primary: $primary;
$color-primary-dark: $primary-dark;
$color-primary-light: $primary-light;
$color-secondary: $accent-dark;
$color-accent: $secondary;
$color-cream: $surface-alt;
$color-warm-white: $background;
$color-text: $text-primary;
$color-text-light: $text-secondary;
$color-gold: $secondary-light;

// Opacity tokens for consistent contrast
$opacity-high: 0.95;      // High emphasis text on colored backgrounds
$opacity-medium: 0.85;    // Medium emphasis text
$opacity-low: 0.75;       // Low emphasis/muted text

// Landing page styles
.landing {
  font-family: $font-body;
  color: $color-text;
  overflow-x: hidden;
}

.container {
  max-width: $breakpoint-xl;
  margin: 0 auto;
  padding: 0 $spacing-lg;
}

// Button styles
.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-md;
  font-weight: 600;
  font-size: $font-size-sm;
  text-decoration: none;
  transition: all $transition-base;
  cursor: pointer;
  border: none;
  
  &--primary {
    background: $color-primary;
    color: white;
    
    &:hover {
      background: $color-primary-dark;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba($color-primary, 0.35);
    }
  }
  
  &--outline {
    background: transparent;
    color: $color-secondary;
    border: 2px solid rgba($color-secondary, 0.2);
    
    &:hover {
      border-color: $color-primary;
      color: $color-primary;
    }
  }
  
  &--white {
    background: white;
    color: $color-primary;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  }
  
  &--large {
    padding: $spacing-md $spacing-xl;
    font-size: $font-size-base;
  }
}

// Navigation
.nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.5rem 0;
  
  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  &__logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: $font-display;
    font-size: 1.5rem;
    font-weight: 700;
    color: $color-secondary;
  }
  
  &__logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
}

// Hero section
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-warm-white;
  
  &__background {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  
  &__pattern {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba($color-primary, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba($color-gold, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba($color-accent, 0.03) 0%, transparent 70%);
  }
  
  &__gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(to top, $color-cream, transparent);
  }
  
  &__content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 8rem 1.5rem 4rem;
    position: relative;
    z-index: 10;
    
    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      text-align: center;
      padding-top: 7rem;
    }
  }
  
  &__text {
    @media (max-width: 900px) {
      order: 2;
    }
  }
  
  &__title {
    font-family: $font-display;
    font-size: clamp(2.5rem, 5vw, 3.75rem);
    font-weight: 700;
    line-height: 1.2;
    color: $color-secondary;
    margin-bottom: 1.5rem;
  }
  
  &__title-highlight {
    display: block;
    color: $color-primary;
    background: linear-gradient(135deg, $color-primary, $color-primary-light);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  &__subtitle {
    font-size: 1.2rem;
    color: $color-text-light;
    line-height: 1.7;
    margin-bottom: 2.5rem;
    max-width: 500px;
    
    @media (max-width: 900px) {
      margin-left: auto;
      margin-right: auto;
    }
  }
  
  &__cta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    
    @media (max-width: 900px) {
      justify-content: center;
    }
  }
  
  &__visual {
    position: relative;
    height: 450px;
    overflow: hidden;
    
    @media (max-width: 900px) {
      order: 1;
      height: 320px;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 500px) {
      height: 280px;
    }
  }
  
  &__card {
    position: absolute;
    background: $surface;
    border-radius: $radius-md;
    padding: $spacing-md $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    box-shadow: $shadow-lg;
    animation: float 6s ease-in-out infinite;
    font-size: $font-size-sm;
    white-space: nowrap;
    
    @media (max-width: 900px) {
      padding: 0.75rem 0.875rem;
      font-size: 0.8rem;
    }
    
    @media (max-width: 500px) {
      display: none;
    }
    
    &--1 {
      top: 8%;
      left: 5%;
      animation-delay: 0s;
    }
    
    &--2 {
      top: 25%;
      right: 5%;
      animation-delay: 1s;
    }
    
    &--3 {
      bottom: 25%;
      left: 8%;
      animation-delay: 2s;
    }
  }
  
  &__card-icon {
    font-size: 1.5rem;
  }
  
  &__card-text {
    font-weight: 600;
    color: $color-secondary;
  }
  
  &__main-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: $surface;
    border-radius: $radius-xl;
    padding: $spacing-lg;
    width: 260px;
    box-shadow: $shadow-xl;
    border: 1px solid rgba($color-gold, 0.2);
    z-index: $z-dropdown;
    
    @media (max-width: 900px) {
      width: 240px;
      padding: 1.25rem;
    }
    
    @media (max-width: 500px) {
      width: 220px;
      padding: 1rem;
    }
  }
  
  &__main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  &__main-title {
    font-family: $font-display;
    font-weight: 700;
    font-size: 1.1rem;
    color: $color-secondary;
  }
  
  &__main-badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    background: rgba($color-primary, 0.1);
    color: $color-primary;
    border-radius: 20px;
    font-weight: 600;
  }
  
  &__main-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  
  &__main-stat {
    text-align: center;
  }
  
  &__main-stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: $color-secondary;
  }
  
  &__main-stat-label {
    font-size: 0.8rem;
    color: $color-text-light;
  }
  
  &__main-progress {
    height: 8px;
    background: $color-cream;
    border-radius: 4px;
    overflow: hidden;
  }
  
  &__main-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $color-primary, $color-primary-light);
    border-radius: 4px;
    transition: width 1s ease;
  }
  
  &__scroll {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    animation: bounce 2s infinite;
    color: $color-text-light;
    font-size: 1.5rem;
    z-index: 10;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

// Stats section
.stats {
  background: $color-secondary;
  padding: 3rem 0;
  
  @media (max-width: 768px) {
    padding: 2.5rem 0;
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    text-align: center;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    @media (max-width: 400px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }
  
  &__item {
    padding: 0.75rem 0.5rem;
  }
  
  &__value {
    display: block;
    font-family: $font-display;
    font-size: 2.5rem;
    font-weight: 700;
    color: $color-gold;
    margin-bottom: 0.25rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
    
    @media (max-width: 400px) {
      font-size: 1.5rem;
    }
  }
  
  &__label {
    color: rgba(white, $opacity-medium);
    font-size: $font-size-sm;
    
    @media (max-width: 400px) {
      font-size: $font-size-xs;
    }
  }
}

// Section header
.section-header {
  text-align: center;
  margin-bottom: 4rem;
  
  &--light {
    .section-title,
    .section-subtitle {
      color: white;
    }
    
    .section-subtitle {
      color: rgba(white, $opacity-high);
    }
  }
}

.section-title {
  font-family: $font-display;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  color: $color-secondary;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.15rem;
  color: $color-text-light;
  max-width: 600px;
  margin: 0 auto;
}

// Features section
.features {
  padding: $spacing-3xl 0;
  background: $color-cream;
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-xl;
    
    @media (max-width: $breakpoint-lg) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: $breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }
}

.feature-card {
  background: $surface;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  transition: all $transition-base;
  border: 1px solid transparent;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-xl;
    border-color: rgba($color-primary, 0.2);
  }
  
  &__icon {
    font-size: $font-size-4xl;
    margin-bottom: $spacing-md;
  }
  
  &__title {
    font-family: $font-display;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-secondary;
    margin-bottom: $spacing-sm;
  }
  
  &__description {
    color: $color-text-light;
    line-height: 1.6;
    font-size: $font-size-sm;
  }
}

// How it works section
.how-it-works {
  padding: 6rem 0;
  background: linear-gradient(135deg, $color-secondary, darken($color-secondary, 8%));
}

.steps {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 900px) {
    flex-direction: column;
    align-items: center;
  }
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  max-width: 280px;
  position: relative;
  
  &__number {
    width: 60px;
    height: 60px;
    background: $color-primary;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba($color-primary, 0.4);
  }
  
  &__content {
    color: white;
  }
  
  &__title {
    font-family: $font-display;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: white;
  }
  
  &__description {
    color: rgba(white, $opacity-medium);
    line-height: 1.6;
    font-size: $font-size-sm;
  }
  
  &__connector {
    position: absolute;
    top: 30px;
    right: -20px;
    color: rgba(white, 0.3);
    font-size: 1.25rem;
    
    @media (max-width: 900px) {
      display: none;
    }
  }
}

// CTA section
.cta {
  padding: 6rem 0;
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  text-align: center;
  
  &__title {
    font-family: $font-display;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
  }
  
  &__subtitle {
    color: rgba(white, $opacity-high);
    font-size: $font-size-lg;
    margin-bottom: $spacing-xl;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
}

// Footer
.footer {
  background: $color-secondary;
  padding: 3rem 0;
  
  &__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
    
    @media (max-width: 600px) {
      flex-direction: column;
      text-align: center;
    }
  }
  
  &__logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: $font-display;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }
  
  &__logo-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }
  
  &__info {
    color: rgba(white, $opacity-low);
    text-align: right;
    font-size: $font-size-sm;
    
    @media (max-width: $breakpoint-sm) {
      text-align: center;
    }
  }
  
  &__heart {
    display: inline-block;
    animation: heartbeat 1.5s infinite;
  }
  
  &__copyright {
    margin-top: 0.5rem;
  }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>

