import { setApiBase, apiUrl } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");

function buildUrl() {
  const host = hostInput.value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const port = portInput.value.trim() || "8000";
  if (!host) throw new Error("Nhập IP máy chủ");
  return `http://${host}:${port}`;
}

function showTest(ok, msg) {
  testStatus.className = "status-test " + (ok ? "ok" : "err");
  testStatus.textContent = msg;
}

async function testConnection() {
  testStatus.className = "status-test";
  testStatus.style.display = "none";
  try {
    const url = buildUrl();
    const res = await fetch(`${url}/api/employees`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    showTest(true, `Kết nối OK — ${data.length} nhân viên trong hệ thống`);
    return url;
  } catch (e) {
    showTest(false, `Không kết nối được. Kiểm tra IP, Wi‑Fi và python app.py trên PC. (${e.message})`);
    return null;
  }
}

btnTest.addEventListener("click", testConnection);

btnSave.addEventListener("click", async () => {
  const url = await testConnection();
  if (!url) return;
  setApiBase(url);
  window.location.replace("index.html");
});

const saved = localStorage.getItem("apiBase");
if (saved) {
  try {
    const u = new URL(saved);
    hostInput.value = u.hostname;
    portInput.value = u.port || "8000";
  } catch {
    /* ignore */
  }
}
