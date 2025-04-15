// src/utils/cookieUtils.ts
export function setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Priority=High`;
  }
  
  export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }
  
  export async function sendConsentToBackend(
    consentGiven: boolean,
    services: number[],
    accessToken?: string
  ) {
    const headers = accessToken
      ? {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }
      : { 'Content-Type': 'application/json' };
    const response = await fetch('/api/cookies/consent', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        consent_given: consentGiven,
        services,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to save consent: ${response.status}`);
    }
    return response.json();
  }