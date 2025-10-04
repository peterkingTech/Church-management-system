// Comprehensive date and time utilities for the church management system

export const formatDate = (date: string | Date, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

export const formatTime = (time: string | Date, locale: string = 'en-US'): string => {
  const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;
  
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(timeObj);
};

export const formatDateTime = (datetime: string | Date, locale: string = 'en-US'): string => {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

export const formatRelativeTime = (date: string | Date, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  return formatDate(dateObj, locale);
};

export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

export const isTomorrow = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.toDateString() === tomorrow.toDateString();
};

export const isThisWeek = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

export const isThisMonth = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return dateObj.getMonth() === now.getMonth() && 
         dateObj.getFullYear() === now.getFullYear();
};

export const getDaysUntilBirthday = (month: number, day: number): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  let birthday = new Date(currentYear, month - 1, day);
  
  // If birthday has passed this year, calculate for next year
  if (birthday < now) {
    birthday = new Date(currentYear + 1, month - 1, day);
  }
  
  const diffTime = birthday.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getAge = (birthDate: string | Date): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const getWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getMonthRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
};

export const getYearRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  return { start, end };
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

export const getDateRange = (
  period: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year',
  referenceDate: Date = new Date()
): { start: Date; end: Date } => {
  const now = new Date(referenceDate);
  
  switch (period) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      };
      
    case 'yesterday':
      const yesterday = addDays(now, -1);
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      };
      
    case 'this_week':
      return getWeekRange(now);
      
    case 'last_week':
      const lastWeekStart = addWeeks(now, -1);
      return getWeekRange(lastWeekStart);
      
    case 'this_month':
      return getMonthRange(now);
      
    case 'last_month':
      const lastMonth = addMonths(now, -1);
      return getMonthRange(lastMonth);
      
    case 'this_year':
      return getYearRange(now);
      
    case 'last_year':
      const lastYear = addYears(now, -1);
      return getYearRange(lastYear);
      
    default:
      return getMonthRange(now);
  }
};

export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

export const formatTimeForInput = (time: string | Date): string => {
  if (typeof time === 'string') {
    return time;
  }
  
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDateTimeForInput = (datetime: Date | string): string => {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return dateObj.toISOString().slice(0, 16);
};

export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const createDateTime = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const dateObj = new Date(date);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

// Timezone helpers
export const convertToTimezone = (date: Date, timezone: string): Date => {
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
};

export const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (target.getTime() - utc.getTime()) / (1000 * 60 * 60);
};

// Calendar helpers
export const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= lastDay || currentDate.getDay() !== 0) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    
    if (days.length > 42) break; // Prevent infinite loop
  }
  
  return days;
};

export const getMonthNames = (locale: string = 'en-US'): string[] => {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    months.push(date.toLocaleDateString(locale, { month: 'long' }));
  }
  return months;
};

export const getDayNames = (locale: string = 'en-US'): string[] => {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(2024, 0, i + 1); // January 1, 2024 was a Monday
    days.push(date.toLocaleDateString(locale, { weekday: 'long' }));
  }
  return days;
};