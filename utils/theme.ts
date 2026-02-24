/**
 * Unified Design Tokens
 *
 * 全局统一的字体、颜色、按钮、图标尺寸规范。
 * 所有页面/组件应引用此文件，禁止硬编码样式值。
 *
 * 使用方式:
 *   import { colors, iconSize, buttonSize, spacing } from '@/utils/theme';
 *   className="text-sm" + style={{ color: colors.text }}
 */

import { TextStyle, ViewStyle } from 'react-native';

// ============================================================================
// Colors — 色板
// ============================================================================

export const colors = {
  // 品牌主色
  primary: '#EC1A52',
  primaryLight: '#FFF0F3',

  // 文字色 (从深到浅)
  text: '#1A1A1A',           // 主文字 — 标题、正文
  textDark: '#1F2937',       // 深色文字 — 模态框标题
  textMedium: '#374151',     // 中灰文字 — 次要标题
  textSecondary: '#6B7280',  // 次要文字 — 说明、标签
  textTertiary: '#9CA3AF',   // 占位符/禁用文字
  textWhite: '#FFFFFF',      // 白色文字 — 深色背景上

  // 背景色 (从白到灰)
  background: '#FFFFFF',
  backgroundLight: '#FAFAFA',
  backgroundSecondary: '#F3F4F6',
  backgroundTertiary: '#F7F7F9',

  // 边框色
  border: '#E5E7EB',
  borderLight: '#F0F1F4',
  borderMedium: '#D1D5DB',

  // 遮罩
  overlay: 'rgba(0,0,0,0.5)',

  // 功能色
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  errorDark: '#DC2626',
  info: '#3B82F6',
  purple: '#8B5CF6',

  // 黑白 / 深色表面
  black: '#000000',
  white: '#FFFFFF',
  surfaceDark: '#20232A',  // Dark button/surface (e.g. Product Settings icon)
} as const;

// ============================================================================
// Typography — 字重 (字号用 Tailwind: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl)
// ============================================================================

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// Icon Sizes — 图标尺寸
// ============================================================================
//
// 层级说明:
//   xs, sm — 已废弃，与 md 相同 (保持向后兼容)
//   md   (18) — 表单字段图标、工具栏图标 ★ 最常用
//   base (20) — 搜索图标、输入框图标
//   lg   (22) — 关闭按钮、操作图标
//   xl   (24) — 侧边栏操作、模态框图标 ★ 第二常用
//   2xl  (32) — 侧边栏导航菜单图标
//   3xl  (40) — Dashboard 统计卡片图标
//   4xl  (48) — 大型展示/空状态图标
//   5xl  (64) — 超大空状态占位图标

export const iconSize = {
  xs: 18,
  sm: 18,
  md: 18,
  base: 20,
  lg: 22,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ============================================================================
// Button Sizes — 按钮尺寸
// ============================================================================
//
// 层级说明:
//   xs, sm — 已废弃，与 md 相同 (保持向后兼容)
//   md — 默认按钮 (工具栏、表单) ★ 最常用
//   lg — 大按钮 (主操作、确认)
//   xl — 超大按钮 (全宽提交、侧边栏)

interface ButtonSizeToken {
  height: number;
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  fontWeight: '500' | '600' | '700';
  borderRadius: number;
  iconSize: number;
}

const _mdToken: ButtonSizeToken = {
  height: 50,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 14,
  fontWeight: '600',
  borderRadius: 8,
  iconSize: 20,
};

export const buttonSize: Record<string, ButtonSizeToken> = {
  xs: _mdToken,
  sm: _mdToken,
  md: _mdToken,
  lg: {
    height: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 8,
    iconSize: 22,
  },
  xl: {
    height: 52,
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    borderRadius: 12,
    iconSize: 24,
  },
  /** Sidebar navigation — large touch targets for kiosk/tablet */
  sidebar: {
    height: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    borderRadius: 8,
    iconSize: 32,
  },
};

// ============================================================================
// Spacing — 间距
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ============================================================================
// Modal Content — 弹窗内容统一 (字体、框样式)
// ============================================================================
//
// 所有 CenteredModal 内容应使用以下 token，保持视觉一致

export const modalContent = {
  /** 区块标题 (如 "Contact Information") */
  titleFontSize: 16,
  titleFontWeight: '600' as const,
  titleColor: colors.textDark,

  /** 字段标签 (如 "Email", "Expected Cash") */
  labelFontSize: 14,
  labelColor: colors.textSecondary,

  /** 字段值 / 正文 */
  valueFontSize: 16,
  valueFontWeight: '500' as const,
  valueColor: colors.textDark,

  /** 大数字显示 (金额、数量) */
  valueLargeFontSize: 24,
  /** 超大数字 (现金金额等) */
  valueXlFontSize: 32,

  /** 框/卡片 - 背景、边框、内边距 */
  boxBackground: colors.backgroundTertiary,
  boxBackgroundAlt: '#F4F5F7',        // 与 backgroundSecondary 相近，用于输入区
  boxBorderColor: colors.border,
  boxBorderWidth: 1,
  boxPadding: 12,
  boxPaddingPct: '4%' as const,
  boxRadius: 8,

  /** 输入框统一 */
  inputBackground: colors.background,
  inputBorderColor: colors.border,
  inputBorderRadius: 8,
  inputPaddingHorizontal: 12,
  inputPaddingVertical: 10,
  inputFontSize: 16,
} as const;

// ============================================================================
// Modal Sizes — 弹窗尺寸 (统一 CenteredModal 使用)
// ============================================================================
//
// sm  (420) — 确认/简短提示 (Park Order, 简单表单)
// md  (560) — 标准表单、详情 (Customer Details)
// lg  (720) — 复杂内容 (Order Details)
// xl  (960) — 大表格、批量编辑
// full — 全屏占比 92%，maxWidth 1100，maxHeight 88%

export const modalSizes = {
  sm: { width: "88%" as const, maxWidth: "95%", maxHeight: "93%" },
  md: { width: "90%" as const, maxWidth: "95%", maxHeight: "93%" },
  lg: { width: "92%" as const, maxWidth: "95%", maxHeight: "93%" },
  xl: { width: "94%" as const, maxWidth: "96%", maxHeight: "93%" },
  full: { width: "96%" as const, maxWidth: "96%", maxHeight: "93%" as const },
} as const;

// ============================================================================
// Border Radius — 圆角
// ============================================================================

export const radius = {
  sm: 4,
  md: 6,
  base: 8,    // ★ 最常用 (rounded-lg)
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ============================================================================
// Helpers — 快捷样式生成
// ============================================================================

/** 生成按钮容器样式 */
export function getButtonStyle(
  size: keyof typeof buttonSize,
  variant: 'primary' | 'outline' | 'ghost' = 'primary',
): ViewStyle {
  const token = buttonSize[size];
  const base: ViewStyle = {
    height: token.height,
    paddingHorizontal: token.paddingHorizontal,
    borderRadius: token.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: colors.primary };
    case 'outline':
      return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
    case 'ghost':
      return { ...base, backgroundColor: 'transparent' };
    default:
      return { ...base, backgroundColor: colors.primary };
  }
}

/** 生成按钮文字样式 */
export function getButtonTextStyle(
  size: keyof typeof buttonSize,
  variant: 'primary' | 'outline' | 'ghost' = 'primary',
): TextStyle {
  const token = buttonSize[size];
  return {
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    color: variant === 'primary' ? colors.textWhite : colors.text,
  };
}
