<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '../../stores/settingsStore';

const props = defineProps<{
  mode: 'unlock' | 'setup' | 'confirm'
}>();

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'cancel'): void
}>();

const settingsStore = useSettingsStore();

const pin = ref('');
const confirmPin = ref('');
const error = ref('');
const step = ref<'enter' | 'confirm'>('enter');

// 根据模式显示不同标题
const title = computed(() => {
  if (props.mode === 'unlock') return 'Enter PIN';
  if (props.mode === 'setup') {
    return step.value === 'enter' ? 'Create PIN' : 'Confirm PIN';
  }
  return 'Enter PIN';
});

const subtitle = computed(() => {
  if (props.mode === 'unlock') return 'Enter your 4-digit PIN to unlock';
  if (props.mode === 'setup') {
    return step.value === 'enter' ? 'Create a 4-digit PIN' : 'Enter the same PIN again';
  }
  return '';
});

// 当前输入的 PIN
const currentPin = computed(() => {
  return step.value === 'confirm' ? confirmPin.value : pin.value;
});

// 数字键盘
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function handleKey(key: string) {
  error.value = '';
  
  if (key === 'del') {
    if (step.value === 'confirm') {
      confirmPin.value = confirmPin.value.slice(0, -1);
    } else {
      pin.value = pin.value.slice(0, -1);
    }
    return;
  }
  
  if (key === '') return;
  
  if (step.value === 'confirm') {
    if (confirmPin.value.length < 4) {
      confirmPin.value += key;
    }
  } else {
    if (pin.value.length < 4) {
      pin.value += key;
    }
  }
}

// 监听 PIN 输入完成
watch(() => pin.value.length, (len) => {
  if (len === 4) {
    if (props.mode === 'unlock') {
      // 验证 PIN
      if (settingsStore.verifyPin(pin.value)) {
        emit('success');
      } else {
        error.value = 'Incorrect PIN';
        pin.value = '';
        // 触发震动反馈
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } else if (props.mode === 'setup') {
      // 进入确认步骤
      step.value = 'confirm';
    }
  }
});

watch(() => confirmPin.value.length, (len) => {
  if (len === 4 && step.value === 'confirm') {
    if (confirmPin.value === pin.value) {
      // PIN 匹配，设置成功
      settingsStore.setPin(pin.value);
      emit('success');
    } else {
      error.value = 'PINs do not match';
      confirmPin.value = '';
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }
});
</script>

<template>
  <div class="fixed inset-0 bg-surface-light dark:bg-surface-dark z-50 flex flex-col items-center justify-center safe-top safe-bottom">
    <!-- 标题区域 -->
    <div class="text-center mb-12">
      <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <span class="material-symbols-rounded text-3xl text-primary" style="font-variation-settings: 'FILL' 1;">lock</span>
      </div>
      <h1 class="text-2xl font-bold mb-2">{{ title }}</h1>
      <p class="text-neutral-500 text-sm">{{ subtitle }}</p>
    </div>
    
    <!-- PIN 显示点 -->
    <div class="flex gap-4 mb-8">
      <div 
        v-for="i in 4" 
        :key="i"
        class="w-4 h-4 rounded-full transition-all duration-200"
        :class="currentPin.length >= i ? 'bg-primary scale-110' : 'bg-neutral-300 dark:bg-neutral-600'"
      ></div>
    </div>
    
    <!-- 错误提示 -->
    <div class="h-6 mb-4">
      <p v-if="error" class="text-red-500 text-sm animate-shake">{{ error }}</p>
    </div>
    
    <!-- 数字键盘 -->
    <div class="grid grid-cols-3 gap-4 max-w-xs">
      <button
        v-for="key in keys"
        :key="key"
        @click="handleKey(key)"
        class="w-20 h-20 rounded-full text-2xl font-medium transition-all duration-150 active:scale-95 flex items-center justify-center select-none"
        :class="key === '' ? 'bg-transparent cursor-default' : 'bg-surface-variant dark:bg-surface-variant-dark hover:bg-neutral-200 dark:hover:bg-neutral-700'"
        :disabled="key === ''"
      >
        <span v-if="key === 'del'" class="material-symbols-rounded text-xl text-neutral-500">backspace</span>
        <span v-else>{{ key }}</span>
      </button>
    </div>
    
    <!-- 取消按钮 (仅设置模式) -->
    <button 
      v-if="mode === 'setup'"
      @click="emit('cancel')"
      class="mt-8 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-medium"
    >
      Cancel
    </button>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
