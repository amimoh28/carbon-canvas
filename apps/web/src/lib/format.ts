/** Display formatting for energy values. The engine keeps precision for
 *  math; the UI rounds because showing "19.993 Wh" would be false precision
 *  in the display layer (UX §5: ranges over point precision). */

export function fmtWh(wh: number): string {
  if (wh === 0) return "0";
  if (wh < 0.1) return "<0.1";
  if (wh < 10) return wh.toFixed(1);
  return String(Math.round(wh));
}

export function fmtWhRange(low: number, high: number): string {
  return `${fmtWh(low)}–${fmtWh(high)} Wh`;
}
