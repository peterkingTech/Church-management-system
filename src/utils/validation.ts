// Comprehensive validation utilities for the church management system

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Email validation
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  
  return null;
};

// Phone validation
export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Phone is optional in most cases
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return 'Please enter a valid phone number';
  }
  
  return null;
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): string | null => {
  if (!name || name.trim().length === 0) {
    return `${fieldName} is required`;
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (name.trim().length > 100) {
    return `${fieldName} must be less than 100 characters`;
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  return null;
};

// Church name validation
export const validateChurchName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Church name is required';
  }
  
  if (name.trim().length < 3) {
    return 'Church name must be at least 3 characters long';
  }
  
  if (name.trim().length > 255) {
    return 'Church name must be less than 255 characters';
  }
  
  // Allow letters, numbers, spaces, hyphens, apostrophes, and common church terms
  if (!/^[a-zA-Z0-9\s\-'&.()]+$/.test(name.trim())) {
    return 'Church name contains invalid characters';
  }
  
  return null;
};

// Enhanced password validation for registration
export const validateStrongPassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

// Terms acceptance validation
export const validateTermsAcceptance = (accepted: boolean): string | null => {
  if (!accepted) {
    return 'You must accept the Terms of Service to continue';
  }
  return null;
};

// Privacy policy acceptance validation
export const validatePrivacyAcceptance = (accepted: boolean): string | null => {
  if (!accepted) {
    return 'You must accept the Privacy Policy to continue';
  }
  return null;
};

// CAPTCHA validation
export const validateCaptcha = (userAnswer: string, correctAnswer: number): string | null => {
  if (!userAnswer) {
    return 'Please solve the math problem';
  }
  
  const numericAnswer = parseInt(userAnswer);
  if (isNaN(numericAnswer)) {
    return 'Please enter a valid number';
  }
  
  if (numericAnswer !== correctAnswer) {
    return 'Incorrect answer, please try again';
  }
  
  return null;
};

// Date validation
export const validateDate = (date: string, fieldName: string = 'Date'): string | null => {
  if (!date) return `${fieldName} is required`;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
  
  return null;
};

// Birthday validation
export const validateBirthday = (month: number, day: number): string | null => {
  if (!month || !day) return null; // Birthday is optional
  
  if (month < 1 || month > 12) {
    return 'Please enter a valid month (1-12)';
  }
  
  if (day < 1 || day > 31) {
    return 'Please enter a valid day (1-31)';
  }
  
  // Check for valid day in month
  const daysInMonth = new Date(2024, month, 0).getDate(); // Use 2024 (leap year) for February
  if (day > daysInMonth) {
    return `Invalid day for the selected month`;
  }
  
  return null;
};

// URL validation
export const validateUrl = (url: string, fieldName: string = 'URL'): string | null => {
  if (!url) return null; // URL is usually optional
  
  try {
    new URL(url);
    return null;
  } catch {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
};

// File validation
export const validateFile = (
  file: File, 
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): string | null => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;
  
  if (!file) {
    return required ? 'File is required' : null;
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${maxSizeMB}MB`;
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

// Amount validation (for financial records)
export const validateAmount = (amount: string | number): string | null => {
  if (!amount && amount !== 0) return 'Amount is required';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Please enter a valid amount';
  }
  
  if (numAmount < 0) {
    return 'Amount cannot be negative';
  }
  
  if (numAmount > 999999.99) {
    return 'Amount is too large';
  }
  
  // Check for valid decimal places (max 2)
  if (typeof amount === 'string' && amount.includes('.')) {
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      return 'Amount can have at most 2 decimal places';
    }
  }
  
  return null;
};

// Generic field validation
export const validateField = (value: any, rules: ValidationRule, fieldName: string): string | null => {
  // Required check
  if (rules.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
    return `${fieldName} is required`;
  }
  
  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return null;
  }
  
  // String-specific validations
  if (typeof value === 'string') {
    if (rules.minLength && value.trim().length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters long`;
    }
    
    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return `${fieldName} must be less than ${rules.maxLength} characters`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }
  
  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }
  
  return null;
};

// Form validation helper
export const validateForm = (
  data: Record<string, any>, 
  rules: Record<string, ValidationRule>
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  Object.entries(rules).forEach(([fieldName, rule]) => {
    const error = validateField(data[fieldName], rule, fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Specific validation schemas for common forms
export const userValidationRules = {
  full_name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, custom: validateEmail },
  phone: { custom: validatePhone },
  password: { required: true, custom: validatePassword }
};

export const eventValidationRules = {
  title: { required: true, minLength: 3, maxLength: 255 },
  description: { maxLength: 1000 },
  event_date: { required: true, custom: (value: string) => validateDate(value, 'Event date') },
  location: { maxLength: 255 }
};

export const taskValidationRules = {
  title: { required: true, minLength: 3, maxLength: 255 },
  description: { maxLength: 1000 },
  assignee_id: { required: true },
  due_date: { custom: (value: string) => value ? validateDate(value, 'Due date') : null }
};

export const financialValidationRules = {
  transaction_type: { required: true },
  amount: { required: true, custom: validateAmount },
  description: { required: true, minLength: 3, maxLength: 255 },
  transaction_date: { required: true, custom: (value: string) => validateDate(value, 'Transaction date') }
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Format helpers
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};