(function () {
  function applyNative() {
    if (window.Capacitor?.isNativePlatform?.()) {
      document.body?.classList.add("native-app");
    }
  }

  function applyLandscape() {
    const land = window.innerWidth > window.innerHeight;
    document.body?.classList.toggle("is-landscape", land);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyNative();
      applyLandscape();
    });
  } else {
    applyNative();
    applyLandscape();
  }

  window.addEventListener("resize", applyLandscape);
  window.addEventListener("orientationchange", applyLandscape);
})();
