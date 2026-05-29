import {
  createSession,
  captureFrame,
  captureSize,
  drawBbox,
  startCamera,
  showToast,
  formatTime,
  formatScore,
  scoreClass,
  getInitials,
  setStatusIcon,
  apiFetch,
  ensureApiConfigured,
  initAppShell,
  speakFeedback,
} from "./common.js";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const captureCanvas = document.getElementById("captureCanvas");
const statusZone = document.getElementById("statusZone");
const statusIcon = document.getElementById("statusIcon");
const statusBadge = document.getElementById("statusBadge");
const statusDetail = document.getElementById("statusDetail");
const progressFill = document.getElementById("progressFill");
const progressWrap = document.getElementById("progressWrap");
const attendanceList = document.getElementById("attendanceList");
const historyCount = document.getElementById("historyCount");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const toast = document.getElementById("toast");
const successFlash = document.getElementById("successFlash");
const noEmployees = document.getElementById("noEmployees");

let sessionId = null;
let stream = null;
let loopActive = false;
let sending = false;
let pauseUntil = 0;
let lastServerHadFace = false;
let faceDetector = null;
let hasFaceDetector = false;

/** ms giữa các lần gọi API khi đang có mặt / đang nhận diện */
const INTERVAL_TRACKING = 160;
/** ms khi chưa thấy mặt (chỉ quét nhẹ, không spam server) */
const INTERVAL_SCAN = 700;

const STATUS = {
  idle: { title: "Sẵn sàng chấm công", icon: "idle", zone: "" },
  collecting: { title: "Đang nhận diện...", icon: "collecting", zone: "is-collecting" },
  matched: { title: "CHẤM CÔNG THÀNH CÔNG", icon: "matched", zone: "is-success" },
  unknown: { title: "Không nhận diện được", icon: "unknown", zone: "is-error" },
  cooldown: { title: "Đã chấm công", icon: "cooldown", zone: "is-warn" },
};

function applyZoneClass(zoneClass) {
  statusZone.className =
    "status-zone status-zone-sidebar" + (zoneClass ? ` ${zoneClass}` : "");
}

function flashSuccess() {
  if (!successFlash) return;
  successFlash.classList.add("show");
  setTimeout(() => successFlash.classList.remove("show"), 600);
}

function setStatus(result, { silentVoice = false } = {}) {
  const status = result.status || "idle";
  const cfg = STATUS[status] || STATUS.idle;

  applyZoneClass(cfg.zone);
  setStatusIcon(statusIcon, cfg.icon);
  statusBadge.textContent = cfg.title;

  if (status === "collecting") {
    progressWrap.classList.remove("hidden");
    progressFill.style.width = `${Math.round((result.progress || 0) * 100)}%`;
    statusDetail.textContent = "Giữ mặt trong khung — tối đa 3 giây";
    drawBbox(overlay, result.bbox, "#3b82f6");
    btnStart.classList.add("hidden");
    btnStop.classList.remove("hidden");
    lastServerHadFace = true;
  } else if (status === "matched") {
    progressWrap.classList.add("hidden");
    const sc = result.score != null ? ` · ${formatScore(result.score)}` : "";
    statusDetail.textContent = `Xin chào, ${result.name}!${sc}`;
    drawBbox(overlay, null);
    showToast(toast, `Chấm công thành công — ${result.name}`, 4000, "success");
    flashSuccess();
    if (!silentVoice) speakFeedback("success");
    loadAttendance();
    pauseUntil = Date.now() + 2500;
    lastServerHadFace = false;
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
    btnStart.disabled = false;
  } else if (status === "cooldown") {
    progressWrap.classList.add("hidden");
    statusDetail.textContent = result.message || "Có thể chấm lại sau vài giây";
    drawBbox(overlay, result.bbox, "#d97706");
    lastServerHadFace = !!result.bbox;
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
  } else if (status === "unknown") {
    progressWrap.classList.add("hidden");
    statusDetail.textContent = "Vui lòng thử lại hoặc đăng ký khuôn mặt nếu chưa có.";
    drawBbox(overlay, null);
    if (!silentVoice) speakFeedback("failure");
    pauseUntil = Date.now() + 1500;
    lastServerHadFace = false;
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
    btnStart.disabled = false;
  } else {
    progressWrap.classList.add("hidden");
    const waiting = loopActive && !lastServerHadFace;
    statusDetail.textContent =
      result.message ||
      (waiting ? "Đưa mặt vào khung — hệ thống sẽ tự nhận diện" : "Nhấn bắt đầu chấm công");
    drawBbox(overlay, null);
    lastServerHadFace = false;
    if (!loopActive) {
      btnStart.classList.remove("hidden");
      btnStop.classList.add("hidden");
    }
  }
}

async function initFaceDetector() {
  if (!("FaceDetector" in window)) return;
  try {
    faceDetector = new FaceDetector({ maxDetectedFaces: 1, fastMode: true });
    hasFaceDetector = true;
  } catch {
    hasFaceDetector = false;
  }
}

