import { colors } from "@/utils/theme";
import React, { useRef } from "react";
import { View } from "react-native";
import type { NewCustomerData } from "./NewCustomerForm";
import { NewCustomerForm } from "./NewCustomerForm";
import { SlidePanelModal } from "./SlidePanelModal";
import { ThemedButton } from "./ThemedButton";

export type { NewCustomerData } from "./NewCustomerForm";

interface NewCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customer: NewCustomerData) => void;
  initialData?: Partial<NewCustomerData>;
  isEditing?: boolean;
}

/**
 * NewCustomerModal - Full customer creation/edit form (SlidePanelModal 版本)
 * 用于需要传统 Modal 弹窗的场景。Customer 页面建议使用 AddCustomerPanelController（LeftSlidePanel）
 */
export function NewCustomerModal({
  visible,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}: NewCustomerModalProps) {
  const formRef = useRef<import("./NewCustomerForm").NewCustomerFormRef>(null);

  const handleSave = () => {
    formRef.current?.submit();
  };

  return (
    <SlidePanelModal
      visible={visible}
      onClose={onClose}
      title={isEditing ? "Edit Customer" : "New Customer"}
      scrollable={true}
      contentPadding={{ horizontal: 24, bottom: 100 }}
      footer={
        <View className="flex-row gap-4 flex-1">
          <ThemedButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            fullWidth
            size="lg"
            textStyle={{ fontSize: 16 }}
          />
          <ThemedButton
            title={isEditing ? "Save Changes" : "Create Customer"}
            onPress={handleSave}
            fullWidth
            style={{ flex: 1, backgroundColor: colors.primary }}
          />
        </View>
      }
    >
      <NewCustomerForm
        ref={formRef}
        initialData={initialData}
        isEditing={isEditing}
        onSave={(data) => {
          onSave(data);
          onClose();
        }}
        embedded={false}
      />
    </SlidePanelModal>
  );
}
