import { WeeklyScheduleItem } from '../types/hrms';

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export type WeekdayName = typeof DAYS_OF_WEEK[number];

const DAY_ALIASES: Record<string, WeekdayName> = {
  sun: 'Sunday',
  sunday: 'Sunday',
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday'
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  last: -1
};

export const normalizeWeekdayName = (value?: string): WeekdayName | null => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return null;
  return DAY_ALIASES[normalized] || null;
};

export const parseWeeklyOffDays = (offDays?: string, includeOrdinalDays = true): WeekdayName[] => {
  const source = (offDays || '')
    .replace(/\bonly\b/gi, ' ')
    .replace(/\boff\b/gi, ' ')
    .replace(/\bweekly\b/gi, ' ');

  const parts = source
    .split(/[,;+&]|\band\b|\+/i)
    .map(part => part.trim())
    .filter(Boolean);

  const days = parts
    .map(part => {
      const lower = part.toLowerCase();
      const hasOrdinal = /\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth|last|alternate)\b/.test(lower);
      if (hasOrdinal && !includeOrdinalDays) return null;

      const exact = normalizeWeekdayName(lower);
      if (exact) return exact;

      const matchedDay = DAYS_OF_WEEK.find(day => new RegExp(`\\b${day.toLowerCase()}\\b`).test(lower));
      const matchedShortDay = Object.keys(DAY_ALIASES).find(alias => new RegExp(`\\b${alias}\\b`).test(lower));
      return matchedDay || (matchedShortDay ? DAY_ALIASES[matchedShortDay] : null);
    })
    .filter((day): day is WeekdayName => Boolean(day));

  return Array.from(new Set(days));
};

const getWeekdayOccurrenceInMonth = (date: Date): number => {
  return Math.floor((date.getDate() - 1) / 7) + 1;
};

const isLastWeekdayOccurrenceInMonth = (date: Date): boolean => {
  const nextWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
  return nextWeek.getMonth() !== date.getMonth();
};

const ordinalMatches = (text: string, occurrence: number, isLast: boolean): boolean => {
  const normalized = text.toLowerCase();
  const ordinalNumbers = [...normalized.matchAll(/\b([1-5])(?:st|nd|rd|th)\b/g)].map(match => Number(match[1]));
  const wordNumbers = Object.entries(ORDINAL_WORDS)
    .filter(([word]) => new RegExp(`\\b${word}\\b`).test(normalized))
    .map(([, value]) => value);
  const ordinals = [...ordinalNumbers, ...wordNumbers];

  if (/\balternate\b/.test(normalized)) {
    ordinals.push(2, 4);
  }

  return ordinals.some(value => value === occurrence || (value === -1 && isLast));
};

export const isDateWeeklyOffByRule = (date: Date, offDays?: string): boolean => {
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const fixedOffDays = parseWeeklyOffDays(offDays, false);
  if (fixedOffDays.includes(dayName)) return true;

  const ruleText = (offDays || '').toLowerCase();
  if (!ruleText) return false;

  const mentionsDay = new RegExp(`\\b${dayName.toLowerCase()}\\b|\\b${dayName.slice(0, 3).toLowerCase()}\\b`).test(ruleText);
  if (!mentionsDay) return false;

  return ordinalMatches(ruleText, getWeekdayOccurrenceInMonth(date), isLastWeekdayOccurrenceInMonth(date));
};

export const isDateWeeklyOffBySchedule = (
  date: Date,
  weeklySchedules?: WeeklyScheduleItem[],
  customWorkingDays?: string[]
): boolean => {
  const dayName = DAYS_OF_WEEK[date.getDay()];

  if (Array.isArray(customWorkingDays) && customWorkingDays.length > 0) {
    const workingDayNames = customWorkingDays
      .map(day => normalizeWeekdayName(day) || DAYS_OF_WEEK.find(d => d.toLowerCase() === day.toLowerCase()))
      .filter((day): day is WeekdayName => Boolean(day));
    return !workingDayNames.includes(dayName);
  }

  if (!weeklySchedules || weeklySchedules.length === 0) {
    return dayName === 'Sunday';
  }

  const activeSchedule = weeklySchedules.find(schedule => schedule.isDefault) || weeklySchedules[0];
  return isDateWeeklyOffByRule(date, activeSchedule.offDays || 'Sunday');
};
