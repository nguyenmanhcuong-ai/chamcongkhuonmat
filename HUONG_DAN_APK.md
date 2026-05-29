# Hướng dẫn cài APK trên Tablet

## Kiến trúc

| Thành phần | Vai trò |
|------------|---------|
| **APK (tablet)** | Giao diện + camera — kết nối qua Wi‑Fi |
| **Server (PC)** | `python app.py` — nhận diện khuôn mặt (InsightFace) |

> APK **không** chạy AI trên máy. Chỉ kết nối **mạng LAN (Wi‑Fi)** tới PC chạy `python app.py` — **không** dùng Render/cloud.

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

## Lưu ý kết nối tablet ↔ PC

- Tablet và PC **cùng mạng LAN** (cùng dải IP, không phải Wi‑Fi khách)
- PC phải chạy **`python app.py`** trước khi bấm Kiểm tra
- Nhập IP **không có** `http://` — chỉ số, vd: `192.168.10.206`

### Share file được nhưng `/api/ping` không vào?

Chia sẻ file (SMB) và web (port **8000**) là **hai thứ khác**. Firewall có thể mở file nhưng vẫn chặn port 8000.

| Bước | Việc làm |
|------|----------|
| 1 | Trên **PC**: mở `http://192.168.10.206:8000/api/ping` — phải thấy `{"status":"ok",...}` |
| 2 | Trên **tablet** (Chrome): mở cùng URL — nếu lỗi → mạng/firewall, không phải APK |
| 3 | PC: chuột phải mạng Ethernet/Wi‑Fi → **Private** (mạng riêng) |
| 4 | Chạy **`mo-firewall.bat`** (chuột phải → **Run as administrator**) |
| 5 | Tablet: Cài đặt Wi‑Fi → xem IP tablet. PC `192.168.10.206` thì tablet nên `192.168.8.x`–`192.168.11.x` (cùng /22). Nếu tablet `192.168.1.x` → **khác mạng** |
| 6 | Tắt VPN; tắt **AP isolation / Wi‑Fi khách** trên router |

Chạy `kiem-tra-mang.bat` trên PC để xem IP và port 8000.

## Chạy server ngay trên tablet (nâng cao)

Cần app **Termux** + cài Python + copy project — phức tạp hơn. Khuyến nghị: **1 PC làm server**, nhiều tablet dùng APK.
