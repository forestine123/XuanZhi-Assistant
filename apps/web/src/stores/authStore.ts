import type { LoginResponse } from '../types/protocol';

const authTokenKey = 'xuanzhi.auth.token';

export function getAuthToken() {
  return window.localStorage.getItem(authTokenKey);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(authTokenKey, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(authTokenKey);
}

export function persistLogin(response: LoginResponse) {
  setAuthToken(response.token);
}
