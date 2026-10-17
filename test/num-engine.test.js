'use strict';
/**
 * TDD Suite — K-Map Arena Num & ALU Engine
 * 
 * Seam 1: Integer Representation (Sign-Mag, 1's Comp, 2's Comp, Excess-K)
 * Seam 2: ALU Operations (+, -, SAL, SAR, SHR, ROL, ROR, Overflow, End-Around Carry)
 * Seam 3: Floating-Point Engine (8-bit Mini-float, 16-bit FP16, 32-bit FP32)
 * Seam 4: Question Generators & Invariants
 */

const NE = require('../js/num-engine.js');

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

function assertClose(actual, expected, eps, desc) {
  const diff = Math.abs(actual - expected);
  assert(diff <= eps, `${desc} (nhận: ${actual}, kỳ vọng: ${expected}, sai lệch: ${diff})`);
}

console.log('====================================================');
console.log('CHẠY BỘ KIỂM THỬ TDD: NUM-ENGINE & ALU ARENA');
console.log('====================================================\n');

/* -------------------------------------------------------------------------
   SEAM 1: INTEGER REPRESENTATIONS (Dấu lượng, Bù 1, Bù 2, Excess-K)
   ------------------------------------------------------------------------- */
console.log('--- SEAM 1: Biểu diễn số nguyên (SM, 1C, 2C, Excess-K) ---');
{
  // 4-bit Sign-Magnitude
  assertEqual(NE.Int.toSignMag(5, 4), '0101', 'SM 4-bit: +5 -> 0101');
  assertEqual(NE.Int.toSignMag(-5, 4), '1101', 'SM 4-bit: -5 -> 1101');
  assertEqual(NE.Int.fromSignMag('0101', 4), 5, 'SM 4-bit decode: 0101 -> +5');
  assertEqual(NE.Int.fromSignMag('1101', 4), -5, 'SM 4-bit decode: 1101 -> -5');
  // Bẫy 2 số 0 trong SM
  assertEqual(NE.Int.fromSignMag('0000', 4), 0, 'SM 4-bit decode: 0000 -> +0');
  assertEqual(Object.is(NE.Int.fromSignMag('1000', 4), -0), true, 'SM 4-bit decode: 1000 -> -0');

  // 4-bit 1's Complement
  assertEqual(NE.Int.toOnesComp(5, 4), '0101', '1C 4-bit: +5 -> 0101');
  assertEqual(NE.Int.toOnesComp(-5, 4), '1010', '1C 4-bit: -5 -> 1010');
  assertEqual(NE.Int.fromOnesComp('0101', 4), 5, '1C 4-bit decode: 0101 -> +5');
  assertEqual(NE.Int.fromOnesComp('1010', 4), -5, '1C 4-bit decode: 1010 -> -5');
  // Bẫy 2 số 0 trong 1C
  assertEqual(NE.Int.fromOnesComp('0000', 4), 0, '1C 4-bit decode: 0000 -> +0');
  assertEqual(Object.is(NE.Int.fromOnesComp('1111', 4), -0), true, '1C 4-bit decode: 1111 -> -0');

  // 4-bit & 8-bit & 16-bit 2's Complement
  assertEqual(NE.Int.toTwosComp(5, 4), '0101', '2C 4-bit: +5 -> 0101');
  assertEqual(NE.Int.toTwosComp(-5, 4), '1011', '2C 4-bit: -5 -> 1011');
  assertEqual(NE.Int.fromTwosComp('0101', 4), 5, '2C 4-bit decode: 0101 -> +5');
  assertEqual(NE.Int.fromTwosComp('1011', 4), -5, '2C 4-bit decode: 1011 -> -5');
  // Cực trị âm bất đối xứng của 2C
  assertEqual(NE.Int.toTwosComp(-8, 4), '1000', '2C 4-bit cực trị âm: -8 -> 1000');
  assertEqual(NE.Int.fromTwosComp('1000', 4), -8, '2C 4-bit cực trị âm: 1000 -> -8');
  assertEqual(NE.Int.toTwosComp(-128, 8), '10000000', '2C 8-bit cực trị âm: -128 -> 10000000');
  assertEqual(NE.Int.fromTwosComp('10000000', 8), -128, '2C 8-bit cực trị âm: 10000000 -> -128');
  assertEqual(NE.Int.toTwosComp(-32768, 16), '1000000000000000', '2C 16-bit cực trị âm: -32768');
  assertEqual(NE.Int.fromTwosComp('1000000000000000', 16), -32768, '2C 16-bit decode -32768');

  // Excess-K (Biased)
  // 4-bit Excess-8 (Bias = 8): 5 + 8 = 13 (1101), -5 + 8 = 3 (0011)
  assertEqual(NE.Int.toExcessK(5, 4, 8), '1101', 'Excess-8 4-bit: +5 -> 1101');
  assertEqual(NE.Int.toExcessK(-5, 4, 8), '0011', 'Excess-8 4-bit: -5 -> 0011');
  assertEqual(NE.Int.fromExcessK('1101', 4, 8), 5, 'Excess-8 decode: 1101 -> +5');
  assertEqual(NE.Int.fromExcessK('0011', 4, 8), -5, 'Excess-8 decode: 0011 -> -5');
  // 8-bit Excess-127 (Bias = 127 chuẩn IEEE 754 exp)
  assertEqual(NE.Int.toExcessK(0, 8, 127), '01111111', 'Excess-127 8-bit: 0 -> 01111111');
  assertEqual(NE.Int.fromExcessK('01111111', 8, 127), 0, 'Excess-127 decode: 01111111 -> 0');
  assertEqual(NE.Int.toExcessK(1, 8, 127), '10000000', 'Excess-127 8-bit: +1 -> 10000000');
  assertEqual(NE.Int.fromExcessK('10000000', 8, 127), 1, 'Excess-127 decode: 10000000 -> +1');

  // Kiểm tra dải giá trị
  assertEqual(NE.Int.getRange('sm', 4), { min: -7, max: 7 }, 'Dải SM 4-bit: [-7, 7]');
  assertEqual(NE.Int.getRange('1c', 4), { min: -7, max: 7 }, 'Dải 1C 4-bit: [-7, 7]');
  assertEqual(NE.Int.getRange('2c', 4), { min: -8, max: 7 }, 'Dải 2C 4-bit: [-8, 7]');
  assertEqual(NE.Int.getRange('2c', 8), { min: -128, max: 127 }, 'Dải 2C 8-bit: [-128, 127]');
  assertEqual(NE.Int.getRange('excess', 4, 8), { min: -8, max: 7 }, 'Dải Excess-8 4-bit: [-8, 7]');
}

