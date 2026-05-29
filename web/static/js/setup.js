import { setApiBase } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const portGroup = document.getElementById("portGroup");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");

function buildUrl() {
  let raw = hostInput.value.trim();
  if (!raw) throw new Error("Nhập địa chỉ server");
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  const port = portInput.value.trim() || "8000";
  return `http://${raw.split("/")[0]}:${port}`;
}

function showTest(ok, msg) {
  testStatus.style.display = "block";
  testStatus.className = "status-test " + (ok ? "ok" : "err");
  testStatus.textContent = msg;
}

hostInput?.addEventListener("input", () => {
  const v = hostInput.value.trim();
  if (portGroup) {
    portGroup.style.display =
      v.startsWith("http://") || v.startsWith("https://") ? "none" : "block";
  }
});

async function testConnection() {
  let url;
  try {
    url = buildUrl();
  } catch (e) {
    showTest(false, e.message);
    return null;
  }

  const timeout = url.includes("onrender.com") ? 90000 : 12000;
  showTest(true, `Đang kết nối ${url} ...`);

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    let res = await fetch(`${url}/api/ping`, { signal: ctrl.signal });
    if (res.status === 404) {
      res = await fetch(`${url}/api/employees`, { signal: ctrl.signal });
    }
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const n = Array.isArray(data) ? data.length : 0;
    showTest(true, `Kết nối OK — ${n} nhân viên`);
    return url;
  } catch (e) {
    const msg =
      e.name === "AbortError"
        ? "Hết thời gian chờ (Render free có thể đang khởi động — thử lại)"
        : e.message;
    showTest(false, `Không kết nối: ${msg}`);
    return null;
  }
}

btnTest.addEventListener("click", testConnection);
btnSave.addEventListener("click", async () => {
  const url = await testConnection();
  if (!url) return;
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
