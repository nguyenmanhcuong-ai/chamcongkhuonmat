import {
  createSession,
  captureFrame,
  captureSize,
  drawBbox,
  startCamera,
  showToast,
  formatTime,
  formatTimeFull,
  getInitials,
  setStatusIcon,
  apiFetch,
  ensureApiConfigured,
  initAppShell,
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
let loopTimer = null;
let sending = false;
let pauseUntil = 0;

const STATUS = {
  idle: { title: "Sẵn sàng chấm công", icon: "idle", zone: "" },
  collecting: { title: "Đang nhận diện...", icon: "collecting", zone: "is-collecting" },
  matched: { title: "CHẤM CÔNG THÀNH CÔNG", icon: "matched", zone: "is-success" },
  unknown: { title: "Không nhận diện được", icon: "unknown", zone: "is-error" },
  cooldown: { title: "Đã chấm công", icon: "cooldown", zone: "is-warn" },
};

function applyZoneClass(zoneClass) {
  statusZone.className = "status-zone" + (zoneClass ? ` ${zoneClass}` : "");
}

function flashSuccess() {
  if (!successFlash) return;
  successFlash.classList.add("show");
  setTimeout(() => successFlash.classList.remove("show"), 600);
}

function setStatus(result) {
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
  } else if (status === "matched") {
    progressWrap.classList.add("hidden");
    statusDetail.textContent = `Xin chào, ${result.name}!`;
    drawBbox(overlay, null);
    showToast(toast, `Chấm công thành công — ${result.name}`, 4000, "success");
    flashSuccess();
    loadAttendance();
    pauseUntil = Date.now() + 2500;
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
    btnStart.disabled = false;
  } else if (status === "cooldown") {
    progressWrap.classList.add("hidden");
    statusDetail.textContent = result.message || "Có thể chấm lại sau vài giây";
    drawBbox(overlay, result.bbox, "#d97706");
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
  } else if (status === "unknown") {
    progressWrap.classList.add("hidden");
    statusDetail.textContent = "Vui lòng thử lại hoặc liên hệ quản trị đăng ký khuôn mặt.";
    drawBbox(overlay, null);
    pauseUntil = Date.now() + 1500;
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
    btnStart.disabled = false;
  } else {
    progressWrap.classList.add("hidden");
    statusDetail.textContent =
      result.message || "Nhấn nút bên dưới để bắt đầu chấm công.";
    drawBbox(overlay, null);
    btnStart.classList.remove("hidden");
    btnStop.classList.add("hidden");
  }
}

async function sendFrame() {
  if (!sessionId || sending || !video.videoWidth) return;
  if (Date.now() < pauseUntil) return;

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

    setStatus(await res.json());
  } catch (e) {
    statusDetail.textContent = e.message;
  } finally {
    sending = false;
  }
}

function startLoop() {
  if (loopTimer) return;
  loopTimer = setInterval(sendFrame, 80);
  btnStart.disabled = true;
  btnStart.classList.add("hidden");
  btnStop.classList.remove("hidden");
  setStatus({ status: "collecting", progress: 0 });
}

function stopLoop() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
  btnStart.disabled = false;
  btnStart.classList.remove("hidden");
  btnStop.classList.add("hidden");
  setStatus({ status: "idle", message: "Đã dừng" });
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
        <div class="att-meta">${escapeHtml(r.employee_id)} · ${formatTimeFull(r.time)}</div>
      </div>
      <span class="att-time">${formatTime(r.time)}</span>
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

  try {
    stream = await startCamera(video);
  } catch {
    statusDetail.textContent =
      "Không mở được camera. Vui lòng cấp quyền trên trình duyệt / tablet.";
    btnStart.disabled = true;
    return;
  }

  btnStart.addEventListener("click", startLoop);
  btnStop.addEventListener("click", stopLoop);

  window.addEventListener("beforeunload", () => {
    stopLoop();
    stream?.getTracks().forEach((t) => t.stop());
  });
}

init();
