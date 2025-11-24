/**
 * Toast notification utility
 * Simple API for showing toast messages throughout the extension
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastInstance {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

class ToastManager {
  private toasts: ToastInstance[] = [];
  private listeners: Array<(toasts: ToastInstance[]) => void> = [];

  show(options: ToastOptions): string {
    const toast: ToastInstance = {
      id: Math.random().toString(36).substr(2, 9),
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    return toast.id;
  }

  success(message: string, duration?: number): string {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number): string {
    return this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number): string {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number): string {
    return this.show({ message, type: 'info', duration });
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  subscribe(callback: (toasts: ToastInstance[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.toasts); // Immediately call with current toasts

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

// Export singleton instance
export const toast = new ToastManager();
export type { ToastInstance };
