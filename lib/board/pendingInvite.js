// Remembers an invite across creator sign-up, in this browser only.
const KEY = "jrive:invite";

export function rememberInvite(token) {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // They can open the link again instead.
  }
}

export function pendingInvite() {
  try {
    return window.localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function forgetInvite() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}
