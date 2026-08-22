let accessToken = "";

export function getCurrentUser() {
  try {
    const saved = sessionStorage.getItem("beautyDiaryUser");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveSession(user, token) {
  sessionStorage.setItem("beautyDiaryUser", JSON.stringify(user));
  accessToken = token || "";
}

export function getAccessToken() {
  return accessToken;
}

export function saveAccessToken(token) {
  accessToken = token || "";
}

export function logout() {
  sessionStorage.removeItem("beautyDiaryUser");
  accessToken = "";
}
