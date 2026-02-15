import { reactive } from 'vue';

// 对话框选项
export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert';
  danger?: boolean;
}

// 对话框状态
interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'confirm' | 'alert';
  danger: boolean;
  resolve: ((value: boolean) => void) | null;
}

const state = reactive<DialogState>({
  visible: false,
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'confirm',
  danger: false,
  resolve: null,
});

/**
 * 显示确认对话框，返回 Promise<boolean>
 */
function showConfirm(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    state.title = options.title || '';
    state.message = options.message;
    state.confirmText = options.confirmText || '确定';
    state.cancelText = options.cancelText || '取消';
    state.type = 'confirm';
    state.danger = options.danger || false;
    state.resolve = resolve;
    state.visible = true;
  });
}

/**
 * 显示提示对话框，返回 Promise<void>
 */
function showAlert(options: DialogOptions | string): Promise<void> {
  const opts = typeof options === 'string' ? { message: options } : options;
  return new Promise((resolve) => {
    state.title = opts.title || '';
    state.message = opts.message;
    state.confirmText = opts.confirmText || '确定';
    state.cancelText = '';
    state.type = 'alert';
    state.danger = false;
    state.resolve = () => resolve();
    state.visible = true;
  });
}

function handleConfirm() {
  state.visible = false;
  state.resolve?.(true);
  state.resolve = null;
}

function handleCancel() {
  state.visible = false;
  state.resolve?.(false);
  state.resolve = null;
}

export function useDialog() {
  return {
    state,
    showConfirm,
    showAlert,
    handleConfirm,
    handleCancel,
  };
}
