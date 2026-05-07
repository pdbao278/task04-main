/**
 * Sanitize user input to prevent XSS
 * Strips script tags and event handlers while preserving markdown
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;

  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\bon\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove style expressions
    .replace(/expression\s*\(/gi, '')
    // Remove iframe, embed, object tags
    .replace(/<\s*(iframe|embed|object|form)\b[^>]*>.*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(iframe|embed|object|form)\b[^>]*\/?>/gi, '');
}

/**
 * Sanitize task/project input fields
 */
export function sanitizeInput<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeHtml(sanitized[key] as string);
    }
  }
  return sanitized;
}
