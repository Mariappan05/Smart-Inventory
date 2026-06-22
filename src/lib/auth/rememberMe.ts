const REMEMBERED_USERNAME_KEY = "rememberedUsername";
const REMEMBER_ME_ENABLED_KEY = "rememberMeEnabled";

export function saveRememberedCredentials(username: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  localStorage.setItem(REMEMBER_ME_ENABLED_KEY, "true");
}

export function clearRememberedCredentials() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  localStorage.removeItem(REMEMBER_ME_ENABLED_KEY);
}

export function getRememberedCredentials() {
  if (typeof window === "undefined") return { username: "", rememberMe: false };
  
  const username = localStorage.getItem(REMEMBERED_USERNAME_KEY) || "";
  const rememberMe = localStorage.getItem(REMEMBER_ME_ENABLED_KEY) === "true";
  
  return { username, rememberMe };
}
