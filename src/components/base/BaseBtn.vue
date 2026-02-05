<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'hero'
  variant?: 'primary' | 'surface' | 'ghost'
}>()
</script>

<template>
  <button 
    class="
      relative overflow-hidden rounded-full font-medium transition-all duration-200
      active:scale-95 flex items-center justify-center select-none
      tap-highlight-transparent
    "
    :class="{
      'w-12 h-12 text-sm': size === 'sm',
      'w-16 h-16 text-base': size === 'md' || !size,
      'w-20 h-20 text-lg': size === 'lg',
      'w-64 h-64 text-4xl shadow-2xl shadow-primary/20': size === 'hero',
      
      'bg-primary text-primary-foreground hover:bg-primary-dark': variant === 'primary' || !variant,
      'bg-surface-variant text-neutral-900 border border-outline-light dark:border-outline-dark': variant === 'surface',
      'bg-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800': variant === 'ghost',
    }"
  >
    <!-- Ripple effect can be added here or via directive -->
    <slot />
  </button>
</template>

<style scoped>
.tap-highlight-transparent {
  -webkit-tap-highlight-color: transparent;
}
</style>
