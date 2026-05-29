import { setApiBase } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const portGroup = document.getElementById("portGroup");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");

function buildUrl() {
  let raw = hostInput.value.trim();
  if (!raw) throw new Error("Vui lòng nhập địa chỉ server");

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }

  raw = raw.split("/")[0];
  const port = portInput.value.trim() || "8000";
  return `http://${raw}:${port}`;
}

function isCloudUrl(url) {
  return url.startsWith("https://") || url.includes("onrender.com");
}

function showMsg(ok, msg) {
  testStatus.style.display = "block";
  testStatus.className = "status-test " + (ok ? "ok" : "err");
  testStatus.textContent = msg;
}

function setBusy(busy) {
  btnTest.disabled = busy;
  btnSave.disabled = busy;
  btnTest.textContent = busy ? "Đang kiểm tra..." : "Kiểm tra";
}

hostInput.addEventListener("input", () => {
  const v = hostInput.value.trim();
  const isUrl = v.startsWith("http://") || v.startsWith("https://");
  if (portGroup) portGroup.style.display = isUrl ? "none" : "block";
});

async function testConnection() {
  let url;
  try {
    url = buildUrl();
  } catch (e) {
    showMsg(false, e.message);
    return null;
  }

  setBusy(true);
  showMsg(true, `Đang kết nối ${url} ...`);

  const timeoutMs = isCloudUrl(url) ? 90000 : 12000;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    let res = await fetch(`${url}/api/ping`, {
      method: "GET",
      signal: ctrl.signal,
    });

    if (res.status === 404) {
      res = await fetch(`${url}/api/employees`, {
        method: "GET",
        signal: ctrl.signal,
      });
    }

    clearTimeout(timer);

    if (!res.ok) throw new Error(`Máy chủ trả lỗi ${res.status}`);

    let employeeCount = 0;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const data = await res.json();
      if (Array.isArray(data)) employeeCount = data.length;
      else if (data.status === "ok") {
        const empRes = await fetch(`${url}/api/employees`);
        if (empRes.ok) employeeCount = (await empRes.json()).length;
      }
    }

    showMsg(true, `Kết nối OK — ${employeeCount} nhân viên`);
    return url;
  } catch (e) {
    const hint =
      e.name === "AbortError"
        ? `Hết thời gian chờ (${timeoutMs / 1000}s — Render free có thể đang khởi động)`
        : e.message || "Lỗi mạng";
    showMsg(
      false,
      `Không kết nối được (${hint}). Kiểm tra URL, server đang chạy, hoặc thử lại sau 1 phút (Render free).`
    );
    return null;
  } finally {
    setBusy(false);
  }
}

btnTest.addEventListener("click", () => testConnection());

btnSave.addEventListener("click", async () => {
  let url;
  try {
    url = buildUrl();
  } catch (e) {
    showMsg(false, e.message);
    return;
  }

  const tested = await testConnection();
  if (!tested) {
    const force = confirm(
      "Chưa kết nối được server.\n\nVẫn lưu địa chỉ này và thử vào app?"
    );
    if (!force) return;
    url = buildUrl();
  } else {
    url = tested;
  }

  setApiBase(url);
  window.location.href = "index.html";
});

const saved = localStorage.getItem("apiBase");
if (saved) {
  try {
    const u = new URL(saved);
    if (u.protocol === "https:" && !u.port) {
      hostInput.value = saved.replace(/\/$/, "");
      if (portGroup) portGroup.style.display = "none";
    } else {
      hostInput.value = u.hostname;
      portInput.value = u.port || "8000";
    }
  } catch {
    hostInput.value = saved;
  }
}
