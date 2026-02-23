import { colors, fontSize, fontWeight, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  Image,
  InteractionManager,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRenderTrace } from "../utils/debug/useRenderTrace";
import { useProducts, useProductsPage } from "../utils/powersync/hooks";
import type { ProductView } from "../utils/powersync/hooks/useProducts";

export interface SearchProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface SearchProductModalHandle {
  open: () => void;
  close: (reason?: string) => void;
  isOpen: () => boolean;
}

interface SearchProductModalProps {
  visible?: boolean;
  onClose: (reason?: string) => void;
  onSelectProduct: (product: SearchProduct) => void;
  products?: ProductView[];
  productsLoading?: boolean;
  onVisible?: () => void;
  onOpenStart?: () => void;
  onOpenEnd?: () => void;
  onCloseStart?: (reason: string) => void;
  onCloseEnd?: (reason: string) => void;
  onNextFrame?: () => void;
  onAfterInteractions?: () => void;
  onFirstListItemVisible?: (metrics: { displayCount: number; query: string }) => void;
  onOverlayLayout?: () => void;
  onPanelLayout?: () => void;
  onFilterReady?: (metrics: {
    displayCount: number;
    query: string;
    filterMs: number;
  }) => void;
  paginationMode?: "none" | "page";
  pageSize?: number;
}

interface SearchProductModalCoreProps extends SearchProductModalProps {
  allProducts: ProductView[];
  isLoading: boolean;
}

interface SearchProductModalWithDataProps extends SearchProductModalProps {
  modalRef: React.Ref<SearchProductModalHandle>;
}

const PANEL_WIDTH_RATIO = 0.5;
const BACKDROP_MAX_OPACITY = 0.35;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 150;
let hiddenSkipCount = 0;

const SearchProductModalCore = forwardRef<
  SearchProductModalHandle,
  SearchProductModalCoreProps
