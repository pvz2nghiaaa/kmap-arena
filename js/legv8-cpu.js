'use strict';
/**
 * ============================================================================
 * LEGv8 Virtual CPU, Assembler, ABI Auditor & Simulation Engine (64-bit)
 * Designed for "LEGv8 Code Master" (Patterson & Hennessy ARMv8 Subset)
 * ============================================================================
 * 
 * Hardware Constraints & Register Rules:
 * - 64-bit registers:
 *   X0-X7   : Parameters / Results (Caller-saved, return value in X0)
 *   X9-X15  : Temporaries (Caller-saved)
 *   X16-X17 : IP0, IP1 (Scratch)
 *   X18     : Platform Register
 *   X19-X27 : Saved Registers (Callee-saved, MUST be preserved on Stack if modified)
 *   SP      : Stack Pointer (Callee-saved, only 'SP', grows downwards, 16-byte aligned)
 *   LR      : Link Register (alias X30, Caller-saved, saved to Stack in non-leaf functions)
 *   XZR     : Zero Register (always 0, writes ignored, only 'XZR')
 * - STRICTLY FORBIDDEN REGISTERS: X8, X28, X29, X31
 * 
 * 3-Stage Validation Engine:
 * 1. Syntax Linting & Register Whitelist Check
 * 2. ABI & Safety Audit (Callee-saved preserve, non-leaf LR save, SP balance)
 * 3. Virtual CPU Execution (up to 50,000 steps, compare X0 and memory)
 */

