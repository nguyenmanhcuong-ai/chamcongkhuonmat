# Deploy server chấm công lên Render (FREE)

Tablet / trình duyệt **bất kỳ Wi‑Fi** → dùng URL `https://xxx.onrender.com`.

---

## Bước 1 — Đưa code lên GitHub

Mở **PowerShell** trong thư mục project:

```powershell
cd "C:\Users\cuongnm\Desktop\CHAM CONG KHUON MAT"

git init
git add .
git commit -m "Cham cong khuon mat"

# Tạo repo trống trên github.com → copy URL
git remote add origin https://github.com/TEN-BAN/TEN-REPO.git
git branch -M main
git push -u origin main
```

> Lần sau sửa code: `git add .` → `git commit -m "..."` → `git push`

---

## Bước 2 — Tạo tài khoản Render

1. Vào https://render.com
2. **Sign Up** → đăng nhập bằng **GitHub**

---

## Bước 3 — Deploy (chọn 1 trong 2 cách)

### Cách A — Blueprint (khuyến nghị)

1. Render Dashboard → **New +** → **Blueprint**
2. Chọn repo GitHub vừa push
3. Render đọc file `render.yaml` → **Apply**
4. Đợi **Deploy** (lần đầu **10–20 phút**)

### Cách B — Tạo tay Web Service

| Mục | Chọn |
|-----|------|
| **New** | Web Service |
| **Connect** | Repo GitHub |
| **Runtime** | **Docker** (không chọn Python 3) |
| **Build Command** | **để trống** |
| **Start Command** | **để trống** |
| **Plan** | Free |
| **Region** | Singapore |
| **Health Check Path** | `/api/ping` |

**Environment Variables:**

| Key | Value |
|-----|-------|
| `MODEL_NAME` | `buffalo_s` |
| `DATA_DIR` | `/tmp/data` |

---

## Bước 4 — Kiểm tra server

Sau khi trạng thái **Live**, mở:

```
https://TEN-APP.onrender.com/api/ping
```

→ `{"status":"ok","message":"Server cham cong dang chay"}`

Trang chấm công:

```
https://TEN-APP.onrender.com
```

---

## Bước 5 — Tablet / APK

1. Mở app → **Cấu hình server**
2. Dán **full URL** (không cần port):
   ```
   https://cham-cong-khuon-mat-xxxx.onrender.com
   ```
3. **Kiểm tra** → **Lưu**
4. Đăng ký nhân viên lại trên cloud (dữ liệu local không tự lên)

> Render free **ngủ sau 15 phút** — lần mở đầu chờ **30–90 giây**.

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Build Docker fail bước model | Code mới tải model lúc **start** (`start.sh`), push lại Git |
| Deploy fail / Out of memory | Gói free 512MB — giữ `MODEL_NAME=buffalo_s` |
| `Not Found` trên `/api/ping` | Chưa deploy code mới — push + Manual Deploy |
| Tablet không kết nối | Dùng **https://** đầy đủ, không port 8000 |
| Mất nhân viên sau redeploy | Free không lưu ổ cứng lâu — đăng ký lại trên web cloud |
| `libxcb.so.1` khi preload model | Push code mới (Dockerfile ép `opencv-python-headless`) rồi redeploy |
| Cảnh báo GPU `/sys/class/drm/...` | Bình thường trên Render — server chạy CPU, bỏ qua |

---

## So sánh LAN vs Render

| | PC + `python app.py` | Render cloud |
|--|---------------------|--------------|
| Tablet Wi‑Fi | Phải cùng mạng PC | **Bất kỳ Wi‑Fi** |
| Tốc độ | Nhanh | Chậm hơn, cold start |
| Chi phí | Free | Free (có giới hạn) |

---

## Cập nhật code sau này

```powershell
git add .
git commit -m "Cap nhat"
git push
```

Render tự build lại (hoặc **Manual Deploy** trong Dashboard).
