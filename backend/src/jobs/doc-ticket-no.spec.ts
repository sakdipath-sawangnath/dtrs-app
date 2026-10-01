import {
  bangkokYear,
  bangkokYearMonth,
  formatDocRunning,
  formatDocTicketNo,
  formatRequestTicketNo,
  formatRequestOocTicketNo,
  formatOocDocTicketNo,
  isFormalDocTicketNo,
  isRequestTicketNo,
  isRequestOocTicketNo,
  isAnyRequestTicketNo,
} from './doc-ticket-no';

describe('doc-ticket-no (Meeting Phase C & Redesign)', () => {
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

    it('out-of-contract uses OOC-YYYY-XXXX when periodYear is provided', () => {
      expect(
        formatDocTicketNo({
          isOutOfContract: true,
          running: 12,
          periodYear: '2026',
        }),
      ).toBe('OOC-2026-0012');
    });

    it('out-of-contract supports legacy YYYYMM format', () => {
      expect(
        formatDocTicketNo({
          isOutOfContract: true,
          running: 12,
          periodYm: '202608',
        }),
      ).toBe('2026080012');
    });

    it('rejects bad period for OOC', () => {
      expect(() =>
        formatDocTicketNo({
          isOutOfContract: true,
          running: 1,
          periodYm: '26',
        }),
      ).toThrow(RangeError);
    });
  });

  describe('formatOocDocTicketNo', () => {
    it('formats OOC-YYYY-XXXX with 4-digit padding', () => {
      expect(formatOocDocTicketNo({ year: '2026', running: 1 })).toBe(
        'OOC-2026-0001',
      );
      expect(formatOocDocTicketNo({ year: '2026', running: 42 })).toBe(
        'OOC-2026-0042',
      );
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
    it('rejects hex, request tickets, and empty', () => {
      expect(isFormalDocTicketNo('29c75819')).toBe(false);
      expect(isFormalDocTicketNo('12345678')).toBe(false);
      expect(isFormalDocTicketNo('')).toBe(false);
      expect(isFormalDocTicketNo(null)).toBe(false);
      expect(isFormalDocTicketNo('RQ-CM-20260001')).toBe(false);
      expect(isFormalDocTicketNo('RQ-OOC-20260001')).toBe(false);
    });

    it('accepts running Doc No formats (in-contract, new OOC, legacy OOC)', () => {
      expect(isFormalDocTicketNo('CM-SHF-2026-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2002-0001')).toBe(true);
      expect(isFormalDocTicketNo('CM-SHF-2026-10000')).toBe(true);
      expect(isFormalDocTicketNo('OOC-2026-0001')).toBe(true);
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

  describe('formatRequestOocTicketNo', () => {
    it('formats RQ-OOC-YYYYXXXX with 4-digit padding', () => {
      expect(formatRequestOocTicketNo({ year: '2026', running: 1 })).toBe(
        'RQ-OOC-20260001',
      );
      expect(formatRequestOocTicketNo({ year: '2026', running: 88 })).toBe(
        'RQ-OOC-20260088',
      );
    });
  });

  describe('isRequestTicketNo', () => {
    it('identifies RQ-CM-YYYYXXXX format', () => {
      expect(isRequestTicketNo('RQ-CM-20260001')).toBe(true);
      expect(isRequestTicketNo('RQ-CM-20269999')).toBe(true);
      expect(isRequestTicketNo('RQ-CM-202610000')).toBe(true);
      expect(isRequestTicketNo('RQ-OOC-20260001')).toBe(false);
    });
  });

  describe('isRequestOocTicketNo', () => {
    it('identifies RQ-OOC-YYYYXXXX format', () => {
      expect(isRequestOocTicketNo('RQ-OOC-20260001')).toBe(true);
      expect(isRequestOocTicketNo('RQ-CM-20260001')).toBe(false);
    });
  });

  describe('isAnyRequestTicketNo', () => {
    it('identifies both RQ-CM and RQ-OOC formats', () => {
      expect(isAnyRequestTicketNo('RQ-CM-20260001')).toBe(true);
      expect(isAnyRequestTicketNo('RQ-OOC-20260001')).toBe(true);
      expect(isAnyRequestTicketNo('CM-SHF-2026-0001')).toBe(false);
      expect(isAnyRequestTicketNo('OOC-2026-0001')).toBe(false);
      expect(isAnyRequestTicketNo('9530f95f')).toBe(false);
    });
  });
});
