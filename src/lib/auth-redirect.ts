const POST_SIGN_IN_PATH_KEY = "pd-stores-post-sign-in-path";

export function storePostSignInPath() {
  window.sessionStorage.setItem(
    POST_SIGN_IN_PATH_KEY,
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

export function consumePostSignInPath() {
  const path = window.sessionStorage.getItem(POST_SIGN_IN_PATH_KEY);
  window.sessionStorage.removeItem(POST_SIGN_IN_PATH_KEY);
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}
