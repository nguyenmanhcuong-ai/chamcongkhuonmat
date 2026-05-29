import { setApiBase, getApiBase, isNativeApp } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const portGroup = document.getElementById("portGroup");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");
const tabLan = document.getElementById("tabLan");
const tabCloud = document.getElementById("tabCloud");
const setupTitle = document.getElementById("setupTitle");
const setupHint = document.getElementById("setupHint");
const hostLabel = document.getElementById("hostLabel");

let mode = "lan";

function showMsg(ok, msg) {
  testStatus.className = "status-test " + (ok ? "ok" : "err");
  testStatus.textContent = msg;
}

function setMode(m) {
  mode = m;
  tabLan.classList.toggle("active", m === "lan");
  tabCloud.classList.toggle("active", m === "cloud");
  if (m === "cloud") {
    setupTitle.textContent = "Kết nối Render Cloud";
    setupHint.textContent =
      "Dán URL từ Render Dashboard. Lần đầu có thể chờ 30–90 giây (free tier).";
    hostLabel.textContent = "URL server (https://...)";
    hostInput.placeholder = "https://cham-cong-xxx.onrender.com";
    portGroup.classList.add("hidden");
  } else {
    setupTitle.textContent = "Kết nối PC trong mạng LAN";
    setupHint.textContent = "IP máy chạy python app.py. Cùng Wi‑Fi. Đã mở firewall port 8000.";
    hostLabel.textContent = "IP máy PC";
    hostInput.placeholder = "192.168.10.206";
    portGroup.classList.remove("hidden");
  }
}

function buildUrl() {
  let raw = hostInput.value.trim();
  if (!raw) throw new Error("Nhập địa chỉ server");
  if (mode === "cloud" || raw.startsWith("http://") || raw.startsWith("https://")) {
    if (!raw.startsWith("http")) raw = "https://" + raw.replace(/^\/\//, "");
    return raw.replace(/\/$/, "");
  }
  const port = portInput.value.trim() || "8000";
  return `http://${raw.split("/")[0].split(":")[0]}:${port}`;
}

async function testConnection() {
  let url;
  try {
    url = buildUrl();
  } catch (e) {
    showMsg(false, e.message);
    return null;
  }

  const timeout = url.includes("onrender.com") ? 90000 : 15000;
  btnTest.disabled = true;
  btnSave.disabled = true;
  showMsg(true, `Đang kết nối...\n${url}`);

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
    showMsg(true, `Kết nối OK — ${n} nhân viên`);
    return url;
  } catch (e) {
    const hint =
      e.name === "AbortError"
        ? "Hết thời gian chờ (server đang khởi động?)"
        : e.message;
    showMsg(false, `Lỗi: ${hint}`);
    return null;
  } finally {
    btnTest.disabled = false;
    btnSave.disabled = false;
  }
}

tabLan.addEventListener("click", () => setMode("lan"));
tabCloud.addEventListener("click", () => setMode("cloud"));
btnTest.addEventListener("click", testConnection);
btnSave.addEventListener("click", async () => {
  const url = await testConnection();
  if (!url) return;
  setApiBase(url);
  window.location.href = "index.html";
});

const saved = getApiBase();
if (saved) {
  if (saved.includes("onrender.com") || saved.startsWith("https://")) {
    setMode("cloud");
    hostInput.value = saved.replace(/\/$/, "");
  } else {
    try {
      const u = new URL(saved);
      hostInput.value = u.hostname;
      portInput.value = u.port || "8000";
    } catch {
      hostInput.value = saved;
    }
  }
}

if (isNativeApp()) {
  document.body.classList.add("native-app");
}

setMode(mode);
