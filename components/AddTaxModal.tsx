import { useEffect, useMemo, useState } from "react";
import { AmountPadModal } from "./AmountPadModal";

type TaxType = "percentage" | "fixed";

interface AddTaxModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (taxAmount: number, taxType: TaxType, taxName: string) => void;
  subTotal: number;
}

/**
 * AddTaxModal - business logic wrapper around shared AmountPadModal UI.
 */
export function AddTaxModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: AddTaxModalProps) {
  const [taxValue, setTaxValue] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("percentage");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTaxValue("");
    setTaxType("percentage");
    setShowTypeDropdown(false);
  }, [visible]);

  const taxNum = useMemo(() => Number.parseFloat(taxValue) || 0, [taxValue]);
  const taxAmount = useMemo(
    () => (taxType === "percentage" ? (subTotal * taxNum) / 100 : taxNum),
    [subTotal, taxNum, taxType]
  );
  const totalAfterTax = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);

  const handleNumberPress = (num: string) => {
    if (taxType === "percentage") {
      const next = taxValue + num;
      if ((Number.parseFloat(next) || 0) <= 100) {
        setTaxValue(next);
      }
      return;
    }
    setTaxValue((prev) => prev + num);
  };

  const handleConfirm = () => {
    const taxName = taxType === "percentage" ? "Percentage Tax" : "Fixed Tax";
    onConfirm(taxAmount, taxType, taxName);
    setTaxValue("");
    setShowTypeDropdown(false);
  };

  return (
    <AmountPadModal
      visible={visible}
      onClose={onClose}
      title="Add Tax"
      typeLabel={taxType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
      typeOptions={[
        { value: "percentage", label: "Percentage (%)" },
        { value: "fixed", label: "Fixed Amount ($)" },
      ]}
      showTypeDropdown={showTypeDropdown}
      onToggleTypeDropdown={() => setShowTypeDropdown((prev) => !prev)}
      onSelectType={(value) => {
        setTaxType(value as TaxType);
        setShowTypeDropdown(false);
        setTaxValue("");
      }}
      summaryCards={[
        {
          label: "Sub Total",
          value: subTotal.toFixed(0),
          valueColorClassName: "text-[#E33163]",
        },
        {
          label: "Tax Amount",
          value: taxType === "percentage" ? `${taxValue || "0"}%` : taxValue || "0",
          valueColorClassName: "text-[#16A085]",
        },
        {
          label: "Total After Tax",
          value: totalAfterTax.toFixed(0),
          valueColorClassName: "text-[#2A2FB2]",
        },
      ]}
      onNumberPress={handleNumberPress}
      onCancelAction={onClose}
      onCorrectAction={() => setTaxValue((prev) => prev.slice(0, -1))}
      onConfirmAction={handleConfirm}
      modalWidth={690}
    />
  );
}
