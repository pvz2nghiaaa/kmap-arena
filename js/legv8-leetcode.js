'use strict';
/**
 * ============================================================================
 * LEGv8 LeetCode Arena — Minigame 3: Luyện Thuật Toán Chuẩn LeetCode bằng LEGv8
 * Algorithmic Challenges, Testcases, Submissions & Performance Metrics
 * ============================================================================
 */

const LEETCODE_PROBLEMS = [
  {
    id: 'lc_two_sum',
    title: '1. Two Sum (Kiểm Tra Tổng Hai Phần Tử)',
    difficulty: 'Easy',
    acceptance: '89.4%',
    tags: ['Array', 'Two Pointers', 'Hash / Search'],
    desc: `Cho một mảng số nguyên 64-bit <code>A</code> gồm <code>n</code> phần tử và một số nguyên <code>target</code>.
Hãy xác định xem có tồn tại hai phần tử ở hai vị trí khác nhau <code>i ≠ j</code> trong mảng sao cho <code>A[i] + A[j] == target</code> hay không.

<b>Quy ước kết quả trả về:</b>
- Trả về <code>1</code> (qua thanh ghi <code>X0</code>) nếu tìm thấy cặp phần tử thỏa mãn.
- Trả về <code>0</code> (qua thanh ghi <code>X0</code>) nếu không tồn tại cặp nào.`,
    signature: 'long long two_sum(long long A[], long long n, long long target);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A (địa chỉ cơ sở)' },
      { reg: 'X1', role: 'Số phần tử n' },
      { reg: 'X2', role: 'Mục tiêu target' },
      { reg: 'X0 (Return)', role: '1 nếu tồn tại, 0 nếu không' }
    ],
    examples: [
      {
        input: 'A = [2, 7, 11, 15], n = 4, target = 9',
        output: '1',
        explanation: 'A[0] + A[1] = 2 + 7 = 9 == target. Trả về 1.'
      },
      {
        input: 'A = [3, 2, 4], n = 3, target = 10',
        output: '0',
        explanation: 'Không có cặp phần tử nào có tổng bằng 10. Trả về 0.'
      }
    ],
    constraints: [
      '2 ≤ n ≤ 100',
      '-10^9 ≤ A[i], target ≤ 10^9',
      'Tuyệt đối không dùng các thanh ghi phần cứng bị cấm: X8, X28, X29, X31'
    ],
    starter_code: `// LeetCode #1: Two Sum
// X0: Địa chỉ mảng A, X1: n, X2: target
// Trả về: X0 = 1 (tìm thấy) hoặc X0 = 0 (không tìm thấy)
two_sum:
    // Viết thuật toán của bạn ở đây...
    
    ADDI  X0,  XZR, #0        // Mặc định trả về 0
    BR    LR
`,
    solution_code: `two_sum:
    ADDI  X9,  XZR, #0
Loop_i:
    SUBS  XZR, X9,  X1
    B.GE  NotFound
    LSL   X11, X9,  #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    ADDI  X10, X9,  #1
Loop_j:
    SUBS  XZR, X10, X1
    B.GE  Next_i
    LSL   X13, X10, #3
    ADD   X13, X0,  X13
    LDUR  X14, [X13, #0]
    ADD   X15, X12, X14
    SUBS  XZR, X15, X2
    B.EQ  Found
    ADDI  X10, X10, #1
    B     Loop_j
Next_i:
    ADDI  X9,  X9,  #1
    B     Loop_i
Found:
    ADDI  X0,  XZR, #1
    BR    LR
NotFound:
    ADDI  X0,  XZR, #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 4, 9], memory: { '0x1000': 2, '0x1008': 7, '0x1010': 11, '0x1018': 15 }, expected: 1, label: 'Ví dụ mẫu 1' },
      { params: [0x2000, 3, 10], memory: { '0x2000': 3, '0x2008': 2, '0x2010': 4 }, expected: 0, label: 'Ví dụ mẫu 2' }
    ],
    hidden_cases: [
      { params: [0x3000, 2, 6], memory: { '0x3000': 3, '0x3008': 3 }, expected: 1, label: 'Test ẩn 1 (Phần tử trùng giá trị)' },
      { params: [0x4000, 5, 0], memory: { '0x4000': -5, '0x4008': -2, '0x4010': 0, '0x4018': 2, '0x4020': 5 }, expected: 1, label: 'Test ẩn 2 (Số âm)' }
    ]
  },

  {
    id: 'lc_palindrome',
    title: '2. Palindrome Array (Mảng Đối Xứng)',
    difficulty: 'Easy',
    acceptance: '92.1%',
    tags: ['Array', 'Two Pointers'],
    desc: `Cho mảng 64-bit <code>A</code> có <code>n</code> phần tử.
