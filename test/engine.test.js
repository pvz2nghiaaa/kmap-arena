'use strict';
/**
 * TDD Suite — K-Map Arena Boolean Engine
 * Kiểm thử tại các Seam ranh giới công khai độc lập:
 * Seam 1: Gray Code Coordinate Mapping (KM.cellToM, KM.mToCell)
 * Seam 2: Boolean Expression Parser & Truth Evaluator (KM.parse, KM.truth)
 * Seam 3: Minimal SOP & POS Cover Optimization (KM.minimalSOP, KM.minimalPOS)
 * Seam 4: Implicant Classification & Prime Detection (KM.primeImplicants, KM.essentialPrimes)
 */

const KM = require('../js/engine.js');

let passed = 0;
let failed = 0;

function assert(condition, desc) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${desc}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

function assertEqual(actual, expected, desc) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, `${desc} (nhận: ${JSON.stringify(actual)}, kỳ vọng: ${JSON.stringify(expected)})`);
}

console.log('====================================================');
console.log('CHẠY BỘ KIỂM THỬ TDD: K-MAP ARENA BOOLEAN ENGINE');
console.log('====================================================\n');

/* -------------------------------------------------------------------------
   SEAM 1: Gray-Code Coordinates (Bản đồ 4 biến AB × CD)
   ------------------------------------------------------------------------- */
console.log('--- SEAM 1: Tọa độ Gray và Minterm Mapping ---');
{
  // Thứ tự trục Gray: 00 (0), 01 (1), 11 (3), 10 (2)
  // Minterm = 8A + 4B + 2C + D
  
  // Hàng 0 (AB=00):
  // Cột 0 (CD=00): m0 = 0000
  // Cột 1 (CD=01): m1 = 0001 (Ô thứ 2 từ trái qua)
  // Cột 2 (CD=11): m3 = 0011 (Ô thứ 3 từ trái qua)
  // Cột 3 (CD=10): m2 = 0010 (Ô thứ 4 từ trái qua)
  assertEqual(KM.cellToM(0, 0), 0, 'Hàng 00, Cột 00 là m0');
  assertEqual(KM.cellToM(0, 1), 1, 'Hàng 00, Cột 01 là m1 (Ví dụ người dùng: ô 2)');
  assertEqual(KM.cellToM(0, 2), 3, 'Hàng 00, Cột 11 là m3 (Ví dụ người dùng: ô 3)');
  assertEqual(KM.cellToM(0, 3), 2, 'Hàng 00, Cột 10 là m2');

  // Kiểm tra ánh xạ ngược m -> (r, c)
  assertEqual(KM.mToCell(1), { r: 0, c: 1 }, 'm1 ánh xạ ngược về hàng 0, cột 1');
  assertEqual(KM.mToCell(3), { r: 0, c: 2 }, 'm3 ánh xạ ngược về hàng 0, cột 2');

  // Kiểm tra 4 góc: m0, m2, m8, m10
  // m0 = (0,0), m2 = (0,3), m8 = (3,0), m10 = (3,3)
  assertEqual(KM.mToCell(0), { r: 0, c: 0 }, 'Góc trên-trái m0');
  assertEqual(KM.mToCell(2), { r: 0, c: 3 }, 'Góc trên-phải m2');
  assertEqual(KM.mToCell(8), { r: 3, c: 0 }, 'Góc dưới-trái m8');
  assertEqual(KM.mToCell(10), { r: 3, c: 3 }, 'Góc dưới-phải m10');
}

