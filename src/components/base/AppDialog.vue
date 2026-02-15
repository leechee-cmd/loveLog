<script setup lang="ts">
import { useDialog } from '../../composables/useDialog';

const { state, handleConfirm, handleCancel } = useDialog();
</script>

<template>
  <!-- 遮罩层 -->
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div 
        v-if="state.visible" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-6"
        @click.self="state.type === 'alert' ? handleConfirm() : handleCancel()"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        
        <!-- 对话框主体 -->
        <Transition name="dialog-scale" appear>
          <div 
            v-if="state.visible"
            class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden"
          >
            <!-- 内容区域 -->
            <div class="px-6 pt-6 pb-4 text-center">
              <!-- 图标 -->
              <div 
                v-if="state.danger" 
                class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3"
              >
                <span class="material-symbols-rounded text-2xl text-red-500">warning</span>
              </div>

              <!-- 标题 -->
              <h3 
                v-if="state.title" 
                class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2"
              >
                {{ state.title }}
              </h3>
              
              <!-- 消息 -->
              <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {{ state.message }}
              </p>
            </div>

            <!-- 按钮区域 — iOS 风格分割线 -->
            <div class="border-t border-neutral-200 dark:border-neutral-700 flex" v-if="state.type === 'confirm'">
              <button
                @click="handleCancel"
                class="flex-1 py-3.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-95 transition-all border-r border-neutral-200 dark:border-neutral-700"
              >
                {{ state.cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="flex-1 py-3.5 text-sm font-semibold active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-95 transition-all"
                :class="state.danger ? 'text-red-500' : 'text-primary'"
              >
                {{ state.confirmText }}
              </button>
            </div>
            
            <!-- Alert 模式 — 单个按钮 -->
            <div class="border-t border-neutral-200 dark:border-neutral-700" v-else>
              <button
                @click="handleConfirm"
                class="w-full py-3.5 text-sm font-semibold text-primary active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-95 transition-all"
              >
                {{ state.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩渐入渐出 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* 对话框缩放弹出 */
.dialog-scale-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.dialog-scale-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.dialog-scale-enter-from {
  transform: scale(0.85);
  opacity: 0;
}
.dialog-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
