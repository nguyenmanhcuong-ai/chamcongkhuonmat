import { setApiBase, lanFetch, isNativeApp } from "./common.js";

const hostInput = document.getElementById("serverHost");
const portInput = document.getElementById("serverPort");
const testStatus = document.getElementById("testStatus");
const btnTest = document.getElementById("btnTest");
const btnSave = document.getElementById("btnSave");

function buildUrl() {
  let host = hostInput.value.trim();
  host = host.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const port = portInput.value.trim() || "8000";
  if (!host) throw new Error("Vui lòng nhập IP máy chủ");
  return `http://${host}:${port}`;
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

function connectionHints(url) {
  const lines = [
    "1. PC dang chay: python app.py",
    `2. Tren tablet mo Chrome thu: ${url}/api/ping`,
    "3. Tablet va PC cung Wi-Fi (tat 4G)",
    "4. Neu Chrome OK ma app loi -> cai lai APK moi (build-apk.bat)",
  ];
  if (isNativeApp()) {
    lines.unshift("App tablet dung ket noi native (CapacitorHttp).");
  }
  return lines.join("\n");
}

async function pingServer(url, signal) {
  let res = await lanFetch(`${url}/api/ping`, {
    method: "GET",
    signal,
  });

  if (res.status === 404) {
    res = await lanFetch(`${url}/api/employees`, {
      method: "GET",
      signal,
    });
  }

  return res;
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
  const mode = isNativeApp() ? "native" : "web";
  showMsg(true, `Đang kết nối ${url} (${mode})...`);

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);

    const res = await pingServer(url, ctrl.signal);
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Máy chủ trả lỗi ${res.status}`);

    let employeeCount = 0;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const data = await res.json();
      if (Array.isArray(data)) employeeCount = data.length;
      else if (data.status === "ok") {
        const empRes = await lanFetch(`${url}/api/employees`);
        if (empRes.ok) employeeCount = (await empRes.json()).length;
      }
    }

    showMsg(true, `Kết nối OK — ${employeeCount} nhân viên`);
    return url;
  } catch (e) {
    const hint =
      e.name === "AbortError"
        ? "Hết thời gian chờ (15s)"
        : e.message || "Lỗi mạng";
    showMsg(
      false,
      `Không kết nối được (${hint}).\n\n${connectionHints(url)}`
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
      "Chưa kết nối được server.\n\nVẫn lưu IP này và thử vào app?"
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
    hostInput.value = u.hostname;
    portInput.value = u.port || "8000";
  } catch {
    /* ignore */
  }
}
