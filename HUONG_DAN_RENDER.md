# Deploy miễn phí lên Render

Tablet / trình duyệt **bất kỳ Wi‑Fi nào** đều dùng được — chỉ cần URL cloud `https://xxx.onrender.com`.

---

## Chuẩn bị

1. Tài khoản [Render.com](https://render.com) (đăng nhập GitHub)
2. Code trên **GitHub** (push project lên repo)

```powershell
cd "C:\Users\cuongnm\Desktop\CHAM CONG KHUON MAT"
git init
git add .
git commit -m "Deploy cham cong khuon mat"
git remote add origin https://github.com/TEN-BAN/REPO.git
git push -u origin main
```

---

## Cách 1 — Blueprint (nhanh)

1. Render → **New** → **Blueprint**
2. Chọn repo GitHub
3. Render đọc file `render.yaml` → **Apply**
4. Đợi build **15–25 phút** (lần đầu tải model AI)

URL dạng: `https://cham-cong-khuon-mat-xxxx.onrender.com`

---

## Cách 2 — Tạo tay

1. **New** → **Web Service**
2. Connect repo
3. Cấu hình:

| Mục | Giá trị |
|-----|---------|
| Runtime | **Docker** |
| Plan | **Free** |
| Region | **Singapore** |
| Health Check | `/api/ping` |

4. Environment variables:

| Key | Value |
|-----|-------|
| `MODEL_NAME` | `buffalo_s` |
| `DATA_DIR` | `/tmp/data` |

5. **Create Web Service**

---

## Kiểm tra

Mở trình duyệt:

```
https://TEN-APP.onrender.com/api/ping
```

→ `{"status":"ok",...}`

Trang chấm công: `https://TEN-APP.onrender.com`

---

## Tablet / APK

1. Cài APK (hoặc mở trình duyệt tablet)
2. Cấu hình server → dán **full URL**:
   ```
   https://cham-cong-khuon-mat-xxxx.onrender.com
   ```
3. **Không cần port 8000** với HTTPS Render
4. Bấm **Kiểm tra** (Render free ngủ → lần đầu chờ **30–90 giây**)

---

## Hạn chế gói FREE Render

| Hạn chế | Giải thích |
|---------|------------|
| **Ngủ sau 15 phút** | Lần mở đầu chậm ~1 phút (cold start) |
| **512 MB RAM** | Dùng model `buffalo_s` (đã cấu hình sẵn) |
| **Dữ liệu tạm** | Redeploy có thể **mất** nhân viên đã đăng ký — đăng ký lại trên cloud |
| **Chậm hơn PC** | CPU cloud yếu hơn máy local |

---

## Nâng cấp (tùy chọn)

- **Starter $7/tháng**: không ngủ, ổ cứng lưu data
- Hoặc giữ free + chấp nhận cold start

---

## Sửa code rồi deploy lại

```powershell
git add .
git commit -m "Update"
git push
```

Render tự build lại.

---

## Tablet + Render + PC local

| Kiểu | Server | Tablet Wi‑Fi |
|------|--------|--------------|
| LAN | `python app.py` trên PC | Cùng Wi‑Fi → IP PC |
| **Cloud** | **Render** | **Wi‑Fi bất kỳ** → URL Render |

Khuyến nghị: **Render** khi PC và tablet **khác mạng**.