/* -------------------------------------------------------------------------
   SEAM 2: PHÉP TOÁN ALU (+, -, SAL, SAR, SHR, ROL, ROR, FLAGS)
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 2: Phép toán ALU & Thao tác bit ---');
{
  // 1. Phép dịch trái SHL / SAL
  assertEqual(NE.ALU.shiftLeft('0110', 1, 4), { result: '1100', carryOut: 0 }, 'SAL 4-bit: 0110 << 1 -> 1100, Carry=0');
  assertEqual(NE.ALU.shiftLeft('1011', 1, 4), { result: '0110', carryOut: 1 }, 'SAL 4-bit: 1011 << 1 -> 0110, Carry=1');

  // 2. Phép dịch phải logic SHR (chèn 0 vào MSB)
  assertEqual(NE.ALU.shiftLogicalRight('1100', 1, 4), { result: '0110', carryOut: 0 }, 'SHR 4-bit: 1100 >> 1 -> 0110, Carry=0');
  assertEqual(NE.ALU.shiftLogicalRight('1101', 1, 4), { result: '0110', carryOut: 1 }, 'SHR 4-bit: 1101 >> 1 -> 0110, Carry=1');

  // 3. Phép dịch phải số học SAR (bảo toàn bit dấu trong Bù 2)
  // Số âm: 1100 (-4) SAR 1 -> 1110 (-2)
  assertEqual(NE.ALU.shiftArithmeticRight('1100', 1, 4), { result: '1110', carryOut: 0 }, 'SAR 4-bit số âm: 1100 (-4) -> 1110 (-2)');
  // Số dương: 0110 (+6) SAR 1 -> 0011 (+3)
  assertEqual(NE.ALU.shiftArithmeticRight('0110', 1, 4), { result: '0011', carryOut: 0 }, 'SAR 4-bit số dương: 0110 (+6) -> 0011 (+3)');
  // 8-bit cực trị âm: 10000000 (-128) SAR 2 -> 11100000 (-32)
  assertEqual(NE.ALU.shiftArithmeticRight('10000000', 2, 8), { result: '11100000', carryOut: 0 }, 'SAR 8-bit: -128 >> 2 -> -32 (11100000)');

  // 4. Phép xoay ROL / ROR
  assertEqual(NE.ALU.rotateLeft('1001', 1, 4), '0011', 'ROL 4-bit: 1001 rol 1 -> 0011');
  assertEqual(NE.ALU.rotateRight('1001', 1, 4), '1100', 'ROR 4-bit: 1001 ror 1 -> 1100');

  // 5. Cộng trong Bù 2 (2's Complement Addition) & Cờ Tràn Overflow
  // Không tràn: (+3) + (+2) = +5
  // 0011 + 0010 = 0101
  const add1 = NE.ALU.addTwosComp('0011', '0010', 4);
  assertEqual(add1.result, '0101', '2C Add (+3)+(+2): Result = 0101');
  assertEqual(add1.overflow, false, '2C Add (+3)+(+2): Không tràn Overflow (V=0)');
  assertEqual(add1.carryOut, 0, '2C Add (+3)+(+2): Carry=0');

  // Tràn dương: (+6) + (+5) = +11 > 7 (V=1)
  // 0110 + 0101 = 1011 (thành số âm -5 trong 4-bit 2C)
  const add2 = NE.ALU.addTwosComp('0110', '0101', 4);
  assertEqual(add2.result, '1011', '2C Add (+6)+(+5): Result = 1011');
  assertEqual(add2.overflow, true, '2C Add (+6)+(+5): TRÀN DƯƠNG (V=1)');

  // Tràn âm: (-7) + (-6) = -13 < -8 (V=1)
  // 1001 + 1010 = 1 0011 (kết quả 4-bit là 0011 = +3, V=1)
  const add3 = NE.ALU.addTwosComp('1001', '1010', 4);
  assertEqual(add3.result, '0011', '2C Add (-7)+(-6): Result = 0011');
  assertEqual(add3.overflow, true, '2C Add (-7)+(-6): TRÀN ÂM (V=1)');

  // Âm + Âm không tràn: (-2) + (-3) = -5
  // 1110 + 1101 = 1 1011 (kết quả 4-bit là 1011 = -5, V=0, CarryOut=1)
  const add4 = NE.ALU.addTwosComp('1110', '1101', 4);
  assertEqual(add4.result, '1011', '2C Add (-2)+(-3): Result = 1011 (-5)');
  assertEqual(add4.overflow, false, '2C Add (-2)+(-3): Không tràn (V=0)');
  assertEqual(add4.carryOut, 1, '2C Add (-2)+(-3): CarryOut=1 (bị loại bỏ trong Bù 2)');

  // 6. Quy tắc End-Around Carry trong Bù 1 (1's Complement Addition)
  // (+5) + (-2) = +3
  // 0101 + 1101 = 1 0010 -> carry-out 1 dồn về LSB: 0010 + 1 = 0011 (+3)
  const add1c_1 = NE.ALU.addOnesComp('0101', '1101', 4);
  assertEqual(add1c_1.rawSum, '0010', '1C Add: Raw sum trước khi dồn carry là 0010');
  assertEqual(add1c_1.endAroundCarry, 1, '1C Add: Phát sinh End-around carry = 1');
  assertEqual(add1c_1.finalResult, '0011', '1C Add: Kết quả sau khi dồn carry = 0011 (+3)');
  assertEqual(add1c_1.finalDec, 3, '1C Add: Giá trị thập phân = +3');

  // (+2) + (-3) = -1
  // 0010 + 1100 = 0 1110 -> không có carry out: 1110 (-1 trong Bù 1)
  const add1c_2 = NE.ALU.addOnesComp('0010', '1100', 4);
  assertEqual(add1c_2.endAroundCarry, 0, '1C Add: Không có End-around carry (0)');
  assertEqual(add1c_2.finalResult, '1110', '1C Add: Kết quả = 1110');
  assertEqual(add1c_2.finalDec, -1, '1C Add: Giá trị thập phân = -1');
}

/* -------------------------------------------------------------------------
   SEAM 3: SỐ CHẤM ĐỘNG (MINI-FLOAT 8-BIT, FP16, FP32)
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 3: Số chấm động (Mini-float 8-bit, FP16, FP32) ---');
{
  const SPEC8 = NE.Float.SPEC_MINIFLOAT_8; // 1 sign, 4 exp, 3 mantissa, bias 7

  // Normalized: +1.0 = 0 0111 000 (Exp = 7 - 7 = 0 -> 2^0, Mantissa = 0 -> 1.0)
  const dec1 = NE.Float.decodeFloat('00111000', SPEC8);
  assertEqual(dec1.type, 'normalized', 'Minifloat 1.0: Type is normalized');
  assertEqual(dec1.sign, 0, 'Minifloat 1.0: Sign = 0 (+)');
  assertEqual(dec1.expVal, 0, 'Minifloat 1.0: ExpVal = 7 - 7 = 0');
  assertClose(dec1.value, 1.0, 1e-6, 'Minifloat 1.0: Giá trị thực = 1.0');

  // Normalized: +1.5 = 0 0111 100 (Exp = 0, Mantissa = 100_2 = 4/8 = 0.5 -> 1 + 0.5 = 1.5)
  const dec1_5 = NE.Float.decodeFloat('00111100', SPEC8);
  assertClose(dec1_5.value, 1.5, 1e-6, 'Minifloat 1.5: Giá trị thực = 1.5');

  // Normalized: -3.5 = 1 1000 110 (Sign=1, Exp=8 - 7=1 -> 2^1, Mantissa=110_2 = 6/8 = 0.75 -> 2 * 1.75 = 3.5 -> -3.5)
  const decNeg3_5 = NE.Float.decodeFloat('11000110', SPEC8);
  assertClose(decNeg3_5.value, -3.5, 1e-6, 'Minifloat -3.5: Giá trị thực = -3.5');

  // Denormalized: Exp = 0000, Mantissa != 0
  // Công thức Denorm: (-1)^S * 2^(1 - Bias) * (0 + M / 2^mantBits) = (-1)^S * 2^(-6) * (M/8)
  // Chuỗi: 0 0000 001 -> 1/8 * 2^(-6) = 1/512 = 0.001953125
  const decDenorm = NE.Float.decodeFloat('00000001', SPEC8);
  assertEqual(decDenorm.type, 'denormalized', 'Minifloat 0 0000 001 là Denormalized');
  assertEqual(decDenorm.implicitBit, 0, 'Minifloat Denormalized có bit ẩn = 0');
  assertClose(decDenorm.value, 1 / 512, 1e-7, 'Minifloat Denorm: Giá trị = 1/512');

  // Specials: Zeros (+0, -0)
  const decPZero = NE.Float.decodeFloat('00000000', SPEC8);
  assertEqual(decPZero.type, 'zero', '00000000 là +0');
  assertEqual(decPZero.value, 0, '+0 decode ra 0');

  const decNZero = NE.Float.decodeFloat('10000000', SPEC8);
  assertEqual(decNZero.type, 'zero', '10000000 là -0');
  assertEqual(Object.is(decNZero.value, -0), true, '-0 decode ra -0');

  // Specials: Infinities (+inf, -inf)
  // Exp = 1111, Mantissa = 000
  const decPInf = NE.Float.decodeFloat('01111000', SPEC8);
  assertEqual(decPInf.type, 'infinity', '0 1111 000 là +Infinity');
  assertEqual(decPInf.value, Infinity, '+Infinity decode ra Infinity');

  const decNInf = NE.Float.decodeFloat('11111000', SPEC8);
  assertEqual(decNInf.type, 'infinity', '1 1111 000 là -Infinity');
  assertEqual(decNInf.value, -Infinity, '-Infinity decode ra -Infinity');

  // Specials: NaN
  // Exp = 1111, Mantissa != 000
  const decNaN = NE.Float.decodeFloat('01111001', SPEC8);
  assertEqual(decNaN.type, 'nan', '0 1111 001 là NaN');
  assertEqual(Number.isNaN(decNaN.value), true, 'NaN decode ra NaN');

  // Kiểm tra FP16 (1-5-10, Bias 15)
  const SPEC16 = NE.Float.SPEC_FP16;
  // +1.0 = 0 01111 0000000000
  const fp16One = NE.Float.decodeFloat('0011110000000000', SPEC16);
  assertClose(fp16One.value, 1.0, 1e-6, 'FP16 1.0 decode = 1.0');

  // Kiểm tra FP32 (1-8-23, Bias 127)
  const SPEC32 = NE.Float.SPEC_FP32;
  // +1.0 = 0 01111111 00000000000000000000000
  const fp32One = NE.Float.decodeFloat('001111111' + '0'.repeat(23), SPEC32);
  assertClose(fp32One.value, 1.0, 1e-6, 'FP32 1.0 decode = 1.0');
}

/* -------------------------------------------------------------------------
   SEAM 4: BỘ SINH CÂU HỎI VÀ ĐẶC TÍNH BẤT BIẾN (QUESTION GENERATORS)
   ------------------------------------------------------------------------- */
