/**
 * ProductSearchTemplate - 公共产品搜索 UI 模板组件
 *
 * 提供搜索框 + 产品列表 + 可选分页。
 * 可嵌入：弹窗 (Modal)、全屏页面、或任意容器。
 *
 * 弹窗内使用 (如 SearchProductModal):
 *   <ProductSearchTemplate
 *     title="Search Products"
 *     searchQuery={query}
 *     onSearchChange={setQuery}
 *     products={products}
 *     isLoading={loading}
 *     onSelectProduct={handleSelect}
 *     onClose={handleClose}
 *     pagination={paginationProps}
 *   />
 *
 * 全屏页面使用:
 *   const { products, isLoading } = useProducts();
 *   const [query, setQuery] = useState("");
 *   const filtered = useMemo(() => filterByQuery(products, query), [products, query]);
 *   return (
 *     <View className="flex-1">
 *       <ProductSearchTemplate
 *         title="Search Products"
 *         searchQuery={query}
 *         onSearchChange={setQuery}
 *         products={filtered}
 *         isLoading={isLoading}
 *         onSelectProduct={handleSelect}
 *       />
 *     </View>
 *   );
 */

import { colors, iconSize } from '@/utils/theme';
import { Ionicons } from "@expo/vector-icons";
import { CloseButton } from "./CloseButton";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ProductView } from "../utils/powersync/hooks/useProducts";

export interface SearchProductResult {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface ProductSearchTemplatePagination {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  isLoading?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSelectPage: (page: number) => void;
}

export interface ProductSearchTemplateProps {
  title?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  products: ProductView[];
  isLoading?: boolean;
  onSelectProduct: (product: SearchProductResult) => void;
  emptyMessage?: string;
  onClose?: () => void;
  pagination?: ProductSearchTemplatePagination;
  /** Custom render for product row; defaults to built-in row */
  renderProductRow?: (item: ProductView, index: number) => React.ReactElement;
  /** 嵌入模式：不渲染标题和关闭按钮，仅渲染搜索框+列表+分页（由父级 LeftSlidePanel 提供 header） */
  embedded?: boolean;
}

const DEFAULT_EMPTY_MESSAGE = "No products found";

function toSearchProductResult(product: ProductView): SearchProductResult {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku || product.upc || "",
    category: product.categoryName || "Uncategorized",
    quantity: 0,
    price: product.salePrice,
    image: product.images?.[0],
  };
}

function DefaultProductRow({
  item,
  onPress,
}: {
  item: ProductView;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-5"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
    >
      <View className="flex-1 flex-row items-center">
        <View
          className="w-16 h-16 rounded-xl overflow-hidden items-center justify-center mr-4 border border-gray-100"
          style={{ backgroundColor: colors.backgroundTertiary }}
        >
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="cube-outline"
              size={iconSize['2xl']}
              color="#c4c8cf"
            />
          )}
        </View>

        <View className="flex-1 min-w-[120px]">
          <Text
            className="text-lg font-bold"
            style={{ color: colors.text }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            className="text-sm"
            style={{ color: colors.textTertiary, marginTop: 2 }}
            numberOfLines={1}
          >
            {item.sku || item.upc || ""}
          </Text>
        </View>
      </View>

      <View className="w-40 items-center px-2 ml-[30px]">
        <Text
          className="text-base font-semibold"
          style={{ color: colors.text, textAlign: "center" }}
          numberOfLines={1}
        >
          {(item.categoryName || "Uncategorized").toUpperCase()}
        </Text>
      </View>

      <View className="flex-1 items-end">
        <Text
          className="text-2xl font-bold"
          style={{ color: colors.text, transform: [{ translateX: -40 }] }}
        >
          ${item.salePrice.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProductSearchTemplate({
  title = "Search Products",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "SI",
  products,
  isLoading = false,
  onSelectProduct,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onClose,
  pagination,
  renderProductRow,
  embedded = false,
}: ProductSearchTemplateProps) {
  const handleSelectProduct = useCallback(
    (product: ProductView) => {
      onSelectProduct(toSearchProductResult(product));
    },
    [onSelectProduct]
  );

  const keyExtractor = useCallback((item: ProductView) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProductView>) => {
      if (renderProductRow) {
        return renderProductRow(item, index);
      }
      return (
        <DefaultProductRow
          item={item}
          onPress={() => handleSelectProduct(item)}
        />
      );
    },
    [handleSelectProduct, renderProductRow]
  );

  const pageTokens = React.useMemo(() => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
    const windowSize = 10;
    const tokenTotalPages = Math.max(totalPages, currentPage);
    const windowStart =
      Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
    const windowEnd = Math.min(tokenTotalPages, windowStart + windowSize - 1);
    const length = windowEnd - windowStart + 1;
    return Array.from({ length }, (_, i) => windowStart + i);
  }, [pagination]);

  const canGoPrevPage = pagination && pagination.currentPage > 1;
  const canGoNextPage =
    pagination && pagination.currentPage < pagination.totalPages;
  const totalPagesText = pagination?.isLoading
    ? "Total ... pages"
    : pagination
      ? `Total ${pagination.totalPages} pages`
      : "";

  return (
    <View style={styles.container}>
      {/* Header: 仅非 embedded 时渲染标题+关闭（与 LeftSlidePanel/ActionCard 一致） */}
      {!embedded && (
        <View className="px-6 pt-6 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
              {title}
            </Text>
            {onClose && <CloseButton onPress={onClose} />}
          </View>
        </View>
      )}

      {/* Search Input */}
      <View className={embedded ? "px-6 pt-4 pb-4 bg-white" : "px-6 pb-4 bg-white"}>
        <View
          className="flex-row items-center bg-white border-2 rounded-xl px-3 py-3 shadow-sm"
          style={{ borderColor: colors.primary }}
        >
          <Ionicons name="search" size={iconSize.xl} color={colors.primary} />
          <TextInput
            className="flex-1 ml-3 text-gray-800 text-lg"
            style={{ fontWeight: "500" }}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange("")}>
              <Ionicons
                name="close-circle"
                size={iconSize.lg}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons
            name="cube-outline"
            size={iconSize['5xl']}
            color={colors.borderMedium}
          />
          <Text className="text-gray-400 mt-4 text-lg">{emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={products}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={pagination?.currentPage}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
            initialNumToRender={16}
            maxToRenderPerBatch={16}
            windowSize={7}
            removeClippedSubviews
          />
          {pagination && (
            <View style={styles.paginationContainer}>
              <Pressable
                accessibilityLabel="search-products-prev-page"
                onPress={pagination.onPrevPage}
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
                  const isActive = token === pagination.currentPage;
                  return (
                    <Pressable
                      key={`page-${token}`}
                      accessibilityLabel={`search-products-page-${token}`}
                      onPress={() => pagination.onSelectPage(token)}
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
                onPress={pagination.onNextPage}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    fontWeight: "700",
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  pageButtonTextActive: {
    color: "#FFFFFF",
  },
  totalPagesText: {
    marginRight: 8,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 82,
    textAlign: "right",
  },
});
