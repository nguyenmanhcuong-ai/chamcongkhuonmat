# Hướng dẫn cài APK trên Tablet

## Kiến trúc

| Thành phần | Vai trò |
|------------|---------|
| **APK (tablet)** | Giao diện + camera — kết nối qua Wi‑Fi |
| **Server (PC)** | `python app.py` — nhận diện khuôn mặt (InsightFace) |

> APK **không** chạy AI trên máy. Cần một máy trong mạng chạy server Python.

---

## Bước 1 — Build file APK (trên PC Windows)

### Cài đặt (một lần)

1. [Node.js LTS](https://nodejs.org/)
2. [Android Studio](https://developer.android.com/studio) — cài **Android SDK**

### Build

```powershell
cd "C:\Users\cuongnm\Desktop\CHAM CONG KHUON MAT"
.\build-apk.bat
```

File tạo ra: **`ChamCongKhuonMat.apk`** (cùng thư mục project)

Nếu `build-apk.bat` lỗi, mở Android Studio → **Open** → `mobile\android` → **Build → Build APK(s)**.

---

## Bước 2 — Chạy server

Trên PC (cùng Wi‑Fi với tablet):

```powershell
cd "C:\Users\cuongnm\Desktop\CHAM CONG KHUON MAT"
python app.py
```

Lấy IP PC: `ipconfig` → **IPv4** (vd: `192.168.1.105`)

---

## Bước 3 — Cài APK lên tablet

1. Copy `ChamCongKhuonMat.apk` sang tablet (USB / Zalo / Drive)
2. Mở file → **Cài đặt** (bật *Cho phép nguồn không xác định* nếu được hỏi)
3. Mở app → nhập **IP** + port **8000** → **Kiểm tra** → **Lưu & vào app**
4. Cấp quyền **Camera**

---

## Lưu ý

- Tablet và PC **cùng mạng Wi‑Fi**
- Tắt firewall chặn port 8000 hoặc cho phép Python
- Đổi IP server: mở `setup.html` trong app (xóa data app hoặc cài lại) — hoặc thêm nút Cài đặt sau

## Chạy server ngay trên tablet (nâng cao)

Cần app **Termux** + cài Python + copy project — phức tạp hơn. Khuyến nghị: **1 PC làm server**, nhiều tablet dùng APK.