const LEGv8 = (() => {
  // Constants for 64-bit limits
  const MASK_64 = 0xFFFFFFFFFFFFFFFFn;
  const SIGN_BIT_64 = 0x8000000000000000n;
  const STACK_BASE = 0x7FFFFFFF0000n; // 64-bit initial stack base

  // Whitelisted registers & their metadata
  const VALID_REGISTERS = new Set([
    'X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
    'X9', 'X10', 'X11', 'X12', 'X13', 'X14', 'X15',
    'X16', 'X17', 'X18',
    'X19', 'X20', 'X21', 'X22', 'X23', 'X24', 'X25', 'X26', 'X27',
    'SP', 'X30', 'LR', 'XZR'
  ]);

  // Forbidden registers according to hardware specification
  const FORBIDDEN_REGISTERS = new Set(['X8', 'X28', 'X29', 'X31']);

  // Callee-saved registers that require preservation if modified
  const CALLEE_SAVED_REGS = new Set([
    'X19', 'X20', 'X21', 'X22', 'X23', 'X24', 'X25', 'X26', 'X27'
  ]);

  // Normalize register name (e.g. x0 -> X0, lr -> LR)
  function normReg(reg) {
    if (!reg) return '';
    const r = reg.trim().toUpperCase();
    if (r === 'X30') return 'LR';
    return r;
  }

  // Convert BigInt to signed 64-bit
  function toSigned64(val) {
    const v = BigInt.asIntN(64, BigInt(val));
    return v;
  }

  // Convert BigInt to unsigned 64-bit
  function toUnsigned64(val) {
    const v = BigInt.asUintN(64, BigInt(val));
    return v;
  }

  /**
   * =========================================================================
   * GIAI ĐOẠN 1: PARSER & SYNTAX LINTING
   * =========================================================================
   */
  class ParseError extends Error {
    constructor(lineNo, message) {
      super(`Dòng ${lineNo}: ${message}`);
      this.lineNo = lineNo;
      this.rawMessage = message;
    }
  }

  function parseCode(sourceCode) {
    const lines = sourceCode.split('\n');
    const instructions = [];
    const labels = new Map();
    const errors = [];

    // Danh sách opcode hợp lệ của LEGv8
    const VALID_OPCODES = new Set([
      'ADD', 'SUB', 'ADDI', 'SUBI', 'MUL',
      'ADDS', 'SUBS', 'ADDIS', 'SUBIS',
      'AND', 'ORR', 'EOR', 'ANDI', 'ORRI', 'EORI',
      'LSL', 'LSR',
      'LDUR', 'STUR',
      'B', 'B.EQ', 'B.NE', 'B.LT', 'B.LE', 'B.GT', 'B.GE',
      'B.HI', 'B.HS', 'B.LO', 'B.LS',
      'CBZ', 'CBNZ',
      'BL', 'BR'
    ]);

    // Pass 1: Tách nhãn, kiểm tra cú pháp từng dòng
    for (let i = 0; i < lines.length; i++) {
      const lineNo = i + 1;
      let rawLine = lines[i];

      // Loại bỏ comment // hoặc ;
      const commentIdx = rawLine.search(/(\/\/|;)/);
      if (commentIdx !== -1) {
        rawLine = rawLine.substring(0, commentIdx);
      }
      const line = rawLine.trim();
      if (!line) continue;

      // Kiểm tra nhãn đầu dòng (e.g. "Loop:" hoặc "Loop: ADD X0, X1, X2")
      let currentLine = line;
      const labelMatch = currentLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:(.*)$/);
      if (labelMatch) {
        const labelName = labelMatch[1];
        if (labels.has(labelName)) {
          errors.push(new ParseError(lineNo, `Nhãn '${labelName}' bị khai báo trùng lặp!`));
        } else {
          labels.set(labelName, instructions.length);
        }
        currentLine = labelMatch[2].trim();
        if (!currentLine) continue; // Dòng chỉ có nhãn
      }

      // Tách opcode và toán hạng
      const tokens = currentLine.split(/\s+/);
      const opcode = tokens[0].toUpperCase();

      if (!VALID_OPCODES.has(opcode)) {
        errors.push(new ParseError(lineNo, `Lệnh '${tokens[0]}' không được hỗ trợ trong tập lệnh LEGv8!`));
        continue;
      }

      const operandStr = currentLine.substring(tokens[0].length).trim();
      
      // Parse operands dựa theo loại lệnh
      try {
        const parsedInstr = parseOperands(opcode, operandStr, lineNo, rawLine.trim());
        parsedInstr.lineNo = lineNo;
        parsedInstr.source = lines[i];
        instructions.push(parsedInstr);
      } catch (err) {
        errors.push(err);
      }
    }

    // Pass 2: Kiểm tra các nhãn đích nhảy có tồn tại không
    for (const instr of instructions) {
      if (['B', 'BL', 'CBZ', 'CBNZ'].includes(instr.opcode) || instr.opcode.startsWith('B.')) {
        const targetLabel = instr.targetLabel;
        if (targetLabel && !labels.has(targetLabel)) {
          errors.push(new ParseError(instr.lineNo, `Nhãn đích '${targetLabel}' không tồn tại trong chương trình!`));
        }
      }
    }

    return { instructions, labels, errors };
  }

  // Parse toán hạng và kiểm tra định dạng
  function parseOperands(opcode, operandStr, lineNo, originalText) {
    // Kiểm tra các thanh ghi bị cấm trong toàn bộ chuỗi toán hạng
    for (const fReg of FORBIDDEN_REGISTERS) {
      const regex = new RegExp(`\\b${fReg}\\b`, 'i');
      if (regex.test(operandStr)) {
        throw new ParseError(lineNo, `Nghiêm cấm sử dụng thanh ghi '${fReg}' theo quy ước phần cứng LEGv8! (Dùng SP thay cho X28, XZR thay cho X31)`);
      }
    }

    // Helper kiểm tra thanh ghi
    const checkReg = (r) => {
      const reg = normReg(r);
      if (!VALID_REGISTERS.has(reg)) {
        throw new ParseError(lineNo, `Tên thanh ghi '${r}' không hợp lệ hoặc nằm ngoài danh sách cho phép!`);
      }
      return reg;
    };

    // Helper kiểm tra hằng số immediate (#imm)
    const parseImm = (immStr) => {
      const s = immStr.trim();
      if (!s.startsWith('#')) {
        throw new ParseError(lineNo, `Hằng số tức thời phải bắt đầu bằng ký tự '#' (ví dụ: #${s.replace(/#/g, '')})`);
      }
      const numStr = s.substring(1).trim();
      let val;
      if (numStr.startsWith('0x') || numStr.startsWith('0X')) {
        val = BigInt(numStr);
      } else {
        val = BigInt(numStr);
      }
      return toSigned64(val);
    };

    const instr = { opcode, originalText };

    // 1. Nhóm lệnh nhảy không điều kiện & gọi hàm: B Label, BL Label, BR Rn
    if (opcode === 'B' || opcode === 'BL' || opcode.startsWith('B.')) {
      if (!operandStr) throw new ParseError(lineNo, `Lệnh '${opcode}' thiếu nhãn đích!`);
      instr.targetLabel = operandStr.trim();
      return instr;
    }

    if (opcode === 'BR') {
      if (!operandStr) throw new ParseError(lineNo, `Lệnh 'BR' thiếu thanh ghi địa chỉ nhảy (thường là LR)!`);
      instr.rn = checkReg(operandStr);
      return instr;
    }

    // 2. Nhóm nhảy có điều kiện trên thanh ghi: CBZ Rt, Label | CBNZ Rt, Label
    if (opcode === 'CBZ' || opcode === 'CBNZ') {
      const parts = operandStr.split(',').map((p) => p.trim());
      if (parts.length !== 2) throw new ParseError(lineNo, `Lệnh '${opcode}' yêu cầu 2 toán hạng: ${opcode} Rt, Label`);
      instr.rt = checkReg(parts[0]);
      instr.targetLabel = parts[1];
      return instr;
    }

    // 3. Nhóm bộ nhớ: LDUR Rt, [Rn, #offset] | STUR Rt, [Rn, #offset]
    if (opcode === 'LDUR' || opcode === 'STUR') {
      const commaIdx = operandStr.indexOf(',');
      if (commaIdx === -1) throw new ParseError(lineNo, `Lệnh '${opcode}' thiếu dấu phẩy phân cách: ${opcode} Rt, [Rn, #offset]`);
      instr.rt = checkReg(operandStr.substring(0, commaIdx).trim());

      const memPart = operandStr.substring(commaIdx + 1).trim();
      const memMatch = memPart.match(/^\[\s*([a-zA-Z0-9]+)\s*(?:,\s*(#[+-]?[0-9a-fA-FxX]+))?\s*\]$/);
      if (!memMatch) {
        throw new ParseError(lineNo, `Cú pháp bộ nhớ không hợp lệ: '${memPart}'. Định dạng chuẩn là [Rn, #offset] (ví dụ: [SP, #8])`);
      }
      instr.rn = checkReg(memMatch[1]);
      instr.offset = memMatch[2] ? parseImm(memMatch[2]) : 0n;
      return instr;
    }

    // 4. Nhóm dịch bit: LSL Rd, Rn, #shift | LSR Rd, Rn, #shift
    if (opcode === 'LSL' || opcode === 'LSR') {
      const parts = operandStr.split(',').map((p) => p.trim());
      if (parts.length !== 3) throw new ParseError(lineNo, `Lệnh '${opcode}' yêu cầu 3 toán hạng: ${opcode} Rd, Rn, #shift`);
      instr.rd = checkReg(parts[0]);
      instr.rn = checkReg(parts[1]);
      instr.shift = Number(parseImm(parts[2]));
      if (instr.shift < 0 || instr.shift > 63) {
        throw new ParseError(lineNo, `Độ dịch bit phải nằm trong khoảng từ 0 đến 63!`);
      }
      return instr;
    }

    // 5. Nhóm số học / logic tức thời (Immediate): ADDI, SUBI, ADDIS, SUBIS, ANDI, ORRI, EORI
    if (['ADDI', 'SUBI', 'ADDIS', 'SUBIS', 'ANDI', 'ORRI', 'EORI'].includes(opcode)) {
      const parts = operandStr.split(',').map((p) => p.trim());
      if (parts.length !== 3) throw new ParseError(lineNo, `Lệnh '${opcode}' yêu cầu 3 toán hạng: ${opcode} Rd, Rn, #imm`);
      instr.rd = checkReg(parts[0]);
      instr.rn = checkReg(parts[1]);
      instr.imm = parseImm(parts[2]);
      return instr;
    }

    // 6. Nhóm số học / logic thanh ghi 3 toán hạng: ADD, SUB, ADDS, SUBS, MUL, AND, ORR, EOR
    if (['ADD', 'SUB', 'ADDS', 'SUBS', 'MUL', 'AND', 'ORR', 'EOR'].includes(opcode)) {
      const parts = operandStr.split(',').map((p) => p.trim());
      if (parts.length !== 3) throw new ParseError(lineNo, `Lệnh '${opcode}' yêu cầu 3 toán hạng: ${opcode} Rd, Rn, Rm`);
      instr.rd = checkReg(parts[0]);
      instr.rn = checkReg(parts[1]);
      instr.rm = checkReg(parts[2]);
      return instr;
    }

    throw new ParseError(lineNo, `Không thể phân tích cú pháp lệnh '${opcode}'!`);
  }

  /**
   * =========================================================================
   * GIAI ĐOẠN 2: ABI & SAFETY AUDIT ENGINE
   * =========================================================================
   */
  function auditABI(instructions, levelMeta = {}) {
    const warnings = [];
    const errors = [];

    // 1. Kiểm tra Non-Leaf Procedure: có lệnh BL không?
    const hasBL = instructions.some((i) => i.opcode === 'BL');
    if (hasBL) {
      // Bắt buộc phải lưu LR/X30 vào Stack
      const storesLR = instructions.some(
        (i) => i.opcode === 'STUR' && (i.rt === 'LR' || i.rt === 'X30') && i.rn === 'SP'
      );
      const loadsLR = instructions.some(
        (i) => i.opcode === 'LDUR' && (i.rt === 'LR' || i.rt === 'X30') && i.rn === 'SP'
      );
      if (!storesLR) {
        errors.push({
          type: 'ABI_VIOLATION',
          message: 'Quy tắc ABI: Hàm có gọi hàm con bằng lệnh "BL" (Non-Leaf) BẮT BUỘC phải lưu thanh ghi liên kết LR (X30) vào Stack bằng lệnh STUR trước khi gọi!'
        });
      }
      if (!loadsLR) {
        errors.push({
          type: 'ABI_VIOLATION',
          message: 'Quy tắc ABI: Hàm non-leaf phải khôi phục giá trị ban đầu của thanh ghi LR từ Stack bằng lệnh LDUR trước khi quay về qua BR LR!'
        });
      }
    }

    // 2. Kiểm tra Callee-saved registers (X19–X27)
    const modifiedCalleeRegs = new Set();
    for (const instr of instructions) {
      const targetReg = instr.rd || (instr.opcode === 'LDUR' ? instr.rt : null);
      if (targetReg && CALLEE_SAVED_REGS.has(targetReg)) {
        modifiedCalleeRegs.add(targetReg);
      }
    }

    // Nếu bài tập là một thủ tục hàm (Tier 4, Tier 5) hoặc có yêu cầu bảo tồn
    if (levelMeta.isProcedure) {
      for (const reg of modifiedCalleeRegs) {
        // Kiểm tra xem reg có được STUR vào SP và LDUR ra từ SP không
        const savedToStack = instructions.some((i) => i.opcode === 'STUR' && i.rt === reg && i.rn === 'SP');
        const restoredFromStack = instructions.some((i) => i.opcode === 'LDUR' && i.rt === reg && i.rn === 'SP');
        if (!savedToStack || !restoredFromStack) {
          errors.push({
            type: 'ABI_VIOLATION',
            message: `Quy tắc ABI: Thanh ghi Callee-saved ${reg} bị sửa đổi giá trị nhưng không được bảo tồn trên Stack (cần STUR lưu trước và LDUR khôi phục trước khi thoát hàm)!`
          });
        }
      }
    }

    // 3. Kiểm tra tính đối xứng của SP trong mã nguồn (SUBI SP, SP, #N vs ADDI SP, SP, #N)
    let spAllocTotal = 0n;
    let spFreeTotal = 0n;
    for (const instr of instructions) {
      if (instr.opcode === 'SUBI' && instr.rd === 'SP' && instr.rn === 'SP') {
        spAllocTotal += instr.imm;
        if (instr.imm % 16n !== 0n) {
          warnings.push(`Cảnh báo căn lề Stack: Khoảng cấp phát SP (${instr.imm} bytes) nên là bội số của 16 theo chuẩn ARMv8/LEGv8.`);
        }
      } else if (instr.opcode === 'ADDI' && instr.rd === 'SP' && instr.rn === 'SP') {
        spFreeTotal += instr.imm;
      }
    }

    if (levelMeta.isProcedure && spAllocTotal !== spFreeTotal) {
      warnings.push(`Cảnh báo cân bằng SP: Tổng cấp phát ngăn xếp (${spAllocTotal} bytes) khác tổng giải phóng (${spFreeTotal} bytes). Hãy kiểm tra kỹ tất cả các nhánh thoát hàm!`);
    }

    return { errors, warnings };
  }

  /**
   * =========================================================================
   * GIAI ĐOẠN 3: VIRTUAL CPU EMULATOR & EXECUTION ENGINE
   * =========================================================================
   */
  class VirtualCPU {
    constructor() {
      this.registers = new Map();
      this.memory = new Map(); // 64-bit address -> 64-bit BigInt value
      this.flags = { N: 0, Z: 0, C: 0, V: 0 };
      this.pc = 0;
      this.cycleCount = 0;
      this.maxCycles = 50000;
      this.callStack = [];
      this.history = [];
      this.reset();
    }

    reset() {
      this.registers.clear();
      for (const reg of VALID_REGISTERS) {
        this.registers.set(reg, 0n);
      }
      this.registers.set('SP', STACK_BASE);
      this.registers.set('LR', 0xDEADBEEFn); // Địa chỉ kết thúc trả về
      this.memory.clear();
      this.flags = { N: 0, Z: 0, C: 0, V: 0 };
      this.pc = 0;
      this.cycleCount = 0;
      this.callStack = [];
      this.history = [];
    }

    // Đọc giá trị thanh ghi (XZR luôn trả về 0)
    getReg(name) {
      const r = normReg(name);
      if (r === 'XZR') return 0n;
      return this.registers.get(r) ?? 0n;
    }

    // Ghi giá trị thanh ghi (XZR bỏ qua mọi lệnh ghi)
    setReg(name, val) {
      const r = normReg(name);
      if (r === 'XZR') return;
      const signedVal = toSigned64(val);
      this.registers.set(r, signedVal);
    }

    // Đọc ô nhớ 64-bit (8 bytes aligned)
    readMem(address) {
      const addr = BigInt(address) & ~7n; // Căn lề 8 bytes
      return this.memory.get(addr) ?? 0n;
    }

    // Ghi ô nhớ 64-bit (8 bytes aligned)
    writeMem(address, val) {
      const addr = BigInt(address) & ~7n;
      this.memory.set(addr, toSigned64(val));
    }

    // Cập nhật cờ điều kiện N, Z, C, V theo kết quả phép tính 64-bit
    updateFlags(a, b, result, isSub) {
      const res64 = toSigned64(result);
      this.flags.N = res64 < 0n ? 1 : 0;
      this.flags.Z = res64 === 0n ? 1 : 0;

      const aU = toUnsigned64(a);
      const bU = toUnsigned64(b);
      const resU = toUnsigned64(result);

      if (isSub) {
        // Carry bit trong ARM/LEGv8 khi trừ là 'Not Borrow': a >= b
        this.flags.C = aU >= bU ? 1 : 0;
        // Tràn số có dấu khi trừ: (a > 0 && b < 0 && res < 0) || (a < 0 && b > 0 && res > 0)
        const signA = a < 0n;
        const signB = b < 0n;
        const signRes = res64 < 0n;
        this.flags.V = (signA !== signB && signA !== signRes) ? 1 : 0;
      } else {
        // Carry bit khi cộng
        this.flags.C = resU < aU ? 1 : 0;
        // Tràn số có dấu khi cộng: a và b cùng dấu nhưng kết quả khác dấu
        const signA = a < 0n;
        const signB = b < 0n;
        const signRes = res64 < 0n;
        this.flags.V = (signA === signB && signA !== signRes) ? 1 : 0;
      }
    }

    // Kiểm tra điều kiện nhảy B.cond
    checkCondition(cond) {
      const { N, Z, C, V } = this.flags;
      switch (cond) {
        case 'EQ': return Z === 1;
        case 'NE': return Z === 0;
        case 'LT': return N !== V;
        case 'LE': return Z === 1 || N !== V;
        case 'GT': return Z === 0 && N === V;
        case 'GE': return N === V;
        case 'HI': return C === 1 && Z === 0;
        case 'HS': return C === 1;
        case 'LO': return C === 0;
        case 'LS': return C === 0 || Z === 1;
        default: return false;
      }
    }

    // Thực thi 1 bước lệnh đơn
    step(instructions, labels) {
      if (this.pc < 0 || this.pc >= instructions.length) {
        return { halted: true, reason: 'Chương trình đã kết thúc (PC ra ngoài phạm vi)' };
      }

      const instr = instructions[this.pc];
      const prevPC = this.pc;
      let nextPC = this.pc + 1;
      let modifiedReg = null;
      let memWrite = null;

      switch (instr.opcode) {
        case 'ADD': {
          const res = this.getReg(instr.rn) + this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'ADDI': {
          const res = this.getReg(instr.rn) + instr.imm;
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'ADDS': {
          const a = this.getReg(instr.rn), b = this.getReg(instr.rm);
          const res = a + b;
          this.setReg(instr.rd, res);
          this.updateFlags(a, b, res, false);
          modifiedReg = instr.rd;
          break;
        }
        case 'ADDIS': {
          const a = this.getReg(instr.rn), b = instr.imm;
          const res = a + b;
          this.setReg(instr.rd, res);
          this.updateFlags(a, b, res, false);
          modifiedReg = instr.rd;
          break;
        }
        case 'SUB': {
          const res = this.getReg(instr.rn) - this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'SUBI': {
          const res = this.getReg(instr.rn) - instr.imm;
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'SUBS': {
          const a = this.getReg(instr.rn), b = this.getReg(instr.rm);
          const res = a - b;
          this.setReg(instr.rd, res);
          this.updateFlags(a, b, res, true);
          modifiedReg = instr.rd;
          break;
        }
        case 'SUBIS': {
          const a = this.getReg(instr.rn), b = instr.imm;
          const res = a - b;
          this.setReg(instr.rd, res);
          this.updateFlags(a, b, res, true);
          modifiedReg = instr.rd;
          break;
        }
        case 'MUL': {
          const res = this.getReg(instr.rn) * this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'AND': {
          const res = this.getReg(instr.rn) & this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'ANDI': {
          const res = this.getReg(instr.rn) & instr.imm;
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'ORR': {
          const res = this.getReg(instr.rn) | this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'ORRI': {
          const res = this.getReg(instr.rn) | instr.imm;
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'EOR': {
          const res = this.getReg(instr.rn) ^ this.getReg(instr.rm);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'EORI': {
          const res = this.getReg(instr.rn) ^ instr.imm;
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'LSL': {
          const base = toUnsigned64(this.getReg(instr.rn));
          const res = toSigned64((base << BigInt(instr.shift)) & MASK_64);
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'LSR': {
          const base = toUnsigned64(this.getReg(instr.rn));
          const res = toSigned64(base >> BigInt(instr.shift));
          this.setReg(instr.rd, res);
          modifiedReg = instr.rd;
          break;
        }
        case 'LDUR': {
          const addr = this.getReg(instr.rn) + instr.offset;
          const val = this.readMem(addr);
          this.setReg(instr.rt, val);
          modifiedReg = instr.rt;
          break;
        }
        case 'STUR': {
          const addr = this.getReg(instr.rn) + instr.offset;
          const val = this.getReg(instr.rt);
          this.writeMem(addr, val);
          memWrite = { addr, val, rt: instr.rt };
          break;
        }
        case 'B': {
          nextPC = labels.get(instr.targetLabel);
          break;
        }
        case 'BL': {
          // Lưu địa chỉ quay về (PC + 1 của mảng instructions)
          this.setReg('LR', BigInt(this.pc + 1));
          this.callStack.push(this.pc + 1);
          nextPC = labels.get(instr.targetLabel);
          modifiedReg = 'LR';
          break;
        }
        case 'BR': {
          const target = this.getReg(instr.rn);
          if (target === 0xDEADBEEFn) {
            // Hàm gốc đã quay về điểm dừng an toàn
            this.pc = instructions.length;
            this.cycleCount++;
            return { halted: true, reason: 'Hàm đã hoàn tất và quay về thành công qua BR LR' };
          }
          nextPC = Number(target);
          if (this.callStack.length > 0) {
            this.callStack.pop();
          }
          break;
        }
        case 'CBZ': {
          if (this.getReg(instr.rt) === 0n) {
            nextPC = labels.get(instr.targetLabel);
          }
          break;
        }
        case 'CBNZ': {
          if (this.getReg(instr.rt) !== 0n) {
            nextPC = labels.get(instr.targetLabel);
          }
          break;
        }
        default: {
          if (instr.opcode.startsWith('B.')) {
            const cond = instr.opcode.substring(2);
            if (this.checkCondition(cond)) {
              nextPC = labels.get(instr.targetLabel);
            }
          } else {
            throw new Error(`Lệnh chưa được hỗ trợ: ${instr.opcode}`);
          }
        }
      }

      this.pc = nextPC;
      this.cycleCount++;

      return {
        halted: this.pc >= instructions.length,
        prevPC,
        nextPC: this.pc,
        instr,
        modifiedReg,
        memWrite
      };
    }

    // Chạy hoàn chỉnh toàn bộ chương trình cho một Test Case
    runProgram(parsed, testCase, levelMeta = {}) {
      this.reset();
      const { instructions, labels } = parsed;

      // Nạp tham số đầu vào vào X0–X7
      if (Array.isArray(testCase.params)) {
        testCase.params.forEach((paramVal, idx) => {
          this.setReg(`X${idx}`, BigInt(paramVal));
        });
      }

      // Nạp các biến phụ hoặc trạng thái bổ sung (nếu testCase quy định)
      if (testCase.registers) {
        for (const [rName, rVal] of Object.entries(testCase.registers)) {
          this.setReg(rName, BigInt(rVal));
        }
      }

      // Nạp bộ nhớ mảng / RAM ảo
      if (testCase.memory) {
        for (const [addrStr, memVal] of Object.entries(testCase.memory)) {
          this.writeMem(BigInt(addrStr), BigInt(memVal));
        }
      }

      const initialSP = this.getReg('SP');
      const initialCalleeState = new Map();
      for (const r of CALLEE_SAVED_REGS) {
        initialCalleeState.set(r, this.getReg(r));
      }

      // Vòng lặp thực thi CPU (giới hạn an toàn chống lặp vô tận)
      while (this.pc < instructions.length) {
        if (this.cycleCount >= this.maxCycles) {
          return {
            success: false,
            errorType: 'TIMEOUT',
            message: `Lỗi quá giới hạn thực thi (${this.maxCycles.toLocaleString()} chu kỳ)! Có thể mã của bạn gặp vòng lặp vô tận hoặc điều kiện dừng chưa đạt.`,
            cycles: this.cycleCount
          };
        }

        const stepResult = this.step(instructions, labels);
        if (stepResult.halted) break;
      }

      // Kiểm tra cân bằng ngăn xếp SP sau khi hàm kết thúc
      const finalSP = this.getReg('SP');
      if (levelMeta.isProcedure && finalSP !== initialSP) {
        return {
          success: false,
          errorType: 'STACK_UNBALANCED',
          message: `Lỗi cân bằng Stack: Khi hàm kết thúc, con trỏ SP (0x${finalSP.toString(16)}) không trở về giá trị ban đầu (0x${initialSP.toString(16)})! Lệch ${Number(finalSP - initialSP)} bytes.`,
          cycles: this.cycleCount
        };
      }

      // Kiểm tra bảo tồn các thanh ghi Callee-saved (X19–X27)
      if (levelMeta.isProcedure) {
        for (const r of CALLEE_SAVED_REGS) {
          const initV = initialCalleeState.get(r);
          const finalV = this.getReg(r);
          if (initV !== finalV) {
            return {
              success: false,
              errorType: 'CALLEE_CORRUPTED',
              message: `Lỗi phá vỡ ABI: Thanh ghi Callee-saved ${r} bị đổi từ ${initV} sang ${finalV} mà không được khôi phục trước khi thoát hàm!`,
              cycles: this.cycleCount
            };
          }
        }
      }

      // So sánh kết quả: Ưu tiên kiểm tra bộ nhớ nếu bài tập là thao tác trên mảng (expected_memory)
      let memDiff = null;
      let passed = true;

      if (testCase.expected_memory) {
        for (const [addrStr, expM] of Object.entries(testCase.expected_memory)) {
          const actM = this.readMem(BigInt(addrStr));
          if (actM !== BigInt(expM)) {
            passed = false;
            memDiff = {
              address: addrStr,
              expected: BigInt(expM).toString(),
              actual: actM.toString()
            };
            break;
          }
        }
      } else {
        const targetReg = testCase.targetReg || 'X0';
        const actualVal = this.getReg(targetReg);
        const expectedVal = BigInt(testCase.expected);
        passed = actualVal === expectedVal;
      }

      const targetReg = testCase.targetReg || 'X0';
      const actualVal = this.getReg(targetReg);
      const expectedVal = testCase.expected !== undefined ? BigInt(testCase.expected).toString() : '';

      return {
        success: passed,
        targetReg,
        actual: actualVal.toString(),
        expected: expectedVal,
        memDiff,
        cycles: this.cycleCount,
        registersSnapshot: new Map(this.registers)
      };
    }
  }

  return {
    VALID_REGISTERS,
    FORBIDDEN_REGISTERS,
    CALLEE_SAVED_REGS,
    STACK_BASE,
    parseCode,
    auditABI,
    VirtualCPU,
    toSigned64,
    toUnsigned64
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEGv8;
}
