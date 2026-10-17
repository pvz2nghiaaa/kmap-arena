'use strict';
/**
 * NumEngine — Core Engine for Computer Organization & Arithmetic Arena
 * 
 * Submodules:
 * 1. NE.Int: Biểu diễn số nguyên (Sign-Magnitude, 1's Comp, 2's Comp, Excess-K)
 * 2. NE.ALU: Phép toán ALU & Thao tác bit (+, -, SAL, SAR, SHR, ROL, ROR, cờ Tràn & Nhớ)
 * 3. NE.Float: Chuẩn số chấm động IEEE 754 & Mini-float (8-bit, 16-bit, 32-bit)
 * 4. NE.Gen: Bộ sinh câu hỏi sư phạm với 4 phương án và giải thích bước-từng-bước
 */

const NumEngine = (function() {

  /* =========================================================================
     1. INTEGER NUMBER SYSTEMS (NE.Int)
     ========================================================================= */
  const Int = {
    /** Chuyển số nguyên sang Sign-Magnitude (Dấu lượng) */
    toSignMag(val, bits) {
      const magBits = bits - 1;
      const maxMag = (1 << magBits) - 1;
      const isNeg = val < 0 || Object.is(val, -0);
      const mag = Math.min(Math.abs(val), maxMag);
      const signBit = isNeg ? '1' : '0';
      return signBit + mag.toString(2).padStart(magBits, '0');
    },

    /** Giải mã chuỗi Sign-Magnitude sang số nguyên */
    fromSignMag(binStr, bits) {
      const sign = binStr[0];
      const mag = parseInt(binStr.slice(1), 2);
      if (mag === 0) return sign === '1' ? -0 : 0;
      return sign === '1' ? -mag : mag;
    },

    /** Chuyển số nguyên sang Bù 1 (1's Complement) */
    toOnesComp(val, bits) {
      const maxVal = (1 << (bits - 1)) - 1;
      const isNeg = val < 0 || Object.is(val, -0);
      const absVal = Math.min(Math.abs(val), maxVal);
      const posBin = absVal.toString(2).padStart(bits, '0');
      if (!isNeg) return posBin;
      return posBin.split('').map(b => b === '0' ? '1' : '0').join('');
    },

    /** Giải mã chuỗi Bù 1 sang số nguyên */
    fromOnesComp(binStr, bits) {
      if (binStr[0] === '0') {
        return parseInt(binStr, 2);
      }
      // Bit dấu 1 -> số âm
      const inverted = binStr.split('').map(b => b === '0' ? '1' : '0').join('');
      const mag = parseInt(inverted, 2);
      if (mag === 0) return -0; // 1111 là -0
      return -mag;
    },

    /** Chuyển số nguyên sang Bù 2 (2's Complement) */
    toTwosComp(val, bits) {
      const minVal = -(1 << (bits - 1));
      const maxVal = (1 << (bits - 1)) - 1;
      let clamped = Math.max(minVal, Math.min(maxVal, val));
      if (clamped >= 0) {
        return clamped.toString(2).padStart(bits, '0');
      }
      // Số âm trong bù 2: 2^bits + val
      const unsignedVal = (BigInt(1) << BigInt(bits)) + BigInt(clamped);
      return unsignedVal.toString(2).padStart(bits, '0');
    },

    /** Giải mã chuỗi Bù 2 sang số nguyên */
    fromTwosComp(binStr, bits) {
      if (binStr[0] === '0') {
        return parseInt(binStr, 2);
      }
      // MSB = 1 -> Số âm
      // Với bits <= 30 dùng toán học số nguyên, với 16-bit an toàn
      const unsignedVal = BigInt('0b' + binStr);
      const mod = BigInt(1) << BigInt(bits);
      return Number(unsignedVal - mod);
    },

    /** Chuyển số nguyên sang Excess-K (Biased) */
    toExcessK(val, bits, bias) {
      if (bias === undefined) bias = 1 << (bits - 1);
      const unsignedVal = val + bias;
      return unsignedVal.toString(2).padStart(bits, '0');
    },

    /** Giải mã chuỗi Excess-K sang số nguyên */
    fromExcessK(binStr, bits, bias) {
      if (bias === undefined) bias = 1 << (bits - 1);
      const unsignedVal = parseInt(binStr, 2);
      return unsignedVal - bias;
    },

    /** Lấy dải giá trị [min, max] của định dạng */
    getRange(format, bits, bias) {
      const b = bits - 1;
      switch (format) {
        case 'sm':
        case '1c': {
          const max = (1 << b) - 1;
          return { min: -max, max };
        }
        case '2c': {
          const min = -(1 << b);
          const max = (1 << b) - 1;
          return { min, max };
        }
        case 'excess': {
          if (bias === undefined) bias = 1 << b;
          const maxUnsigned = (1 << bits) - 1;
          return { min: -bias, max: maxUnsigned - bias };
        }
        default:
          return { min: 0, max: (1 << bits) - 1 };
      }
    },

    /** Lấy toàn bộ 4 biểu diễn nhị phân của một giá trị để so sánh */
    getAllReps(val, bits, bias) {
      if (bias === undefined) bias = 1 << (bits - 1);
      const r = this.getRange('2c', bits);
      const rSM = this.getRange('sm', bits);
      return {
        sm: (val >= rSM.min && val <= rSM.max) ? this.toSignMag(val, bits) : 'N/A',
        ones: (val >= rSM.min && val <= rSM.max) ? this.toOnesComp(val, bits) : 'N/A',
        twos: (val >= r.min && val <= r.max) ? this.toTwosComp(val, bits) : 'N/A',
        excess: this.toExcessK(val, bits, bias)
      };
    }
  };

  /* =========================================================================
     2. ALU OPERATIONS & BIT MANIPULATION (NE.ALU)
     ========================================================================= */
  const ALU = {
    /** Phép dịch trái SHL / SAL (Shift Arithmetic / Logical Left) */
    shiftLeft(binStr, amount, bits) {
      amount = amount || 1;
      bits = bits || binStr.length;
      const carryOut = parseInt(binStr[amount - 1] || '0', 10);
      const shifted = binStr.slice(amount) + '0'.repeat(amount);
      const result = shifted.slice(0, bits).padStart(bits, '0');
      return { result, carryOut };
    },

    /** Phép dịch phải logic SHR (Shift Logical Right - chèn 0 vào MSB) */
    shiftLogicalRight(binStr, amount, bits) {
      amount = amount || 1;
      bits = bits || binStr.length;
      const carryOut = parseInt(binStr[binStr.length - amount] || '0', 10);
      const shifted = '0'.repeat(amount) + binStr.slice(0, bits - amount);
      const result = shifted.slice(0, bits);
      return { result, carryOut };
    },

    /** Phép dịch phải số học SAR (Shift Arithmetic Right - giữ nguyên bit dấu) */
    shiftArithmeticRight(binStr, amount, bits) {
      amount = amount || 1;
      bits = bits || binStr.length;
      const sign = binStr[0];
      const carryOut = parseInt(binStr[binStr.length - amount] || '0', 10);
      const shifted = sign.repeat(amount) + binStr.slice(0, bits - amount);
      const result = shifted.slice(0, bits);
      return { result, carryOut };
    },

    /** Phép xoay trái ROL (Rotate Left) */
    rotateLeft(binStr, amount, bits) {
      bits = bits || binStr.length;
      amount = amount % bits;
      return binStr.slice(amount) + binStr.slice(0, amount);
    },

    /** Phép xoay phải ROR (Rotate Right) */
    rotateRight(binStr, amount, bits) {
      bits = bits || binStr.length;
      amount = amount % bits;
      return binStr.slice(bits - amount) + binStr.slice(0, bits - amount);
    },

    /** Cộng trong Bù 2 kèm phát hiện Tràn (Overflow) */
    addTwosComp(binA, binB, bits) {
      bits = bits || binA.length;
      const uA = parseInt(binA, 2);
      const uB = parseInt(binB, 2);
      const uSum = uA + uB;
      const mod = 1 << bits;
      const mask = mod - 1;
      const carryOut = (uSum >= mod) ? 1 : 0;
      const resUnsigned = uSum & mask;
      const result = resUnsigned.toString(2).padStart(bits, '0');

      const sA = binA[0];
      const sB = binB[0];
      const sR = result[0];
      // Tràn khi cùng dấu toán hạng nhưng kết quả ngược dấu:
      // (Dương + Dương -> Âm) hoặc (Âm + Âm -> Dương)
      const overflow = (sA === sB) && (sA !== sR);

      const decA = Int.fromTwosComp(binA, bits);
      const decB = Int.fromTwosComp(binB, bits);
      const decR = Int.fromTwosComp(result, bits);

      let expl = `${decA} + (${decB}) = ${decA + decB}. `;
      if (overflow) {
        expl += `⚠️ TRÀN SỐ (Overflow V=1) do kết quả vượt ra ngoài dải [${-(1 << (bits - 1))}, ${(1 << (bits - 1)) - 1}]. Kết quả trong thanh ghi thành ${decR} (${result}).`;
      } else {
        expl += `Không tràn (V=0). Kết quả: ${result} (${decR}). Cờ nhớ Carry-out = ${carryOut}.`;
      }

      return {
        result,
        decResult: decR,
        carryOut,
        overflow,
        zero: decR === 0,
        sign: sR === '1',
        explanation: expl
      };
    },

    /** Trừ trong Bù 2: A - B = A + (-B) */
    subTwosComp(binA, binB, bits) {
      bits = bits || binA.length;
      const decB = Int.fromTwosComp(binB, bits);
      const negBinB = Int.toTwosComp(-decB, bits);
      const addRes = this.addTwosComp(binA, negBinB, bits);
      const decA = Int.fromTwosComp(binA, bits);
      addRes.explanation = `Phép trừ ${decA} - (${decB}) chuyển thành ${decA} + (${-decB}). ` + addRes.explanation;
      return addRes;
    },

    /** Cộng trong Bù 1 (1's Complement) kèm cơ chế End-Around Carry */
    addOnesComp(binA, binB, bits) {
      bits = bits || binA.length;
      const uA = parseInt(binA, 2);
      const uB = parseInt(binB, 2);
      const uSum = uA + uB;
      const mod = 1 << bits;
      const mask = mod - 1;
      const endAroundCarry = (uSum >= mod) ? 1 : 0;
      const rawSum = (uSum & mask).toString(2).padStart(bits, '0');

      let finalUnsigned = uSum & mask;
      if (endAroundCarry === 1) {
        finalUnsigned += 1;
      }
      const finalResult = (finalUnsigned & mask).toString(2).padStart(bits, '0');
      const decA = Int.fromOnesComp(binA, bits);
      const decB = Int.fromOnesComp(binB, bits);
      const finalDec = Int.fromOnesComp(finalResult, bits);

      let expl = `Trong Bù 1: ${binA} (${decA}) + ${binB} (${decB}). Tổng nhị phân thô = ${rawSum}. `;
      if (endAroundCarry === 1) {
        expl += `Có bit nhớ MSB (Carry-out = 1). Theo quy tắc End-Around Carry, bit 1 này được CỘNG DỒN VỀ LSB: ${rawSum} + 1 = ${finalResult} (${finalDec}).`;
      } else {
        expl += `Không có bit nhớ quay đầu (Carry = 0). Kết quả giữ nguyên: ${finalResult} (${finalDec}).`;
      }

      return {
        rawSum,
        endAroundCarry,
        finalResult,
        finalDec,
        explanation: expl
      };
    }
  };

  /* =========================================================================
     3. FLOATING-POINT SYSTEMS (NE.Float)
     ========================================================================= */
  const Float = {
    SPEC_MINIFLOAT_8: {
      name: 'Mini-float 8-bit',
      totalBits: 8,
      signBits: 1,
      expBits: 4,
      mantBits: 3,
      bias: 7
    },
    SPEC_FP16: {
      name: 'IEEE 754 Half Precision (FP16)',
      totalBits: 16,
      signBits: 1,
      expBits: 5,
      mantBits: 10,
      bias: 15
    },
    SPEC_FP32: {
      name: 'IEEE 754 Single Precision (FP32)',
      totalBits: 32,
      signBits: 1,
      expBits: 8,
      mantBits: 23,
      bias: 127
    },

    /** Giải mã số chấm động thành cấu trúc chi tiết & công thức bước giải */
    decodeFloat(binStr, spec) {
      spec = spec || this.SPEC_MINIFLOAT_8;
      const signChar = binStr[0];
      const sign = signChar === '1' ? 1 : 0;
      const signFactor = sign === 1 ? -1 : 1;

      const expStr = binStr.slice(1, 1 + spec.expBits);
      const mantStr = binStr.slice(1 + spec.expBits);

      const expRaw = parseInt(expStr, 2);
      const maxExp = (1 << spec.expBits) - 1;

      // Tính giá trị phần thập phân của mantissa: sum(b_i * 2^-(i+1))
      let mantFrac = 0;
      for (let i = 0; i < mantStr.length; i++) {
        if (mantStr[i] === '1') {
          mantFrac += Math.pow(2, -(i + 1));
        }
      }

      let type = 'normalized';
      let value = 0;
      let implicitBit = 1;
      let expVal = expRaw - spec.bias;
      let formulaText = '';

      if (expRaw === 0) {
        if (mantFrac === 0) {
          type = 'zero';
          value = sign === 1 ? -0 : 0;
          formulaText = `${sign === 1 ? '-' : '+'}0 (Số không)`;
        } else {
          type = 'denormalized';
          implicitBit = 0;
          expVal = 1 - spec.bias;
          value = signFactor * Math.pow(2, expVal) * mantFrac;
          formulaText = `(-1)^${sign} × 2^(${1 - spec.bias}) × (0 + ${mantFrac}) = ${value}`;
        }
      } else if (expRaw === maxExp) {
        if (mantFrac === 0) {
          type = 'infinity';
          value = sign === 1 ? -Infinity : Infinity;
          formulaText = `${sign === 1 ? '-' : '+'}Vô cực (Infinity)`;
        } else {
          type = 'nan';
          value = NaN;
          formulaText = `NaN (Not a Number - Không phải số)`;
        }
      } else {
        type = 'normalized';
        implicitBit = 1;
        expVal = expRaw - spec.bias;
        const significand = 1 + mantFrac;
        value = signFactor * Math.pow(2, expVal) * significand;
        formulaText = `(-1)^${sign} × 2^(${expRaw} - ${spec.bias}) × (1 + ${mantFrac}) = ${signFactor} × 2^${expVal} × ${significand} = ${value}`;
      }

      return {
        spec,
        binStr,
        sign,
        signChar,
        expStr,
        expRaw,
        expVal,
        mantStr,
        mantFrac,
        implicitBit,
        type,
        value,
        formulaText
      };
    }
  };

  /* =========================================================================
     4. QUESTION GENERATOR & PEDAGOGICAL ENGINE (NE.Gen)
     ========================================================================= */
  const Gen = {
    _rnd(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    _pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    _shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    /**
     * Sinh câu hỏi cho Game 7: ĐẤU TRƯỜNG SỐ NGUYÊN
     * Level 0: 4-bit cơ bản
     * Level 1: 8-bit nâng cao
     * Level 2: 8-bit / 16-bit cạm bẫy cực trị & phân biệt 4 hệ
     */
    genIntQuestion(level) {
      level = level || 0;
      const bits = level === 0 ? 4 : level === 1 ? 8 : (Math.random() < 0.6 ? 8 : 16);
      const qTypes = ['bin_to_dec', 'dec_to_bin', 'compare_trap', 'who_is_who'];
      const qType = this._pick(qTypes);
      const formats = ['sm', '1c', '2c', 'excess'];
      const fmt = this._pick(formats);
      const bias = bits === 4 ? 8 : bits === 8 ? 128 : 32768;

      const formatNames = {
        sm: 'Dấu Lượng (Sign-Magnitude)',
        '1c': 'Bù 1 (1\'s Complement)',
        '2c': 'Bù 2 (2\'s Complement)',
        excess: `Excess-${bias} (Mã Lệch Bias ${bias})`
      };

      if (qType === 'bin_to_dec') {
        const r = Int.getRange(fmt, bits, bias);
        let val = this._rnd(r.min, r.max);
        // Đôi khi ưu tiên số âm hoặc số 0 để tạo bẫy
        if (Math.random() < 0.5 && r.min < 0) val = this._rnd(r.min, -1);
        let bin = '';
        if (fmt === 'sm') bin = Int.toSignMag(val, bits);
        else if (fmt === '1c') bin = Int.toOnesComp(val, bits);
        else if (fmt === '2c') bin = Int.toTwosComp(val, bits);
        else bin = Int.toExcessK(val, bits, bias);

        const correct = val.toString();
        // Distractors
        const distractors = new Set();
        distractors.add((-val).toString());
        distractors.add((val + 1).toString());
        distractors.add((val - 1).toString());
        distractors.add((parseInt(bin, 2)).toString()); // Nhầm sang unsigned
        distractors.delete(correct);

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'int',
          title: 'Giải Mã Chuỗi Nhị Phân',
          prompt: `Chuỗi bit <code>${bin}</code> (${bits}-bit) biểu diễn số thập phân nào trong hệ <strong>${formatNames[fmt]}</strong>?`,
          bits,
          bin,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `Trong hệ ${formatNames[fmt]} ${bits}-bit: chuỗi <code>${bin}</code> giải mã ra giá trị thập phân là <strong>${correct}</strong>.`
        };
      }

      if (qType === 'dec_to_bin') {
        const r = Int.getRange(fmt, bits, bias);
        let val = this._rnd(r.min, r.max);
        if (Math.random() < 0.5 && val > 0) val = -val;

        let correct = '';
        if (fmt === 'sm') correct = Int.toSignMag(val, bits);
        else if (fmt === '1c') correct = Int.toOnesComp(val, bits);
        else if (fmt === '2c') correct = Int.toTwosComp(val, bits);
        else correct = Int.toExcessK(val, bits, bias);

        // Sinh phương án gây nhiễu từ các hệ khác
        const distractors = new Set();
        distractors.add(Int.toTwosComp(val, bits));
        distractors.add(Int.toSignMag(val, bits));
        distractors.add(Int.toOnesComp(val, bits));
        distractors.add(Int.toExcessK(val, bits, bias));
        distractors.add(Int.toTwosComp(-val, bits));
        distractors.delete(correct);

        while (distractors.size < 3) {
          const fake = this._rnd(0, (1 << bits) - 1).toString(2).padStart(bits, '0');
          if (fake !== correct) distractors.add(fake);
        }

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'int',
          title: 'Mã Hóa Số Thập Phân',
          prompt: `Số nguyên <strong>${val}</strong> được biểu diễn ở dạng ${bits}-bit trong hệ <strong>${formatNames[fmt]}</strong> như thế nào?`,
          bits,
          val,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `Số ${val} trong ${formatNames[fmt]} (${bits}-bit) có mã nhị phân chuẩn xác là <code>${correct}</code>.`
        };
      }

      if (qType === 'compare_trap') {
        // Câu hỏi bẫy cực trị hoặc bẫy 2 số không
        const trapType = this._pick(['dual_zero', 'min_asym', 'range']);
        if (trapType === 'dual_zero') {
          const isSM = Math.random() < 0.5;
          const chosenFmt = isSM ? 'sm' : '1c';
          const zeroBits = isSM ? ('1' + '0'.repeat(bits - 1)) : '1'.repeat(bits);
          const correct = '-0 (Số không âm)';
          const options = this._shuffle([
            correct,
            isSM ? `${-(1 << (bits - 1))}` : '-1',
            `+${(1 << (bits - 1)) - 1}`,
            'Không hợp lệ (Lỗi tràn)'
          ]);
          return {
            category: 'int',
            title: 'Bẫy Hai Số Không (+0 / -0)',
            prompt: `Trong hệ <strong>${formatNames[chosenFmt]}</strong> ${bits}-bit, chuỗi nhị phân <code>${zeroBits}</code> mang ý nghĩa gì?`,
            bits,
            options,
            correctIndex: options.indexOf(correct),
            explanation: `Hệ ${formatNames[chosenFmt]} tồn tại 2 trạng thái số 0: +0 (${'0'.repeat(bits)}) và -0 (<code>${zeroBits}</code>). Đây là điểm hạn chế lớn khiến phần cứng máy tính chuyển sang dùng Bù 2.`
          };
        } else {
          // Cực trị âm bất đối xứng trong bù 2
          const minVal = -(1 << (bits - 1));
          const minBin = '1' + '0'.repeat(bits - 1);
          const correct = `${minVal}`;
          const options = this._shuffle([
            correct,
            `-${(1 << (bits - 1)) - 1}`,
            `-0`,
            `+${(1 << (bits - 1))}`
          ]);
          return {
            category: 'int',
            title: 'Cực Trị Âm Bất Đối Xứng (Bù 2)',
            prompt: `Trong hệ <strong>Bù 2 (2's Complement)</strong> ${bits}-bit, chuỗi bit <code>${minBin}</code> biểu diễn giá trị nào?`,
            bits,
            options,
            correctIndex: options.indexOf(correct),
            explanation: `Trong Bù 2, chuỗi <code>${minBin}</code> biểu diễn cực trị âm nhỏ nhất là <strong>${minVal}</strong>. Lưu ý không có số dương đối xứng (+${Math.abs(minVal)}) trong cùng số bit này!`
          };
        }
      }

      // 'who_is_who': Cho chuỗi bit, hỏi đây là biểu diễn của số X trong hệ nào?
      const targetVal = -3;
      const binSM = Int.toSignMag(targetVal, bits);
      const bin1C = Int.toOnesComp(targetVal, bits);
      const bin2C = Int.toTwosComp(targetVal, bits);
      const binEx = Int.toExcessK(targetVal, bits, bias);

      const chosen = this._pick([
        { bin: binSM, fmtName: 'Dấu Lượng (Sign-Magnitude)' },
        { bin: bin1C, fmtName: 'Bù 1 (1\'s Complement)' },
        { bin: bin2C, fmtName: 'Bù 2 (2\'s Complement)' },
        { bin: binEx, fmtName: `Excess-${bias}` }
      ]);

      const correct = chosen.fmtName;
      const allNames = ['Dấu Lượng (Sign-Magnitude)', 'Bù 1 (1\'s Complement)', 'Bù 2 (2\'s Complement)', `Excess-${bias}`];
      const options = this._shuffle(allNames);

      return {
        category: 'int',
        title: 'Nhận Diện Hệ Biểu Diễn',
        prompt: `Chuỗi <code>${chosen.bin}</code> (${bits}-bit) biểu diễn số nguyên <strong>${targetVal}</strong> trong hệ nào?`,
        bits,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `Số ${targetVal} (${bits}-bit) được viết dưới dạng <code>${chosen.bin}</code> chính là định dạng của hệ <strong>${correct}</strong>.`
      };
    },

    /**
     * Sinh câu hỏi cho Game 8: VÕ ĐÀI ALU (ALU COMBAT)
     * Level 0: Phép dịch SAR, SHR, SAL 4-bit
     * Level 1: Cộng/Trừ Bù 2, phát hiện cờ Overflow (V=1) 4-bit / 8-bit
     * Level 2: End-Around Carry trong Bù 1, xoay ROL/ROR, kiểm tra cờ hỗn hợp 8-bit / 16-bit
     */
    genALUQuestion(level) {
      level = level || 0;
      const bits = level === 0 ? 4 : 8;
      const opcodes = level === 0 
        ? ['SAR', 'SHR', 'SAL', 'ADD_2C'] 
        : level === 1 
          ? ['SAR', 'ADD_2C', 'OVERFLOW_CHECK', 'SUB_2C'] 
          : ['END_AROUND_1C', 'OVERFLOW_CHECK', 'SAR', 'ROL', 'ROR'];
      
      const opcode = this._pick(opcodes);

      if (opcode === 'SAR' || opcode === 'SHR' || opcode === 'SAL') {
        const amount = 1;
        // Chọn một số âm trong bù 2 để kiểm tra phản xạ SAR vs SHR
        const decVal = this._rnd(-(1 << (bits - 1)), -1);
        const binA = Int.toTwosComp(decVal, bits);
        let resObj;
        let opDesc = '';
        if (opcode === 'SAR') {
          resObj = ALU.shiftArithmeticRight(binA, amount, bits);
          opDesc = `Dịch phải số học <strong>SAR ${amount}</strong> (giữ nguyên bit dấu MSB)`;
        } else if (opcode === 'SHR') {
          resObj = ALU.shiftLogicalRight(binA, amount, bits);
          opDesc = `Dịch phải logic <strong>SHR ${amount}</strong> (chèn 0 vào MSB)`;
        } else {
          resObj = ALU.shiftLeft(binA, amount, bits);
          opDesc = `Dịch trái <strong>SAL ${amount}</strong> (chèn 0 vào LSB)`;
        }

        const correct = resObj.result;
        const distractors = new Set();
        distractors.add(ALU.shiftArithmeticRight(binA, amount, bits).result);
        distractors.add(ALU.shiftLogicalRight(binA, amount, bits).result);
        distractors.add(ALU.shiftLeft(binA, amount, bits).result);
        distractors.add(ALU.rotateRight(binA, amount, bits));
        distractors.delete(correct);

        while (distractors.size < 3) {
          const rndBin = this._rnd(0, (1 << bits) - 1).toString(2).padStart(bits, '0');
          if (rndBin !== correct) distractors.add(rndBin);
        }

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'alu',
          opcode,
          title: `Lệnh Dịch Bit: ${opcode}`,
          prompt: `Thực hiện lệnh ${opDesc} trên thanh ghi ${bits}-bit chứa chuỗi <code>${binA}</code> (${decVal} trong Bù 2). Kết quả nhận được là gì?`,
          operands: [binA],
          options,
          correctIndex: options.indexOf(correct),
          explanation: opcode === 'SAR'
            ? `Lệnh SAR ${amount} bảo toàn bit dấu MSB (${binA[0]}), nên chèn ${binA[0]} vào đầu $\\rightarrow$ kết quả là <code>${correct}</code> (${Int.fromTwosComp(correct, bits)}). Lệnh này chia nguyên cho 2!`
            : opcode === 'SHR'
              ? `Lệnh SHR ${amount} luôn chèn 0 vào MSB bất kể dấu $\\rightarrow$ kết quả là <code>${correct}</code>.`
              : `Lệnh SAL ${amount} đẩy bit sang trái và chèn 0 vào LSB $\\rightarrow$ kết quả là <code>${correct}</code>.`
        };
      }

      if (opcode === 'ADD_2C' || opcode === 'SUB_2C') {
        const decA = this._rnd(-(1 << (bits - 2)), (1 << (bits - 2)) - 1);
        const decB = this._rnd(-(1 << (bits - 2)), (1 << (bits - 2)) - 1);
        const binA = Int.toTwosComp(decA, bits);
        const binB = Int.toTwosComp(decB, bits);
        const isSub = opcode === 'SUB_2C';
        const res = isSub ? ALU.subTwosComp(binA, binB, bits) : ALU.addTwosComp(binA, binB, bits);
        const correct = res.result;

        const distractors = new Set();
        distractors.add(isSub ? ALU.addTwosComp(binA, binB, bits).result : ALU.subTwosComp(binA, binB, bits).result);
        distractors.add(Int.toTwosComp(decA + decB + 1, bits));
        distractors.add(Int.toTwosComp(decA - decB - 1, bits));
        distractors.delete(correct);

        while (distractors.size < 3) {
          const rndBin = this._rnd(0, (1 << bits) - 1).toString(2).padStart(bits, '0');
          if (rndBin !== correct) distractors.add(rndBin);
        }

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'alu',
          opcode,
          title: `Phép Tính Bù 2: ${isSub ? 'A - B' : 'A + B'}`,
          prompt: `Thực hiện ${isSub ? 'trừ' : 'cộng'} hai số Bù 2 ${bits}-bit: <code>${binA}</code> (${decA}) ${isSub ? '-' : '+'} <code>${binB}</code> (${decB}). Kết quả nhị phân lưu trong thanh ghi là gì?`,
          operands: [binA, binB],
          options,
          correctIndex: options.indexOf(correct),
          explanation: res.explanation
        };
      }

      if (opcode === 'OVERFLOW_CHECK') {
        // Sinh trường hợp tràn (Overflow) hoặc không tràn
        const shouldOverflow = Math.random() < 0.5;
        let decA, decB;
        const maxVal = (1 << (bits - 1)) - 1;
        const minVal = -(1 << (bits - 1));

        if (shouldOverflow) {
          if (Math.random() < 0.5) {
            // Tràn dương: 2 số dương tổng > maxVal
            decA = this._rnd(Math.floor(maxVal / 2) + 1, maxVal);
            decB = this._rnd(Math.floor(maxVal / 2) + 1, maxVal);
          } else {
            // Tràn âm: 2 số âm tổng < minVal
            decA = this._rnd(minVal, Math.floor(minVal / 2) - 1);
            decB = this._rnd(minVal, Math.floor(minVal / 2) - 1);
          }
        } else {
          // Không tràn: 1 âm 1 dương hoặc 2 số nhỏ
          decA = this._rnd(-(1 << (bits - 2)), (1 << (bits - 2)) - 1);
          decB = this._rnd(-(1 << (bits - 2)), (1 << (bits - 2)) - 1);
        }

        const binA = Int.toTwosComp(decA, bits);
        const binB = Int.toTwosComp(decB, bits);
        const res = ALU.addTwosComp(binA, binB, bits);

        const correct = res.overflow ? 'Có tràn (Overflow V = 1)' : 'Không tràn (V = 0)';
        const other = res.overflow ? 'Không tràn (V = 0)' : 'Có tràn (Overflow V = 1)';
        const options = this._shuffle([
          correct,
          other,
          'Tràn chỉ khi cờ Carry C = 1',
          'Không xác định được nếu không đổi sang thập phân'
        ]);

        return {
          category: 'alu',
          opcode,
          title: 'Kiểm Tra Cờ Tràn (Overflow Flag)',
          prompt: `Khi ALU cộng hai số Bù 2 ${bits}-bit: <code>${binA}</code> (${decA}) + <code>${binB}</code> (${decB}), cờ tràn Overflow (V) có được bật không?`,
          operands: [binA, binB],
          options,
          correctIndex: options.indexOf(correct),
          explanation: res.explanation
        };
      }

      if (opcode === 'END_AROUND_1C') {
        // Phép cộng Bù 1 có Carry-out dồn về LSB
        const decA = 5;
        const decB = -2;
        const binA = Int.toOnesComp(decA, bits);
        const binB = Int.toOnesComp(decB, bits);
        const res = ALU.addOnesComp(binA, binB, bits);

        const correct = res.finalResult;
        const distractors = new Set();
        distractors.add(res.rawSum); // Bẫy quên dồn carry
        distractors.add(Int.toTwosComp(decA + decB, bits));
        distractors.add(Int.toOnesComp(decA - decB, bits));
        distractors.delete(correct);

        while (distractors.size < 3) {
          const rndBin = this._rnd(0, (1 << bits) - 1).toString(2).padStart(bits, '0');
          if (rndBin !== correct) distractors.add(rndBin);
        }

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'alu',
          opcode,
          title: 'Quy Tắc End-Around Carry (Bù 1)',
          prompt: `Thực hiện phép cộng Bù 1 ${bits}-bit: <code>${binA}</code> (+${decA}) + <code>${binB}</code> (${decB}). Nhớ áp dụng quy tắc bit nhớ quay vòng End-Around Carry!`,
          operands: [binA, binB],
          options,
          correctIndex: options.indexOf(correct),
          explanation: res.explanation
        };
      }

      // Fallback ROL / ROR
      const decA = 9;
      const binA = decA.toString(2).padStart(bits, '0');
      const isRol = opcode === 'ROL';
      const correct = isRol ? ALU.rotateLeft(binA, 1, bits) : ALU.rotateRight(binA, 1, bits);
      const distractors = new Set();
      distractors.add(isRol ? ALU.rotateRight(binA, 1, bits) : ALU.rotateLeft(binA, 1, bits));
      distractors.add(ALU.shiftLeft(binA, 1, bits).result);
      distractors.add(ALU.shiftLogicalRight(binA, 1, bits).result);
      distractors.add(ALU.shiftArithmeticRight(binA, 1, bits).result);
      distractors.delete(correct);

      while (distractors.size < 3) {
        const rndBin = this._rnd(0, (1 << bits) - 1).toString(2).padStart(bits, '0');
        if (rndBin !== correct) distractors.add(rndBin);
      }

      const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);

      return {
        category: 'alu',
        opcode,
        title: `Phép Xoay Bit: ${opcode}`,
        prompt: `Thực hiện lệnh ${opcode} 1 bit trên chuỗi nhị phân <code>${binA}</code> (${bits}-bit). Chuỗi kết quả là gì?`,
        operands: [binA],
        options,
        correctIndex: options.indexOf(correct),
        explanation: `Lệnh ${opcode} quay vòng bit bị đẩy ra ở một đầu về lại đầu đối diện mà không làm mất bit.`
      };
    },

    /**
     * Sinh câu hỏi cho Game 9: PHI HÀNH GIA CHẤM ĐỘNG (FLOATING-POINT STUDIO)
     * Level 0: 8-bit Mini-float Normalized (các giá trị quen thuộc 1.0, 1.5, 2.0, 3.5, 0.5, ...)
     * Level 1: 8-bit Mini-float Denormalized (E=0), Zeros (+0/-0), Infinities (+/- inf), NaN
     * Level 2: FP16 (16-bit) & FP32 (32-bit IEEE 754) chuẩn công nghiệp
     */
    genFloatQuestion(level) {
      level = level || 0;
      const spec = level === 2 ? Float.SPEC_FP16 : Float.SPEC_MINIFLOAT_8;

      if (level === 0) {
        // Normalized cơ bản trên 8-bit Minifloat
        // Chọn một số giá trị đẹp:
        const pool = [
          { bin: '00111000', val: 1.0 },
          { bin: '00111100', val: 1.5 },
          { bin: '01000000', val: 2.0 },
          { bin: '01000100', val: 3.0 },
          { bin: '01000110', val: 3.5 },
          { bin: '00110000', val: 0.5 },
          { bin: '00110100', val: 0.75 },
          { bin: '10111000', val: -1.0 },
          { bin: '10111100', val: -1.5 },
          { bin: '11000110', val: -3.5 }
        ];
        const target = this._pick(pool);
        const dec = Float.decodeFloat(target.bin, spec);
        const correct = `${target.val}`;

        const distractors = new Set();
        distractors.add(`${-target.val}`);
        distractors.add(`${target.val * 2}`);
        distractors.add(`${target.val / 2}`);
        distractors.add(`${target.val + 1}`);
        distractors.delete(correct);

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'float',
          spec,
          title: 'Giải Mã Mini-float (Normalized)',
          prompt: `Chuỗi Mini-float 8-bit (1 Dấu, 4 Số Mũ bias 7, 3 Định Trị): <span class="fp-bit-strip"><span class="fp-s">${target.bin[0]}</span> <span class="fp-e">${target.bin.slice(1, 5)}</span> <span class="fp-m">${target.bin.slice(5)}</span></span> biểu diễn giá trị số thực nào?`,
          binStr: target.bin,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `Bước giải: ${dec.formulaText}`
        };
      }

      if (level === 1) {
        // Denormalized và các trường hợp đặc biệt (+0, -0, +inf, -inf, NaN)
        const pool = [
          { bin: '00000000', label: '+0 (Dương không)', type: 'zero' },
          { bin: '10000000', label: '-0 (Âm không)', type: 'zero' },
          { bin: '01111000', label: '+Vô cực (+Infinity)', type: 'infinity' },
          { bin: '11111000', label: '-Vô cực (-Infinity)', type: 'infinity' },
          { bin: '01111001', label: 'NaN (Không phải số)', type: 'nan' },
          { bin: '00000001', label: 'Số dưới chuẩn (Denormalized: 1/512)', type: 'denormalized' },
          { bin: '00000010', label: 'Số dưới chuẩn (Denormalized: 1/256)', type: 'denormalized' }
        ];
        const target = this._pick(pool);
        const dec = Float.decodeFloat(target.bin, spec);
        const correct = target.label;

        const allLabels = pool.map(p => p.label);
        const distractors = new Set(allLabels);
        distractors.delete(correct);

        const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
        return {
          category: 'float',
          spec,
          title: 'Trạng Thái Đặc Biệt & Dưới Chuẩn',
          prompt: `Chuỗi Mini-float: <span class="fp-bit-strip"><span class="fp-s">${target.bin[0]}</span> <span class="fp-e">${target.bin.slice(1, 5)}</span> <span class="fp-m">${target.bin.slice(5)}</span></span> mang ý nghĩa gì theo chuẩn IEEE 754?`,
          binStr: target.bin,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `Số mũ E = <code>${dec.expStr}</code> (${dec.expRaw}) và Mantissa M = <code>${dec.mantStr}</code>. Trạng thái: <strong>${dec.type.toUpperCase()}</strong>. ${dec.formulaText}`
        };
      }

      // Level 2: FP16 (16-bit Half Precision: 1 sign, 5 exp bias 15, 10 mantissa)
      const fp16Pool = [
        { bin: '0011110000000000', val: '1.0' },
        { bin: '0100000000000000', val: '2.0' },
        { bin: '0011100000000000', val: '0.5' },
        { bin: '1011110000000000', val: '-1.0' },
        { bin: '0111110000000000', val: '+Infinity' },
        { bin: '1111110000000000', val: '-Infinity' },
        { bin: '0111110000000001', val: 'NaN' }
      ];
      const target = this._pick(fp16Pool);
      const dec = Float.decodeFloat(target.bin, spec);
      const correct = target.val;

      const distractors = new Set(['1.0', '2.0', '0.5', '-1.0', '+Infinity', '-Infinity', 'NaN']);
      distractors.delete(correct);

      const options = this._shuffle([correct, ...Array.from(distractors).slice(0, 3)]);
      return {
        category: 'float',
        spec,
        title: 'IEEE 754 Bán Chính Xác (FP16 16-bit)',
        prompt: `Trong chuẩn FP16 16-bit (1 Dấu, 5 Mũ bias 15, 10 Mantissa), chuỗi bit <span class="fp-bit-strip"><span class="fp-s">${target.bin[0]}</span> <span class="fp-e">${target.bin.slice(1, 6)}</span> <span class="fp-m">${target.bin.slice(6)}</span></span> có giá trị là gì?`,
        binStr: target.bin,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `Phân tách FP16: Dấu=${dec.sign}, Số mũ=${dec.expRaw} (Thực tế: ${dec.expRaw} - 15 = ${dec.expVal}). Kết quả: <strong>${correct}</strong>.`
      };
    }
  };

  return {
    Int,
    ALU,
    Float,
    Gen
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NumEngine;
}
