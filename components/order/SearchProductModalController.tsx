import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import {
  SearchProduct,
  SearchProductModal,
  SearchProductModalHandle,
} from "../SearchProductModal";
import type { ProductView } from "../../utils/powersync/hooks/useProducts";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";

export type SearchModalOpenSource = "top_bar" | "table_empty" | "sidebar";
type SearchModalDismissReason =
  | "manual"
  | "close_button"
  | "backdrop"
  | "hardware_back"
  | "select_product";

export interface SearchProductModalControllerHandle {
  open: (source?: SearchModalOpenSource) => void;
  close: () => void;
  isVisible: () => boolean;
}

interface SearchProductModalControllerProps {
  products: ProductView[];
  productsLoading: boolean;
  onSelectProduct: (product: SearchProduct) => void;
  onVisibleStateChange?: (visible: boolean) => void;
}

const SearchProductModalControllerInner = forwardRef<
  SearchProductModalControllerHandle,
  SearchProductModalControllerProps
>(function SearchProductModalControllerInner(
  { products, productsLoading, onSelectProduct, onVisibleStateChange },
  ref
) {
  const modalRef = useRef<SearchProductModalHandle>(null);
  const visibleRef = useRef(false);

  useRenderTrace(
    "SearchProductModalController",
    {
      visible: visibleRef.current,
      productsLength: products.length,
      productsLoading,
      onSelectProduct,
      onVisibleStateChange,
    },
    { throttleMs: 100 }
  );

  const dismiss = useCallback(
    (reason: SearchModalDismissReason = "manual") => {
      if (!modalRef.current?.isOpen() && !visibleRef.current) return;
      modalRef.current?.close(reason);
      visibleRef.current = false;
      onVisibleStateChange?.(false);
    },
    [onVisibleStateChange]
  );

  const open = useCallback(
    (_source: SearchModalOpenSource = "top_bar") => {
      if (visibleRef.current) return;
      visibleRef.current = true;
      onVisibleStateChange?.(true);
      modalRef.current?.open();
    },
    [onVisibleStateChange]
  );

  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      onSelectProduct(product);
      dismiss("select_product");
    },
    [dismiss, onSelectProduct]
  );

  const handleModalCloseRequest = useCallback(
    (reason?: string) => {
      if (reason === "close_button") {
        dismiss("close_button");
        return;
      }
      if (reason === "backdrop") {
        dismiss("backdrop");
        return;
      }
      if (reason === "hardware_back") {
        dismiss("hardware_back");
        return;
      }
      dismiss("manual");
    },
    [dismiss]
  );

  useImperativeHandle(
    ref,
    () => ({
      open,
      close: () => dismiss("manual"),
      isVisible: () => visibleRef.current,
    }),
    [dismiss, open]
  );

  return (
    <SearchProductModal
      ref={modalRef}
      onClose={handleModalCloseRequest}
      onSelectProduct={handleSelectProduct}
      products={products}
      productsLoading={productsLoading}
    />
  );
});

export const SearchProductModalController = React.memo(
  SearchProductModalControllerInner
);
SearchProductModalController.displayName = "SearchProductModalController";
