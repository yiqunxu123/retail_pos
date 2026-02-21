import { useCallback, useRef, useState } from "react";

export interface ModalControllerHandle {
  open: () => void;
  close: () => void;
  isVisible: () => boolean;
}

export function useModalVisibilityRef(
  onVisibleStateChange?: (visible: boolean) => void
) {
  const visibleRef = useRef(false);

  const setVisibleRef = useCallback(
    (next: boolean): boolean => {
      if (visibleRef.current === next) return false;
      visibleRef.current = next;
      onVisibleStateChange?.(next);
      return true;
    },
    [onVisibleStateChange]
  );

  const openRef = useCallback(() => {
    setVisibleRef(true);
  }, [setVisibleRef]);

  const closeRef = useCallback(() => {
    setVisibleRef(false);
  }, [setVisibleRef]);

  const isVisible = useCallback(() => visibleRef.current, []);

  return {
    visibleRef,
    setVisibleRef,
    openRef,
    closeRef,
    isVisible,
  };
}

export function useModalVisibilityState(
  onVisibleStateChange?: (visible: boolean) => void
) {
  const [visible, setVisible] = useState(false);
  const { visibleRef, setVisibleRef, isVisible } =
    useModalVisibilityRef(onVisibleStateChange);

  const setVisibleState = useCallback(
    (next: boolean) => {
      const changed = setVisibleRef(next);
      if (changed) setVisible(next);
    },
    [setVisibleRef]
  );

  const open = useCallback(() => {
    setVisibleState(true);
  }, [setVisibleState]);

  const close = useCallback(() => {
    setVisibleState(false);
  }, [setVisibleState]);

  return {
    visible,
    visibleRef,
    setVisibleState,
    open,
    close,
    isVisible,
  };
}
