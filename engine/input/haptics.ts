export function pulse(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* some browsers expose vibrate and then throw */
  }
}
