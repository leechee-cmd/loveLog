<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { useSettingsStore } from './stores/settingsStore';
import PinLock from './components/business/PinLock.vue';

const settingsStore = useSettingsStore();

onMounted(() => {
  // 检查锁定状态
  settingsStore.checkLockStatus();
});
</script>

<template>
  <div class="bg-surface-light dark:bg-surface-dark h-screen overflow-hidden flex flex-col text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
    <!-- PIN 锁屏 -->
    <PinLock 
      v-if="settingsStore.settings.security.pinEnabled && !settingsStore.isUnlocked"
      mode="unlock"
      @success="() => {}"
    />
    
    <!-- 主内容区域 -->
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
