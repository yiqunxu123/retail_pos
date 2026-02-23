/**
 * Unified Design Tokens
 *
 * 全局统一的字体、颜色、按钮、图标尺寸规范。
 * 所有页面/组件应引用此文件，禁止硬编码样式值。
 *
 * 使用方式:
 *   import { typography, colors, iconSize, buttonSize, spacing } from '@/utils/theme';
 *   style={{ fontSize: typography.md.fontSize, color: colors.text }}
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

  // 黑白
  black: '#000000',
  white: '#FFFFFF',
} as const;

// ============================================================================
// Typography — 字体规范
// ============================================================================
//
// 层级说明:
//   xs   (10) — 极小标注、角标
//   sm   (12) — 辅助说明、表格次要信息
//   md   (14) — 默认正文、表单标签、按钮文字 ★ 最常用
//   base (16) — 稍大正文、输入框文字
//   lg   (18) — 小标题、侧边栏按钮文字
//   xl   (20) — 中标题
//   2xl  (24) — 大标题、卡片标题
//   3xl  (32) — 统计数字、大数值展示
//   4xl  (36) — 超大展示数字
//
// fontWeight 统一使用数字字符串:
//   regular  "400"
//   medium   "500"
//   semibold "600"  ★ 最常用
//   bold     "700"

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 36,
} as const;

/** 预组合的文字样式，可直接展开到 style 中 */
export const typography: Record<string, TextStyle> = {
  // —— 极小 ——
  xs: { fontSize: 10, fontWeight: '400' },
  xsMedium: { fontSize: 10, fontWeight: '500' },
  xsBold: { fontSize: 10, fontWeight: '700' },

  // —— 小 ——
  sm: { fontSize: 12, fontWeight: '400' },
  smMedium: { fontSize: 12, fontWeight: '500' },
  smSemibold: { fontSize: 12, fontWeight: '600' },
  smBold: { fontSize: 12, fontWeight: '700' },

  // —— 默认正文 ★ ——
  md: { fontSize: 14, fontWeight: '400' },
  mdMedium: { fontSize: 14, fontWeight: '500' },
  mdSemibold: { fontSize: 14, fontWeight: '600' },
  mdBold: { fontSize: 14, fontWeight: '700' },

  // —— 稍大正文 ——
  base: { fontSize: 16, fontWeight: '400' },
  baseMedium: { fontSize: 16, fontWeight: '500' },
  baseSemibold: { fontSize: 16, fontWeight: '600' },
  baseBold: { fontSize: 16, fontWeight: '700' },

  // —— 小标题 ——
  lg: { fontSize: 18, fontWeight: '400' },
  lgSemibold: { fontSize: 18, fontWeight: '600' },
  lgBold: { fontSize: 18, fontWeight: '700' },

  // —— 中标题 ——
  xl: { fontSize: 20, fontWeight: '400' },
  xlSemibold: { fontSize: 20, fontWeight: '600' },
  xlBold: { fontSize: 20, fontWeight: '700' },

  // —— 大标题 ——
  '2xl': { fontSize: 24, fontWeight: '400' },
  '2xlSemibold': { fontSize: 24, fontWeight: '600' },
  '2xlBold': { fontSize: 24, fontWeight: '700' },

  // —— 统计数字 ——
  '3xl': { fontSize: 32, fontWeight: '400' },
  '3xlBold': { fontSize: 32, fontWeight: '700' },

  // —— 超大展示 ——
  '4xl': { fontSize: 36, fontWeight: '700' },
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
