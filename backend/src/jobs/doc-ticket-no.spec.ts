import {
  bangkokYear,
  bangkokYearMonth,
  formatDocRunning,
  formatDocTicketNo,
  isFormalDocTicketNo,
} from './doc-ticket-no';

describe('doc-ticket-no (Meeting Phase C)', () => {
  describe('formatDocRunning', () => {
    it('pads to 4 digits', () => {
      expect(formatDocRunning(1)).toBe('0001');
      expect(formatDocRunning(42)).toBe('0042');
      expect(formatDocRunning(9999)).toBe('9999');
    });

    it('grows past 4 digits without wrap', () => {
      expect(formatDocRunning(10000)).toBe('10000');
      expect(formatDocRunning(123456)).toBe('123456');
    });

    it('rejects invalid running', () => {
      expect(() => formatDocRunning(0)).toThrow(RangeError);
      expect(() => formatDocRunning(-1)).toThrow(RangeError);
    });
  });

  describe('formatDocTicketNo', () => {
    it('in-contract uses CM-SHF-YYYY- prefix', () => {
      expect(
        formatDocTicketNo({
          isOutOfContract: false,
          running: 7,
          periodYear: '2026',
        }),
      ).toBe('CM-SHF-2026-0007');
    });

    it('rejects missing periodYear for in-contract', () => {
      expect(() =>
        formatDocTicketNo({ isOutOfContract: false, running: 1 }),
      ).toThrow(RangeError);
    });

    it('out-of-contract uses YYYYMM + running', () => {
      expect(
        formatDocTicketNo({
          isOutOfContract: true,
          running: 12,
          periodYm: '202608',
        }),
      ).toBe('2026080012');
    });

    it('rejects bad periodYm for OOC', () => {
      expect(() =>
        formatDocTicketNo({
          isOutOfContract: true,
          running: 1,
          periodYm: '2026',
        }),
      ).toThrow(RangeError);
    });
  });

  describe('bangkokYear / bangkokYearMonth', () => {
    it('returns YYYY and YYYYMM for a fixed instant', () => {
      // 2026-08-13 10:00 UTC → 17:00 Bangkok same day
      const d = new Date('2026-08-13T10:00:00.000Z');
      expect(bangkokYear(d)).toBe('2026');
      expect(bangkokYearMonth(d)).toBe('202608');
    });
  });

  describe('isFormalDocTicketNo', () => {
    it('rejects hex and empty', () => {
      expect(isFormalDocTicketNo('29c75819')).toBe(false);
      expect(isFormalDocTicketNo('12345678')).toBe(false);
      expect(isFormalDocTicketNo('')).toBe(false);
      expect(isFormalDocTicketNo(null)).toBe(false);
    });

    it('accepts running Doc No formats (incl. legacy CM-SHF-2002-)', () => {
      expect(isFormalDocTicketNo('CM-SHF-2026-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2002-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2026-10000')).toBe(true);
      expect(isFormalDocTicketNo('2026080001')).toBe(true);
    });
  });
});
