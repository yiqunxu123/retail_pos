import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  SearchCustomerModal,
  SearchCustomerModalProps,
} from "../SearchCustomerModal";
import type { QuickCustomerResult } from "../AddQuickCustomerModal";
import { useRenderTrace } from "../../utils/debug/useRenderTrace";
import {
  ModalControllerHandle,
  useModalVisibilityState,
} from "./modalVisibilityController";
import { useModalOpenPerf } from "./useModalOpenPerf";

export type SearchCustomerModalControllerHandle = ModalControllerHandle;

interface SearchCustomerModalControllerProps {
  onSelectCustomer: (customer: QuickCustomerResult) => void;
  currentCustomer?: QuickCustomerResult | null;
  orderSettings?: SearchCustomerModalProps["orderSettings"];
  onOrderSettingsChange?: SearchCustomerModalProps["onOrderSettingsChange"];
  onVisibleStateChange?: (visible: boolean) => void;
}

const SearchCustomerModalControllerInner = forwardRef<
  SearchCustomerModalControllerHandle,
  SearchCustomerModalControllerProps
>(function SearchCustomerModalControllerInner(
  {
    onSelectCustomer,
    currentCustomer,
    orderSettings,
    onOrderSettingsChange,
    onVisibleStateChange,
  },
  ref
) {
  const { visible, open: openRaw, close, isVisible } =
    useModalVisibilityState(onVisibleStateChange);
  const { markOpenClick } = useModalOpenPerf("add_quick_customer", visible);

  const open = useCallback(() => {
    if (isVisible()) return;
    markOpenClick();
    openRaw();
  }, [isVisible, markOpenClick, openRaw]);

  useRenderTrace(
    "SearchCustomerModalController",
    {
      visible,
      onSelectCustomer,
      currentCustomerId: currentCustomer?.id ?? null,
      paymentTerms: orderSettings?.paymentTerms ?? null,
      shippingType: orderSettings?.shippingType ?? null,
      onOrderSettingsChange,
      onVisibleStateChange,
    },
    { throttleMs: 100 }
  );

  const handleModalClose = useCallback(() => {
    close();
  }, [close]);

  const handleSelectCustomer = useCallback(
    (customer: QuickCustomerResult) => {
      onSelectCustomer(customer);
      close();
    },
    [close, onSelectCustomer]
  );

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
    <SearchCustomerModal
      visible={visible}
      onClose={handleModalClose}
      onSelectCustomer={handleSelectCustomer}
      currentCustomer={currentCustomer}
      orderSettings={orderSettings}
      onOrderSettingsChange={onOrderSettingsChange}
    />
  );
});

export const SearchCustomerModalController = React.memo(
  SearchCustomerModalControllerInner
);
SearchCustomerModalController.displayName = "SearchCustomerModalController";
