import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  getInitials,
  getAvatarColor,
  isValidBirthday,
  formatBirthday,
} from '@/lib/player-utils';

/**
 * Constructs a Date exactly N years before today, accounting for whether
 * the birthday has already occurred this year so calculateAge returns
 * predictable results regardless of test-run date.
 */
function yearsAgo(years: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
}

/**
 * Returns a Date whose birthday has NOT yet occurred this calendar year,
 * making calculateAge return (years - 1) for that input.
 *
 * Strategy: shift the month forward by 1 (or roll to January next year
 * if we're already in December) relative to today.
 */
function birthdayLaterThisYear(yearsOld: number): Date {
  const today = new Date();
  let futureMonth = today.getMonth() + 1;
  let year = today.getFullYear() - yearsOld;
  if (futureMonth > 11) {
    futureMonth = 0;
    year += 1; // birthday would be Jan next year = still "later this year" for age calc
  }
  return new Date(year, futureMonth, 1);
}

describe('calculateAge', () => {
  it('returns correct age for birthday exactly 10 years ago today', () => {
    const birthday = yearsAgo(10);
    expect(calculateAge(birthday)).toBe(10);
  });

  it('returns age - 1 when birthday has not yet occurred this year', () => {
    const birthday = birthdayLaterThisYear(10);
    expect(calculateAge(birthday)).toBe(9);
  });

  it('returns 0 for a birthday earlier this year (newborn)', () => {
    const today = new Date();
    // Born this year, January 1st (past in any month but Jan 1)
    const thisYearJan1 = new Date(today.getFullYear(), 0, 1);
    // Age is 0 regardless
    expect(calculateAge(thisYearJan1)).toBe(0);
  });

  it('returns correct age for a 15-year-old', () => {
    const birthday = yearsAgo(15);
    expect(calculateAge(birthday)).toBe(15);
  });
});

describe('getInitials', () => {
  it('returns first and last initials for two-word name', () => {
    expect(getInitials('John Smith')).toBe('JS');
  });

  it('returns first and last initials for three-word name', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('returns first letter for single-word name', () => {
    expect(getInitials('Madonna')).toBe('M');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('handles extra whitespace correctly', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });

  it('returns uppercased initials', () => {
    expect(getInitials('alex rodriguez')).toBe('AR');
  });
});

describe('getAvatarColor', () => {
  const validColors = [
    'bg-zinc-100 text-zinc-700',
    'bg-zinc-200 text-zinc-800',
    'bg-zinc-300 text-zinc-900',
  ] as const;

  it('returns one of the 3 valid Tailwind color classes', () => {
    const color = getAvatarColor('John Smith');
    expect(validColors).toContain(color);
  });

  it('is deterministic - same name always returns same color', () => {
    const color1 = getAvatarColor('Alex Rodriguez');
    const color2 = getAvatarColor('Alex Rodriguez');
    expect(color1).toBe(color2);
  });

  it('can return different colors for different names', () => {
    // Build names whose first char covers all 3 modulo buckets
    // charCode % 3 → 0, 1, 2
    // Find chars that produce each bucket
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const colorsFound = new Set(names.map(n => getAvatarColor(n)));
    // We should see at least 2 distinct colors across 11 different first chars
    expect(colorsFound.size).toBeGreaterThanOrEqual(2);
  });
});

describe('isValidBirthday', () => {
  it('returns true for a valid birthday 10 years ago', () => {
    expect(isValidBirthday(yearsAgo(10))).toBe(true);
  });

  it('returns false for a future date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isValidBirthday(future)).toBe(false);
  });

  it('returns false for a birthday 30 years ago (too old)', () => {
    expect(isValidBirthday(yearsAgo(30))).toBe(false);
  });

  it('returns false for a birthday 1 year ago (too young)', () => {
    expect(isValidBirthday(yearsAgo(1))).toBe(false);
  });

  it('returns true for a birthday exactly 5 years ago', () => {
    expect(isValidBirthday(yearsAgo(5))).toBe(true);
  });

  it('returns true for a birthday exactly 25 years ago', () => {
    expect(isValidBirthday(yearsAgo(25))).toBe(true);
  });

  it('returns false for a birthday exactly 26 years ago', () => {
    expect(isValidBirthday(yearsAgo(26))).toBe(false);
  });
});

describe('formatBirthday', () => {
  it('returns a human-readable date string', () => {
    const birthday = new Date(2010, 4, 15); // May 15, 2010
    const formatted = formatBirthday(birthday);
    expect(formatted).toContain('2010');
    expect(formatted).toContain('15');
  });

  it('includes the month name', () => {
    const birthday = new Date(2012, 5, 20); // June 20, 2012
    const formatted = formatBirthday(birthday);
    expect(formatted).toMatch(/June/);
  });

  it('formats January correctly', () => {
    const birthday = new Date(2015, 0, 1); // January 1, 2015
    const formatted = formatBirthday(birthday);
    expect(formatted).toMatch(/January/);
    expect(formatted).toContain('2015');
  });

  it('returns a non-empty string for any valid date', () => {
    const birthday = new Date(2008, 11, 31); // December 31, 2008
    expect(formatBirthday(birthday)).toBeTruthy();
  });
});
