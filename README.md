# 🎮 K-Map Arena — Đấu Trường Bảng Karnaugh & Lũy Thừa 2

Ứng dụng web học tập tương tác và rèn luyện phản xạ rút gọn đại số Boolean, bản đồ Karnaugh 4 biến ($A, B, C, D$) và các lũy thừa bậc 2 ($2^0$ đến $2^{16}$) chuẩn đại học.

![Giao diện K-Map Arena](https://img.shields.io/badge/Status-Ready%20to%20Play-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌟 Tính Năng Nổi Bật

1. **6 Chế Độ Trò Chơi Đua Thời Gian Đỉnh Cao:**
   - ⚡ **Đua Rút Gọn (K-Map Sprint):** Cho bảng Karnaugh $\rightarrow$ gõ biểu thức tối giản SOP hoặc POS trong thời gian đếm ngược.
   - $\Sigma$ **Giải Mã $\Sigma$ (Minterm / Maxterm $\leftrightarrow$ Map):** Chuyển đổi phản xạ giữa $\Sigma m(\dots)$, $\Pi M(\dots)$ và vị trí ô ma trận theo mã Gray.
   - ✎ **Vẽ Ngược (Expression $\rightarrow$ Map):** Cho biểu thức Boolean phức tạp $\rightarrow$ suy luận và tô các ô tương ứng trên bản đồ.
   - ◎ **Thợ Săn Nguyên Tố (Prime Hunter):** Phân loại từng nhóm khoanh: **Bắt buộc** (EPI), **Dự bị** (PI), **Quá nhỏ** (Imp) hay **Phạm luật** (✗).
   - ⌖ **Tọa Độ Gray (Gray Reflex):** Luyện phản xạ mắt chớp nhoáng giữa ô sáng và chỉ số minterm nhị phân.
   - $2^n$ **Lũy Thừa 2 ($2^0 \dots 2^{16}$):** Rèn luyện số mũ, hex, nhị phân, phân tích tổng số mũ, số bit tối thiểu.

2. **🧪 Phòng Thí Nghiệm Tự Do (Sandbox Solver):**
   - Tô ô tùy ý ($0, 1, X$), đảo bảng, đổi trục $AB \leftrightarrow CD$.
   - Tự động giải Quine–McCluskey ra dạng **SOP tối giản** và **POS tối giản**.
   - Bảng phân tích chi tiết Prime Implicants và Essential Prime Implicants.
   - Hỗ trợ công tắc **Hiện/Ẩn số ô ($m_0 \dots m_{15}$)** phục vụ học tập.

3. **📚 Cẩm Nang Bảng Karnaugh & 2ⁿ:**
   - Hướng dẫn chi tiết về trục mã Gray $00 - 01 - 11 - 10$, quy tắc gom nhóm không gian Torus, 4 góc thần thánh ($m_0, m_2, m_8, m_{10}$), và mẹo tính nhẩm nhanh lũy thừa 2.

4. **Âm Thanh & Đồ Họa Cao Cấp:**
   - Hiệu ứng hạt Canvas, Confetti mừng kỷ lục, âm thanh tổng hợp thời gian thực WebAudio API (không cần tải file âm thanh ngoài).

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari) mà không cần cài đặt môi trường.

Nếu muốn chạy kiểm thử TDD:
```bash
node test/engine.test.js
```

---

## 📄 Bản Quyền
Dự án được phân phối dưới giấy phép MIT. Tự do học tập và đóng góp!
