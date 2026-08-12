export function getCurrentUser() {
  const saved = localStorage.getItem("beautyDiaryUser");
  if (saved) return JSON.parse(saved);

  return null;
}

export function saveSession(user, token) {
  localStorage.setItem("beautyDiaryUser", JSON.stringify(user));
  localStorage.setItem("beautyDiaryToken", token);
}

export function getAccessToken() {
  return localStorage.getItem("beautyDiaryToken") || "";
}

export function saveAccessToken(token) {
  localStorage.setItem("beautyDiaryToken", token);
}

export function logout() {
  localStorage.removeItem("beautyDiaryUser");
  localStorage.removeItem("beautyDiaryToken");
}
