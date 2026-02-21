import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  BarcodePrintModal,
  CartItem,
} from "../BarcodePrintModal";
import type { ProductView } from "../../utils/powersync/hooks/useProducts";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import {
  ModalControllerHandle,
  useModalVisibilityState,
} from "./modalVisibilityController";
import { useModalOpenPerf } from "./useModalOpenPerf";

export type BarcodePrintModalControllerHandle = ModalControllerHandle;

interface BarcodePrintModalControllerProps {
  cartItems?: CartItem[];
  products: ProductView[];
  productsLoading: boolean;
  onVisibleStateChange?: (visible: boolean) => void;
}

const BarcodePrintModalControllerInner = forwardRef<
  BarcodePrintModalControllerHandle,
  BarcodePrintModalControllerProps
>(function BarcodePrintModalControllerInner(
  { cartItems, products, productsLoading, onVisibleStateChange },
  ref
) {
  const { visible, open: openRaw, close, isVisible } =
    useModalVisibilityState(onVisibleStateChange);
  const { markOpenClick } = useModalOpenPerf("print_barcode", visible);

  const open = useCallback(() => {
    if (isVisible()) return;
    markOpenClick();
    openRaw();
  }, [isVisible, markOpenClick, openRaw]);

  useRenderTrace(
    "BarcodePrintModalController",
    {
      visible,
      cartItemsLength: cartItems?.length ?? 0,
      productsLength: products.length,
      productsLoading,
      onVisibleStateChange,
    },
    { throttleMs: 100 }
  );

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
      isVisible,
    }),
    [close, isVisible, open]
  );

  return (
    <BarcodePrintModal
      visible={visible}
      onClose={handleClose}
      cartItems={cartItems}
      products={products}
      productsLoading={productsLoading}
    />
  );
});

export const BarcodePrintModalController = React.memo(
  BarcodePrintModalControllerInner
);
BarcodePrintModalController.displayName = "BarcodePrintModalController";
