// src/utils/money.js
export function formatMoney(amount, currency = "USD", locale = "es-UY") {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
