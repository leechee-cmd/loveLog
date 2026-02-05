<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="bg-surface-light dark:bg-surface-dark h-screen overflow-hidden flex flex-col text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
    <!-- Main Content Area -->
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