/* -------------------------------------------------------------------------
   SEAM 2: Parser & AST Truth Table Evaluator
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 2: Boolean Expression Parser & Truth Evaluator ---');
{
  // 1. Phép toán cơ bản & độ ưu tiên: NOT > AND > XOR > OR
  const ast1 = KM.parse("A'B'C'D + A'B'CD");
  const bits1 = KM.truth(ast1);
  const expectedBits1 = (1 << 1) | (1 << 3); // m1 và m3
  assertEqual(bits1, expectedBits1, "Biểu thức A'B'C'D + A'B'CD phủ chính xác m1 và m3");

  // 2. Cú pháp dấu ngã ~A và viết liền
  const ast2 = KM.parse("~A~B~CD + ~A~BCD");
  const bits2 = KM.truth(ast2);
  assertEqual(bits2, expectedBits1, "Cú pháp ~A~B~CD + ~A~BCD tương đương chính xác");

  // 3. Biểu thức rút gọn A'B'D
  const ast3 = KM.parse("A'B'D");
  const bits3 = KM.truth(ast3);
  assertEqual(bits3, expectedBits1, "Biểu thức tối giản A'B'D phủ chính xác m1 và m3");

  // 4. Biểu thức có dấu ngoặc và phép XOR: (A ^ B)(C + D)
  const ast4 = KM.parse("(A ^ B)(C + D)");
  assert(typeof KM.truth(ast4) === 'number', "Parse biểu thức có dấu ngoặc và XOR thành công");

  // 5. Bắt lỗi cú pháp không hợp lệ
  let threw = false;
  try {
    KM.parse("A ++ B");
  } catch (e) {
    threw = true;
  }
  assert(threw, "Parser ném ngoại lệ khi gặp cú pháp sai (A ++ B)");
}

/* -------------------------------------------------------------------------
   SEAM 3: Minimal SOP & Minimal POS Optimization
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 3: Tối Thiểu Hóa SOP & POS ---');
{
  // Trường hợp 1: Ví dụ của người dùng: Σm(1, 3)
  const on1 = (1 << 1) | (1 << 3);
  const res1 = KM.minimalSOP(on1, 0);
  assertEqual(res1.cost[0], 1, "Σ(1, 3) rút gọn chỉ còn 1 số hạng duy nhất");
  assertEqual(res1.cost[1], 3, "Σ(1, 3) rút gọn còn 3 literal (A'B'D)");
  // Kiểm tra số hạng được chọn chính là mask 1101 (chứa A, B, D), giá trị 0001 (A=0, B=0, D=1)
  const term1 = res1.terms[0];
  assertEqual(term1.mask, 13, "Mask của A'B'D là 8+4+1 = 13 (A, B, D)");
  assertEqual(term1.value, 1, "Value của A'B'D là 0+0+1 = 1");

  // Trường hợp 2: Bốn góc thần thánh: Σm(0, 2, 8, 10) -> B'D'
  const onCorners = (1 << 0) | (1 << 2) | (1 << 8) | (1 << 10);
  const resCorners = KM.minimalSOP(onCorners, 0);
  assertEqual(resCorners.cost[0], 1, "4 góc rút gọn còn 1 số hạng");
  assertEqual(resCorners.cost[1], 2, "4 góc rút gọn còn 2 literal (B'D')");
  assertEqual(resCorners.terms[0].mask, 5, "Mask của B'D' là 4+1 = 5 (B, D)");
  assertEqual(resCorners.terms[0].value, 0, "Value của B'D' là B=0, D=0");

  // Trường hợp 3: Có ô tùy định (Don't-cares)
  // on = {1, 3}, dc = {0, 2} -> có thể mở rộng gom cả 4 ô hàng 0: A'B' (2 literal)
  const onDC = (1 << 1) | (1 << 3);
  const dc = (1 << 0) | (1 << 2);
  const resDC = KM.minimalSOP(onDC, dc);
  assertEqual(resDC.cost[0], 1, "Với ô X, rút gọn còn 1 số hạng");
  assertEqual(resDC.cost[1], 2, "Với ô X, nhóm nở to gấp đôi từ 3 literal xuống 2 literal (A'B')");
  assertEqual(resDC.terms[0].mask, 12, "Mask của A'B' là 8+4 = 12 (A, B)");

  // Trường hợp 4: POS tối giản cho f = A + B
  // f = 0 khi A=0, B=0 (các ô m0, m1, m2, m3)
  const off4 = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3);
  const on4 = KM.FULL & ~off4;
  const resPOS = KM.minimalPOS(on4, 0);
  assertEqual(resPOS.cost[0], 1, "POS cho (A+B) có đúng 1 mệnh đề");
  assertEqual(resPOS.cost[1], 2, "POS cho (A+B) có đúng 2 literal");
}

/* -------------------------------------------------------------------------
   SEAM 4: Implicant Classification (EPI vs PI vs Non-implicant)
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 4: Phân Loại Implicants & Essential Primes ---');
{
  const on = (1 << 1) | (1 << 3);
  const primes = KM.primeImplicants(on, 0);
  assertEqual(primes.length, 1, "Chỉ có đúng 1 Prime Implicant cho Σ(1,3)");
  
  const ess = KM.essentialPrimes(primes, on);
  assertEqual(ess.length, 1, "Prime Implicant này là Essential Prime Implicant (EPI)");
}

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
