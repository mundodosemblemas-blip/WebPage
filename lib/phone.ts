// Cape Verde (Cabo Verde) phone numbers: country code +238, 7-digit national
// numbers. Mobiles typically start with 5 or 9, landlines with 2.

// Reduce any input to the 7-digit national number, dropping a +238 / 00238
// country-code prefix if present. Used so the same number written in different
// formats still matches when looking up an order.
export function normalizeCVPhone(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("00238")) digits = digits.slice(5);
  else if (digits.startsWith("238") && digits.length > 7) digits = digits.slice(3);
  return digits;
}

// Valid when it reduces to a 7-digit national number starting 2-9.
export function isValidCVPhone(input: string): boolean {
  return /^[2-9]\d{6}$/.test(normalizeCVPhone(input));
}

// Pretty international form, e.g. "+238 991 23 45". Falls back to the raw input.
export function formatCVPhone(input: string): string {
  const d = normalizeCVPhone(input);
  if (d.length !== 7) return input;
  return `+238 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)}`;
}

export const CV_PHONE_PLACEHOLDER = "+238 991 23 45";
