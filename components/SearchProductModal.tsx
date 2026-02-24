import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { LeftSlidePanel, LeftSlidePanelHandle } from "./LeftSlidePanel";
import { ProductSearchTemplate } from "./ProductSearchTemplate";
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
  const pageModeEnabled = paginationMode === "page";
  const normalizedPageSize = Math.max(1, Math.floor(pageSize || DEFAULT_PAGE_SIZE));
  const panelRef = useRef<LeftSlidePanelHandle>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchQueryRef = useRef(searchQuery);

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

  useImperativeHandle(
    ref,
    () => ({
      open: () => panelRef.current?.open(),
      close: (reason = "manual") => panelRef.current?.close(reason),
      isOpen: () => panelRef.current?.isOpen() ?? false,
    }),
    []
  );

  const handleCloseRequest = useCallback(
    (reason?: string) => {
      onClose(reason);
    },
    [onClose]
  );

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);
  const handleSelectPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const paginationProps = pageModeEnabled
    ? {
        currentPage,
        totalPages,
        totalCount,
        isLoading: pageInfoLoading,
        onPrevPage: handlePrevPage,
        onNextPage: handleNextPage,
        onSelectPage: handleSelectPage,
      }
    : undefined;

  useRenderTrace(
    "SearchProductModal",
    {
      visible: controlledVisible,
      controlled: isControlled,
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

  return (
    <LeftSlidePanel
      ref={panelRef}
      visible={isControlled ? controlledVisible : undefined}
      onClose={handleCloseRequest}
      title="Search Products"
      body={
        <ProductSearchTemplate
          embedded
          title="Search Products"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="SI"
          products={filteredProducts}
          isLoading={listLoading}
          onSelectProduct={onSelectProduct}
          emptyMessage="No products found"
          pagination={paginationProps}
        />
      }
    />
  );
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
