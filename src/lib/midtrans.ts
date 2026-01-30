// Midtrans Snap.js helper to prevent duplicate popup calls
let isSnapLoading = false;
let isSnapOpen = false;
let currentSnapToken: string | null = null;

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
  if (!window.snap) {
    console.error('Snap.js not loaded');
    return false;
  }
  
  // IMPORTANT: Always hide any existing popup first to reset Snap.js internal state
  // This prevents "Invalid state transition from PopupInView to PopupInView" error
  try {
    window.snap.hide();
  } catch (e) {
    // Ignore errors if no popup is open
    console.log('No existing popup to hide');
  }
  
  // Small delay to ensure Snap.js state is reset
  setTimeout(() => {
    isSnapOpen = true;
    currentSnapToken = token;
    
    try {
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          isSnapOpen = false;
          currentSnapToken = null;
          callbacks.onSuccess(result);
        },
        onPending: (result: any) => {
          isSnapOpen = false;
          currentSnapToken = null;
          callbacks.onPending(result);
        },
        onError: (result: any) => {
          isSnapOpen = false;
          currentSnapToken = null;
          callbacks.onError(result);
        },
        onClose: () => {
          isSnapOpen = false;
          currentSnapToken = null;
          callbacks.onClose();
        },
      });
    } catch (error) {
      console.error('Error opening Snap popup:', error);
      isSnapOpen = false;
      currentSnapToken = null;
      // Try to hide and reset on error
      try {
        window.snap.hide();
      } catch (e) {}
    }
  }, 100);
  
  return true;
}

export function isSnapPopupOpen(): boolean {
  return isSnapOpen;
}

export function resetSnapState(): void {
  isSnapOpen = false;
  currentSnapToken = null;
  
  // Also try to hide any existing Snap popup
  if (window.snap) {
    try {
      window.snap.hide();
    } catch (e) {
      // Ignore errors
    }
  }
}

export function hideSnapPopup(): void {
  if (window.snap) {
    try {
      window.snap.hide();
      isSnapOpen = false;
      currentSnapToken = null;
    } catch (e) {
      console.error('Error hiding Snap popup:', e);
    }
  }
}
