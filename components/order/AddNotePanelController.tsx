/**
 * AddNotePanelController - 控制 Add Note 左弹窗
 *
 * 使用 LeftSlidePanel（与 Search Product 相同的左滑弹窗样式）
 * 包含：Search for Customer by, Payment Terms, Invoice Due Date, Order Number,
 * Shipping Type, Notes, Add New Customer, Add Customer
 *
 * AddQuickCustomerModal 在 Controller 层级渲染（与 LeftSlidePanel 并列），
 * 避免在 Panel 内渲染导致的弹窗被遮挡问题。
 */

import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import type { QuickCustomerResult } from "../AddQuickCustomerModal";
import { AddQuickCustomerModal } from "../AddQuickCustomerModal";
import { LeftSlidePanel, LeftSlidePanelHandle } from "../LeftSlidePanel";
import { OrderSettingsAndCustomerForm } from "./OrderSettingsAndCustomerForm";
import { ModalControllerHandle, useModalVisibilityRef } from "./modalVisibilityController";

export interface AddNotePanelControllerHandle extends ModalControllerHandle {}

export interface OrderSettingsType {
  paymentTerms?: string;
  shippingType?: string;
  orderNumber?: string;
  invoiceDueDate?: string;
  notesInternal?: string;
  notesInvoice?: string;
}

interface AddNotePanelControllerProps {
  onVisibleStateChange?: (visible: boolean) => void;
  onSelectCustomer?: (customer: QuickCustomerResult) => void;
  currentCustomer?: QuickCustomerResult | null;
  orderSettings?: OrderSettingsType;
  onOrderSettingsChange?: (settings: Partial<OrderSettingsType>) => void;
}

const AddNotePanelControllerInner = forwardRef<
  AddNotePanelControllerHandle,
  AddNotePanelControllerProps
>(function AddNotePanelControllerInner(
  {
    onVisibleStateChange,
    onSelectCustomer,
    orderSettings,
    onOrderSettingsChange,
  },
  ref
) {
  const panelRef = useRef<LeftSlidePanelHandle>(null);
  const { visibleRef, setVisibleRef, isVisible } =
    useModalVisibilityRef(onVisibleStateChange);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickModalCustomerId, setQuickModalCustomerId] = useState<number | null>(null);

  const dismiss = useCallback(
    (reason = "manual") => {
      const panelOpen = panelRef.current?.isOpen?.() ?? false;
      if (!panelOpen && !visibleRef.current) return;
      panelRef.current?.close(reason);
      setVisibleRef(false);
    },
    [setVisibleRef, visibleRef]
  );

  const open = useCallback(() => {
    const panelOpen = panelRef.current?.isOpen?.() ?? false;
    if (panelOpen && visibleRef.current) return;
    setVisibleRef(true);
    panelRef.current?.open();
  }, [setVisibleRef, visibleRef]);

  const handleCloseRequest = useCallback(
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

  const handleSelectCustomer = useCallback(
    (customer: QuickCustomerResult) => {
      onSelectCustomer?.(customer);
      dismiss("select_customer");
    },
    [dismiss, onSelectCustomer]
  );

  const handleFormDismiss = useCallback(() => {
    dismiss("add_customer_button");
  }, [dismiss]);

  const handleOpenAddQuickCustomer = useCallback(() => {
    setQuickModalCustomerId(null);
    setShowQuickCustomerModal(true);
  }, []);

  const handleSaveQuickCustomer = useCallback(
    (customer: QuickCustomerResult) => {
      onSelectCustomer?.(customer);
      setQuickModalCustomerId(null);
      setShowQuickCustomerModal(false);
      dismiss("select_customer");
    },
    [dismiss, onSelectCustomer]
  );

  const handleCloseQuickCustomerModal = useCallback(() => {
    setQuickModalCustomerId(null);
    setShowQuickCustomerModal(false);
  }, []);

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
    <>
      <LeftSlidePanel
        ref={panelRef}
        onClose={handleCloseRequest}
        title="Add Note"
        body={
          <OrderSettingsAndCustomerForm
            orderSettings={orderSettings}
            onOrderSettingsChange={onOrderSettingsChange}
            onSelectCustomer={handleSelectCustomer}
            onDismiss={handleFormDismiss}
            onOpenAddQuickCustomer={handleOpenAddQuickCustomer}
          />
        }
      />
      <AddQuickCustomerModal
        visible={showQuickCustomerModal}
        onClose={handleCloseQuickCustomerModal}
        onSave={handleSaveQuickCustomer}
        customerId={quickModalCustomerId}
      />
    </>
  );
});

export const AddNotePanelController = React.memo(AddNotePanelControllerInner);
AddNotePanelController.displayName = "AddNotePanelController";
