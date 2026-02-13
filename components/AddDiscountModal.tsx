import { useEffect, useMemo, useState } from "react";
import { AmountPadModal } from "./AmountPadModal";

type DiscountType = "percentage" | "fixed";

interface AddDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (discount: number, type: DiscountType) => void;
  subTotal: number;
}

/**
 * AddDiscountModal - business logic wrapper around shared AmountPadModal UI.
 */
export function AddDiscountModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: AddDiscountModalProps) {
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDiscountValue("");
    setDiscountType("percentage");
    setShowTypeDropdown(false);
  }, [visible]);

  const discountNum = useMemo(() => Number.parseFloat(discountValue) || 0, [discountValue]);
  const discountAmount = useMemo(
    () => (discountType === "percentage" ? (subTotal * discountNum) / 100 : discountNum),
    [discountType, subTotal, discountNum]
  );
  const totalAfterDiscount = useMemo(
    () => Math.max(0, subTotal - discountAmount),
    [subTotal, discountAmount]
  );

  const handleNumberPress = (num: string) => {
    if (discountType === "percentage") {
      const next = discountValue + num;
      if ((Number.parseFloat(next) || 0) <= 100) {
        setDiscountValue(next);
      }
      return;
    }
    setDiscountValue((prev) => prev + num);
  };

  const handleDecimalPress = () => {
    if (discountType !== "fixed") return;
    setDiscountValue((prev) => (prev.includes(".") ? prev : prev ? `${prev}.` : "0."));
  };

  const handleConfirm = () => {
    onConfirm(discountNum, discountType);
    setDiscountValue("");
  };

  return (
    <AmountPadModal
      visible={visible}
      onClose={onClose}
      title="Add Discount"
      typeLabel={discountType === "percentage" ? "Percentage (%)" : "Fixed ($)"}
      typeOptions={[
        { value: "percentage", label: "Percentage (%)" },
        { value: "fixed", label: "Fixed ($)" },
      ]}
      showTypeDropdown={showTypeDropdown}
      onToggleTypeDropdown={() => setShowTypeDropdown((prev) => !prev)}
      onSelectType={(value) => {
        setDiscountType(value as DiscountType);
        setShowTypeDropdown(false);
        setDiscountValue("");
      }}
      summaryCards={[
        {
          label: "Sub Total",
          value: subTotal.toFixed(0),
          valueColorClassName: "text-[#E33163]",
        },
        {
          label: "Discount Amount",
          value: discountType === "percentage" ? `${discountValue || "0"}%` : discountValue || "0",
          valueColorClassName: "text-[#16A085]",
        },
        {
          label: "Total After Discount",
          value: totalAfterDiscount.toFixed(0),
          valueColorClassName: "text-[#2A2FB2]",
        },
      ]}
      onNumberPress={handleNumberPress}
      showDecimalKey={discountType === "fixed"}
      onDecimalPress={handleDecimalPress}
      onCancelAction={() => setDiscountValue("")}
      onCorrectAction={() => setDiscountValue((prev) => prev.slice(0, -1))}
      onConfirmAction={handleConfirm}
      modalWidth={700}
    />
  );
}
