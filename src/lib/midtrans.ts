// Midtrans Snap.js helper to prevent duplicate popup calls
let isSnapLoading = false;
let isSnapOpen = false;

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
      hide: () => void;
    };
  }
}

export async function loadSnapScript(clientKey: string, isProduction: boolean): Promise<void> {
  // Already loaded
  if (window.snap) return;
  
  // Prevent multiple loads
  if (isSnapLoading) {
    // Wait for existing load to complete
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.snap) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
    return;
  }
  
  isSnapLoading = true;
  
  try {
    const script = document.createElement('script');
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey);
    document.body.appendChild(script);
    
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
    });
  } finally {
    isSnapLoading = false;
  }
}

export function openSnapPayment(
  token: string,
  callbacks: {
    onSuccess: (result: any) => void;
    onPending: (result: any) => void;
    onError: (result: any) => void;
    onClose: () => void;
  }
): boolean {
  // Prevent opening if already open
  if (isSnapOpen) {
    console.warn('Snap popup is already open');
    return false;
  }
  
  if (!window.snap) {
    console.error('Snap.js not loaded');
    return false;
  }
  
  isSnapOpen = true;
  
  window.snap.pay(token, {
    onSuccess: (result: any) => {
      isSnapOpen = false;
      callbacks.onSuccess(result);
    },
    onPending: (result: any) => {
      isSnapOpen = false;
      callbacks.onPending(result);
    },
    onError: (result: any) => {
      isSnapOpen = false;
      callbacks.onError(result);
    },
    onClose: () => {
      isSnapOpen = false;
      callbacks.onClose();
    },
  });
  
  return true;
}

export function isSnapPopupOpen(): boolean {
  return isSnapOpen;
}

export function resetSnapState(): void {
  isSnapOpen = false;
}
