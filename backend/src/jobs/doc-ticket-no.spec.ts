import {
  bangkokYear,
  bangkokYearMonth,
  formatDocRunning,
  formatDocTicketNo,
  formatRequestTicketNo,
  isFormalDocTicketNo,
  isRequestTicketNo,
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
      expect(isFormalDocTicketNo('RQ-CM-20260001')).toBe(false);
    });

    it('accepts running Doc No formats (incl. legacy CM-SHF-2002-)', () => {
      expect(isFormalDocTicketNo('CM-SHF-2026-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2002-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2026-10000')).toBe(true);
      expect(isFormalDocTicketNo('2026080001')).toBe(true);
    });
  });

  describe('formatRequestTicketNo', () => {
    it('formats RQ-CM-YYYYXXXX with 4-digit padding', () => {
      expect(formatRequestTicketNo({ year: '2026', running: 1 })).toBe(
        'RQ-CM-20260001',
      );
      expect(formatRequestTicketNo({ year: '2026', running: 42 })).toBe(
        'RQ-CM-20260042',
      );
      expect(formatRequestTicketNo({ year: '2026', running: 9999 })).toBe(
        'RQ-CM-20269999',
      );
    });

    it('grows past 4 digits for large running numbers', () => {
      expect(formatRequestTicketNo({ year: '2026', running: 10000 })).toBe(
        'RQ-CM-202610000',
      );
    });

    it('rejects invalid year or running', () => {
      expect(() => formatRequestTicketNo({ year: '26', running: 1 })).toThrow(
        RangeError,
      );
      expect(() => formatRequestTicketNo({ year: '2026', running: 0 })).toThrow(
        RangeError,
      );
    });
  });

  describe('isRequestTicketNo', () => {
    it('identifies RQ-CM-YYYYXXXX format', () => {
      expect(isRequestTicketNo('RQ-CM-20260001')).toBe(true);
      expect(isRequestTicketNo('RQ-CM-20269999')).toBe(true);
      expect(isRequestTicketNo('RQ-CM-202610000')).toBe(true);
    });

    it('rejects formal doc numbers, hex, and invalid values', () => {
      expect(isRequestTicketNo('CM-SHF-2026-0001')).toBe(false);
      expect(isRequestTicketNo('2026080001')).toBe(false);
      expect(isRequestTicketNo('9530f95f')).toBe(false);
      expect(isRequestTicketNo('')).toBe(false);
      expect(isRequestTicketNo(null)).toBe(false);
    });
  });
});
