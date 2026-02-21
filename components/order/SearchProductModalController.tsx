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
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import {
  ModalControllerHandle,
  useModalVisibilityRef,
} from "./modalVisibilityController";

export type SearchModalOpenSource = "top_bar" | "table_empty" | "sidebar";
type SearchModalDismissReason =
  | "manual"
  | "close_button"
  | "backdrop"
  | "hardware_back"
  | "select_product";

export interface SearchProductModalControllerHandle extends ModalControllerHandle {
  open: (source?: SearchModalOpenSource) => void;
}

interface SearchProductModalControllerProps {
  onSelectProduct: (product: SearchProduct) => void;
  onVisibleStateChange?: (visible: boolean) => void;
}

const SEARCH_PRODUCT_MODAL_PAGE_SIZE = 10;

const SearchProductModalControllerInner = forwardRef<
  SearchProductModalControllerHandle,
  SearchProductModalControllerProps
>(function SearchProductModalControllerInner(
  { onSelectProduct, onVisibleStateChange },
  ref
) {
  const modalRef = useRef<SearchProductModalHandle>(null);
  const { visibleRef, setVisibleRef, isVisible } =
    useModalVisibilityRef(onVisibleStateChange);

  useRenderTrace(
    "SearchProductModalController",
    {
      visible: visibleRef.current,
      onSelectProduct,
      onVisibleStateChange,
    },
    { throttleMs: 100 }
  );

  const dismiss = useCallback(
    (reason: SearchModalDismissReason = "manual") => {
      const modalOpen = modalRef.current?.isOpen?.() ?? false;
      if (!modalOpen && !visibleRef.current) return;
      modalRef.current?.close(reason);
      setVisibleRef(false);
    },
    [setVisibleRef, visibleRef]
  );

  const open = useCallback(
    (_source: SearchModalOpenSource = "top_bar") => {
      const modalOpen = modalRef.current?.isOpen?.() ?? false;
      if (modalOpen && visibleRef.current) return;
      setVisibleRef(true);
      modalRef.current?.open();
    },
    [setVisibleRef, visibleRef]
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
      isVisible,
    }),
    [dismiss, isVisible, open]
  );

  return (
    <SearchProductModal
      ref={modalRef}
      onClose={handleModalCloseRequest}
      onSelectProduct={handleSelectProduct}
      paginationMode="page"
      pageSize={SEARCH_PRODUCT_MODAL_PAGE_SIZE}
    />
  );
});

export const SearchProductModalController = React.memo(
  SearchProductModalControllerInner
);
SearchProductModalController.displayName = "SearchProductModalController";
