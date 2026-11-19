"use client";

/**
 * Google Identity Services loader. The real login button only renders when
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured (see README for console setup).
 */

interface GsiButtonOptions {
  client_id: string;
  callback: (response: { credential: string }) => void;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GsiButtonOptions) => void;
    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<void> | null = null;

export function gsiClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  if (!id || id.startsWith("REPLACE_WITH")) return null;
  return id;
}

export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

export async function renderGoogleButton(
  container: HTMLElement,
  onCredential: (credential: string) => void,
): Promise<void> {
  const clientId = gsiClientId();
  if (!clientId) return;
  await loadGoogleScript();
  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => onCredential(response.credential),
  });
  container.innerHTML = "";
  window.google!.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    shape: "rectangular",
    text: "continue_with",
    logo_alignment: "left",
    width: 320,
  });
}
