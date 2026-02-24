import { useWindowDimensions } from "react-native";
import { SUB_PAGE_SIDEBAR_WIDTH } from "../components/SubPageSidebar";

/** Min table width when content area is very narrow */
const MIN_CONTENT_WIDTH = 600;

/**
 * useTableContentWidth - Content width for DataTable (screen minus sidebar)
 *
 * Use for responsive column widths and DataTable minWidth:
 * - Landscape: screenWidth - sidebar
 * - Portrait: full screenWidth (sidebar below)
 */
export function useTableContentWidth(): number {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  return Math.max(
    MIN_CONTENT_WIDTH,
    isLandscape ? screenWidth - SUB_PAGE_SIDEBAR_WIDTH : screenWidth
  );
}

/** Compute column width from percentage of content width */
export function colWidth(contentWidth: number, pct: number): number {
  return Math.round((contentWidth * pct) / 100);
}
