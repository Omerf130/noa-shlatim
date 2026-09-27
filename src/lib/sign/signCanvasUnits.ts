/**
 * Canonical 3:2 sign canvas — composition geometry uses cqw/cqh on `.signCanvas`.
 * `design.text.size` = px at reference width 360.
 */
export const SIGN_REFERENCE_WIDTH_PX = 360;

export function textFontSizeCqw(textSize: number): string {
  return `${textSize / (SIGN_REFERENCE_WIDTH_PX / 100)}cqw`;
}

export const TEXT_PRESET_INSET_CQH = 8;

export const DECORATION_BASE_CQW = 40 / (SIGN_REFERENCE_WIDTH_PX / 100);

export function decorationSizeCqw(scale: number): string {
  return `${DECORATION_BASE_CQW * scale}cqw`;
}

export const ILLUSTRATION_MAX_CQW = 63;
export const ILLUSTRATION_MAX_CQH = 68;
