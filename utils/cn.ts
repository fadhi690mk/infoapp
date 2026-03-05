/**
 * Simple class name merger for NativeWind.
 * Pass multiple class names; falsy values are filtered out.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
