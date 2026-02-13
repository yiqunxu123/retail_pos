import { useEffect, useMemo, useState } from "react";
import { AmountPadModal } from "./AmountPadModal";

interface CashPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (cashReceived: number) => void;
  subTotal: number;
}

/**
 * CashPaymentModal - business logic wrapper around shared AmountPadModal UI.
 */
export function CashPaymentModal({
  visible,
  onClose,
  onConfirm,
  subTotal,
}: CashPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState("");

  useEffect(() => {
    if (!visible) return;
    setCashReceived("");
  }, [visible]);

  const cashReceivedNum = useMemo(
    () => Number.parseFloat(cashReceived) || 0,
    [cashReceived]
  );

  const changeDue = useMemo(
    () => Math.max(0, cashReceivedNum - subTotal),
    [cashReceivedNum, subTotal]
  );

  const handleNumberPress = (num: string) => {
    setCashReceived((prev) => {
      if (prev.includes(".")) {
        const decimalPart = prev.split(".")[1] || "";
        if (decimalPart.length >= 2) return prev;
      }
      return prev + num;
    });
  };

  const handleDecimalPress = () => {
    setCashReceived((prev) =>
      prev.includes(".") ? prev : prev ? `${prev}.` : "0."
    );
  };

  const handleConfirm = () => {
    if (cashReceivedNum >= subTotal) {
      onConfirm(cashReceivedNum);
      setCashReceived("");
    }
  };

  return (
    <AmountPadModal
      visible={visible}
      onClose={onClose}
      title="Total Cash Recieved"
      showTypeSelector={false}
      summaryCards={[
        {
          label: "Sub Total",
          value: subTotal.toFixed(0),
          valueColorClassName: "text-[#E33163]",
        },
        {
          label: "Cash Recieved",
          value: cashReceived || "0",
          valueColorClassName: "text-[#16A085]",
        },
        {
          label: "Change Due",
          value: changeDue.toFixed(0),
          valueColorClassName: "text-[#2A2FB2]",
        },
      ]}
      onNumberPress={handleNumberPress}
      showZeroKey
      showDecimalKey
      onDecimalPress={handleDecimalPress}
      onCancelAction={() => setCashReceived("")}
      onCorrectAction={() => setCashReceived((prev) => prev.slice(0, -1))}
      onConfirmAction={handleConfirm}
      confirmDisabled={cashReceivedNum < subTotal}
      modalWidth={690}
    />
  );
}
