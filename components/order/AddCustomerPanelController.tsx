/**
 * AddCustomerPanelController - 控制 Add Customer 左滑弹窗
 *
 * 使用 LeftSlidePanel（与 Add Note、Search Product 相同的左滑弹窗模板）
 * 保持 Customer 页面与订单流程的 Add Note、Add Product 侧边栏风格一致
 */

import { colors } from "@/utils/theme";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { View } from "react-native";
import {
  NewCustomerForm,
  type NewCustomerData,
  type NewCustomerFormRef,
} from "../NewCustomerForm";
import { LeftSlidePanel, LeftSlidePanelHandle } from "../LeftSlidePanel";
import { ThemedButton } from "../ThemedButton";
import {
  ModalControllerHandle,
  useModalVisibilityRef,
} from "./modalVisibilityController";

export interface AddCustomerPanelControllerHandle extends ModalControllerHandle {}

export interface AddCustomerPanelControllerProps {
  onSave?: (customer: NewCustomerData) => void;
  onVisibleStateChange?: (visible: boolean) => void;
}

const AddCustomerPanelControllerInner = forwardRef<
  AddCustomerPanelControllerHandle,
  AddCustomerPanelControllerProps
>(function AddCustomerPanelControllerInner(
  { onSave, onVisibleStateChange },
  ref
) {
  const panelRef = useRef<LeftSlidePanelHandle>(null);
  const formRef = useRef<NewCustomerFormRef>(null);
  const { visibleRef, setVisibleRef, isVisible } =
    useModalVisibilityRef(onVisibleStateChange);

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

  const handleSave = useCallback(
    (customer: NewCustomerData) => {
      onSave?.(customer);
      dismiss("save");
    },
    [dismiss, onSave]
  );

  const handleCreatePress = useCallback(() => {
    const ok = formRef.current?.submit();
    if (ok) {
      dismiss("save");
    }
  }, [dismiss]);

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
    <LeftSlidePanel
      ref={panelRef}
      onClose={handleCloseRequest}
      title="Add Customer"
      body={
        <NewCustomerForm
          ref={formRef}
          onSave={handleSave}
          embedded
        />
      }
      footer={
        <View className="flex-row gap-4 flex-1">
          <ThemedButton
            title="Cancel"
            variant="outline"
            onPress={() => dismiss("cancel")}
            fullWidth
            size="lg"
            textStyle={{ fontSize: 16 }}
          />
          <ThemedButton
            title="Create Customer"
            onPress={handleCreatePress}
            fullWidth
            style={{ flex: 1, backgroundColor: colors.primary }}
          />
        </View>
      }
    />
  );
});

export const AddCustomerPanelController = React.memo(
  AddCustomerPanelControllerInner
);
AddCustomerPanelController.displayName = "AddCustomerPanelController";