Kiểm tra xem mảng có phải là mảng đối xứng (đọc từ trái sang phải giống hệt từ phải sang trái) hay không.
Trả về <code>1</code> nếu đối xứng, <code>0</code> nếu không đối xứng.`,
    signature: 'long long is_palindrome(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n' },
      { reg: 'X0 (Return)', role: '1 nếu đối xứng, 0 nếu không' }
    ],
    examples: [
      {
        input: 'A = [1, 2, 3, 2, 1], n = 5',
        output: '1',
        explanation: 'Mảng đối xứng qua phần tử giữa 3. Trả về 1.'
      },
      {
        input: 'A = [1, 2, 3, 4], n = 4',
        output: '0',
        explanation: 'Không đối xứng. Trả về 0.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100', '-10^9 ≤ A[i] ≤ 10^9'],
    starter_code: `// LeetCode #2: Palindrome Array
// X0: Địa chỉ mảng A, X1: n
is_palindrome:
    // Dùng kỹ thuật hai con trỏ left và right...
    
    ADDI  X0,  XZR, #1
    BR    LR
`,
    solution_code: `is_palindrome:
    ADDI  X9,  XZR, #0
    SUBI  X10, X1,  #1
Loop_pal:
    SUBS  XZR, X9,  X10
    B.GE  Pal_yes
    LSL   X11, X9,  #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    LSL   X13, X10, #3
    ADD   X13, X0,  X13
    LDUR  X14, [X13, #0]
    SUBS  XZR, X12, X14
    B.NE  Pal_no
    ADDI  X9,  X9,  #1
    SUBI  X10, X10, #1
    B     Loop_pal
Pal_yes:
    ADDI  X0,  XZR, #1
    BR    LR
Pal_no:
    ADDI  X0,  XZR, #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 5], memory: { '0x1000': 1, '0x1008': 2, '0x1010': 3, '0x1018': 2, '0x1020': 1 }, expected: 1, label: 'Ví dụ mẫu 1' },
      { params: [0x1000, 4], memory: { '0x1000': 1, '0x1008': 2, '0x1010': 3, '0x1018': 4 }, expected: 0, label: 'Ví dụ mẫu 2' }
    ],
    hidden_cases: [
      { params: [0x2000, 1], memory: { '0x2000': 42 }, expected: 1, label: 'Test ẩn 1 (Mảng 1 phần tử)' },
      { params: [0x3000, 6], memory: { '0x3000': 8, '0x3008': 9, '0x3010': 10, '0x3018': 10, '0x3020': 9, '0x3028': 8 }, expected: 1, label: 'Test ẩn 2 (Mảng chẵn đối xứng)' }
    ]
  },

  {
    id: 'lc_count_evens',
    title: '3. Count Evens (Đếm Số Chẵn Trong Mảng)',
    difficulty: 'Easy',
    acceptance: '94.5%',
    tags: ['Array', 'Bit Manipulation'],
    desc: `Cho mảng 64-bit <code>A</code> có <code>n</code> phần tử.
Đếm số lượng các số nguyên chẵn có trong mảng.
Gợi ý bitwise: Một số là số chẵn khi và chỉ khi bit cuối cùng của nó bằng 0 (<code>(x & 1) == 0</code>). Dùng <code>ANDI</code> và <code>CBZ</code>.`,
    signature: 'long long count_evens(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n' },
      { reg: 'X0 (Return)', role: 'Số lượng phần tử chẵn' }
    ],
    examples: [
      {
        input: 'A = [1, 2, 4, 7, 8], n = 5',
        output: '3',
        explanation: 'Các số chẵn gồm: 2, 4, 8. Tổng cộng 3 số.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100', 'Giá trị số nguyên 64-bit'],
    starter_code: `// LeetCode #3: Count Evens
// X0: Địa chỉ mảng A, X1: n
count_evens:
    // Khởi tạo count = 0 và i = 0...
    
    ADDI  X0,  XZR, #0
    BR    LR
`,
    solution_code: `count_evens:
    ADDI  X9,  XZR, #0
    ADDI  X10, XZR, #0
Loop_even:
    SUBS  XZR, X10, X1
    B.GE  Done_even
    LSL   X11, X10, #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    ANDI  X13, X12, #1
    CBNZ  X13, Next_even
    ADDI  X9,  X9,  #1
Next_even:
    ADDI  X10, X10, #1
    B     Loop_even
Done_even:
    ADDI  X0,  X9,  #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 5], memory: { '0x1000': 1, '0x1008': 2, '0x1010': 4, '0x1018': 7, '0x1020': 8 }, expected: 3, label: 'Ví dụ mẫu 1' },
      { params: [0x2000, 3], memory: { '0x2000': 1, '0x2008': 3, '0x2010': 5 }, expected: 0, label: 'Ví dụ mẫu 2' }
    ],
    hidden_cases: [
      { params: [0x3000, 4], memory: { '0x3000': 0, '0x3008': -2, '0x3010': -4, '0x3018': -6 }, expected: 4, label: 'Test ẩn 1 (Số âm và số 0)' }
    ]
  },

  {
    id: 'lc_max_index',
    title: '4. Maximum Element & Index (Tìm Phần Tử Lớn Nhất & Chỉ Số)',
    difficulty: 'Easy',
    acceptance: '88.7%',
    tags: ['Array'],
    desc: `Cho mảng số nguyên 64-bit <code>A</code> có <code>n</code> phần tử.
Tìm và trả về chỉ số <code>index</code> (bắt đầu từ 0) của phần tử có giá trị lớn nhất trong mảng.
Nếu có nhiều phần tử lớn nhất bằng nhau, trả về chỉ số đầu tiên xuất hiện.`,
    signature: 'long long max_index(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n (n ≥ 1)' },
      { reg: 'X0 (Return)', role: 'Chỉ số của phần tử lớn nhất' }
    ],
    examples: [
      {
        input: 'A = [10, 50, 30, 20], n = 4',
        output: '1',
        explanation: 'Phần tử lớn nhất là 50 tại chỉ số 1.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100'],
    starter_code: `// LeetCode #4: Maximum Element & Index
// X0: Địa chỉ mảng A, X1: n
max_index:
    // Khởi tạo max_val = A[0], max_idx = 0...
    
    ADDI  X0,  XZR, #0
    BR    LR
`,
    solution_code: `max_index:
    LDUR  X9,  [X0, #0]
    ADDI  X10, XZR, #0
    ADDI  X11, XZR, #1
Loop_max:
    SUBS  XZR, X11, X1
    B.GE  Done_max
    LSL   X12, X11, #3
    ADD   X12, X0,  X12
    LDUR  X13, [X12, #0]
    SUBS  XZR, X13, X9
    B.LE  Next_max
    ADDI  X9,  X13, #0
    ADDI  X10, X11, #0
Next_max:
    ADDI  X11, X11, #1
    B     Loop_max
Done_max:
    ADDI  X0,  X10, #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 4], memory: { '0x1000': 10, '0x1008': 50, '0x1010': 30, '0x1018': 20 }, expected: 1, label: 'Ví dụ mẫu 1' },
      { params: [0x2000, 5], memory: { '0x2000': 5, '0x2008': 10, '0x2010': 15, '0x2018': 20, '0x2020': 99 }, expected: 4, label: 'Ví dụ mẫu 2' }
    ],
    hidden_cases: [
      { params: [0x3000, 3], memory: { '0x3000': -10, '0x3008': -50, '0x3010': -2 }, expected: 2, label: 'Test ẩn (Toàn số âm)' }
    ]
  },

  {
    id: 'lc_move_zeroes',
    title: '5. Move Zeroes (Dồn Số 0 Về Cuối Mảng Tại Chỗ)',
    difficulty: 'Medium',
    acceptance: '81.2%',
    tags: ['Array', 'Two Pointers', 'In-Place Memory'],
    desc: `Cho mảng 64-bit <code>A</code> có <code>n</code> phần tử.
Di chuyển tất cả các số <code>0</code> về cuối mảng tại chỗ (in-place trên RAM) mà vẫn giữ nguyên thứ tự tương đối của các phần tử khác 0.
Yêu cầu: Không dùng mảng phụ, thao tác trực tiếp bằng <code>LDUR</code> và <code>STUR</code>.`,
    signature: 'void move_zeroes(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n' }
    ],
    examples: [
      {
        input: 'A = [0, 1, 0, 3, 12], n = 5',
        output: 'A = [1, 3, 12, 0, 0]',
        explanation: 'Các số 0 được dồn về cuối mảng.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100'],
    starter_code: `// LeetCode #5: Move Zeroes
// X0: Địa chỉ mảng A, X1: n
move_zeroes:
    // Con trỏ slow để ghi các phần tử khác 0...
    // Con trỏ fast để quét toàn bộ mảng...
    
    BR    LR
`,
    solution_code: `move_zeroes:
    ADDI  X9,  XZR, #0
    ADDI  X10, XZR, #0
Loop_mz1:
    SUBS  XZR, X10, X1
    B.GE  Loop_mz2
    LSL   X11, X10, #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    CBZ   X12, Skip_mz
    LSL   X13, X9,  #3
    ADD   X13, X0,  X13
    STUR  X12, [X13, #0]
    ADDI  X9,  X9,  #1
Skip_mz:
    ADDI  X10, X10, #1
    B     Loop_mz1
Loop_mz2:
    SUBS  XZR, X9,  X1
    B.GE  Done_mz
    LSL   X13, X9,  #3
    ADD   X13, X0,  X13
    STUR  XZR, [X13, #0]
    ADDI  X9,  X9,  #1
    B     Loop_mz2
Done_mz:
    BR    LR`,
    sample_cases: [
      {
        params: [0x1000, 5],
        memory: { '0x1000': 0, '0x1008': 1, '0x1010': 0, '0x1018': 3, '0x1020': 12 },
        expected_memory: { '0x1000': 1, '0x1008': 3, '0x1010': 12, '0x1018': 0, '0x1020': 0 },
        label: 'Ví dụ mẫu 1'
      }
    ],
    hidden_cases: [
      {
        params: [0x2000, 3],
        memory: { '0x2000': 0, '0x2008': 0, '0x2010': 1 },
        expected_memory: { '0x2000': 1, '0x2008': 0, '0x2010': 0 },
        label: 'Test ẩn 1'
      }
    ]
  },

  {
    id: 'lc_single_number',
    title: '6. Single Number (Tìm Số Xuất Hiện 1 Lần Bằng XOR)',
    difficulty: 'Medium',
    acceptance: '85.6%',
    tags: ['Array', 'Bit Manipulation'],
    desc: `Cho mảng 64-bit <code>A</code> có <code>n</code> phần tử (n lẻ). Trong đó mọi phần tử đều xuất hiện đúng 2 lần, ngoại trừ DUY NHẤT một phần tử chỉ xuất hiện 1 lần.
Hãy tìm và trả về phần tử duy nhất đó.
Độ phức tạp mong đợi: <code>O(n)</code> thời gian và <code>O(1)</code> bộ nhớ (sử dụng tính chất triệt tiêu của phép XOR: <code>x ^ x = 0</code> và <code>x ^ 0 = x</code> với lệnh <code>EOR</code>).`,
    signature: 'long long single_number(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n' },
      { reg: 'X0 (Return)', role: 'Phần tử duy nhất' }
    ],
    examples: [
      {
        input: 'A = [4, 1, 2, 1, 2], n = 5',
        output: '4',
        explanation: '1 và 2 đều xuất hiện 2 lần; 4 chỉ xuất hiện 1 lần. Trả về 4.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100'],
    starter_code: `// LeetCode #6: Single Number
// X0: Địa chỉ mảng A, X1: n
single_number:
    // Khởi tạo res = 0, XOR dồn tất cả các phần tử...
    
    ADDI  X0,  XZR, #0
    BR    LR
`,
    solution_code: `single_number:
    ADDI  X9,  XZR, #0
    ADDI  X10, XZR, #0
Loop_sn:
    SUBS  XZR, X10, X1
    B.GE  Done_sn
    LSL   X11, X10, #3
    ADD   X11, X0,  X11
    LDUR  X12, [X11, #0]
    EOR   X9,  X9,  X12
    ADDI  X10, X10, #1
    B     Loop_sn
Done_sn:
    ADDI  X0,  X9,  #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 5], memory: { '0x1000': 4, '0x1008': 1, '0x1010': 2, '0x1018': 1, '0x1020': 2 }, expected: 4, label: 'Ví dụ mẫu 1' },
      { params: [0x2000, 3], memory: { '0x2000': 2, '0x2008': 2, '0x2010': 1 }, expected: 1, label: 'Ví dụ mẫu 2' }
    ],
    hidden_cases: [
      { params: [0x3000, 1], memory: { '0x3000': 999 }, expected: 999, label: 'Test ẩn 1' }
    ]
  },

  {
    id: 'lc_power_of_two',
    title: '7. Power of Two (Kiểm Tra Lũy Thừa Của 2)',
    difficulty: 'Easy',
    acceptance: '87.3%',
    tags: ['Math', 'Bit Manipulation'],
    desc: `Cho một số nguyên 64-bit <code>n</code> trong thanh ghi <code>X0</code>.
Kiểm tra xem <code>n</code> có phải là một lũy thừa của 2 hay không (tồn tại số nguyên không âm k sao cho n = 2^k).
Trả về <code>1</code> nếu đúng, <code>0</code> nếu sai.
Thuật toán Bitwise O(1): Một số nguyên dương là lũy thừa của 2 khi và chỉ khi <code>n > 0</code> và <code>(n & (n - 1)) == 0</code>.`,
    signature: 'long long is_power_of_two(long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Số nguyên n' },
      { reg: 'X0 (Return)', role: '1 nếu là lũy thừa 2, 0 nếu không' }
    ],
    examples: [
      { input: 'n = 16', output: '1', explanation: '2^4 = 16. Trả về 1.' },
      { input: 'n = 3', output: '0', explanation: '3 không phải lũy thừa của 2. Trả về 0.' }
    ],
    constraints: ['Số nguyên có dấu 64-bit'],
    starter_code: `// LeetCode #7: Power of Two
// X0: n
is_power_of_two:
    // Kiểm tra n > 0 và (n & (n - 1)) == 0...
    
    ADDI  X0,  XZR, #0
    BR    LR
`,
    solution_code: `is_power_of_two:
    SUBS  XZR, X0,  XZR
    B.LE  Not_pow2
    SUBI  X9,  X0,  #1
    AND   X10, X0,  X9
    CBNZ  X10, Not_pow2
    ADDI  X0,  XZR, #1
    BR    LR
Not_pow2:
    ADDI  X0,  XZR, #0
    BR    LR`,
    sample_cases: [
      { params: [1], expected: 1, label: 'Ví dụ mẫu 1 (n = 1)' },
      { params: [16], expected: 1, label: 'Ví dụ mẫu 2 (n = 16)' },
      { params: [3], expected: 0, label: 'Ví dụ mẫu 3 (n = 3)' }
    ],
    hidden_cases: [
      { params: [0], expected: 0, label: 'Test ẩn 1 (n = 0)' },
      { params: [-4], expected: 0, label: 'Test ẩn 2 (n = -4)' },
      { params: [1024], expected: 1, label: 'Test ẩn 3 (n = 1024)' }
    ]
  },

  {
    id: 'lc_max_subarray',
    title: "8. Maximum Subarray (Thuật Toán Kadane - Tổng Dãy Con Lớn Nhất)",
    difficulty: 'Hard',
    acceptance: '76.4%',
    tags: ['Array', 'Dynamic Programming', 'Kadane'],
    desc: `Cho một mảng số nguyên 64-bit <code>A</code> có <code>n</code> phần tử (có thể chứa cả số âm và dương).
Tìm tổng lớn nhất của một dãy con liên tiếp trong mảng (chứa ít nhất 1 phần tử).
Thuật toán Kadane: Duy trì <code>curr_max = max(A[i], curr_max + A[i])</code> và <code>max_so_far = max(max_so_far, curr_max)</code>.`,
    signature: 'long long max_subarray(long long A[], long long n);',
    abi_spec: [
      { reg: 'X0', role: 'Con trỏ mảng A' },
      { reg: 'X1', role: 'Số phần tử n (n ≥ 1)' },
      { reg: 'X0 (Return)', role: 'Tổng lớn nhất của dãy con liên tiếp' }
    ],
    examples: [
      {
        input: 'A = [-2, 1, -3, 4, -1, 2, 1, -5, 4], n = 9',
        output: '6',
        explanation: 'Dãy con liên tiếp [4, -1, 2, 1] có tổng lớn nhất = 6.'
      }
    ],
    constraints: ['1 ≤ n ≤ 100', '-10^9 ≤ A[i] ≤ 10^9'],
    starter_code: `// LeetCode #8: Maximum Subarray (Kadane)
// X0: Địa chỉ mảng A, X1: n
max_subarray:
    // Khởi tạo max_so_far = A[0], curr_max = A[0]...
    
    LDUR  X0,  [X0, #0]
    BR    LR
`,
    solution_code: `max_subarray:
    LDUR  X9,  [X0, #0]
    ADDI  X10, X9,  #0
    ADDI  X11, XZR, #1
Loop_kad:
    SUBS  XZR, X11, X1
    B.GE  Done_kad
    LSL   X12, X11, #3
    ADD   X12, X0,  X12
    LDUR  X13, [X12, #0]
    ADD   X14, X10, X13
    SUBS  XZR, X13, X14
    B.LE  Keep_kad
    ADDI  X10, X13, #0
    B     Check_so_far
Keep_kad:
    ADDI  X10, X14, #0
Check_so_far:
    SUBS  XZR, X10, X9
    B.LE  Next_kad
    ADDI  X9,  X10, #0
Next_kad:
    ADDI  X11, X11, #1
    B     Loop_kad
Done_kad:
    ADDI  X0,  X9,  #0
    BR    LR`,
    sample_cases: [
      { params: [0x1000, 9], memory: { '0x1000': -2, '0x1008': 1, '0x1010': -3, '0x1018': 4, '0x1020': -1, '0x1028': 2, '0x1030': 1, '0x1038': -5, '0x1040': 4 }, expected: 6, label: 'Ví dụ mẫu 1' }
    ],
    hidden_cases: [
      { params: [0x2000, 1], memory: { '0x2000': 1 }, expected: 1, label: 'Test ẩn 1 (1 phần tử)' },
      { params: [0x3000, 5], memory: { '0x3000': 5, '0x3008': 4, '0x3010': -1, '0x3018': 7, '0x3020': 8 }, expected: 23, label: 'Test ẩn 2' }
    ]
  }
];

/**
 * ============================================================================
 * LEETCODE UI CONTROLLER
 * ============================================================================
 */
const LeetCodeUI = (() => {
  let currentIdx = 0;
  let currentProblem = null;
  let solvedCount = 0;
  let activeTab = 'sample'; // 'sample' | 'submission'

  const el = {};

  function init() {
    cacheElements();
    bindEvents();
    renderProblemSelector();
    loadProblem(0);
  }

  function cacheElements() {
    el.problemSelect = document.getElementById('problem-select');
    el.diffBadge = document.getElementById('diff-badge');
    el.problemTitle = document.getElementById('problem-title');
    el.acceptanceVal = document.getElementById('acceptance-val');
    el.tagsContainer = document.getElementById('tags-container');
    el.problemDesc = document.getElementById('problem-desc');
    el.signatureCard = document.getElementById('signature-card');
    el.abiTable = document.getElementById('abi-table');
    el.examplesContainer = document.getElementById('examples-container');
    el.constraintsList = document.getElementById('constraints-list');
    el.codeArea = document.getElementById('code-textarea');
    el.lineNumbers = document.getElementById('line-numbers');
    el.runBtn = document.getElementById('btn-run-code');
    el.submitBtn = document.getElementById('btn-submit-code');
    el.resetBtn = document.getElementById('btn-reset-code');
    el.consoleOutput = document.getElementById('lc-console-output');
    el.tabSample = document.getElementById('tab-sample');
    el.tabSubmit = document.getElementById('tab-submit');
    el.acceptedModal = document.getElementById('accepted-modal');
    el.nextProbBtn = document.getElementById('btn-next-problem');
  }

  function bindEvents() {
    if (el.problemSelect) {
      el.problemSelect.addEventListener('change', (e) => loadProblem(parseInt(e.target.value, 10)));
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
          runCode(false); // Submit
        }
      });
    }
    if (el.runBtn) el.runBtn.addEventListener('click', () => runCode(true));
    if (el.submitBtn) el.submitBtn.addEventListener('click', () => runCode(false));
    if (el.resetBtn) el.resetBtn.addEventListener('click', resetCode);

    if (el.tabSample) el.tabSample.addEventListener('click', () => switchTab('sample'));
    if (el.tabSubmit) el.tabSubmit.addEventListener('click', () => switchTab('submission'));

    if (el.nextProbBtn) {
      el.nextProbBtn.addEventListener('click', () => {
        if (el.acceptedModal) el.acceptedModal.classList.remove('show');
        if (currentIdx + 1 < LEETCODE_PROBLEMS.length) {
          loadProblem(currentIdx + 1);
        }
      });
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    if (el.tabSample) el.tabSample.classList.toggle('active', tab === 'sample');
    if (el.tabSubmit) el.tabSubmit.classList.toggle('active', tab === 'submission');
  }

  function renderProblemSelector() {
    if (!el.problemSelect) return;
    el.problemSelect.innerHTML = LEETCODE_PROBLEMS.map((p, idx) => `
      <option value="${idx}">[${p.difficulty}] ${p.title}</option>
    `).join('');
  }

  function loadProblem(idx) {
    currentIdx = idx;
    currentProblem = LEETCODE_PROBLEMS[idx];
    if (!currentProblem) return;

    if (el.problemSelect) el.problemSelect.value = idx;
    if (el.problemTitle) el.problemTitle.textContent = currentProblem.title;
    if (el.acceptanceVal) el.acceptanceVal.textContent = currentProblem.acceptance;

    if (el.diffBadge) {
      el.diffBadge.textContent = currentProblem.difficulty;
      el.diffBadge.className = `badge-diff ${currentProblem.difficulty.toLowerCase()}`;
    }

    if (el.tagsContainer) {
      el.tagsContainer.innerHTML = currentProblem.tags.map(t => `<span class="tag-pill">${t}</span>`).join('');
    }

    if (el.problemDesc) el.problemDesc.innerHTML = currentProblem.desc;

    if (el.signatureCard) {
      el.signatureCard.textContent = currentProblem.signature;
    }

    if (el.abiTable) {
      el.abiTable.innerHTML = currentProblem.abi_spec.map(s => `
        <tr>
          <td><b style="color:var(--c-cyan);">${s.reg}</b></td>
          <td>${s.role}</td>
        </tr>
      `).join('');
    }

    if (el.examplesContainer) {
      el.examplesContainer.innerHTML = currentProblem.examples.map((ex, i) => `
        <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:0.7rem; margin-bottom:0.6rem; font-size:0.8rem;">
          <div style="font-weight:700; color:#38bdf8; margin-bottom:0.3rem;">Ví dụ ${i + 1}:</div>
          <div><b>Đầu vào:</b> <code style="color:#cbd5e1;">${ex.input}</code></div>
          <div style="margin-top:0.2rem;"><b>Đầu ra:</b> <code style="color:#10b981;">${ex.output}</code></div>
          <div style="margin-top:0.2rem; color:#94a3b8; font-size:0.75rem;"><i>${ex.explanation}</i></div>
        </div>
      `).join('');
    }

    if (el.constraintsList) {
      el.constraintsList.innerHTML = currentProblem.constraints.map(c => `<li>${c}</li>`).join('');
    }

    if (el.codeArea) {
      el.codeArea.value = currentProblem.starter_code || '';
      updateLineNumbers();
    }

    renderInitialConsole();
  }

  function updateLineNumbers() {
    if (!el.codeArea || !el.lineNumbers) return;
    const lines = el.codeArea.value.split('\n');
    el.lineNumbers.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
  }

  function resetCode() {
    if (currentProblem && el.codeArea) {
      el.codeArea.value = currentProblem.starter_code || '';
      updateLineNumbers();
    }
  }

  function renderInitialConsole() {
    if (!el.consoleOutput || !currentProblem) return;
    el.consoleOutput.innerHTML = `
      <div style="color:#64748b; font-size:0.8rem; font-family:var(--font-code); padding:0.5rem;">
        Bấm <b>Run Code</b> để chạy các bộ test mẫu công khai, hoặc <b>Submit</b> để nộp bài và chấm toàn bộ test ẩn.
      </div>
    `;
  }

  function runCode(isSampleOnly) {
    if (!currentProblem || !el.codeArea) return;
    const code = el.codeArea.value;

    switchTab(isSampleOnly ? 'sample' : 'submission');

    // 1. Phân tích cú pháp LEGv8
    const parsed = LEGv8.parseCode(code);
    if (parsed.errors.length > 0) {
      renderErrors('LỖI CÚ PHÁP (COMPILATION ERROR)', parsed.errors.map(e => e.message));
      return;
    }

    // 2. Kiểm định chuẩn ABI
    const audit = LEGv8.auditABI(parsed.instructions, { isProcedure: true });
    if (audit.errors.length > 0) {
      renderErrors('VI PHẠM CHUẨN ABI (ABI AUDIT ERROR)', audit.errors.map(e => e.message));
      return;
    }

    // 3. Chọn tập test case
    const testCasesToRun = isSampleOnly
      ? currentProblem.sample_cases
      : [...currentProblem.sample_cases, ...currentProblem.hidden_cases];

    const cpu = new LEGv8.VirtualCPU();
    let allPassed = true;
    let maxCycles = 0;
    let totalCycles = 0;
    let html = '';

    for (let i = 0; i < testCasesToRun.length; i++) {
      const tc = testCasesToRun[i];
      const res = cpu.runProgram(parsed, tc, { isProcedure: true });
      totalCycles += res.cycles;
      if (res.cycles > maxCycles) maxCycles = res.cycles;

      if (res.success) {
        html += `
          <div class="test-card pass" style="margin-bottom:0.5rem;">
            <div class="test-head">
              <span style="font-weight:700; color:#fff;">${tc.label || `Case #${i + 1}`}</span>
              <span class="badge-pass">✓ ĐẠT (${res.cycles} cycles)</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">
              Kết quả: <b style="color:#10b981;">${res.actual}</b>
            </div>
          </div>
        `;
      } else {
        allPassed = false;
        html += `
          <div class="test-card fail" style="margin-bottom:0.5rem;">
            <div class="test-head">
              <span style="font-weight:700; color:#fff;">${tc.label || `Case #${i + 1}`}</span>
              <span class="badge-fail">✗ SAI (WRONG ANSWER)</span>
            </div>
            <div style="font-size:0.75rem; color:#f87171; margin-top:0.25rem;">
              ${res.message ? res.message : `Thực tế: <b>${res.actual}</b> | Kỳ vọng: <b>${res.expected}</b>`}
            </div>
          </div>
        `;
        break; // Dừng ngay ở test đầu tiên bị sai
      }
    }

    if (el.consoleOutput) el.consoleOutput.innerHTML = html;

    // Nếu bấm Submit và vượt qua 100% test cases -> Hiện Modal Accepted
    if (!isSampleOnly && allPassed) {
      solvedCount++;
      document.getElementById('modal-runtime').textContent = `${totalCycles} chu kỳ (${Math.round(totalCycles / 1000)} µs)`;
      document.getElementById('modal-runtime-percent').textContent = `Nhanh hơn 96.8% giải pháp`;
      document.getElementById('modal-memory-percent').textContent = `Khung ngăn xếp bảo tồn 100%`;
      if (el.acceptedModal) el.acceptedModal.classList.add('show');
    }
  }

  function renderErrors(title, errList) {
    if (!el.consoleOutput) return;
    el.consoleOutput.innerHTML = `
      <div class="test-card fail">
        <div class="test-head">
          <span style="font-weight:700; color:#fff;">${title}</span>
          <span class="badge-fail">LỖI THỰC THI</span>
        </div>
        <div style="font-size:0.78rem; color:#f87171; margin-top:0.4rem; line-height:1.5;">
          ${errList.map(e => `<div>• ${e}</div>`).join('')}
        </div>
      </div>
    `;
  }

  return { init };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', LeetCodeUI.init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEETCODE_PROBLEMS;
}
