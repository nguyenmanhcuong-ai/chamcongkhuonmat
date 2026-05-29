(function () {
  function applyNative() {
    if (window.Capacitor?.isNativePlatform?.()) {
      document.body?.classList.add("native-app");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyNative);
  } else {
    applyNative();
  }
})();
