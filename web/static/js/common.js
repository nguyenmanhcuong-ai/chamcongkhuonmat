/** Shared utilities — tablet / WebView / APK */

export function isNativeApp() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

export function getApiBase() {
  const v = localStorage.getItem("apiBase");
  return v ? v.replace(/\/$/, "") : "";
}

export function setApiBase(url) {
  localStorage.setItem("apiBase", url.replace(/\/$/, ""));
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}

export async function ensureApiConfigured() {
  if (!isNativeApp()) return true;
  if (!getApiBase()) {
    window.location.replace("setup.html");
    return false;
  }
  return true;
}

const ICONS = {  idle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7"/></svg>`,
  collecting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
  matched: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
  unknown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>`,
  cooldown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>`,
};

export function setStatusIcon(el, name) {
  if (el) el.innerHTML = ICONS[name] || ICONS.idle;
}

export function initClock() {
  const timeEl = document.getElementById("clockTime");
  const dateEl = document.getElementById("clockDate");
  if (!timeEl || !dateEl) return;

  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    dateEl.textContent = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  tick();
  setInterval(tick, 1000);
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export async function createSession() {
  const res = await apiFetch("/api/session", { method: "POST" });
  if (!res.ok) throw new Error("Không tạo được phiên");
  const data = await res.json();
  return data.session_id;
}

export function captureFrame(video, canvas, quality = 0.65, maxWidth = 480) {
  const ctx = canvas.getContext("2d");
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export function captureSize(canvas) {
  return { w: canvas.width, h: canvas.height };
}

export function drawBbox(overlay, bbox, color = "#22c55e") {
  const ctx = overlay.getContext("2d");
  const w = overlay.width;
  const h = overlay.height;
  ctx.clearRect(0, 0, w, h);
  if (!bbox) return;

  const [x1, y1, x2, y2] = bbox;
  const scaleX = w / overlay.dataset.sourceW;
  const scaleY = h / overlay.dataset.sourceH;
  const rx1 = w - x2 * scaleX;
  const rx2 = w - x1 * scaleX;
  const ry1 = y1 * scaleY;
  const ry2 = y2 * scaleY;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
}

export async function startCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function showToast(el, message, duration = 3500, type = "") {
  el.textContent = message;
  el.className = "toast show" + (type ? ` is-${type}` : "");
  setTimeout(() => {
    el.className = "toast";
  }, duration);
}

export function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function formatTimeFull(iso) {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
}

initClock();