>(function SearchProductModalCore(
  {
    visible,
    onClose,
    onSelectProduct,
    onVisible,
    onOpenStart,
    onOpenEnd,
    onCloseStart,
    onCloseEnd,
    onNextFrame,
    onAfterInteractions,
    onFirstListItemVisible,
    onOverlayLayout,
    onPanelLayout,
    onFilterReady,
    paginationMode = "none",
    pageSize = DEFAULT_PAGE_SIZE,
    allProducts,
    isLoading,
  },
  ref
) {
  const isControlled = typeof visible === "boolean";
  const controlledVisible = visible ?? false;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.max(1, Math.round(width * PANEL_WIDTH_RATIO));
  const pageModeEnabled = paginationMode === "page";
  const normalizedPageSize = Math.max(1, Math.floor(pageSize || DEFAULT_PAGE_SIZE));
  const safeAreaPadding = useMemo(
    () =>
      Platform.OS === "android"
        ? {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        : null,
    [insets.left, insets.right, insets.top]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(controlledVisible);
  const progress = useRef(new Animated.Value(controlledVisible ? 1 : 0)).current;
  const isOpenRef = useRef(controlledVisible);
  const targetOpenRef = useRef(controlledVisible);
  const isAnimatingRef = useRef(false);
  const searchQueryRef = useRef(searchQuery);
  const touchGateRef = useRef<View | null>(null);
  const frameRafRef = useRef<number | null>(null);
  const interactionTaskRef =
    useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(
      null
    );
  const overlayMeasuredRef = useRef(false);
  const panelMeasuredRef = useRef(false);
  const firstItemReportedRef = useRef(false);
  const overlayLayoutReportedRef = useRef(false);
  const panelLayoutReportedRef = useRef(false);
  const filterReadyReportedRef = useRef(false);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const pagedProductsResult = useProductsPage({
    query: debouncedSearchQuery,
    page: currentPage,
    pageSize: normalizedPageSize,
    enabled: pageModeEnabled,
  });

  const pagedProducts = pagedProductsResult.products;
  const totalPages = pagedProductsResult.totalPages;
  const totalCount = pagedProductsResult.totalCount;

  useEffect(() => {
    if (!pageModeEnabled) return;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pageModeEnabled, totalPages]);

  const filteredResult = useMemo(() => {
    const start = Date.now();
    if (pageModeEnabled) {
      return {
        items: pagedProducts,
        filterMs: Number((Date.now() - start).toFixed(2)),
      };
    }
    const keyword = searchQuery.trim().toLowerCase();
    const items = keyword
      ? allProducts.filter((product) => {
          const name = (product.name || "").toLowerCase();
          const sku = (product.sku || "").toLowerCase();
          const upc = (product.upc || "").toLowerCase();
          return name.includes(keyword) || sku.includes(keyword) || upc.includes(keyword);
        })
      : allProducts;

    return {
      items,
      filterMs: Number((Date.now() - start).toFixed(2)),
    };
  }, [allProducts, pageModeEnabled, pagedProducts, searchQuery]);
  const filteredProducts = filteredResult.items;
  const listLoading = pageModeEnabled
    ? pagedProductsResult.isListLoading && pagedProducts.length === 0
    : isLoading;
  const pageInfoLoading = pageModeEnabled ? pagedProductsResult.isCountLoading : false;

  const panelTranslateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-panelWidth, 0],
      }),
    [panelWidth, progress]
  );
  const backdropOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, BACKDROP_MAX_OPACITY],
      }),
    [progress]
  );

  const setTouchGateEnabled = useCallback((enabled: boolean) => {
    const node = touchGateRef.current as
      | (View & { setNativeProps?: (props: Record<string, unknown>) => void })
      | null;
    node?.setNativeProps?.({ pointerEvents: enabled ? "auto" : "none" });
  }, []);

  const clearScheduledOpenCallbacks = useCallback(() => {
    if (frameRafRef.current != null) {
      cancelAnimationFrame(frameRafRef.current);
      frameRafRef.current = null;
    }
    interactionTaskRef.current?.cancel?.();
    interactionTaskRef.current = null;
  }, []);

  const resetOpenMarkers = useCallback(() => {
    firstItemReportedRef.current = false;
    overlayLayoutReportedRef.current = false;
    panelLayoutReportedRef.current = false;
    filterReadyReportedRef.current = false;
  }, []);

  const maybeReportOverlayLayout = useCallback(() => {
    if (
      !overlayMeasuredRef.current ||
      !isOpenRef.current ||
      overlayLayoutReportedRef.current
    ) {
      return;
    }
    overlayLayoutReportedRef.current = true;
    onOverlayLayout?.();
  }, [onOverlayLayout]);

  const maybeReportPanelLayout = useCallback(() => {
    if (!panelMeasuredRef.current || !isOpenRef.current || panelLayoutReportedRef.current) {
      return;
    }
    panelLayoutReportedRef.current = true;
    onPanelLayout?.();
  }, [onPanelLayout]);

  const maybeReportFilterReady = useCallback(() => {
    if (!isOpenRef.current || listLoading || filterReadyReportedRef.current) return;
    filterReadyReportedRef.current = true;
    onFilterReady?.({
      displayCount: filteredProducts.length,
      query: searchQueryRef.current.trim(),
      filterMs: filteredResult.filterMs,
    });
  }, [filteredProducts.length, filteredResult.filterMs, listLoading, onFilterReady]);

  const maybeReportFirstRowVisible = useCallback(() => {
    if (!isOpenRef.current || listLoading || filteredProducts.length === 0 || firstItemReportedRef.current) {
      return;
    }
    firstItemReportedRef.current = true;
    onFirstListItemVisible?.({
      displayCount: filteredProducts.length,
      query: searchQueryRef.current.trim(),
    });
  }, [filteredProducts.length, listLoading, onFirstListItemVisible]);

  const scheduleOpenCallbacks = useCallback(() => {
    clearScheduledOpenCallbacks();
    frameRafRef.current = requestAnimationFrame(() => {
      frameRafRef.current = null;
      if (!isOpenRef.current) return;
      onNextFrame?.();
      maybeReportFilterReady();
      maybeReportFirstRowVisible();
    });
    interactionTaskRef.current = InteractionManager.runAfterInteractions(() => {
      interactionTaskRef.current = null;
      if (!isOpenRef.current) return;
      onAfterInteractions?.();
      maybeReportFilterReady();
      maybeReportFirstRowVisible();
    });
  }, [
    clearScheduledOpenCallbacks,
    maybeReportFilterReady,
    maybeReportFirstRowVisible,
    onAfterInteractions,
    onNextFrame,
  ]);

  const animateTo = useCallback(
    (nextOpen: boolean, reason: string) => {
      if (
        targetOpenRef.current === nextOpen &&
        isOpenRef.current === nextOpen &&
        !isAnimatingRef.current
      ) {
        return;
      }

      targetOpenRef.current = nextOpen;
      progress.stopAnimation();

      if (nextOpen) {
        isOpenRef.current = true;
        setIsModalOpen(true);
        resetOpenMarkers();
        setTouchGateEnabled(true);
        maybeReportOverlayLayout();
        maybeReportPanelLayout();
        onOpenStart?.();
        onVisible?.();
        scheduleOpenCallbacks();
      } else {
        clearScheduledOpenCallbacks();
        onCloseStart?.(reason);
      }

      // Animation intentionally disabled: switch visibility immediately.
      isAnimatingRef.current = true;
      progress.setValue(nextOpen ? 1 : 0);
      isAnimatingRef.current = false;
      isOpenRef.current = nextOpen;
      targetOpenRef.current = nextOpen;

      if (nextOpen) {
        onOpenEnd?.();
        maybeReportFilterReady();
        maybeReportFirstRowVisible();
      } else {
        setIsModalOpen(false);
        setTouchGateEnabled(false);
        onCloseEnd?.(reason);
        setCurrentPage(1);
        if (searchQueryRef.current) {
          setSearchQuery("");
          setDebouncedSearchQuery("");
        }
      }
    },
    [
      clearScheduledOpenCallbacks,
      maybeReportFilterReady,
      maybeReportFirstRowVisible,
      maybeReportOverlayLayout,
      maybeReportPanelLayout,
      onCloseEnd,
      onCloseStart,
      onOpenEnd,
      onOpenStart,
      onVisible,
      progress,
      resetOpenMarkers,
      scheduleOpenCallbacks,
      setTouchGateEnabled,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      open: () => animateTo(true, "imperative"),
      close: (reason = "manual") => animateTo(false, reason),
      isOpen: () => isOpenRef.current,
    }),
    [animateTo]
  );

  useEffect(() => {
    setTouchGateEnabled(isOpenRef.current);
    return () => {
      clearScheduledOpenCallbacks();
    };
  }, [clearScheduledOpenCallbacks, setTouchGateEnabled]);

  useEffect(() => {
    if (!isControlled) return;
    animateTo(controlledVisible, "controlled");
  }, [animateTo, controlledVisible, isControlled]);

  const handleCloseRequest = useCallback(
    (reason: string) => {
      onClose(reason);
    },
    [onClose]
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isOpenRef.current) return false;
      handleCloseRequest("hardware_back");
      return true;
    });
    return () => subscription.remove();
  }, [handleCloseRequest]);

  useEffect(() => {
    maybeReportFilterReady();
    maybeReportFirstRowVisible();
  }, [maybeReportFilterReady, maybeReportFirstRowVisible]);

  const handleSelectProduct = useCallback(
    (product: ProductView) => {
      onSelectProduct({
        id: product.id,
        name: product.name,
        sku: product.sku || product.upc || "",
        category: product.categoryName || "Uncategorized",
        quantity: 0,
        price: product.salePrice,
        image: product.images?.[0],
      });
    },
    [onSelectProduct]
  );

  const handleFirstItemLayout = useCallback(() => {
    maybeReportFirstRowVisible();
  }, [maybeReportFirstRowVisible]);

  const handleOverlayLayout = useCallback(() => {
    overlayMeasuredRef.current = true;
    maybeReportOverlayLayout();
  }, [maybeReportOverlayLayout]);

  const handlePanelLayout = useCallback(() => {
    panelMeasuredRef.current = true;
    maybeReportPanelLayout();
  }, [maybeReportPanelLayout]);

  const handleBackdropPress = useCallback(() => {
    handleCloseRequest("backdrop");
  }, [handleCloseRequest]);

  const handleCloseButtonPress = useCallback(() => {
    handleCloseRequest("close_button");
  }, [handleCloseRequest]);

  const keyExtractor = useCallback((item: ProductView) => item.id, []);

  const canGoPrevPage = pageModeEnabled && currentPage > 1;
  const canGoNextPage = pageModeEnabled && currentPage < totalPages;
  const totalPagesText = pageInfoLoading ? "Total ... pages" : `Total ${totalPages} pages`;
  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);
  const handleSelectPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const pageTokens = useMemo(() => {
    if (!pageModeEnabled) return [currentPage];
    const windowSize = 10;
    const tokenTotalPages = Math.max(totalPages, currentPage);
    const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
    const windowEnd = Math.min(tokenTotalPages, windowStart + windowSize - 1);
    const length = windowEnd - windowStart + 1;
    return Array.from({ length }, (_, i) => windowStart + i);
  }, [currentPage, pageModeEnabled, totalPages]);

  const renderProductRow = useCallback(
    ({ item, index }: ListRenderItemInfo<ProductView>) => (
      <Pressable
        onPress={() => handleSelectProduct(item)}
        onLayout={index === 0 ? handleFirstItemLayout : undefined}
        className="flex-row items-center px-6 py-5" style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
      >
        <View className="flex-1 flex-row items-center">
          <View className="w-16 h-16 rounded-xl overflow-hidden items-center justify-center mr-4 border border-gray-100" style={{ backgroundColor: colors.backgroundTertiary }}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={iconSize['2xl']} color="#c4c8cf" />
            )}
          </View>

          <View className="flex-1 min-w-[120px]">
            <Text
              style={{ fontFamily: "Montserrat", fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text
              style={{ fontFamily: "Montserrat", fontSize: fontSize.md, color: colors.textTertiary, marginTop: 2 }}
              numberOfLines={1}
            >
              {item.sku || item.upc || ""}
            </Text>
          </View>
        </View>

        <View className="w-40 items-center px-2 ml-[30px]">
          <Text
            style={{
              fontFamily: "Montserrat",
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              color: colors.text,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {(item.categoryName || "Uncategorized").toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <Text
            style={{
              fontFamily: "Montserrat",
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.bold,
              color: colors.text,
              transform: [{ translateX: -40 }],
            }}
          >
            ${item.salePrice.toFixed(2)}
          </Text>
        </View>
      </Pressable>
    ),
    [handleFirstItemLayout, handleSelectProduct]
  );

  useRenderTrace(
    "SearchProductModal",
    {
      visible: controlledVisible,
      controlled: isControlled,
      keepMountedHidden: !isOpenRef.current,
      searchQuery,
      paginationMode,
      pageSize: normalizedPageSize,
      currentPage,
      totalPages,
      totalCount,
      allProductsLength: allProducts.length,
      filteredProductsLength: filteredProducts.length,
      isLoading: listLoading,
      onClose,
      onSelectProduct,
      onVisible,
      onOpenStart,
      onOpenEnd,
      onCloseStart,
      onCloseEnd,
      onNextFrame,
      onAfterInteractions,
      onFirstListItemVisible,
      onOverlayLayout,
      onPanelLayout,
      onFilterReady,
      onFilterReadyQuery: debouncedSearchQuery,
    },
    { throttleMs: 100 }
  );

  // Disable all pointer events when modal is closed to prevent scanner input from going to search box
  const rootPointerEvents = isModalOpen ? "box-none" : "none";

  return (
    <View pointerEvents={rootPointerEvents} style={styles.rootContainer}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        onLayout={handleOverlayLayout}
      />

      <View ref={touchGateRef} pointerEvents="none" style={styles.backdropTouchGate}>
        <View pointerEvents="none" style={{ width: panelWidth }} />
        <Pressable style={styles.backdropPressArea} onPress={handleBackdropPress} />
      </View>

      <Animated.View
        pointerEvents={isModalOpen ? "auto" : "none"}
        style={[
          styles.panel,
          {
            width: panelWidth,
            transform: [{ translateX: panelTranslateX }],
          },
        ]}
        onLayout={handlePanelLayout}
      >
        <View style={[styles.panelTouchBlocker, safeAreaPadding]}>
          <View className="px-6 pt-6 pb-4 bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                style={{ fontFamily: "Montserrat", fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary }}
              >
                Search Products
              </Text>
              <Pressable
                onPress={handleCloseButtonPress}
                className="w-8 h-8 rounded-full items-center justify-center shadow-sm"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="close" size={iconSize.base} color="white" />
              </Pressable>
            </View>

            <View className="flex-row items-center bg-white border-2 rounded-xl px-4 py-2.5 shadow-sm" style={{ borderColor: colors.primary }}>
              <Ionicons name="search" size={iconSize.xl} color={colors.primary} />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-[20px]"
                style={{ fontFamily: "Montserrat", fontWeight: "500" }}
                placeholder="SI"
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={iconSize.lg} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {listLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="cube-outline" size={iconSize['5xl']} color={colors.borderMedium} />
              <Text style={{ fontFamily: "Montserrat" }} className="text-gray-400 mt-4 text-lg">
                No products found
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <FlatList
                data={filteredProducts}
                keyExtractor={keyExtractor}
                renderItem={renderProductRow}
                extraData={currentPage}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
                initialNumToRender={16}
                maxToRenderPerBatch={16}
                windowSize={7}
                removeClippedSubviews
              />
              {pageModeEnabled && (
                <View style={styles.paginationContainer}>
                  <Pressable
                    accessibilityLabel="search-products-prev-page"
                    onPress={handlePrevPage}
                    disabled={!canGoPrevPage}
                    style={[
                      styles.paginationButton,
                      !canGoPrevPage && styles.paginationButtonDisabled,
                    ]}
                  >
                    <Text style={styles.paginationButtonText}>Prev</Text>
                  </Pressable>

                  <View style={styles.pageButtonsContainer}>
                    {pageTokens.map((token) => {
                      const isActive = token === currentPage;
                      return (
                        <Pressable
                          key={`page-${token}`}
                          accessibilityLabel={`search-products-page-${token}`}
                          onPress={() => handleSelectPage(token)}
                          style={[
                            styles.pageButton,
                            isActive && styles.pageButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pageButtonText,
                              isActive && styles.pageButtonTextActive,
                            ]}
                          >
                            {token}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.totalPagesText}>{totalPagesText}</Text>

                  <Pressable
                    accessibilityLabel="search-products-next-page"
                    onPress={handleNextPage}
                    disabled={!canGoNextPage}
                    style={[
                      styles.paginationButton,
                      !canGoNextPage && styles.paginationButtonDisabled,
                    ]}
                  >
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  backdropTouchGate: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 1,
  },
  backdropPressArea: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
    zIndex: 2,
  },
  panelTouchBlocker: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  paginationButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#F3A9BC",
  },
  paginationButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  pageButtonsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  pageButton: {
    minWidth: 34,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageButtonText: {
    color: colors.text,
    fontFamily: "Montserrat",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  pageButtonTextActive: {
    color: "#FFFFFF",
  },
  totalPagesText: {
    marginRight: 8,
    color: colors.textSecondary,
    fontFamily: "Montserrat",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    minWidth: 82,
    textAlign: "right",
  },
});

function SearchProductModalWithData({
  modalRef,
  ...props
}: SearchProductModalWithDataProps) {
  const { products: allProducts, isLoading } = useProducts();
  return (
    <SearchProductModalCore
      ref={modalRef}
      {...props}
      allProducts={allProducts}
      isLoading={isLoading}
    />
  );
}

const SearchProductModalImpl = forwardRef<
  SearchProductModalHandle,
  SearchProductModalProps
>(function SearchProductModalImpl(props, ref) {
  if (props.paginationMode === "page") {
    return (
      <SearchProductModalCore
        ref={ref}
        {...props}
        allProducts={[]}
        isLoading={false}
      />
    );
  }

  if (props.products) {
    return (
      <SearchProductModalCore
        ref={ref}
        {...props}
        allProducts={props.products}
        isLoading={props.productsLoading ?? false}
      />
    );
  }
  return <SearchProductModalWithData {...props} modalRef={ref} />;
});

function areSearchProductModalPropsEqual(
  prev: SearchProductModalProps,
  next: SearchProductModalProps
): boolean {
  const prevIsControlled = typeof prev.visible === "boolean";
  const nextIsControlled = typeof next.visible === "boolean";

  if (prevIsControlled !== nextIsControlled) {
    return false;
  }

  if (prevIsControlled && !prev.visible && !next.visible) {
    if (__DEV__) {
      hiddenSkipCount += 1;
      if (hiddenSkipCount === 1 || hiddenSkipCount % 20 === 0) {
        console.log("[RenderMark][SearchProductModal]", {
          stage: "hidden_skip",
          count: hiddenSkipCount,
        });
      }
    }
    return true;
  }

  return (
    prev.visible === next.visible &&
    prev.onClose === next.onClose &&
    prev.onSelectProduct === next.onSelectProduct &&
    prev.products === next.products &&
    prev.productsLoading === next.productsLoading &&
    prev.paginationMode === next.paginationMode &&
    prev.pageSize === next.pageSize &&
    prev.onVisible === next.onVisible &&
    prev.onOpenStart === next.onOpenStart &&
    prev.onOpenEnd === next.onOpenEnd &&
    prev.onCloseStart === next.onCloseStart &&
    prev.onCloseEnd === next.onCloseEnd &&
    prev.onNextFrame === next.onNextFrame &&
    prev.onAfterInteractions === next.onAfterInteractions &&
    prev.onFirstListItemVisible === next.onFirstListItemVisible &&
    prev.onOverlayLayout === next.onOverlayLayout &&
    prev.onPanelLayout === next.onPanelLayout &&
    prev.onFilterReady === next.onFilterReady
  );
}

const MemoizedSearchProductModal = React.memo(
  SearchProductModalImpl,
  areSearchProductModalPropsEqual
);
MemoizedSearchProductModal.displayName = "SearchProductModal";
export const SearchProductModal = MemoizedSearchProductModal;