console.log('\n--- SEAM 4: Bộ sinh câu hỏi & Đảm bảo tính hợp lệ ---');
{
  // 1. Sinh câu hỏi Số nguyên
  for (let lvl = 0; lvl <= 2; lvl++) {
    for (let i = 0; i < 5; i++) {
      const q = NE.Gen.genIntQuestion(lvl);
      assert(q && q.title && q.prompt, `Int Q (Level ${lvl}, run ${i}): Có đầy đủ title & prompt`);
      assertEqual(q.options.length, 4, `Int Q (Level ${lvl}): Phải có đúng 4 phương án lựa chọn`);
      const uniq = new Set(q.options);
      assertEqual(uniq.size, 4, `Int Q (Level ${lvl}): 4 phương án phải phân biệt, không trùng lặp`);
      assert(q.correctIndex >= 0 && q.correctIndex < 4, `Int Q (Level ${lvl}): Chỉ số đúng trong [0..3]`);
      assert(q.explanation && q.explanation.length > 5, `Int Q (Level ${lvl}): Có lời giải thích sư phạm`);
    }
  }

  // 2. Sinh câu hỏi ALU
  for (let lvl = 0; lvl <= 2; lvl++) {
    for (let i = 0; i < 5; i++) {
      const q = NE.Gen.genALUQuestion(lvl);
      assert(q && q.opcode && q.operands, `ALU Q (Level ${lvl}, run ${i}): Có opcode và toán hạng`);
      assertEqual(q.options.length, 4, `ALU Q (Level ${lvl}): Đúng 4 phương án`);
      const uniq = new Set(q.options);
      assertEqual(uniq.size, 4, `ALU Q (Level ${lvl}): 4 phương án phân biệt`);
      assert(q.correctIndex >= 0 && q.correctIndex < 4, `ALU Q (Level ${lvl}): Chỉ số đáp án hợp lệ`);
      assert(q.explanation && q.explanation.length > 5, `ALU Q (Level ${lvl}): Có giải thích chi tiết`);
    }
  }

  // 3. Sinh câu hỏi Số chấm động
  for (let lvl = 0; lvl <= 2; lvl++) {
    for (let i = 0; i < 5; i++) {
      const q = NE.Gen.genFloatQuestion(lvl);
      assert(q && q.title && q.spec, `Float Q (Level ${lvl}, run ${i}): Có title và thông số spec`);
      assertEqual(q.options.length, 4, `Float Q (Level ${lvl}): Đúng 4 phương án`);
      const uniq = new Set(q.options);
      assertEqual(uniq.size, 4, `Float Q (Level ${lvl}): 4 phương án phân biệt`);
      assert(q.correctIndex >= 0 && q.correctIndex < 4, `Float Q (Level ${lvl}): Chỉ số đáp án hợp lệ`);
      assert(q.explanation && q.explanation.length > 5, `Float Q (Level ${lvl}): Có giải thích chi tiết`);
    }
  }
}

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
