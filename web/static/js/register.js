import {
  createSession,
  captureFrame,
  captureSize,
  drawBbox,
  startCamera,
  showToast,
  apiFetch,
  ensureApiConfigured,
} from "./common.js";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const captureCanvas = document.getElementById("captureCanvas");
const employeeId = document.getElementById("employeeId");
const employeeName = document.getElementById("employeeName");
const sampleDots = document.getElementById("sampleDots");
const sampleLabel = document.getElementById("sampleLabel");
const sampleBarFill = document.getElementById("sampleBarFill");
const statusMsg = document.getElementById("statusMsg");
const btnCapture = document.getElementById("btnCapture");
const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");
const toast = document.getElementById("toast");

let sessionId = null;
let stream = null;
let sampleCount = 0;
let minSamples = 5;
let maxSamples = 7;

function renderDots() {
  sampleDots.innerHTML = "";
  for (let i = 0; i < maxSamples; i++) {
    const dot = document.createElement("div");
    dot.className = "sample-dot" + (i < sampleCount ? " filled" : "");
    dot.textContent = i + 1;
    sampleDots.appendChild(dot);
  }

  sampleLabel.textContent = `${sampleCount} / ${maxSamples}`;
  sampleBarFill.style.width = `${Math.min(100, (sampleCount / maxSamples) * 100)}%`;
  btnSave.disabled = sampleCount < minSamples;

  if (sampleCount >= maxSamples) {
    statusMsg.textContent = `Đủ ${maxSamples} ảnh — bấm Lưu nhân viên`;
  } else if (sampleCount >= minSamples) {
    statusMsg.textContent = `Đã đủ tối thiểu — có thể Lưu hoặc chụp thêm (${sampleCount}/${maxSamples})`;
  } else {
    statusMsg.textContent = `Cần thêm ${minSamples - sampleCount} ảnh nữa (tối thiểu ${minSamples})`;
  }
}

async function captureSample() {
  if (!video.videoWidth || sampleCount >= maxSamples) return;

  const image = captureFrame(video, captureCanvas, 0.65, 480);
  const res = await apiFetch("/api/register/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, session_id: sessionId }),
  });

  const data = await res.json();
  if (data.min) minSamples = data.min;
  if (data.max) maxSamples = data.max;

  overlay.dataset.sourceW = captureCanvas.width;
  overlay.dataset.sourceH = captureCanvas.height;
  overlay.width = video.clientWidth;
  overlay.height = video.clientHeight;

  if (data.ok) {
    sampleCount = data.count;
    drawBbox(overlay, data.bbox, "#059669");
    showToast(toast, data.message, 2500, "success");
  } else {
    drawBbox(overlay, data.bbox, "#dc2626");
    statusMsg.textContent = data.message;
  }
  renderDots();
}

async function saveEmployee() {
  const id = employeeId.value.trim();
  const name = employeeName.value.trim();
  if (!id || !name) {
    statusMsg.textContent = "Vui lòng nhập đầy đủ mã và họ tên";
    return;
  }

  const res = await apiFetch("/api/register/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: id,
      name,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    statusMsg.textContent = err.detail || "Lưu thất bại";
    return;
  }

  const data = await res.json();
  showToast(toast, data.message, 4000, "success");
  sampleCount = 0;
  employeeId.value = "";
  employeeName.value = "";
  renderDots();
  drawBbox(overlay, null);
  sessionId = await createSession();
}

async function resetSamples() {
  await apiFetch("/api/register/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  sampleCount = 0;
  renderDots();
  drawBbox(overlay, null);
}

async function init() {
  if (!(await ensureApiConfigured())) return;
  sessionId = await createSession();
  renderDots();

  try {
    stream = await startCamera(video);
  } catch {
    statusMsg.textContent = "Không mở được camera trên thiết bị.";
    btnCapture.disabled = true;
    return;
  }

  btnCapture.addEventListener("click", captureSample);
  btnSave.addEventListener("click", saveEmployee);
  btnReset.addEventListener("click", resetSamples);

  window.addEventListener("beforeunload", () => {
    stream?.getTracks().forEach((t) => t.stop());
  });
}

init();
