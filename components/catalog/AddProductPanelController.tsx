/**
 * AddProductPanelController - 控制 Add Product 左滑弹窗
 *
 * 使用 LeftSlidePanel（与 Add Note、Add Customer 相同的左滑弹窗模板）
 * 在 Catalog 页面侧边栏点击 Add Product 时弹出，展示完整的产品创建表单
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
  AddProductForm,
  type AddProductFormRef,
} from "./AddProductForm";
import { LeftSlidePanel, LeftSlidePanelHandle } from "../LeftSlidePanel";
import { ThemedButton } from "../ThemedButton";
import {
  ModalControllerHandle,
  useModalVisibilityRef,
} from "../order/modalVisibilityController";

export interface AddProductPanelControllerHandle extends ModalControllerHandle {}

export interface AddProductPanelControllerProps {
  onVisibleStateChange?: (visible: boolean) => void;
  /** 产品保存成功后的回调（如刷新列表） */
  onSaveSuccess?: () => void;
}

const AddProductPanelControllerInner = forwardRef<
  AddProductPanelControllerHandle,
  AddProductPanelControllerProps
>(function AddProductPanelControllerInner(
  { onVisibleStateChange, onSaveSuccess },
  ref
) {
  const panelRef = useRef<LeftSlidePanelHandle>(null);
  const formRef = useRef<AddProductFormRef>(null);
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

  const handleSaveSuccess = useCallback(() => {
    onSaveSuccess?.();
    dismiss("save");
  }, [dismiss, onSaveSuccess]);

  const handleSavePress = useCallback(() => {
    formRef.current?.submit();
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
    <LeftSlidePanel
      ref={panelRef}
      onClose={handleCloseRequest}
      title="Add Product"
      body={
        <View className="flex-1" style={{ minHeight: 400 }}>
          <AddProductForm
            ref={formRef}
            onSaveSuccess={handleSaveSuccess}
          />
        </View>
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
            title="Save"
            onPress={handleSavePress}
            fullWidth
            style={{ flex: 1, backgroundColor: colors.primary }}
          />
        </View>
      }
    />
  );
});

export const AddProductPanelController = React.memo(
  AddProductPanelControllerInner
);
AddProductPanelController.displayName = "AddProductPanelController";
