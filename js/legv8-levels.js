'use strict';
/**
 * ============================================================================
 * LEGv8 Code Master — Challenge Levels Database
 * Covering 5 Tiers of Difficulty with Standard C and LEGv8 Mapping
 * ============================================================================
 */

const LEGV8_LEVELS = [
  /* =========================================================================
     TIER 1: BIỂU THỨC SỐ HỌC & GÁN BIẾN CƠ BẢN
     Không dùng hàm, không rẽ nhánh. Thời gian: 180s (3 phút).
     ========================================================================= */
  {
    id: 'tier1_expr1',
    tier: 1,
    title: 'Biểu thức Số học Cơ bản: f = (a + b) - (c + 35)',
    time_limit: 180,
    base_score: 500,
    isProcedure: false,
    c_code: `// Ánh xạ biến: a: X19, b: X20, c: X21, f: X9
f = (a + b) - (c + 35);`,
    desc: 'Biên dịch biểu thức số học C sang hợp ngữ LEGv8. Ánh xạ biến: a: X19, b: X20, c: X21, f (kết quả): X9.',
    register_map: [
      { var: 'a', reg: 'X19', role: 'Đầu vào (số nguyên)' },
      { var: 'b', reg: 'X20', role: 'Đầu vào (số nguyên)' },
      { var: 'c', reg: 'X21', role: 'Đầu vào (số nguyên)' },
      { var: 'f (kết quả)', reg: 'X9', role: 'Thanh ghi lưu kết quả' },
      { var: 'tạm', reg: 'X10', role: 'Thanh ghi lưu kết quả tạm (c + 35)' }
    ],
    starter_code: `// Tính f = (a + b) - (c + 35)
// Ánh xạ: a: X19, b: X20, c: X21, f: X9
// Viết mã hợp ngữ LEGv8 của bạn ở đây...

`,
    solution_code: `ADD   X9,  X19, X20
ADDI  X10, X21, #35
SUB   X9,  X9,  X10`,
    scaffold: {
      template: `ADD   {{0}},  X19, X20
ADDI  X10, {{1}}, #35
SUB   X9,  X9,  {{2}}`,
      blanks: [
        { id: 0, expected: 'X9', options: ['X9', 'X10', 'X0', 'XZR'] },
        { id: 1, expected: 'X21', options: ['X21', 'X19', 'X20', 'X10'] },
        { id: 2, expected: 'X10', options: ['X10', 'X9', 'X21', 'XZR'] }
      ]
    },
    test_cases: [
      { registers: { X19: 10, X20: 20, X21: 5 }, targetReg: 'X9', expected: -10, label: 'Bộ kiểm thử #1' },
      { registers: { X19: 50, X20: 50, X21: 15 }, targetReg: 'X9', expected: 50, label: 'Bộ kiểm thử #2' },
      { registers: { X19: 0, X20: 35, X21: 0 }, targetReg: 'X9', expected: 0, label: 'Bộ kiểm thử #3' },
      { registers: { X19: -10, X20: -20, X21: -35 }, targetReg: 'X9', expected: -30, label: 'Bộ kiểm thử #4' }
    ],
    hints: [
      'Gợi ý 1: Thực hiện phép cộng (a + b) trước và lưu vào thanh ghi tạm X9: `ADD X9, X19, X20`.',
      'Gợi ý 2: Dùng lệnh ADDI để cộng hằng số 35 với c (X21), lưu vào X10: `ADDI X10, X21, #35`.',
      'Gợi ý 3: Lấy X9 trừ đi X10 và ghi đè kết quả vào X9: `SUB X9, X9, X10`.'
    ]
  },

  {
    id: 'tier1_expr2',
    tier: 1,
    title: 'Phép Nhân & Dịch Bit: result = 2 * (x - y) + (z + 10)',
    time_limit: 180,
    base_score: 550,
    isProcedure: false,
    c_code: `// Ánh xạ biến: x: X19, y: X20, z: X21, result: X9
result = 2 * (x - y) + (z + 10);`,
    desc: 'Thực hiện phép trừ (x - y), nhân đôi kết quả (dùng LSL #1 hoặc ADD với chính nó), sau đó cộng với (z + 10).',
    register_map: [
      { var: 'x', reg: 'X19', role: 'Đầu vào (số nguyên)' },
      { var: 'y', reg: 'X20', role: 'Đầu vào (số nguyên)' },
      { var: 'z', reg: 'X21', role: 'Đầu vào (số nguyên)' },
      { var: 'result', reg: 'X9', role: 'Kết quả' }
    ],
    starter_code: `// Tính result = 2 * (x - y) + (z + 10)
// Ánh xạ: x: X19, y: X20, z: X21, result: X9
// Viết mã hợp ngữ LEGv8 của bạn ở đây...

`,
    solution_code: `SUB   X9,  X19, X20
LSL   X9,  X9,  #1
ADDI  X10, X21, #10
ADD   X9,  X9,  X10`,
    scaffold: {
      template: `SUB   X9,  X19, {{0}}
{{1}}   X9,  X9,  #1
ADDI  X10, X21, {{2}}
ADD   X9,  X9,  X10`,
      blanks: [
        { id: 0, expected: 'X20', options: ['X20', 'X21', 'X9', 'XZR'] },
        { id: 1, expected: 'LSL', options: ['LSL', 'LSR', 'ADD', 'MUL'] },
        { id: 2, expected: '#10', options: ['#10', '#1', '#2', '#0'] }
      ]
    },
    test_cases: [
      { registers: { X19: 15, X20: 5, X21: 2 }, targetReg: 'X9', expected: 32, label: 'Bộ kiểm thử #1' },
      { registers: { X19: 8, X20: 8, X21: -5 }, targetReg: 'X9', expected: 5, label: 'Bộ kiểm thử #2' },
      { registers: { X19: 3, X20: 7, X21: 20 }, targetReg: 'X9', expected: 22, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: Trừ x cho y lưu vào X9: `SUB X9, X19, X20`.',
      'Gợi ý 2: Nhân 2 tương đương phép dịch trái 1 bit: `LSL X9, X9, #1`.',
      'Gợi ý 3: Cộng z với 10 vào X10: `ADDI X10, X21, #10`, sau đó cộng dồn vào X9: `ADD X9, X9, X10`.'
    ]
  },

  /* =========================================================================
     TIER 2: MẢNG 1 CHIỀU & TRUY XUẤT BỘ NHỚ (LOAD/STORE & BYTE OFFSET)
     Nhân 8 tính Byte Offset, LDUR, STUR. Thời gian: 240s (4 phút).
     ========================================================================= */
  {
    id: 'tier2_swap',
    tier: 2,
    title: 'Hoán Đổi 2 Phần Tử Liền Kề: Swap(A[i], A[i + 1])',
    time_limit: 240,
    base_score: 700,
    isProcedure: false,
    c_code: `// A là mảng 64-bit (8 bytes/phần tử)
// Ánh xạ: Địa chỉ mảng A: X10, chỉ số i: X19, temp: X9
temp = A[i];
A[i] = A[i + 1];
A[i + 1] = temp;`,
    desc: 'Truy xuất mảng A tại chỉ số i và i + 1. Độ dời byte = i * 8 (dùng LSL #3), sau đó cộng với địa chỉ cơ sở của A.',
    register_map: [
      { var: 'Địa chỉ cơ sở A', reg: 'X10', role: 'Con trỏ mảng A' },
      { var: 'Chỉ số i', reg: 'X19', role: 'Chỉ số phần tử' },
      { var: 'temp', reg: 'X9', role: 'Biến tạm lưu A[i]' },
      { var: 'địa chỉ A[i]', reg: 'X11', role: 'Địa chỉ byte của A[i]' },
      { var: 'giá trị A[i+1]', reg: 'X12', role: 'Thanh ghi lưu A[i + 1]' }
    ],
    starter_code: `// Hoán đổi A[i] và A[i + 1]
// Ánh xạ: Con trỏ mảng A: X10, chỉ số i: X19, temp: X9
// Viết mã hợp ngữ LEGv8 của bạn ở đây...

`,
    solution_code: `LSL   X11, X19, #3
ADD   X11, X10, X11
LDUR  X9,  [X11, #0]
LDUR  X12, [X11, #8]
STUR  X12, [X11, #0]
STUR  X9,  [X11, #8]`,
    scaffold: {
      template: `LSL   X11, X19, {{0}}
ADD   X11, X10, X11
LDUR  X9,  [X11, #0]
LDUR  X12, [X11, {{1}}]
STUR  {{2}}, [X11, #0]
STUR  X9,  [X11, #8]`,
      blanks: [
        { id: 0, expected: '#3', options: ['#3', '#2', '#8', '#1'] },
        { id: 1, expected: '#8', options: ['#8', '#1', '#4', '#16'] },
        { id: 2, expected: 'X12', options: ['X12', 'X9', 'X11', 'X10'] }
      ]
    },
    test_cases: [
      {
        registers: { X10: 0x1000, X19: 0 },
        memory: { '0x1000': 42, '0x1008': 99 },
        expected_memory: { '0x1000': 99, '0x1008': 42 },
        label: 'Bộ kiểm thử #1'
      },
      {
        registers: { X10: 0x2000, X19: 2 },
        memory: { '0x2010': 700, '0x2018': 800 },
        expected_memory: { '0x2010': 800, '0x2018': 700 },
        label: 'Bộ kiểm thử #2'
      }
    ],
    hints: [
      'Gợi ý 1: Mỗi phần tử 64-bit chiếm 8 bytes. Dùng `LSL X11, X19, #3` để tính độ dời byte của i.',
      'Gợi ý 2: Cộng địa chỉ cơ sở: `ADD X11, X10, X11`. Phần tử A[i] nạp từ `[X11, #0]`, phần tử A[i+1] nạp từ `[X11, #8]`.',
      'Gợi ý 3: Dùng `STUR` để ghi giá trị mới vào hai vị trí trên.'
    ]
  },

  {
    id: 'tier2_add_elem',
    tier: 2,
    title: 'Cộng Hằng Số Vào Phần Tử Mảng: A[i] = h + A[i]',
    time_limit: 240,
    base_score: 750,
    isProcedure: false,
    c_code: `// Ánh xạ: Địa chỉ mảng A: X10, h: X20, i: X19
A[i] = h + A[i];`,
    desc: 'Đọc phần tử A[i] từ bộ nhớ, thực hiện phép cộng với h, sau đó lưu kết quả trở lại vị trí A[i].',
    register_map: [
      { var: 'Địa chỉ cơ sở A', reg: 'X10', role: 'Con trỏ mảng A' },
      { var: 'Biến h', reg: 'X20', role: 'Giá trị cần cộng' },
      { var: 'Chỉ số i', reg: 'X19', role: 'Chỉ số phần tử' },
      { var: 'Tạm', reg: 'X9', role: 'Lưu giá trị A[i]' }
    ],
    starter_code: `// A[i] = h + A[i]
// Ánh xạ: A: X10, h: X20, i: X19
// Viết mã hợp ngữ LEGv8 của bạn ở đây...

`,
    solution_code: `LSL   X11, X19, #3
ADD   X11, X10, X11
LDUR  X9,  [X11, #0]
ADD   X9,  X20, X9
STUR  X9,  [X11, #0]`,
    test_cases: [
      {
        registers: { X10: 0x3000, X19: 1, X20: 25 },
        memory: { '0x3008': 100 },
        expected_memory: { '0x3008': 125 },
        label: 'Bộ kiểm thử #1'
      },
      {
        registers: { X10: 0x3000, X19: 0, X20: -40 },
        memory: { '0x3000': 50 },
        expected_memory: { '0x3000': 10 },
        label: 'Bộ kiểm thử #2'
      }
    ],
    hints: [
      'Gợi ý 1: Đọc A[i] vào thanh ghi tạm X9 bằng LDUR [X11, #0].',
      'Gợi ý 2: Cộng h vào X9: `ADD X9, X20, X9`.',
      'Gợi ý 3: Ghi đè vào ô nhớ cũ bằng STUR X9, [X11, #0].'
    ]
  },

  /* =========================================================================
     TIER 3: RẼ NHÁNH & VÒNG LẶP (CONTROL FLOW & LOOPS)
     Cờ điều kiện, SUBS, B.EQ, B.NE, CBZ, CBNZ, B. Thời gian: 300s (5 phút).
     ========================================================================= */
  {
    id: 'tier3_while',
    tier: 3,
    title: 'Vòng Lặp While: Quét Mảng Tìm Phần Tử Khác K',
    time_limit: 300,
    base_score: 900,
    isProcedure: false,
    c_code: `// Ánh xạ: save: X10, i: X19, k: X20
while (save[i] == k) {
    i += 1;
}`,
    desc: 'Tại mỗi vòng lặp, tính địa chỉ của save[i], nạp giá trị từ bộ nhớ và so sánh với k bằng SUBS XZR, save[i], k. Nếu không bằng nhau thì rẽ nhánh thoát vòng lặp.',
    register_map: [
      { var: 'Con trỏ save', reg: 'X10', role: 'Địa chỉ cơ sở mảng' },
      { var: 'Chỉ số i', reg: 'X19', role: 'Chỉ số vòng lặp (kết quả kiểm tra)' },
      { var: 'Hằng số k', reg: 'X20', role: 'Giá trị so sánh' }
    ],
    starter_code: `// Vòng lặp while (save[i] == k)
// Ánh xạ: save: X10, i: X19, k: X20
Loop:
    // Viết mã kiểm tra save[i] == k và tăng i...

Exit:
`,
    solution_code: `Loop:
    LSL   X11, X19, #3
    ADD   X11, X10, X11
    LDUR  X12, [X11, #0]
    SUBS  XZR, X12, X20
    B.NE  Exit
    ADDI  X19, X19, #1
    B     Loop
Exit:`,
    test_cases: [
      {
        registers: { X10: 0x4000, X19: 0, X20: 7 },
        memory: { '0x4000': 7, '0x4008': 7, '0x4010': 7, '0x4018': 99 },
        targetReg: 'X19',
        expected: 3,
        label: 'Bộ kiểm thử #1'
      },
      {
        registers: { X10: 0x4000, X19: 0, X20: 7 },
        memory: { '0x4000': 15 },
        targetReg: 'X19',
        expected: 0,
        label: 'Bộ kiểm thử #2'
      },
      {
        registers: { X10: 0x4000, X19: 2, X20: 100 },
        memory: { '0x4010': 100, '0x4018': 50 },
        targetReg: 'X19',
        expected: 3,
        label: 'Bộ kiểm thử #3'
      }
    ],
    hints: [
      'Gợi ý 1: Lệnh so sánh chuẩn trong LEGv8 là `SUBS XZR, X12, X20` (cập nhật cờ điều kiện).',
      'Gợi ý 2: Để nhảy khi không bằng nhau, dùng `B.NE Exit`. Cuối thân vòng lặp, dùng `B Loop` để lặp lại.'
    ]
  },

  {
    id: 'tier3_ifelse',
    tier: 3,
    title: 'Cấu Trúc If-Else: Tính Giá Trị Tuyệt Đối Hiệu Số',
    time_limit: 300,
    base_score: 950,
    isProcedure: false,
    c_code: `// Ánh xạ: a: X19, b: X20, f: X9
if (a > b) {
    f = a - b;
} else {
    f = b - a;
}`,
    desc: 'So sánh a và b bằng SUBS XZR, a, b. Sử dụng lệnh nhảy có điều kiện B.LE để nhảy sang nhánh Else.',
    register_map: [
      { var: 'a', reg: 'X19', role: 'Đầu vào a' },
      { var: 'b', reg: 'X20', role: 'Đầu vào b' },
      { var: 'f (kết quả)', reg: 'X9', role: 'Kết quả' }
    ],
    starter_code: `// Cấu trúc if (a > b) f = a - b; else f = b - a;
// Ánh xạ: a: X19, b: X20, f: X9
    // So sánh a và b, rẽ nhánh...

ElsePart:
    // Nhánh Else...

EndIf:
`,
    solution_code: `    SUBS  XZR, X19, X20
    B.LE  ElsePart
    SUB   X9,  X19, X20
    B     EndIf
ElsePart:
    SUB   X9,  X20, X19
EndIf:`,
    test_cases: [
      { registers: { X19: 15, X20: 7 }, targetReg: 'X9', expected: 8, label: 'Bộ kiểm thử #1' },
      { registers: { X19: 4, X20: 10 }, targetReg: 'X9', expected: 6, label: 'Bộ kiểm thử #2' },
      { registers: { X19: 9, X20: 9 }, targetReg: 'X9', expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: `SUBS XZR, X19, X20` thực hiện phép tính a - b và cập nhật cờ Z, N, V.',
      'Gợi ý 2: Nếu a <= b thì `B.LE ElsePart` nhảy sang Else. Nhớ thêm `B EndIf` ở cuối nhánh Then để không rơi vào Else!'
    ]
  },

  /* =========================================================================
     TIER 4: THỦ TỤC LÁ (LEAF PROCEDURES - KHÔNG GỌI HÀM KHÁC)
     Tham số qua X0–X7, kết quả qua X0, kết thúc bằng BR LR. Thời gian: 300s.
     ========================================================================= */
  {
    id: 'tier4_leaf',
    tier: 4,
    title: 'Thủ Tục Lá Tiêu Chuẩn: leaf_example(g, h, i, j)',
    time_limit: 300,
    base_score: 1100,
    isProcedure: true,
    c_code: `// Ánh xạ tham số: g: X0, h: X1, i: X2, j: X3. Kết quả: X0
long long leaf(long long g, long long h, long long i, long long j) {
    return (g + h) - (i + j);
}`,
    desc: '4 tham số g, h, i, j truyền lần lượt qua X0, X1, X2, X3. Kết quả trả về đặt trong X0. Kết thúc thủ tục bằng lệnh BR LR.',
    register_map: [
      { var: 'g (tham số 1)', reg: 'X0', role: 'Tham số đầu vào' },
      { var: 'h (tham số 2)', reg: 'X1', role: 'Tham số đầu vào' },
      { var: 'i (tham số 3)', reg: 'X2', role: 'Tham số đầu vào' },
      { var: 'j (tham số 4)', reg: 'X3', role: 'Tham số đầu vào' },
      { var: 'Kết quả trả về', reg: 'X0', role: 'Giá trị trả về của hàm' },
      { var: 'Địa chỉ quay về', reg: 'LR (X30)', role: 'Thanh ghi liên kết quay về' }
    ],
    starter_code: `leaf:
    // Nhận g: X0, h: X1, i: X2, j: X3
    // Tính (g + h) - (i + j), trả về qua X0
    
    BR    LR               // Quay về hàm gọi
`,
    solution_code: `leaf:
    ADD   X9,  X0, X1
    ADD   X10, X2, X3
    SUB   X0,  X9, X10
    BR    LR`,
    test_cases: [
      { params: [10, 20, 5, 5], targetReg: 'X0', expected: 20, label: 'Bộ kiểm thử #1' },
      { params: [1, 2, 3, 4], targetReg: 'X0', expected: -4, label: 'Bộ kiểm thử #2' },
      { params: [100, 200, 150, 150], targetReg: 'X0', expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: Vì là hàm Leaf (không gọi hàm khác), không cần lưu LR vào Stack!',
      'Gợi ý 2: Dùng X9 để lưu g+h, X10 để lưu i+j.',
      'Gợi ý 3: Lưu kết quả cuối cùng vào X0 và kết thúc bằng `BR LR`.'
    ]
  },

  {
    id: 'tier4_max2',
    tier: 4,
    title: 'Thủ Tục Lá Tìm Max: long long max2(long long a, long long b)',
    time_limit: 300,
    base_score: 1150,
    isProcedure: true,
    c_code: `// Ánh xạ tham số: a: X0, b: X1. Kết quả: X0
long long max2(long long a, long long b) {
    if (a >= b)
        return a;
    else
        return b;
}`,
    desc: 'So sánh tham số a (X0) và b (X1). Nếu a >= b thì kết quả đã nằm sẵn trong X0; ngược lại chuyển b (X1) sang X0. Kết thúc bằng BR LR.',
    register_map: [
      { var: 'a', reg: 'X0', role: 'Tham số 1' },
      { var: 'b', reg: 'X1', role: 'Tham số 2' },
      { var: 'Kết quả', reg: 'X0', role: 'Giá trị trả về' }
    ],
    starter_code: `max2:
    // So sánh a (X0) và b (X1), trả về số lớn hơn qua X0
    
    BR    LR               // Quay về
`,
    solution_code: `max2:
    SUBS  XZR, X0, X1
    B.GE  ReturnA
    ADDI  X0,  X1, #0
ReturnA:
    BR    LR`,
    test_cases: [
      { params: [42, 17], targetReg: 'X0', expected: 42, label: 'Bộ kiểm thử #1' },
      { params: [-10, 5], targetReg: 'X0', expected: 5, label: 'Bộ kiểm thử #2' },
      { params: [88, 88], targetReg: 'X0', expected: 88, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: So sánh bằng `SUBS XZR, X0, X1` và dùng `B.GE` để nhảy tới nhãn ReturnA.',
      'Gợi ý 2: Sao chép b sang X0 bằng lệnh `ADDI X0, X1, #0`.'
    ]
  },

  /* =========================================================================
     TIER 5: THỦ TỤC LỒNG NHAU & ĐỆ QUY (NON-LEAF PROCEDURES & STACK FRAME)
     Lưu LR và tham số qua SP, khôi phục trước khi BR LR. Thời gian: 480–600s.
     ========================================================================= */
  {
    id: 'tier5_factorial',
    tier: 5,
    title: 'Giai Thừa Đệ Quy: long long fact(long long n)',
    time_limit: 480,
    base_score: 1500,
    isProcedure: true,
    c_code: `// Ánh xạ: n: X0, kết quả: X0
long long fact(long long n) {
    if (n < 1)
        return 1;
    else
        return n * fact(n - 1);
}`,
    desc: 'Hàm đệ quy gọi lại chính nó bằng lệnh BL fact. Cần cấp phát 16 bytes trên Stack để bảo tồn LR (X30) và giá trị n (X0) qua lời gọi đệ quy.',
    register_map: [
      { var: 'n (đầu vào)', reg: 'X0', role: 'Tham số truyền vào' },
      { var: 'kết quả trả về', reg: 'X0', role: 'Kết quả fact(n)' },
      { var: 'Địa chỉ quay về', reg: 'LR (X30)', role: 'Thanh ghi liên kết' },
      { var: 'Đỉnh ngăn xếp', reg: 'SP', role: 'Con trỏ ngăn xếp (căn 16 bytes)' }
    ],
    starter_code: `fact:
    // Cấp phát ngăn xếp 16 bytes và lưu LR, X0...
    
    // Xử lý nhánh cơ sở n < 1 và nhánh đệ quy n * fact(n - 1)...
    
    BR    LR               // Quay về
`,
    solution_code: `fact:
    SUBI  SP, SP, #16
    STUR  X30, [SP, #8]
    STUR  X0,  [SP, #0]

    SUBIS XZR, X0, #1
    B.GE  L1

    ADDI  X0, XZR, #1
    ADDI  SP, SP, #16
    BR    LR

L1:
    SUBI  X0, X0, #1
    BL    fact

    LDUR  X1,  [SP, #0]
    LDUR  X30, [SP, #8]
    ADDI  SP, SP, #16

    MUL   X0, X1, X0
    BR    LR`,
    test_cases: [
      { params: [0], targetReg: 'X0', expected: 1, label: 'Bộ kiểm thử #1' },
      { params: [1], targetReg: 'X0', expected: 1, label: 'Bộ kiểm thử #2' },
      { params: [4], targetReg: 'X0', expected: 24, label: 'Bộ kiểm thử #3' },
      { params: [6], targetReg: 'X0', expected: 720, label: 'Bộ kiểm thử #4' },
      { params: [7], targetReg: 'X0', expected: 5040, label: 'Bộ kiểm thử #5' }
    ],
    hints: [
      'Gợi ý 1: Cấp phát Stack 16 bytes bằng `SUBI SP, SP, #16`. Lưu X30 (LR) tại [SP, #8] và n (X0) tại [SP, #0].',
      'Gợi ý 2: Kiểm tra n < 1 bằng `SUBIS XZR, X0, #1` và `B.GE L1`.',
      'Gợi ý 3: Đừng quên khôi phục SP bằng `ADDI SP, SP, #16` trước khi thực hiện `BR LR` ở CẢ HAI NHÁNH (nhánh cơ sở n < 1 và nhánh đệ quy)!'
    ]
  },

  {
    id: 'tier5_fib',
    tier: 5,
    title: 'Dãy Số Fibonacci Đệ Quy: long long fib(long long n)',
    time_limit: 600,
    base_score: 1800,
    isProcedure: true,
    c_code: `// Ánh xạ: n: X0, kết quả: X0
long long fib(long long n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}`,
    desc: 'Mỗi hàm thực hiện 2 lời gọi đệ quy. Cần lưu LR và kết quả của fib(n-1) vào Stack trước khi gọi fib(n-2).',
    register_map: [
      { var: 'n', reg: 'X0', role: 'Tham số đầu vào' },
      { var: 'kết quả', reg: 'X0', role: 'fib(n)' },
      { var: 'LR', reg: 'LR (X30)', role: 'Địa chỉ quay về' },
      { var: 'SP', reg: 'SP', role: 'Đỉnh ngăn xếp' }
    ],
    starter_code: `fib:
    // Cấp phát khung Stack 32 bytes...
    // Xử lý trường hợp cơ sở n <= 0, n == 1 và hai lời gọi đệ quy...
    
    BR    LR
`,
    solution_code: `fib:
    SUBI  SP, SP, #32
    STUR  X30, [SP, #16]
    STUR  X0,  [SP, #8]

    SUBS  XZR, X0, XZR
    B.GT  CheckOne
    ADDI  X0,  XZR, #0
    ADDI  SP, SP, #32
    BR    LR

CheckOne:
    SUBIS XZR, X0, #1
    B.NE  Recurse
    ADDI  X0,  XZR, #1
    ADDI  SP, SP, #32
    BR    LR

Recurse:
    SUBI  X0,  X0, #1
    BL    fib
    STUR  X0,  [SP, #0]

    LDUR  X0,  [SP, #8]
    SUBI  X0,  X0, #2
    BL    fib

    LDUR  X1,  [SP, #0]
    ADD   X0,  X1, X0

    LDUR  X30, [SP, #16]
    ADDI  SP, SP, #32
    BR    LR`,
    test_cases: [
      { params: [0], targetReg: 'X0', expected: 0, label: 'Bộ kiểm thử #1' },
      { params: [1], targetReg: 'X0', expected: 1, label: 'Bộ kiểm thử #2' },
      { params: [3], targetReg: 'X0', expected: 2, label: 'Bộ kiểm thử #3' },
      { params: [5], targetReg: 'X0', expected: 5, label: 'Bộ kiểm thử #4' },
      { params: [7], targetReg: 'X0', expected: 13, label: 'Bộ kiểm thử #5' }
    ],
    hints: [
      'Gợi ý 1: Khung Stack 32 bytes có thể chứa: [SP, #16] cho LR, [SP, #8] cho n, [SP, #0] cho giá trị fib(n - 1).',
      'Gợi ý 2: Luôn giải phóng SP bằng ADDI SP, SP, #32 ở mọi điểm return!'
    ]
  },

  /* =========================================================================
     TIER 3 CẤP CAO: VÒNG LẶP & THAO TÁC MẢNG NÂNG CAO
     ========================================================================= */
  {
    id: 'tier3_sum_array',
    tier: 3,
    title: 'Vòng Lặp & Mảng: Tính Tổng Các Phần Tử Trong Mảng',
    time_limit: 300,
    base_score: 950,
    isProcedure: true,
    c_code: `// Ánh xạ tham số: con trỏ mảng A: X0, số phần tử n: X1. Kết quả: X0
long long sum_array(long long A[], long long n) {
    long long sum = 0;
    for (long long i = 0; i < n; i++) {
        sum += A[i];
    }
    return sum;
}`,
    desc: 'Duyệt qua mảng A có n phần tử 64-bit (8 bytes/phần tử). Tính tổng tất cả các phần tử và trả về kết quả trong thanh ghi X0.',
    register_map: [
      { var: 'Địa chỉ mảng A', reg: 'X0', role: 'Tham số đầu vào (con trỏ mảng)' },
      { var: 'Số phần tử n', reg: 'X1', role: 'Tham số đầu vào (kích thước mảng)' },
      { var: 'Tổng sum', reg: 'X9', role: 'Biến cộng dồn tổng' },
      { var: 'Chỉ số i', reg: 'X10', role: 'Biến đếm vòng lặp' },
      { var: 'Kết quả', reg: 'X0', role: 'Giá trị trả về' }
    ],
    starter_code: `sum_array:
    // Khởi tạo biến cộng dồn sum và biến đếm i
    // Vòng lặp duyệt từ i = 0 đến n - 1
    // Nạp A[i] (độ dời i * 8) và cộng dồn vào sum
    // Trả về tổng qua X0 và kết thúc bằng BR LR
    
    BR    LR
`,
    solution_code: `sum_array:
    ADDI  X9,  XZR, #0
    ADDI  X10, XZR, #0
Loop:
    SUBS  XZR, X10, X1
    B.GE  Exit
    LSL   X11, X10, #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    ADD   X9,  X9,  X12
    ADDI  X10, X10, #1
    B     Loop
Exit:
    ADDI  X0,  X9,  #0
    BR    LR`,
    test_cases: [
      { params: [0x1000, 4], memory: { '0x1000': 5, '0x1008': 10, '0x1010': 15, '0x1018': 20 }, expected: 50, label: 'Bộ kiểm thử #1' },
      { params: [0x2000, 5], memory: { '0x2000': -5, '0x2008': 5, '0x2010': -10, '0x2018': 10, '0x2020': 25 }, expected: 25, label: 'Bộ kiểm thử #2' },
      { params: [0x3000, 0], memory: {}, expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: Khởi tạo sum (X9) = 0 và i (X10) = 0.',
      'Gợi ý 2: Kiểm tra điều kiện dừng: `SUBS XZR, X10, X1` rồi `B.GE Exit`.',
      'Gợi ý 3: Tính địa chỉ byte bằng `LSL X11, X10, #3` rồi `ADD X11, X0, X11`. Nạp phần tử bằng `LDUR X12, [X11, #0]`.'
    ]
  },

  {
    id: 'tier3_find_max',
    tier: 3,
    title: 'Vòng Lặp & Rẽ Nhánh: Tìm Phần Tử Lớn Nhất Trong Mảng',
    time_limit: 300,
    base_score: 1000,
    isProcedure: true,
    c_code: `// Ánh xạ tham số: con trỏ mảng A: X0, số phần tử n: X1. Kết quả: X0
long long find_max(long long A[], long long n) {
    long long max_val = A[0];
    for (long long i = 1; i < n; i++) {
        if (A[i] > max_val) {
            max_val = A[i];
        }
    }
    return max_val;
}`,
    desc: 'Tìm giá trị lớn nhất trong mảng A có n phần tử (n >= 1). Khởi tạo max_val = A[0], sau đó duyệt mảng từ i = 1 đến n - 1 để so sánh và cập nhật.',
    register_map: [
      { var: 'Địa chỉ mảng A', reg: 'X0', role: 'Tham số đầu vào' },
      { var: 'Số phần tử n', reg: 'X1', role: 'Kích thước mảng' },
      { var: 'max_val', reg: 'X9', role: 'Giá trị lớn nhất tạm thời' },
      { var: 'Chỉ số i', reg: 'X10', role: 'Biến đếm vòng lặp' },
      { var: 'Kết quả', reg: 'X0', role: 'Giá trị trả về' }
    ],
    starter_code: `find_max:
    // Nạp phần tử đầu tiên A[0] vào X9 làm max ban đầu
    // Khởi tạo i = 1
    // Vòng lặp: nếu i >= n thì thoát
    // Nạp A[i], so sánh với max_val, nếu lớn hơn thì cập nhật
    // Trả về max_val qua X0 và BR LR
    
    BR    LR
`,
    solution_code: `find_max:
    LDUR  X9,  [X0, #0]
    ADDI  X10, XZR, #1
Loop:
    SUBS  XZR, X10, X1
    B.GE  Done
    LSL   X11, X10, #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    SUBS  XZR, X12, X9
    B.LE  Next
    ADDI  X9,  X12, #0
Next:
    ADDI  X10, X10, #1
    B     Loop
Done:
    ADDI  X0,  X9,  #0
    BR    LR`,
    test_cases: [
      { params: [0x1000, 5], memory: { '0x1000': 12, '0x1008': 45, '0x1010': 7, '0x1018': 89, '0x1020': 34 }, expected: 89, label: 'Bộ kiểm thử #1' },
      { params: [0x2000, 4], memory: { '0x2000': -20, '0x2008': -5, '0x2010': -40, '0x2018': -1 }, expected: -1, label: 'Bộ kiểm thử #2' }
    ],
    hints: [
      'Gợi ý 1: Nạp A[0] vào X9 bằng `LDUR X9, [X0, #0]`. Khởi tạo i = 1: `ADDI X10, XZR, #1`.',
      'Gợi ý 2: So sánh A[i] với max: `SUBS XZR, X12, X9`. Nếu A[i] <= max thì nhảy qua: `B.LE Next`.'
    ]
  },

  /* =========================================================================
     TIER 4 NÂNG CAO: THUẬT TOÁN MẢNG & HAI CON TRỎ (IN-PLACE REVERSE & BINARY SEARCH)
     ========================================================================= */
  {
    id: 'tier4_reverse_array',
    tier: 4,
    title: 'Đảo Ngược Mảng Tại Chỗ: Hai Con Trỏ Hoán Đổi Bộ Nhớ',
    time_limit: 360,
    base_score: 1200,
    isProcedure: true,
    c_code: `// Ánh xạ tham số: con trỏ mảng A: X0, số phần tử n: X1
void reverse_array(long long A[], long long n) {
    long long left = 0, right = n - 1;
    while (left < right) {
        long long temp = A[left];
        A[left] = A[right];
        A[right] = temp;
        left++;
        right--;
    }
}`,
    desc: 'Đảo ngược mảng trực tiếp trên RAM bằng hai con trỏ left và right. Hoán đổi từng cặp phần tử A[left] và A[right] cho đến khi left >= right.',
    register_map: [
      { var: 'Địa chỉ mảng A', reg: 'X0', role: 'Con trỏ mảng' },
      { var: 'Số phần tử n', reg: 'X1', role: 'Kích thước mảng' },
      { var: 'left', reg: 'X9', role: 'Chỉ số đầu' },
      { var: 'right', reg: 'X10', role: 'Chỉ số cuối (n - 1)' }
    ],
    starter_code: `reverse_array:
    // Khởi tạo left = 0, right = n - 1
    // Vòng lặp while (left < right):
    //   Tính địa chỉ và nạp A[left], A[right]
    //   Ghi chéo A[right] vào vị trí left và ngược lại
    //   left++, right--
    
    BR    LR
`,
    solution_code: `reverse_array:
    ADDI  X9,  XZR, #0
    SUBI  X10, X1,  #1
Loop:
    SUBS  XZR, X9,  X10
    B.GE  Exit
    LSL   X11, X9,  #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    LSL   X13, X10, #3
    ADD   X13, X0,  X13
    LDUR  X14, [X13, #0]
    STUR  X14, [X11, #0]
    STUR  X12, [X13, #0]
    ADDI  X9,  X9,  #1
    SUBI  X10, X10, #1
    B     Loop
Exit:
    BR    LR`,
    test_cases: [
      {
        params: [0x1000, 4],
        memory: { '0x1000': 1, '0x1008': 2, '0x1010': 3, '0x1018': 4 },
        expected_memory: { '0x1000': 4, '0x1008': 3, '0x1010': 2, '0x1018': 1 },
        label: 'Bộ kiểm thử #1'
      },
      {
        params: [0x2000, 5],
        memory: { '0x2000': 10, '0x2008': 20, '0x2010': 30, '0x2018': 40, '0x2020': 50 },
        expected_memory: { '0x2000': 50, '0x2008': 40, '0x2010': 30, '0x2018': 20, '0x2020': 10 },
        label: 'Bộ kiểm thử #2'
      }
    ],
    hints: [
      'Gợi ý 1: Khởi tạo left = 0 bằng `ADDI X9, XZR, #0` và right = n - 1 bằng `SUBI X10, X1, #1`.',
      'Gợi ý 2: Kiểm tra điều kiện `SUBS XZR, X9, X10` rồi `B.GE Exit`.',
      'Gợi ý 3: Đổi chỗ bằng cách dùng STUR: ghi giá trị A[right] vào địa chỉ [X11] và A[left] vào địa chỉ [X13].'
    ]
  },

  {
    id: 'tier4_binary_search',
    tier: 4,
    title: 'Tìm Kiếm Nhị Phân: binary_search(A, n, key)',
    time_limit: 420,
    base_score: 1350,
    isProcedure: true,
    c_code: `// Ánh xạ: con trỏ mảng A: X0, kích thước n: X1, khóa cần tìm key: X2. Kết quả: X0
long long binary_search(long long A[], long long n, long long key) {
    long long low = 0, high = n - 1;
    while (low <= high) {
        long long mid = (low + high) / 2;
        if (A[mid] == key) return mid;
        if (A[mid] < key)  low = mid + 1;
        else               high = mid - 1;
    }
    return -1;
}`,
    desc: 'Thực hiện thuật toán tìm kiếm nhị phân trên mảng đã sắp xếp tăng dần. Chia đôi bằng phép dịch phải logic (LSR #1). Trả về chỉ số tìm thấy hoặc -1 nếu không có.',
    register_map: [
      { var: 'Địa chỉ mảng A', reg: 'X0', role: 'Mảng đã sắp xếp' },
      { var: 'Kích thước n', reg: 'X1', role: 'Số phần tử' },
      { var: 'Khóa key', reg: 'X2', role: 'Giá trị cần tìm' },
      { var: 'low', reg: 'X9', role: 'Chỉ số cận dưới' },
      { var: 'high', reg: 'X10', role: 'Chỉ số cận trên' },
      { var: 'mid', reg: 'X11', role: 'Chỉ số điểm giữa' },
      { var: 'Kết quả', reg: 'X0', role: 'Chỉ số mid hoặc -1' }
    ],
    starter_code: `binary_search:
    // Khởi tạo low = 0, high = n - 1
    // Vòng lặp while (low <= high):
    //   mid = (low + high) >> 1
    //   Nạp A[mid], so sánh với key
    //   Nếu bằng nhau: trả về mid trong X0
    //   Nếu A[mid] < key: low = mid + 1
    //   Ngược lại: high = mid - 1
    // Nếu thoát vòng lặp: trả về -1 trong X0
    
    BR    LR
`,
    solution_code: `binary_search:
    ADDI  X9,  XZR, #0
    SUBI  X10, X1,  #1
Loop:
    SUBS  XZR, X9,  X10
    B.GT  NotFound
    ADD   X11, X9,  X10
    LSR   X11, X11, #1
    LSL   X12, X11, #3
    ADD   X12, X0,  X12
    LDUR  X13, [X12, #0]
    SUBS  XZR, X13, X2
    B.EQ  Found
    B.LT  GoRight
    SUBI  X10, X11, #1
    B     Loop
GoRight:
    ADDI  X9,  X11, #1
    B     Loop
Found:
    ADDI  X0,  X11, #0
    BR    LR
NotFound:
    SUBI  X0,  XZR, #1
    BR    LR`,
    test_cases: [
      {
        params: [0x1000, 5, 23],
        memory: { '0x1000': 2, '0x1008': 5, '0x1010': 12, '0x1018': 23, '0x1020': 40 },
        expected: 3,
        label: 'Bộ kiểm thử #1'
      },
      {
        params: [0x1000, 5, 50],
        memory: { '0x1000': 2, '0x1008': 5, '0x1010': 12, '0x1018': 23, '0x1020': 40 },
        expected: -1,
        label: 'Bộ kiểm thử #2'
      },
      {
        params: [0x1000, 5, 2],
        memory: { '0x1000': 2, '0x1008': 5, '0x1010': 12, '0x1018': 23, '0x1020': 40 },
        expected: 0,
        label: 'Bộ kiểm thử #3'
      }
    ],
    hints: [
      'Gợi ý 1: Phép chia đôi số nguyên không âm `(low + high) / 2` tương đương lệnh `LSR X11, X11, #1`.',
      'Gợi ý 2: So sánh `SUBS XZR, X13, X2`: B.EQ nhảy tới Found; B.LT nhảy tới GoRight (low = mid + 1).',
      'Gợi ý 3: Khi không tìm thấy, trả về -1 bằng lệnh `SUBI X0, XZR, #1`.'
    ]
  },

  /* =========================================================================
     TIER 5 NÂNG CAO: CHUỖI GỌI HÀM LỒNG NHAU, VÒNG LẶP GỌI HÀM & ĐỆ QUY CÂY
     ========================================================================= */
  {
    id: 'tier5_nested_chain',
    tier: 5,
    title: 'Chuỗi Lời Gọi Hàm Lồng Nhau 3 Cấp: chain3(a, b, c)',
    time_limit: 480,
    base_score: 1600,
    isProcedure: true,
    c_code: `// mul2 nhân đôi số nguyên
long long mul2(long long x) {
    return x * 2;
}

// poly tính mul2(x) + c
long long poly(long long x, long long c) {
    return mul2(x) + c;
}

// chain3 tính poly(a, b) + poly(b, c)
long long chain3(long long a, long long b, long long c) {
    return poly(a, b) + poly(b, c);
}`,
    desc: 'Hàm chain3 gọi poly 2 lần; hàm poly lại gọi hàm mul2. Yêu cầu quản lý ngăn xếp (Stack Frame) chuẩn xác ở từng cấp độ hàm non-leaf để bảo toàn con trỏ LR và các biến trung gian.',
    register_map: [
      { var: 'a', reg: 'X0', role: 'Tham số 1' },
      { var: 'b', reg: 'X1', role: 'Tham số 2' },
      { var: 'c', reg: 'X2', role: 'Tham số 3' },
      { var: 'LR', reg: 'LR (X30)', role: 'Địa chỉ quay về' },
      { var: 'SP', reg: 'SP', role: 'Con trỏ ngăn xếp (căn 16 bytes)' }
    ],
    starter_code: `chain3:
    // Cấp phát Stack Frame (32 bytes)
    // Lưu LR, X19 và các tham số b, c
    // Gọi poly(a, b)
    // Lưu kết quả vào X19
    // Gọi poly(b, c)
    // Cộng hai kết quả, khôi phục X19, LR, giải phóng SP
    BR    LR

poly:
    // Cấp phát Stack Frame (16 bytes)
    // Lưu LR và tham số c
    // Gọi mul2(x)
    // Cộng c vào kết quả trả về, khôi phục LR, giải phóng SP
    BR    LR

mul2:
    // Hàm lá: nhân đôi X0 bằng dịch trái 1 bit
    LSL   X0,  X0, #1
    BR    LR
`,
    solution_code: `chain3:
    SUBI  SP, SP, #32
    STUR  X30, [SP, #24]
    STUR  X19, [SP, #16]
    STUR  X1,  [SP, #8]
    STUR  X2,  [SP, #0]
    
    BL    poly
    ADDI  X19, X0, #0
    
    LDUR  X0,  [SP, #8]
    LDUR  X1,  [SP, #0]
    BL    poly
    
    ADD   X0,  X19, X0
    
    LDUR  X19, [SP, #16]
    LDUR  X30, [SP, #24]
    ADDI  SP, SP, #32
    BR    LR

poly:
    SUBI  SP, SP, #16
    STUR  X30, [SP, #8]
    STUR  X1,  [SP, #0]
    
    BL    mul2
    
    LDUR  X1,  [SP, #0]
    ADD   X0,  X0, X1
    
    LDUR  X30, [SP, #8]
    ADDI  SP, SP, #16
    BR    LR

mul2:
    LSL   X0,  X0, #1
    BR    LR`,
    test_cases: [
      { params: [3, 4, 5], expected: 23, label: 'Bộ kiểm thử #1' },
      { params: [1, 2, 3], expected: 11, label: 'Bộ kiểm thử #2' },
      { params: [10, -5, 8], expected: 13, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: Trong `chain3`, bạn dùng callee-saved register X19 để lưu kết quả của lần gọi `poly` thứ nhất, do đó bắt buộc phải lưu X19 vào Stack trước và khôi phục lại khi kết thúc!',
      'Gợi ý 2: Khung Stack trong chain3 cần 32 bytes (bội số của 16): [SP, #24]=LR, [SP, #16]=X19, [SP, #8]=b, [SP, #0]=c.',
      'Gợi ý 3: Trong `poly`, khung Stack 16 bytes: [SP, #8]=LR, [SP, #0]=c.'
    ]
  },

  {
    id: 'tier5_sum_sq_array',
    tier: 5,
    title: 'Duyệt Mảng & Gọi Hàm Con: sum_sq_array(A, n)',
    time_limit: 480,
    base_score: 1700,
    isProcedure: true,
    c_code: `// Hàm bình phương số nguyên
long long sq(long long x) {
    return x * x;
}

// Tính tổng bình phương các phần tử mảng: sum(A[i]^2)
long long sum_sq_array(long long A[], long long n) {
    long long total = 0;
    for (long long i = 0; i < n; i++) {
        total += sq(A[i]);
    }
    return total;
}`,
    desc: 'Sự kết hợp giữa vòng lặp duyệt mảng và gọi hàm con `sq`. Vì trong thân vòng lặp có lệnh BL sq, hàm gọi trở thành Non-Leaf và có thể bị hàm con ghi đè các thanh ghi tạm. Cần sử dụng các thanh ghi Callee-saved (X19–X22) để giữ nguyên con trỏ mảng, biến đếm i, n và tổng total qua mỗi lần gọi hàm!',
    register_map: [
      { var: 'A (con trỏ mảng)', reg: 'X19', role: 'Callee-saved: lưu địa chỉ mảng' },
      { var: 'n (số phần tử)', reg: 'X20', role: 'Callee-saved: kích thước mảng' },
      { var: 'i (chỉ số vòng lặp)', reg: 'X21', role: 'Callee-saved: biến đếm' },
      { var: 'total (tổng dồn)', reg: 'X22', role: 'Callee-saved: tổng kết quả' },
      { var: 'LR', reg: 'LR (X30)', role: 'Địa chỉ quay về' },
      { var: 'SP', reg: 'SP', role: 'Căn 16 bytes (48 bytes)' }
    ],
    starter_code: `sum_sq_array:
    // Cấp phát khung ngăn xếp 48 bytes (bội số của 16)
    // Lưu LR và các thanh ghi callee-saved X19, X20, X21, X22
    // Lưu tham số A và n vào X19, X20; khởi tạo i (X21) = 0, total (X22) = 0
    // Vòng lặp: nạp A[i], gọi BL sq, cộng kết quả vào total, i++
    // Khôi phục X22, X21, X20, X19, LR và giải phóng ngăn xếp
    BR    LR

sq:
    MUL   X0,  X0, X0
    BR    LR
`,
    solution_code: `sum_sq_array:
    SUBI  SP, SP, #48
    STUR  X30, [SP, #40]
    STUR  X19, [SP, #32]
    STUR  X20, [SP, #24]
    STUR  X21, [SP, #16]
    STUR  X22, [SP, #8]
    
    ADDI  X19, X0,  #0
    ADDI  X20, X1,  #0
    ADDI  X21, XZR, #0
    ADDI  X22, XZR, #0
    
Loop:
    SUBS  XZR, X21, X20
    B.GE  Done
    
    LSL   X9,  X21, #3
    ADD   X9,  X19, X9
    LDUR  X0,  [X9, #0]
    BL    sq
    
    ADD   X22, X22, X0
    ADDI  X21, X21, #1
    B     Loop
    
Done:
    ADDI  X0,  X22, #0
    
    LDUR  X22, [SP, #8]
    LDUR  X21, [SP, #16]
    LDUR  X20, [SP, #24]
    LDUR  X19, [SP, #32]
    LDUR  X30, [SP, #40]
    ADDI  SP, SP, #48
    BR    LR

sq:
    MUL   X0,  X0, X0
    BR    LR`,
    test_cases: [
      { params: [0x1000, 3], memory: { '0x1000': 1, '0x1008': 2, '0x1010': 3 }, expected: 14, label: 'Bộ kiểm thử #1' },
      { params: [0x2000, 3], memory: { '0x2000': 3, '0x2008': 4, '0x2010': 5 }, expected: 50, label: 'Bộ kiểm thử #2' },
      { params: [0x3000, 3], memory: { '0x3000': -2, '0x3008': 0, '0x3010': 2 }, expected: 8, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Gợi ý 1: Khung Stack cần 48 bytes (vì 5 thanh ghi 64-bit = 40 bytes, làm tròn lên bội số của 16 thành 48 bytes).',
      'Gợi ý 2: Lưu X30 (LR) tại [SP, #40], X19 tại [SP, #32], X20 tại [SP, #24], X21 tại [SP, #16], X22 tại [SP, #8].',
      'Gợi ý 3: Trước khi gọi `BL sq`, nạp A[i] vào X0 làm tham số. Sau khi `sq` trả về, kết quả bình phương nằm trong X0.'
    ]
  },

  {
    id: 'tier5_pascal_nCr',
    tier: 5,
    title: 'Đệ Quy Hai Nhánh Cây: Tính Tổ Hợp Chập r Của n - Tam Giác Pascal',
    time_limit: 600,
    base_score: 2000,
    isProcedure: true,
    c_code: `// Tính tổ hợp C(n, r) bằng công thức truy hồi Tam giác Pascal
long long nCr(long long n, long long r) {
    if (r == 0 || r == n) return 1;
    return nCr(n - 1, r - 1) + nCr(n - 1, r);
}`,
    desc: 'C(n, r) = C(n - 1, r - 1) + C(n - 1, r). Mỗi lời gọi hàm sinh ra 2 nhánh đệ quy con. Đòi hỏi bảo tồn LR và kết quả nhánh con thứ nhất trên ngăn xếp trước khi thực hiện nhánh con thứ hai.',
    register_map: [
      { var: 'n', reg: 'X0', role: 'Tham số n' },
      { var: 'r', reg: 'X1', role: 'Tham số r' },
      { var: 'kết quả', reg: 'X0', role: 'C(n, r)' },
      { var: 'LR', reg: 'LR (X30)', role: 'Địa chỉ quay về' },
      { var: 'SP', reg: 'SP', role: 'Khung Stack 32 bytes' }
    ],
    starter_code: `nCr:
    // Kiểm tra trường hợp dừng: r == 0 hoặc r == n -> trả về 1
    // Cấp phát Stack Frame 32 bytes
    // Lưu LR, n, r
    // Gọi đệ quy nhánh 1: nCr(n - 1, r - 1)
    // Lưu kết quả nhánh 1 lên Stack
    // Gọi đệ quy nhánh 2: nCr(n - 1, r)
    // Cộng kết quả nhánh 1 với nhánh 2, khôi phục LR và SP
    BR    LR
`,
    solution_code: `nCr:
    CBZ   X1,  BaseOne
    SUBS  XZR, X1, X0
    B.EQ  BaseOne

    SUBI  SP, SP, #32
    STUR  X30, [SP, #24]
    STUR  X0,  [SP, #16]
    STUR  X1,  [SP, #8]

    SUBI  X0,  X0, #1
    SUBI  X1,  X1, #1
    BL    nCr
    STUR  X0,  [SP, #0]

    LDUR  X0,  [SP, #16]
    SUBI  X0,  X0, #1
    LDUR  X1,  [SP, #8]
    BL    nCr

    LDUR  X2,  [SP, #0]
    ADD   X0,  X2, X0

    LDUR  X30, [SP, #24]
    ADDI  SP, SP, #32
    BR    LR

BaseOne:
    ADDI  X0,  XZR, #1
    BR    LR`,
    test_cases: [
      { params: [4, 2], expected: 6, label: 'Bộ kiểm thử #1' },
      { params: [5, 3], expected: 10, label: 'Bộ kiểm thử #2' },
      { params: [6, 0], expected: 1, label: 'Bộ kiểm thử #3' },
      { params: [6, 6], expected: 1, label: 'Bộ kiểm thử #4' },
      { params: [6, 2], expected: 15, label: 'Bộ kiểm thử #5' }
    ],
    hints: [
      'Gợi ý 1: Trường hợp cơ sở: dùng `CBZ X1, BaseOne` (khi r == 0) và `SUBS XZR, X1, X0` + `B.EQ BaseOne` (khi r == n). Tại BaseOne chỉ cần gán `ADDI X0, XZR, #1` và `BR LR`.',
      'Gợi ý 2: Khung Stack 32 bytes: [SP, #24]=LR, [SP, #16]=n, [SP, #8]=r, [SP, #0]=kết quả nhánh 1.',
      'Gợi ý 3: Sau khi nhánh 1 trả về kết quả trong X0, lưu ngay vào `[SP, #0]` trước khi phục hồi n và r để chuẩn bị cho nhánh 2.'
    ]
  },

  /* =========================================================================
     TIER 2 BỔ SUNG: DỮ LIỆU ĐA KÍCH THƯỚC (32-BIT INT & 16-BIT SHORT)
     ========================================================================= */
  {
    id: 'tier2_32bit_array_sum',
    level_id: 'tier2_32bit_array_sum',
    tier: 2,
    title: 'Tính Tổng Mảng int 32-bit (LDURSW & LSL #2)',
    difficulty: 'Medium',
    time_limit: 240,
    time_limit_seconds: 240,
    base_score: 600,
    isProcedure: true,
    c_code: `// Tính tổng các phần tử của mảng int 32-bit có kích thước n
int sum_array(int A[], int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += A[i];
    }
    return sum;
}`,
    desc: 'Vì kiểu int là 32-bit (4 bytes), byte offset = i * 4 (dùng LSL #2). Sử dụng lệnh LDURSW để nạp 32-bit từ bộ nhớ và tự động mở rộng dấu (sign-extend) lên thanh ghi 64-bit.',
    register_map: [
      { var: 'A (con trỏ mảng)', reg: 'X0', role: 'Địa chỉ cơ sở mảng int' },
      { var: 'n (số phần tử)', reg: 'X1', role: 'Kích thước mảng' },
      { var: 'sum (kết quả)', reg: 'X0', role: 'Giá trị trả về' },
      { var: 'i (biến đếm)', reg: 'X9', role: 'Biến lặp' },
      { var: 'sum tạm', reg: 'X10', role: 'Thanh ghi cộng dồn' }
    ],
    starter_code: `sum_array:
    ORR   X9, XZR, XZR       // i = 0
    ORR   X10, XZR, XZR      // sum = 0
Loop:
    SUBS  XZR, X9, X1        // So sánh i với n
    B.GE  Exit               // Nếu i >= n -> Thoát

    // TODO: Tính byte offset của A[i] (int 32-bit: LSL #2)
    // Nạp dữ liệu bằng LDURSW và cộng dồn vào X10
    
Exit:
    ORR   X0, XZR, X10       // Trả về kết quả qua X0
    BR    LR
`,
    solution_code: `sum_array:
    ORR   X9, XZR, XZR
    ORR   X10, XZR, XZR
Loop:
    SUBS  XZR, X9, X1
    B.GE  Exit
    LSL   X11, X9, #2
    ADD   X11, X0, X11
    LDURSW X12, [X11, #0]
    ADD   X10, X10, X12
    ADDI  X9, X9, #1
    B     Loop
Exit:
    ORR   X0, XZR, X10
    BR    LR`,
    test_cases: [
      { params: [0x1000, 4], data_width: 4, memory: { '0x1000': 10, '0x1004': 20, '0x1008': -5, '0x100C': 15 }, targetReg: 'X0', expected: 40, label: 'Bộ kiểm thử #1' },
      { params: [0x2000, 3], data_width: 4, memory: { '0x2000': 100, '0x2004': -150, '0x2008': 50 }, targetReg: 'X0', expected: 0, label: 'Bộ kiểm thử #2' }
    ],
    hints: [
      'Gợi ý 1: Vì kiểu int là 32-bit (4 bytes), byte offset = i * 4. Hãy dùng lệnh LSL X11, X9, #2.',
      'Gợi ý 2: Dùng lệnh LDURSW để nạp 32-bit từ bộ nhớ và tự động mở rộng dấu (sign-extend) lên thanh ghi 64-bit.'
    ]
  },

  {
    id: 'tier2_16bit_halfword_scale',
    level_id: 'tier2_16bit_halfword_scale',
    tier: 2,
    title: 'Nhân Đôi Phần Tử Mảng short 16-bit (LDURH & STURH)',
    difficulty: 'Medium',
    time_limit: 240,
    time_limit_seconds: 240,
    base_score: 600,
    isProcedure: true,
    c_code: `// Gấp đôi giá trị phần tử thứ i trong mảng 16-bit: A[i] = A[i] * 2
void double_element(short A[], long long i) {
    A[i] = A[i] * 2;
}`,
    desc: 'Thao tác trên dữ liệu short 16-bit (halfword, 2 bytes). Tính byte offset = i * 2 bằng LSL #1. Nạp bằng LDURH, nhân 2 bằng LSL #1 và lưu lại bằng STURH.',
    register_map: [
      { var: 'A (con trỏ mảng 16-bit)', reg: 'X0', role: 'Địa chỉ mảng' },
      { var: 'i (chỉ số phần tử)', reg: 'X1', role: 'Chỉ số phần tử' }
    ],
    starter_code: `double_element:
    // TODO: Tính byte offset của short 16-bit (2 bytes: LSL #1)
    // Nạp bằng LDURH, nhân đôi (LSL #1), rồi lưu lại bằng STURH

    BR    LR
`,
    solution_code: `double_element:
    LSL   X9, X1, #1
    ADD   X9, X0, X9
    LDURH X10, [X9, #0]
    LSL   X10, X10, #1
    STURH X10, [X9, #0]
    BR    LR`,
    test_cases: [
      { params: [0x1000, 2], data_width: 2, memory: { '0x1000': 50, '0x1002': 100, '0x1004': 300 }, expected_memory: { '0x1004': 600 }, label: 'Bộ kiểm thử #1' },
      { params: [0x2000, 0], data_width: 2, memory: { '0x2000': 25, '0x2002': 75 }, expected_memory: { '0x2000': 50 }, label: 'Bộ kiểm thử #2' }
    ],
    hints: [
      'Gợi ý 1: short chiếm 2 bytes, do đó offset = i * 2 (dùng LSL X9, X1, #1).',
      'Gợi ý 2: Lưu ý dùng cặp lệnh đúng kích cỡ: nạp bằng LDURH và lưu lại bằng STURH.'
    ]
  },

  /* =========================================================================
     TIER 3 BỔ SUNG: DỮ LIỆU CHUỖI KÝ TỰ (STRING - 8-BIT CHAR)
     ========================================================================= */
  {
    id: 'tier3_string_strlen',
    level_id: 'tier3_string_strlen',
    tier: 3,
    title: 'Tính Độ Dài Chuỗi Ký Tự (strlen với LDURB & CBZ)',
    difficulty: 'Medium',
    time_limit: 300,
    time_limit_seconds: 300,
    base_score: 700,
    isProcedure: true,
    c_code: `long long my_strlen(char *s) {
    long long len = 0;
    while (s[len] != '\\0') {
        len++;
    }
    return len;
}`,
    desc: 'Mỗi ký tự char chiếm đúng 1 byte (8-bit). Byte offset bằng đúng len, cộng trực tiếp Base + len mà KHÔNG cần dịch bit. Nạp ký tự bằng LDURB và kiểm tra ký tự kết thúc chuỗi "\\0" (giá trị 0) bằng lệnh CBZ.',
    register_map: [
      { var: 's (con trỏ chuỗi)', reg: 'X0', role: 'Địa chỉ chuỗi ký tự' },
      { var: 'len (kết quả trả về)', reg: 'X0', role: 'Độ dài chuỗi' },
      { var: 'biến đếm nội bộ', reg: 'X9', role: 'Biến đếm độ dài' }
    ],
    starter_code: `my_strlen:
    ORR   X9, XZR, XZR       // len = 0
Loop_len:
    // TODO: Nạp ký tự s[len] bằng LDURB (chú ý: char 1-byte không cần dịch bit!)
    // Kiểm tra ký tự '\\0' bằng CBZ để thoát khỏi vòng lặp

Exit_len:
    ORR   X0, XZR, X9        // Gán kết quả vào X0
    BR    LR
`,
    solution_code: `my_strlen:
    ORR   X9, XZR, XZR
Loop_len:
    ADD   X10, X0, X9
    LDURB X11, [X10, #0]
    CBZ   X11, Exit_len
    ADDI  X9, X9, #1
    B     Loop_len
Exit_len:
    ORR   X0, XZR, X9
    BR    LR`,
    test_cases: [
      { params: [0x1000], memory: { '0x1000': 'LEGv8' }, targetReg: 'X0', expected: 5, label: 'Bộ kiểm thử #1 ("LEGv8")' },
      { params: [0x2000], memory: { '0x2000': '' }, targetReg: 'X0', expected: 0, label: 'Bộ kiểm thử #2 (Chuỗi rỗng)' },
      { params: [0x3000], memory: { '0x3000': 'Hello World!' }, targetReg: 'X0', expected: 12, label: 'Bộ kiểm thử #3 ("Hello World!")' }
    ],
    hints: [
      'Gợi ý 1: Vì char chiếm đúng 1 byte, địa chỉ của s[len] chỉ là X0 + len, KHÔNG được nhân hay dịch trái!',
      'Gợi ý 2: Dùng CBZ X11, Exit_len để nhảy ra ngoài ngay khi ký tự nạp vào có giá trị bằng 0.'
    ]
  },

  /* =========================================================================
     TIER 4 BỔ SUNG: SAO CHÉP CHUỖI & QUẢN LÝ CALLEE-SAVED
     ========================================================================= */
  {
    id: 'tier4_string_strcpy',
    level_id: 'tier4_string_strcpy',
    tier: 4,
    title: 'Sao Chép Chuỗi Ký Tự (strcpy & Bảo Tồn Callee-saved X19)',
    difficulty: 'Hard',
    time_limit: 360,
    time_limit_seconds: 360,
    base_score: 800,
    isProcedure: true,
    c_code: `void my_strcpy(char x[], char y[]) {
    size_t i = 0;
    while ((x[i] = y[i]) != '\\0') {
        i++;
    }
}`,
    desc: 'Sao chép chuỗi nguồn y vào chuỗi đích x. Phép gán x[i] = y[i] được thực hiện trước khi kiểm tra ký tự "\\0" để đảm bảo ký tự kết thúc chuỗi cũng được sao chép. Nếu dùng thanh ghi Callee-saved X19 làm biến đếm i, bắt buộc phải lưu vào Stack và khôi phục trước khi thoát.',
    register_map: [
      { var: 'x (chuỗi đích)', reg: 'X0', role: 'Địa chỉ chuỗi đích' },
      { var: 'y (chuỗi nguồn)', reg: 'X1', role: 'Địa chỉ chuỗi nguồn' },
      { var: 'i', reg: 'X19', role: 'Chỉ số (lưu vào Stack)' }
    ],
    starter_code: `my_strcpy:
    SUBI  SP, SP, #16        // Cấp phát Stack bảo tồn X19
    STUR  X19, [SP, #0]
    ORR   X19, XZR, XZR      // i = 0
Loop_cpy:
    // TODO: Nạp y[i] bằng LDURB, ghi vào x[i] bằng STURB
    // Kiểm tra thoát nếu byte vừa lưu là '\\0'

Exit_cpy:
    LDUR  X19, [SP, #0]      // Khôi phục X19
    ADDI  SP, SP, #16        // Giải phóng Stack
    BR    LR
`,
    solution_code: `my_strcpy:
    SUBI  SP, SP, #16
    STUR  X19, [SP, #0]
    ORR   X19, XZR, XZR
Loop_cpy:
    ADD   X10, X1, X19
    LDURB X11, [X10, #0]
    ADD   X12, X0, X19
    STURB X11, [X12, #0]
    CBZ   X11, Exit_cpy
    ADDI  X19, X19, #1
    B     Loop_cpy
Exit_cpy:
    LDUR  X19, [SP, #0]
    ADDI  SP, SP, #16
    BR    LR`,
    test_cases: [
      { params: [0x1000, 0x2000], memory: { '0x2000': 'ARMv8_Rulez' }, expected_memory: { '0x1000': 'ARMv8_Rulez' }, label: 'Bộ kiểm thử #1' },
      { params: [0x3000, 0x4000], memory: { '0x4000': 'KMap' }, expected_memory: { '0x3000': 'KMap' }, label: 'Bộ kiểm thử #2' }
    ],
    hints: [
      'Gợi ý 1: Phép gán x[i] = y[i] phải được thực hiện TRƯỚC KHI kiểm tra điều kiện thoát, để đảm bảo ký tự "\\0" cũng được sao chép sang chuỗi đích.',
      'Gợi ý 2: Dùng STURB để ghi đúng 1 byte sang x[i].'
    ]
  },

  /* =========================================================================
     TIER 5 BỔ SUNG: CHƯƠNG TRÌNH C TOÀN DIỆN VỚI HÀM MAIN & LỒNG NHAU ĐA CẤP
     ========================================================================= */
  {
    id: 'tier5_complete_c_pipeline',
    level_id: 'tier5_complete_c_pipeline',
    tier: 5,
    title: 'Chương Trình C Hoàn Chỉnh: main, Duyệt Mảng & Lời Gọi Lồng Nhau',
    difficulty: 'Master',
    time_limit: 600,
    time_limit_seconds: 600,
    base_score: 2500,
    isProcedure: true,
    c_code: `// Hàm lá: biến đổi giá trị x
long long transform(long long x) {
    return (x * 3) + 5;
}

// Hàm duyệt mảng: lặp qua n phần tử, gọi transform và cộng dồn có điều kiện (> 20)
long long process_array(long long A[], long long n) {
    long long sum = 0;
    for (long long i = 0; i < n; i++) {
        long long val = transform(A[i]);
        if (val > 20) {
            sum += val;
        }
    }
    return sum;
}

// Hàm main chuẩn C: cấp phát mảng cục bộ trên Stack, gọi process_array và trả về kết quả
long long main() {
    long long data[4] = { 2, 6, 8, 3 };
    return process_array(data, 4);
}`,
    desc: 'Đỉnh cao của kiến trúc máy tính: Mô phỏng đầy đủ cấu trúc một chương trình C thực thụ. Hàm main cấp phát mảng cục bộ trên khung ngăn xếp, gọi hàm process_array; hàm process_array duyệt mảng bằng vòng lặp và gọi hàm lá transform bên trong vòng lặp. Đòi hỏi quản lý hoàn hảo nhiều tầng Stack Frame, bảo tồn con trỏ LR và các thanh ghi Callee-saved X19–X22.',
    register_map: [
      { var: 'main SP Frame', reg: 'SP', role: 'Khung Stack 48 bytes chứa mảng data[4] và LR' },
      { var: 'process_array Frame', reg: 'SP', role: 'Khung Stack 48 bytes bảo tồn LR và X19..X22' },
      { var: 'A (con trỏ mảng)', reg: 'X19', role: 'Callee-saved trong process_array' },
      { var: 'n (số phần tử)', reg: 'X20', role: 'Callee-saved trong process_array' },
      { var: 'i (chỉ số lặp)', reg: 'X21', role: 'Callee-saved trong process_array' },
      { var: 'sum (tổng kết quả)', reg: 'X22', role: 'Callee-saved trong process_array' }
    ],
    starter_code: `main:
    // Cấp phát Stack Frame (48 bytes: bội số 16)
    // Lưu LR vào [SP, #32]
    // Khởi tạo mảng cục bộ data[4] = { 2, 6, 8, 3 } tại [SP, #0]..[SP, #24]
    // Gọi process_array(data, 4) với X0 = SP, X1 = 4
    // Khôi phục LR, giải phóng Stack, BR LR
    BR    LR

process_array:
    // Cấp phát Stack Frame (48 bytes) bảo tồn LR và X19..X22
    // Lưu tham số A, n vào X19, X20; khởi tạo i (X21) = 0, sum (X22) = 0
    // Vòng lặp: nạp A[i], gọi BL transform
    // Nếu kết quả > 20 thì cộng dồn vào sum
    // Khôi phục các thanh ghi, giải phóng Stack, BR LR
    BR    LR

transform:
    // Hàm lá: tính (x * 3) + 5
    ADDI  X9,  XZR, #3
    MUL   X0,  X0,  X9
    ADDI  X0,  X0,  #5
    BR    LR
`,
    solution_code: `main:
    SUBI  SP, SP, #48
    STUR  X30, [SP, #32]
    
    ADDI  X9,  XZR, #2
    STUR  X9,  [SP, #0]
    ADDI  X9,  XZR, #6
    STUR  X9,  [SP, #8]
    ADDI  X9,  XZR, #8
    STUR  X9,  [SP, #16]
    ADDI  X9,  XZR, #3
    STUR  X9,  [SP, #24]
    
    ADDI  X0,  SP,  #0
    ADDI  X1,  XZR, #4
    BL    process_array
    
    LDUR  X30, [SP, #32]
    ADDI  SP, SP, #48
    BR    LR

process_array:
    SUBI  SP, SP, #48
    STUR  X30, [SP, #40]
    STUR  X19, [SP, #32]
    STUR  X20, [SP, #24]
    STUR  X21, [SP, #16]
    STUR  X22, [SP, #8]
    
    ADDI  X19, X0,  #0
    ADDI  X20, X1,  #0
    ADDI  X21, XZR, #0
    ADDI  X22, XZR, #0
    
Loop_proc:
    SUBS  XZR, X21, X20
    B.GE  Done_proc
    
    LSL   X9,  X21, #3
    ADD   X9,  X19, X9
    LDUR  X0,  [X9, #0]
    BL    transform
    
    SUBIS XZR, X0, #20
    B.LE  Skip_add
    ADD   X22, X22, X0
    
Skip_add:
    ADDI  X21, X21, #1
    B     Loop_proc
    
Done_proc:
    ADDI  X0,  X22, #0
    LDUR  X22, [SP, #8]
    LDUR  X21, [SP, #16]
    LDUR  X20, [SP, #24]
    LDUR  X19, [SP, #32]
    LDUR  X30, [SP, #40]
    ADDI  SP, SP, #48
    BR    LR

transform:
    ADDI  X9,  XZR, #3
    MUL   X0,  X0,  X9
    ADDI  X0,  X0,  #5
    BR    LR`,
    test_cases: [
      { params: [], targetReg: 'X0', expected: 52, label: 'Bộ kiểm thử #1 (main return = 52)' }
    ],
    hints: [
      'Gợi ý 1: Trong main, cấp phát 48 bytes trên Stack: [SP, #32] cho LR, các vị trí [SP, #0], [SP, #8], [SP, #16], [SP, #24] chứa 4 phần tử data.',
      'Gợi ý 2: Truyền con trỏ mảng data cho process_array bằng lệnh `ADDI X0, SP, #0`.',
      'Gợi ý 3: Vì process_array gọi BL transform bên trong vòng lặp, bắt buộc phải bảo tồn biến đếm i, con trỏ mảng và tổng sum trong các thanh ghi Callee-saved X19..X22!'
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEGV8_LEVELS;
}
