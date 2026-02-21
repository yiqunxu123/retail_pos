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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRenderTrace } from "../utils/debug/useRenderTrace";
import { useProducts } from "../utils/powersync/hooks";
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
    allProducts,
    isLoading,
  },
  ref
) {
  const isControlled = typeof visible === "boolean";
  const controlledVisible = visible ?? false;
  const { width } = useWindowDimensions();
  const panelWidth = Math.max(1, Math.round(width * PANEL_WIDTH_RATIO));

  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredResult = useMemo(() => {
    const start = Date.now();
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
  }, [allProducts, searchQuery]);
  const filteredProducts = filteredResult.items;

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
    if (!isOpenRef.current || isLoading || filterReadyReportedRef.current) return;
    filterReadyReportedRef.current = true;
    onFilterReady?.({
      displayCount: filteredProducts.length,
      query: searchQueryRef.current.trim(),
      filterMs: filteredResult.filterMs,
    });
  }, [filteredProducts.length, filteredResult.filterMs, isLoading, onFilterReady]);

  const maybeReportFirstRowVisible = useCallback(() => {
    if (!isOpenRef.current || isLoading || filteredProducts.length === 0 || firstItemReportedRef.current) {
      return;
    }
    firstItemReportedRef.current = true;
    onFirstListItemVisible?.({
      displayCount: filteredProducts.length,
      query: searchQueryRef.current.trim(),
    });
  }, [filteredProducts.length, isLoading, onFirstListItemVisible]);

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
        setTouchGateEnabled(false);
        onCloseEnd?.(reason);
        if (searchQueryRef.current) {
          setSearchQuery("");
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

  const renderProductRow = useCallback(
    ({ item, index }: ListRenderItemInfo<ProductView>) => (
      <Pressable
        onPress={() => handleSelectProduct(item)}
        onLayout={index === 0 ? handleFirstItemLayout : undefined}
        className="flex-row items-center px-6 py-5 border-b border-[#F0F1F4]"
      >
        <View className="flex-1 flex-row items-center">
          <View className="w-16 h-16 rounded-xl bg-[#F7F7F9] overflow-hidden items-center justify-center mr-4 border border-gray-100">
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={32} color="#c4c8cf" />
            )}
          </View>

          <View className="flex-1 min-w-[120px]">
            <Text
              style={{ fontFamily: "Montserrat", fontSize: 16, fontWeight: "700", color: "#1A1A1A" }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text
              style={{ fontFamily: "Montserrat", fontSize: 12, color: "#9CA3AF", marginTop: 2 }}
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
              fontSize: 14,
              fontWeight: "600",
              color: "#1A1A1A",
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
              fontSize: 22,
              fontWeight: "700",
              color: "#1A1A1A",
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
      allProductsLength: allProducts.length,
      filteredProductsLength: filteredProducts.length,
      isLoading,
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
    },
    { throttleMs: 100 }
  );

  return (
    <View pointerEvents="box-none" style={styles.rootContainer}>
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
        style={[
          styles.panel,
          {
            width: panelWidth,
            transform: [{ translateX: panelTranslateX }],
          },
        ]}
        onLayout={handlePanelLayout}
      >
        <View style={styles.panelTouchBlocker}>
          <View className="px-6 pt-6 pb-4 bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                style={{ fontFamily: "Montserrat", fontSize: 24, fontWeight: "700", color: "#EC1A52" }}
              >
                Search Products
              </Text>
              <Pressable
                onPress={handleCloseButtonPress}
                className="w-8 h-8 rounded-full bg-[#EC1A52] items-center justify-center shadow-sm"
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>

            <View className="flex-row items-center bg-white border-2 border-[#EC1A52] rounded-xl px-4 py-2.5 shadow-sm">
              <Ionicons name="search" size={24} color="#EC1A52" />
              <TextInput
                className="flex-1 ml-3 text-gray-800 text-[20px]"
                style={{ fontFamily: "Montserrat", fontWeight: "500" }}
                placeholder="SI"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={22} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#EC1A52" />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              <Text style={{ fontFamily: "Montserrat" }} className="text-gray-400 mt-4 text-lg">
                No products found
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={keyExtractor}
              renderItem={renderProductRow}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
              initialNumToRender={16}
              maxToRenderPerBatch={16}
              windowSize={7}
              removeClippedSubviews
            />
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
    borderColor: "#E5E7EB",
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
