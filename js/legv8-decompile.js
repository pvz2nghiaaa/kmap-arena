'use strict';
/**
 * ============================================================================
 * LEGv8 Reverse Decompiler — Minigame 2: Chuyển Đổi LEGv8 sang Ngôn Ngữ C
 * Decompilation Challenges, C-to-JS Sandbox Evaluator & Test Runner
 * ============================================================================
 */

const DECOMPILE_LEVELS = [
  {
    id: 'dec_expr1',
    tier: 1,
    title: 'Dịch Ngược Biểu Thức Số Học: ADD & SUB',
    time_limit: 180,
    base_score: 500,
    legv8_code: `// Ánh xạ thanh ghi: a: X19, b: X20, c: X21, f: X9
ADD   X9,  X19, X20
ADDI  X10, X21, #35
SUB   X9,  X9,  X10`,
    desc: 'Quan sát các lệnh hợp ngữ LEGv8 bên trái. Hoàn thành hàm C tương đương nhận vào 3 tham số a, b, c và trả về giá trị của f.',
    function_signature: 'long long calc(long long a, long long b, long long c)',
    starter_c_code: `long long calc(long long a, long long b, long long c) {
    // Viết biểu thức tính f tương ứng với mã LEGv8 bên cạnh...
    
}`,
    solution_c_code: `long long calc(long long a, long long b, long long c) {
    long long f = (a + b) - (c + 35);
    return f;
}`,
    scaffold: {
      template: `long long calc(long long a, long long b, long long c) {
    long long f = {{0}} - {{1}};
    return f;
}`,
      blanks: [
        { id: 0, expected: '(a + b)', options: ['(a + b)', '(a - b)', '(b + c)', 'a'] },
        { id: 1, expected: '(c + 35)', options: ['(c + 35)', '(c - 35)', '35', '(a + 35)'] }
      ]
    },
    test_cases: [
      { params: [10, 20, 5], expected: -10, label: 'Bộ kiểm thử #1' },
      { params: [50, 50, 15], expected: 50, label: 'Bộ kiểm thử #2' },
      { params: [0, 35, 0], expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Lệnh `ADD X9, X19, X20` thực hiện phép cộng trên hai tham số tương ứng.',
      'Lệnh `ADDI X10, X21, #35` thực hiện phép cộng biến c với một hằng số.',
      'Lệnh `SUB X9, X9, X10` thực hiện trừ kết quả của hai biểu thức.'
    ]
  },

  {
    id: 'dec_expr2',
    tier: 1,
    title: 'Dịch Ngược Dịch Trái & Nhân: LSL #1',
    time_limit: 180,
    base_score: 550,
    legv8_code: `// Ánh xạ thanh ghi: x: X19, y: X20, z: X21, result: X9
SUB   X9,  X19, X20
LSL   X9,  X9,  #1
ADDI  X10, X21, #10
ADD   X9,  X9,  X10`,
    desc: 'Lệnh dịch trái bit `LSL #1` trong kiến trúc máy tính tương đương phép biến đổi số học nào? Hãy phân tích toàn bộ chuỗi tính toán.',
    function_signature: 'long long compute(long long x, long long y, long long z)',
    starter_c_code: `long long compute(long long x, long long y, long long z) {
    // Viết mã C tương đương ở đây...
    
}`,
    solution_c_code: `long long compute(long long x, long long y, long long z) {
    return 2 * (x - y) + (z + 10);
}`,
    scaffold: {
      template: `long long compute(long long x, long long y, long long z) {
    return 2 * ({{0}} - {{1}}) + (z + {{2}});
}`,
      blanks: [
        { id: 0, expected: 'x', options: ['x', 'y', 'z', '2'] },
        { id: 1, expected: 'y', options: ['y', 'x', 'z', '10'] },
        { id: 2, expected: '10', options: ['10', '1', '2', '20'] }
      ]
    },
    test_cases: [
      { params: [15, 5, 2], expected: 32, label: 'Bộ kiểm thử #1' },
      { params: [8, 8, -5], expected: 5, label: 'Bộ kiểm thử #2' },
      { params: [3, 7, 20], expected: 22, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Dịch trái 1 bit (`LSL #1`) một giá trị nhị phân chính là nhân giá trị đó với 2.',
      'Chú ý thứ tự thực hiện phép trừ trước, nhân 2, sau đó cộng kết quả với biểu thức chứa z.'
    ]
  },

  {
    id: 'dec_swap',
    tier: 2,
    title: 'Dịch Ngược Thao Tác Mảng: Hoán Đổi Hai Phần Tử Liền Kề',
    time_limit: 240,
    base_score: 700,
    legv8_code: `// Ánh xạ: Địa chỉ cơ sở mảng A: X10, Chỉ số i: X19
LSL   X11, X19, #3
ADD   X11, X10, X11
LDUR  X9,  [X11, #0]
LDUR  X12, [X11, #8]
STUR  X12, [X11, #0]
STUR  X9,  [X11, #8]`,
    desc: 'Đoạn mã nạp 2 phần tử liên tiếp từ mảng vào thanh ghi, sau đó ghi ngược lại vị trí của nhau. Hãy viết hàm C thực hiện hoán đổi tại chỗ.',
    function_signature: 'void swap_adjacent(long long A[], long long i)',
    starter_c_code: `void swap_adjacent(long long A[], long long i) {
    // Hoán đổi A[i] và A[i + 1]...
    
}`,
    solution_c_code: `void swap_adjacent(long long A[], long long i) {
    long long temp = A[i];
    A[i] = A[i + 1];
    A[i + 1] = temp;
}`,
    test_cases: [
      {
        params: [[42, 99], 0],
        expected_array: [99, 42],
        label: 'Bộ kiểm thử #1'
      },
      {
        params: [[10, 20, 700, 800, 50], 2],
        expected_array: [10, 20, 800, 700, 50],
        label: 'Bộ kiểm thử #2'
      }
    ],
    hints: [
      'Độ dời byte `[X11, #0]` tương ứng với `A[i]`, còn `[X11, #8]` tương ứng với phần tử liền kề `A[i + 1]`.',
      'Trong C, cần một biến tạm thời để giữ giá trị trước khi ghi đè.'
    ]
  },

  {
    id: 'dec_while',
    tier: 3,
    title: 'Dịch Ngược Vòng Lặp While: Quét Mảng',
    time_limit: 300,
    base_score: 900,
    legv8_code: `// Ánh xạ: Con trỏ mảng save: X10, Chỉ số i: X19, Giá trị k: X20
Loop:
    LSL   X11, X19, #3
    ADD   X11, X10, X11
    LDUR  X12, [X11, #0]
    SUBS  XZR, X12, X20
    B.NE  Exit
    ADDI  X19, X19, #1
    B     Loop
Exit:`,
    desc: 'Xác định điều kiện tiếp tục vòng lặp và câu lệnh tăng biến đếm. Viết hàm C trả về chỉ số i sau khi vòng lặp dừng lại.',
    function_signature: 'long long find_mismatch(long long save[], long long i, long long k)',
    starter_c_code: `long long find_mismatch(long long save[], long long i, long long k) {
    // Viết vòng lặp while tương ứng với mã LEGv8...
    
    return i;
}`,
    solution_c_code: `long long find_mismatch(long long save[], long long i, long long k) {
    while (save[i] == k) {
        i++;
    }
    return i;
}`,
    test_cases: [
      { params: [[7, 7, 7, 99], 0, 7], expected: 3, label: 'Bộ kiểm thử #1' },
      { params: [[15], 0, 7], expected: 0, label: 'Bộ kiểm thử #2' },
      { params: [[0, 0, 100, 50], 2, 100], expected: 3, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Lệnh `B.NE Exit` nhảy thoát ra ngoài khi phần tử không bằng k.',
      'Như vậy, điều kiện để vòng lặp tiếp tục thực hiện bên trong là gì?'
    ]
  },

  {
    id: 'dec_ifelse',
    tier: 3,
    title: 'Dịch Ngược Rẽ Nhánh: Cấu Trúc If-Else',
    time_limit: 300,
    base_score: 950,
    legv8_code: `// Ánh xạ thanh ghi: a: X19, b: X20, f: X9
    SUBS  XZR, X19, X20
    B.LE  ElsePart
    SUB   X9,  X19, X20
    B     EndIf
ElsePart:
    SUB   X9,  X20, X19
EndIf:`,
    desc: 'Phân tích điều kiện rẽ nhánh và hai khối lệnh tương ứng. Đây là thuật toán tính độ lệch tuyệt đối giữa a và b.',
    function_signature: 'long long abs_diff(long long a, long long b)',
    starter_c_code: `long long abs_diff(long long a, long long b) {
    // Viết cấu trúc if-else...
    
}`,
    solution_c_code: `long long abs_diff(long long a, long long b) {
    if (a > b) {
        return a - b;
    } else {
        return b - a;
    }
}`,
    test_cases: [
      { params: [15, 7], expected: 8, label: 'Bộ kiểm thử #1' },
      { params: [4, 10], expected: 6, label: 'Bộ kiểm thử #2' },
      { params: [9, 9], expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Phân tích điều kiện rẽ nhánh `B.LE`: nếu `a <= b` thì rẽ sang nhánh `ElsePart`.',
      'Xác định biểu thức gán tương ứng trong mỗi nhánh điều kiện.'
    ]
  },

  {
    id: 'dec_max2',
    tier: 4,
    title: 'Dịch Ngược Thủ Tục Lá: Tìm Số Lớn Hơn (max2)',
    time_limit: 300,
    base_score: 1100,
    legv8_code: `// Ánh xạ: Tham số a: X0, Tham số b: X1. Giá trị trả về trong X0
max2:
    SUBS  XZR, X0,  X1
    B.GE  ReturnA
    ADDI  X0,  X1,  #0
ReturnA:
    BR    LR`,
    desc: 'Hàm lá nhận 2 tham số trong X0 và X1, trả về số lớn hơn trong X0.',
    function_signature: 'long long max2(long long a, long long b)',
    starter_c_code: `long long max2(long long a, long long b) {
    // Viết hàm C tìm số lớn hơn...
    
}`,
    solution_c_code: `long long max2(long long a, long long b) {
    if (a >= b) {
        return a;
    } else {
        return b;
    }
}`,
    test_cases: [
      { params: [42, 17], expected: 42, label: 'Bộ kiểm thử #1' },
      { params: [-10, 5], expected: 5, label: 'Bộ kiểm thử #2' },
      { params: [88, 88], expected: 88, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Lệnh `B.GE ReturnA` kiểm tra nếu `a >= b` thì nhảy đến nhãn trả về giá trị ban đầu trong X0.'
    ]
  },

  {
    id: 'dec_strlen',
    tier: 3,
    title: 'Dịch Ngược Chuỗi Ký Tự: my_strlen',
    time_limit: 300,
    base_score: 1000,
    legv8_code: `// Ánh xạ: Con trỏ chuỗi s: X0. Giá trị trả về trong X0
my_strlen:
    ORR   X9,  XZR, XZR
Loop_len:
    ADD   X10, X0,  X9
    LDURB X11, [X10, #0]
    CBZ   X11, Exit_len
    ADDI  X9,  X9,  #1
    B     Loop_len
Exit_len:
    ORR   X0,  XZR, X9
    BR    LR`,
    desc: 'Dịch ngược hàm duyệt chuỗi ký tự kết thúc bằng byte 0 (\\0) để tính chiều dài chuỗi.',
    function_signature: 'long long my_strlen(char *s)',
    starter_c_code: `long long my_strlen(char *s) {
    // Viết hàm C đếm độ dài chuỗi...
    
}`,
    solution_c_code: `long long my_strlen(char *s) {
    long long len = 0;
    while (s[len] != '\\0') {
        len++;
    }
    return len;
}`,
    test_cases: [
      { params: ['LEGv8'], expected: 5, label: 'Bộ kiểm thử #1' },
      { params: [''], expected: 0, label: 'Bộ kiểm thử #2' },
      { params: ['Hello World!'], expected: 12, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'Ký tự rỗng `\\0` có giá trị 0, lệnh `CBZ` kiểm tra điều kiện kết thúc chuỗi.',
      'Dùng vòng lặp kiểm tra ký tự hiện tại khác `\\0`.'
    ]
  },

  {
    id: 'dec_sum_array',
    tier: 3,
    title: 'Dịch Ngược Vòng Lặp & Mảng: Tính Tổng Phần Tử',
    time_limit: 360,
    base_score: 1150,
    legv8_code: `// Ánh xạ: Con trỏ mảng A: X0, Kích thước n: X1. Giá trị trả về trong X0
sum_array:
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
    desc: 'Dịch ngược hàm tính tổng mảng 64-bit có kích thước n.',
    function_signature: 'long long sum_array(long long A[], long long n)',
    starter_c_code: `long long sum_array(long long A[], long long n) {
    // Duyệt mảng và cộng dồn vào sum...
    
}`,
    solution_c_code: `long long sum_array(long long A[], long long n) {
    long long sum = 0;
    for (long long i = 0; i < n; i++) {
        sum += A[i];
    }
    return sum;
}`,
    test_cases: [
      { params: [[5, 10, 15, 20], 4], expected: 50, label: 'Bộ kiểm thử #1' },
      { params: [[-5, 5, -10, 10, 25], 5], expected: 25, label: 'Bộ kiểm thử #2' },
      { params: [[], 0], expected: 0, label: 'Bộ kiểm thử #3' }
    ],
    hints: [
      'X10 đóng vai trò biến đếm i, mỗi lần lặp tăng 1 cho đến khi `i >= n`.',
      'X9 tích lũy tổng giá trị các phần tử đọc từ mảng.'
    ]
  },

  {
    id: 'dec_factorial',
    tier: 5,
    title: 'Dịch Ngược Hàm Đệ Quy: fact(n)',
    time_limit: 480,
    base_score: 1500,
    legv8_code: `// Ánh xạ: Tham số n: X0. Giá trị trả về trong X0
fact:
    SUBI  SP,  SP,  #16
    STUR  X30, [SP, #8]
    STUR  X0,  [SP, #0]

    SUBIS XZR, X0,  #1
    B.GE  L1

    ADDI  X0,  XZR, #1
    ADDI  SP,  SP,  #16
    BR    LR

L1:
    SUBI  X0,  X0,  #1
    BL    fact

    LDUR  X1,  [SP, #0]
    LDUR  X30, [SP, #8]
    ADDI  SP,  SP,  #16

    MUL   X0,  X1,  X0
    BR    LR`,
    desc: 'Phân tích điểm dừng cơ sở và lời gọi đệ quy lồng nhau với quản lý ngăn xếp.',
    function_signature: 'long long fact(long long n)',
    starter_c_code: `long long fact(long long n) {
    // Viết hàm đệ quy tính giai thừa n!...
    
}`,
    solution_c_code: `long long fact(long long n) {
    if (n < 1) {
        return 1;
    } else {
        return n * fact(n - 1);
    }
}`,
    test_cases: [
      { params: [0], expected: 1, label: 'Bộ kiểm thử #1' },
      { params: [1], expected: 1, label: 'Bộ kiểm thử #2' },
      { params: [4], expected: 24, label: 'Bộ kiểm thử #3' },
      { params: [6], expected: 720, label: 'Bộ kiểm thử #4' }
    ],
    hints: [
      'Phân tích điều kiện dừng cơ sở tại phép so sánh `SUBIS XZR, X0, #1`.',
      'Lời gọi đệ quy lồng nhau được thực hiện thông qua lệnh `BL fact`.'
    ]
  },

  {
    id: 'dec_fib',
    tier: 5,
    title: 'Dịch Ngược Đệ Quy Nhị Phân: fib(n)',
    time_limit: 600,
    base_score: 1800,
    legv8_code: `// Ánh xạ: Tham số n: X0. Giá trị trả về trong X0
fib:
    SUBI  SP,  SP,  #32
    STUR  X30, [SP, #16]
    STUR  X0,  [SP, #8]

    SUBS  XZR, X0,  XZR
    B.GT  CheckOne
    ADDI  X0,  XZR, #0
    ADDI  SP,  SP,  #32
    BR    LR

CheckOne:
    SUBIS XZR, X0,  #1
    B.NE  Recurse
    ADDI  X0,  XZR, #1
    ADDI  SP,  SP,  #32
    BR    LR

Recurse:
    SUBI  X0,  X0,  #1
    BL    fib
    STUR  X0,  [SP, #0]

    LDUR  X0,  [SP, #8]
    SUBI  X0,  X0,  #2
    BL    fib

    LDUR  X1,  [SP, #0]
    ADD   X0,  X1,  X0

    LDUR  X30, [SP, #16]
    ADDI  SP,  SP,  #32
    BR    LR`,
    desc: 'Dịch ngược cấu trúc đệ quy 2 nhánh phân biệt tính số Fibonacci thứ n.',
    function_signature: 'long long fib(long long n)',
    starter_c_code: `long long fib(long long n) {
    // Viết hàm đệ quy tính dãy số Fibonacci...
    
}`,
    solution_c_code: `long long fib(long long n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}`,
    test_cases: [
      { params: [0], expected: 0, label: 'Bộ kiểm thử #1' },
      { params: [1], expected: 1, label: 'Bộ kiểm thử #2' },
      { params: [3], expected: 2, label: 'Bộ kiểm thử #3' },
      { params: [6], expected: 8, label: 'Bộ kiểm thử #4' }
    ],
    hints: [
      'Xác định 2 điều kiện cơ sở: khi n <= 0 và khi n == 1.',
      'Cấu trúc đệ quy phân nhánh 2 lần gọi hàm và cộng dồn kết quả.'
    ]
  }
];

/**
 * ============================================================================
 * C-TO-JS COMPILER & SANDBOX TEST RUNNER ENGINE
 * ============================================================================
 */
function transpileCCode(cSource) {
  let js = cSource;

  // 1. Loại bỏ các kiểu dữ liệu trong khai báo hàm
  const funcRegex = /^[ \t]*(?:long\s+long|int|void|short|char\*?|size_t)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{/m;
  const match = js.match(funcRegex);
  if (!match) {
    throw new Error('Không tìm thấy định dạng hàm C hợp lệ! Ví dụ: long long func(long long a) { ... }');
  }
  const funcName = match[1];
  const rawArgs = match[2];
  const cleanArgs = rawArgs.split(',')
    .map(a => a.trim().split(/\s+/).pop().replace(/[\[\]*]/g, ''))
    .filter(Boolean)
    .join(', ');

  js = js.replace(funcRegex, `function ${funcName}(${cleanArgs}) {`);

  // 2. Chuyển đổi các khai báo kiểu dữ liệu cục bộ sang let
  js = js.replace(/\b(?:long\s+long|int|short|char|size_t)\s+/g, 'let ');

  // 3. Cơ chế bảo vệ chống vòng lặp vô tận (Timeout / Max Loop)
  let loopId = 0;
  js = js.replace(/\bwhile\s*\(([^)]*)\)\s*\{/g, (m, cond) => {
    loopId++;
    return `let __loop_${loopId} = 0; while ((${cond}) && ++__loop_${loopId} < 30000) {`;
  });

  return { funcName, jsCode: `${js}\nreturn ${funcName};` };
}

function evaluateCCode(cSource, testCase) {
  try {
    const { funcName, jsCode } = transpileCCode(cSource);
    const fn = new Function(jsCode)();

    // Chuẩn bị tham số bản sao (tránh ô nhiễm giữa các lần chạy)
    const clonedParams = testCase.params.map(p => {
      if (Array.isArray(p)) return [...p];
      if (typeof p === 'string') return p.endsWith('\0') ? p : (p + '\0');
      return p;
    });

    const startTime = performance.now();
    const actualRes = fn(...clonedParams);
    const durationMs = Math.max(0.1, Number((performance.now() - startTime).toFixed(2)));

    // Kiểm tra kết quả mảng (đối với void swap, ...)
    if (testCase.expected_array) {
      const modifiedArray = clonedParams[0];
      const match = JSON.stringify(modifiedArray) === JSON.stringify(testCase.expected_array);
      return {
        success: match,
        actual: JSON.stringify(modifiedArray),
        expected: JSON.stringify(testCase.expected_array),
        durationMs
      };
    }

    // So sánh kết quả trả về
    const expectedVal = testCase.expected;
    const match = actualRes == expectedVal;
    return {
      success: match,
      actual: String(actualRes),
      expected: String(expectedVal),
      durationMs
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * ============================================================================
 * UI ENGINE FOR DECOMPILER
 * ============================================================================
 */
const DecompileUI = (() => {
  let currentIdx = 0;
  let currentLevel = null;
  let timerInterval = null;
  let timeLeft = 180;
  let totalScore = 0;
  let wrongTries = 0;
  let editorMode = 'pro';
  let scaffoldSelections = {};

  const el = {};

  function init() {
    cacheElements();
    bindEvents();
    renderLevelSelector();
    loadLevel(0);
  }

  function cacheElements() {
    el.levelSelect = document.getElementById('level-select');
    el.tierBadge = document.getElementById('tier-badge');
    el.levelTitle = document.getElementById('level-title');
    el.timerVal = document.getElementById('timer-val');
    el.scoreVal = document.getElementById('total-score-val');
    el.levelDesc = document.getElementById('level-desc');
    el.hintsContainer = document.getElementById('hints-container');
    el.asmCodeCard = document.getElementById('asm-code-card');
    el.codeArea = document.getElementById('code-textarea');
    el.lineNumbers = document.getElementById('line-numbers');
    el.scaffoldView = document.getElementById('scaffold-view');
    el.modeBtn = document.getElementById('toggle-mode-btn');
    el.runBtn = document.getElementById('btn-run');
    el.resetBtn = document.getElementById('btn-reset');
    el.testConsole = document.getElementById('test-console');
    el.victoryModal = document.getElementById('victory-modal');
    el.nextLevelBtn = document.getElementById('btn-next-level');
  }

  function bindEvents() {
    if (el.levelSelect) {
      el.levelSelect.addEventListener('change', (e) => loadLevel(parseInt(e.target.value, 10)));
    }
    if (el.codeArea) {
      el.codeArea.addEventListener('input', updateLineNumbers);
      el.codeArea.addEventListener('scroll', () => {
        if (el.lineNumbers) el.lineNumbers.scrollTop = el.codeArea.scrollTop;
      });
      el.codeArea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = el.codeArea.selectionStart;
          const end = el.codeArea.selectionEnd;
          el.codeArea.value = el.codeArea.value.substring(0, start) + '    ' + el.codeArea.value.substring(end);
          el.codeArea.selectionStart = el.codeArea.selectionEnd = start + 4;
          updateLineNumbers();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          compileAndRun();
        }
      });
    }
    if (el.runBtn) el.runBtn.addEventListener('click', compileAndRun);
    if (el.resetBtn) el.resetBtn.addEventListener('click', resetCode);
    if (el.modeBtn) el.modeBtn.addEventListener('click', toggleEditorMode);
    if (el.nextLevelBtn) {
      el.nextLevelBtn.addEventListener('click', () => {
        if (el.victoryModal) el.victoryModal.classList.remove('show');
        if (currentIdx + 1 < DECOMPILE_LEVELS.length) {
          loadLevel(currentIdx + 1);
        }
      });
    }
  }

  function renderLevelSelector() {
    if (!el.levelSelect) return;
    el.levelSelect.innerHTML = DECOMPILE_LEVELS.map((lvl, idx) => `
      <option value="${idx}">Màn ${idx + 1}: ${lvl.title}</option>
    `).join('');
  }

  function loadLevel(idx) {
    currentIdx = idx;
    currentLevel = DECOMPILE_LEVELS[idx];
    if (!currentLevel) return;

    if (el.levelSelect) el.levelSelect.value = idx;
    if (el.levelTitle) el.levelTitle.textContent = currentLevel.title;
    if (el.tierBadge) {
      el.tierBadge.textContent = `Tier ${currentLevel.tier}`;
      el.tierBadge.className = `legv8-tier-badge tier-${currentLevel.tier}`;
    }
    if (el.levelDesc) el.levelDesc.textContent = currentLevel.desc;

    // Render LEGv8 Assembly Code Card
    if (el.asmCodeCard) {
      el.asmCodeCard.innerHTML = `<pre style="font-family:var(--font-code); line-height:1.55; color:#38bdf8; margin:0;">${escapeHtml(currentLevel.legv8_code)}</pre>`;
    }

    // Render Hints
    if (el.hintsContainer) {
      el.hintsContainer.innerHTML = currentLevel.hints.map((hint, hIdx) => `
        <div class="hint-item">
          <div class="hint-header" onclick="this.parentElement.classList.toggle('open')">
            <span>💡 Gợi ý ${hIdx + 1}</span>
            <span>▼</span>
          </div>
          <div class="hint-body">${hint}</div>
        </div>
      `).join('');
    }

    // Reset Code Area
    if (el.codeArea) {
      el.codeArea.value = currentLevel.starter_c_code || '';
      updateLineNumbers();
    }

    scaffoldSelections = {};
    renderScaffoldMode();

    wrongTries = 0;
    startTimer(currentLevel.time_limit || 180);
    renderInitialTests();
  }

  function startTimer(sec) {
    clearInterval(timerInterval);
    timeLeft = sec;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) clearInterval(timerInterval);
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!el.timerVal) return;
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    el.timerVal.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateLineNumbers() {
    if (!el.codeArea || !el.lineNumbers) return;
    const lines = el.codeArea.value.split('\n');
    el.lineNumbers.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
  }

  function resetCode() {
    if (currentLevel && el.codeArea) {
      el.codeArea.value = currentLevel.starter_c_code || '';
      updateLineNumbers();
    }
  }

  function toggleEditorMode() {
    editorMode = editorMode === 'pro' ? 'scaffold' : 'pro';
    if (editorMode === 'scaffold' && currentLevel.scaffold) {
      el.codeArea.style.display = 'none';
      if (el.lineNumbers) el.lineNumbers.style.display = 'none';
      if (el.scaffoldView) el.scaffoldView.style.display = 'block';
      if (el.modeBtn) el.modeBtn.textContent = 'Chế Độ Pro Editor';
      renderScaffoldMode();
    } else {
      el.codeArea.style.display = 'block';
      if (el.lineNumbers) el.lineNumbers.style.display = 'block';
      if (el.scaffoldView) el.scaffoldView.style.display = 'none';
      if (el.modeBtn) el.modeBtn.textContent = 'Chế Độ Điền Khuyết';
    }
  }

  function renderScaffoldMode() {
    if (!el.scaffoldView) return;
    if (!currentLevel.scaffold) {
      el.scaffoldView.innerHTML = `<p class="muted">Bài tập này yêu cầu viết mã tự do trên Pro Editor.</p>`;
      return;
    }
    const sc = currentLevel.scaffold;
    let html = sc.template;
    sc.blanks.forEach(b => {
      const selected = scaffoldSelections[b.id] || '[ ? ]';
      const isFilled = scaffoldSelections[b.id] !== undefined;
      const selectHtml = `
        <select class="scaffold-blank ${isFilled ? 'filled' : ''}" onchange="DecompileUI.onScaffoldSelect(${b.id}, this.value)">
          <option value="">[ ? ]</option>
          ${b.options.map(opt => `<option value="${opt}" ${selected === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      `;
      html = html.replace(`{{${b.id}}}`, selectHtml);
    });
    el.scaffoldView.innerHTML = `<pre style="white-space:pre-wrap; font-family:var(--font-code);">${html}</pre>`;
  }

  function onScaffoldSelect(blankId, val) {
    scaffoldSelections[blankId] = val;
    // Cập nhật lại code textarea
    let code = currentLevel.scaffold.template;
    currentLevel.scaffold.blanks.forEach(b => {
      const v = scaffoldSelections[b.id] || '[ ? ]';
      code = code.replace(`{{${b.id}}}`, v);
    });
    if (el.codeArea) {
      el.codeArea.value = code;
      updateLineNumbers();
    }
  }

  function renderInitialTests() {
    if (!el.testConsole || !currentLevel) return;
    el.testConsole.innerHTML = currentLevel.test_cases.map((tc, idx) => `
      <div class="test-card">
        <div class="test-head">
          <span style="font-weight:700; color:#cbd5e1;">${tc.label || `Bộ kiểm thử #${idx + 1}`}</span>
          <span class="badge-waiting">CHỜ CHẠY</span>
        </div>
      </div>
    `).join('');
  }

  function compileAndRun() {
    if (!currentLevel || !el.codeArea) return;
    const cCode = el.codeArea.value;

    let allPassed = true;
    let html = '';

    currentLevel.test_cases.forEach((tc, idx) => {
      const res = evaluateCCode(cCode, tc);
      if (res.success) {
        html += `
          <div class="test-card pass">
            <div class="test-head">
              <span style="font-weight:700; color:#fff;">${tc.label || `Bộ kiểm thử #${idx + 1}`}</span>
              <span class="badge-pass">✓ ĐẠT (PASS)</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.3rem;">
              Thời gian thực thi: <b>${res.durationMs}ms</b> | Kết quả: <b style="color:#10b981;">${res.actual}</b>
            </div>
          </div>
        `;
      } else {
        allPassed = false;
        html += `
          <div class="test-card fail">
            <div class="test-head">
              <span style="font-weight:700; color:#fff;">${tc.label || `Bộ kiểm thử #${idx + 1}`}</span>
              <span class="badge-fail">✗ THẤT BẠI (FAIL)</span>
            </div>
            <div style="font-size:0.75rem; color:#f87171; margin-top:0.3rem;">
              ${res.error ? `Lỗi biên dịch / thực thi: <b>${res.error}</b>` : `Kết quả thực tế: <b>${res.actual}</b> | Kỳ vọng: <b>${res.expected}</b>`}
            </div>
          </div>
        `;
      }
    });

    if (el.testConsole) el.testConsole.innerHTML = html;

    if (allPassed) {
      clearInterval(timerInterval);
      const timeBonus = Math.max(0, timeLeft * 2);
      const penalty = wrongTries * 30;
      const scoreGained = Math.max(100, currentLevel.base_score + timeBonus - penalty);
      totalScore += scoreGained;
      if (el.scoreVal) el.scoreVal.textContent = totalScore.toLocaleString();

      document.getElementById('modal-base-score').textContent = `+${currentLevel.base_score}`;
      document.getElementById('modal-time-bonus').textContent = `+${timeBonus}`;
      document.getElementById('modal-penalty').textContent = `-${penalty}`;
      document.getElementById('modal-total-score').textContent = `+${scoreGained}`;

      if (el.victoryModal) el.victoryModal.classList.add('show');
    } else {
      wrongTries++;
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    onScaffoldSelect
  };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', DecompileUI.init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DECOMPILE_LEVELS, evaluateCCode, transpileCCode };
}