/** Phát hiện mặt trên tablet (không gọi server) */
async function detectLocalFace() {
  if (!video.videoWidth || video.readyState < 2) return false;
  if (hasFaceDetector && faceDetector) {
    try {
      const faces = await faceDetector.detect(video);
      return faces.length > 0;
    } catch {
      return lastServerHadFace;
    }
  }
  return lastServerHadFace;
}

async function sendFrame() {
  if (!sessionId || sending || !video.videoWidth) return null;
  if (Date.now() < pauseUntil) return null;

  sending = true;
  try {
    const image = captureFrame(video, captureCanvas, 0.65, 480);
    const { w: capW, h: capH } = captureSize(captureCanvas);
    overlay.dataset.sourceW = capW;
    overlay.dataset.sourceH = capH;
    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;

    const res = await apiFetch("/api/checkin/frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, session_id: sessionId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Lỗi server");
    }

    const data = await res.json();
    lastServerHadFace =
      data.status === "collecting" ||
      data.status === "cooldown" ||
      (data.status === "idle" && !!data.bbox);

    setStatus(data);

    if (data.status === "matched" || data.status === "unknown") {
      stopLoop(false);
    }
    return data;
  } catch (e) {
    statusDetail.textContent = e.message;
    return null;
  } finally {
    sending = false;
  }
}

let nextTickAt = 0;
let lastProbeAt = 0;

async function tickLoop() {
  if (!loopActive) return;

  const now = Date.now();
  if (now < pauseUntil) {
    setTimeout(tickLoop, 200);
    return;
  }
  if (sending) {
    setTimeout(tickLoop, 80);
    return;
  }
  if (now < nextTickAt) {
    setTimeout(tickLoop, 80);
    return;
  }

  const localFace = await detectLocalFace();
  let shouldCallServer = lastServerHadFace;

  if (hasFaceDetector) {
    shouldCallServer = localFace || lastServerHadFace;
  } else if (!lastServerHadFace) {
    shouldCallServer = now - lastProbeAt >= INTERVAL_SCAN;
    if (shouldCallServer) lastProbeAt = now;
  }

  if (!shouldCallServer) {
    setStatus({
      status: "idle",
      message: "Đưa mặt vào khung — hệ thống sẽ tự nhận diện",
    });
    nextTickAt = now + 200;
    setTimeout(tickLoop, 150);
    return;
  }

  await sendFrame();
  const delay = lastServerHadFace ? INTERVAL_TRACKING : INTERVAL_SCAN;
  nextTickAt = Date.now() + delay;
  setTimeout(tickLoop, 50);
}

function startLoop() {
  if (loopActive) return;
  loopActive = true;
  lastServerHadFace = false;
  nextTickAt = 0;
  btnStart.disabled = true;
  btnStart.classList.add("hidden");
  btnStop.classList.remove("hidden");
  setStatus({
    status: "idle",
    message: hasFaceDetector
      ? "Đưa mặt vào khung — phát hiện mặt sẽ tự chạy"
      : "Đưa mặt vào khung",
  });
  tickLoop();
}

function stopLoop(resetUi = true) {
  loopActive = false;
  lastServerHadFace = false;
  btnStart.disabled = false;
  btnStart.classList.remove("hidden");
  btnStop.classList.add("hidden");
  if (resetUi) {
    setStatus({ status: "idle", message: "Đã dừng" }, { silentVoice: true });
  }
}

async function loadAttendance() {
  const res = await apiFetch("/api/attendance?limit=30");
  const rows = await res.json();
  historyCount.textContent = String(rows.length);

  if (!rows.length) {
    attendanceList.innerHTML = `
      <li class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        <p>Chưa có lượt chấm công</p>
      </li>`;
    return;
  }

  attendanceList.innerHTML = rows
    .map(
      (r) => `
    <li>
      <div class="att-avatar" aria-hidden="true">${escapeHtml(getInitials(r.name))}</div>
      <div class="att-info">
        <div class="att-name">${escapeHtml(r.name)}</div>
        <div class="att-meta">${formatTime(r.time)} · ${escapeHtml(r.employee_id || "")}</div>
      </div>
      <span class="att-score ${scoreClass(r.score)}" title="Độ khớp">${formatScore(r.score)}</span>
    </li>`
    )
    .join("");
}

async function loadEmployees() {
  const res = await apiFetch("/api/employees");
  const list = await res.json();
  if (!list.length) {
    noEmployees.classList.remove("hidden");
    btnStart.disabled = true;
  } else {
    noEmployees.classList.add("hidden");
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function init() {
  initAppShell();
  if (!(await ensureApiConfigured())) return;
  setStatus({ status: "idle" });
  await loadEmployees();
  await loadAttendance();
  sessionId = await createSession();
  await initFaceDetector();

  try {
    stream = await startCamera(video);
  } catch {
    statusDetail.textContent =
      "Không mở được camera. Vui lòng cấp quyền trên trình duyệt / tablet.";
    btnStart.disabled = true;
    return;
  }

  btnStart.addEventListener("click", startLoop);
  btnStop.addEventListener("click", () => stopLoop(true));

  window.addEventListener("beforeunload", () => {
    stopLoop(false);
    stream?.getTracks().forEach((t) => t.stop());
  });
}

init();
