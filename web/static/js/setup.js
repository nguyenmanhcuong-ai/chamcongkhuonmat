import { setApiBase, getApiBase, isNativeApp } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");

function showMsg(ok, msg) {
  testStatus.hidden = false;
  testStatus.className = "status-test " + (ok ? "ok" : "err");
  testStatus.textContent = msg;
}

function setBusy(busy) {
  btnTest.disabled = busy;
  btnSave.disabled = busy;
  btnTest.textContent = busy ? "Đang kiểm tra..." : "Kiểm tra";
}

function buildUrl() {
  let host = hostInput.value.trim();
  host = host.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const port = portInput.value.trim() || "8000";
  if (!host) throw new Error("Vui lòng nhập IP máy PC");
  if (host.includes("onrender.com")) {
    throw new Error("App chỉ dùng mạng LAN — nhập IP PC (vd: 192.168.1.105)");
  }
  return `http://${host}:${port}`;
}

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

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);

    let res = await fetch(`${url}/api/ping`, { signal: ctrl.signal });
    if (res.status === 404) {
      res = await fetch(`${url}/api/employees`, { signal: ctrl.signal });
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
      e.name === "AbortError" ? "Hết thời gian chờ (8s)" : e.message || "Lỗi mạng";
    showMsg(false, `Không kết nối (${hint}). Kiểm tra PC chạy app + cùng Wi‑Fi.`);
    return null;
  } finally {
    setBusy(false);
  }
}

btnTest.addEventListener("click", () => testConnection());

btnSave.addEventListener("click", async () => {
  const tested = await testConnection();
  if (!tested) {
    const force = confirm("Chưa kết nối được.\n\nVẫn lưu IP và thử vào app?");
    if (!force) return;
  }
  setApiBase(tested || buildUrl());
  window.location.href = "index.html";
});

function loadSavedLan() {
  const saved = getApiBase();
  if (!saved) return;
  if (saved.includes("onrender.com") || saved.startsWith("https://")) {
    localStorage.removeItem("apiBase");
    showMsg(
      false,
      "Đã xóa cấu hình cloud cũ. Nhập IP máy PC trong mạng LAN."
    );
    return;
  }
  try {
    const u = new URL(saved);
    hostInput.value = u.hostname;
    portInput.value = u.port || "8000";
  } catch {
    /* ignore */
  }
}

if (isNativeApp()) {
  document.body.classList.add("native-app");
}
loadSavedLan();
