<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { useSettingsStore } from './stores/settingsStore';
import PinLock from './components/business/PinLock.vue';

const settingsStore = useSettingsStore();
const router = useRouter();

// 动态过渡名称
const transitionName = ref('fade-up');

// 监听路由变化，只对 Settings 使用滑动过渡
watch(() => router.currentRoute.value, (to, from) => {
  const toSettings = to.name === 'settings';
  const fromSettings = from?.name === 'settings';
  
  if (toSettings) {
    // 进入 Settings -> 左滑
    transitionName.value = 'slide-left';
  } else if (fromSettings) {
    // 离开 Settings -> 右滑
    transitionName.value = 'slide-right';
  } else {
    // 其他页面间切换 -> 渐变 + 上浮
    transitionName.value = 'fade-up';
  }
});

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
      <transition :name="transitionName">
        <component :is="Component" :key="$route.path" class="page-wrapper" />
      </transition>
    </RouterView>
  </div>
</template>

<style>
/* 页面容器 - 并行过渡时需要绝对定位避免闪烁 */
.page-wrapper {
  position: absolute;
  inset: 0;
  background: inherit;
}

/* 渐变 + 上浮过渡（默认，用于 history/stats） */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.25s ease, transform 0.28s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 左滑过渡（进入 Settings） */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-20%);
  opacity: 0;
}

/* 右滑过渡（离开 Settings） */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
}

.slide-right-enter-from {
  transform: translateX(-20%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
