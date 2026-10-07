"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { App } from "antd";
import { OPERATION_STATUS } from "../constants/movement";
import type { InventoryDepartureOptions } from "../types/hook-types";

export const useInventoryDeparture = ({
  pageId,
  operationRef,
  operation,
  discard,
  clearPage,
}: InventoryDepartureOptions) => {
  const { modal } = App.useApp();
  const modalRef = useRef<{ destroy: () => void } | null>(null);
  const [pageActive, setPageActive] = useState(true);
  const release = useEffectEvent(() => {
    discard();
    clearPage();
    modalRef.current?.destroy();
    modalRef.current = null;
  });
  const handlePageHide = useEffectEvent(() => {
    release();
    setPageActive(false);
  });
  const handlePageShow = useEffectEvent((event: PageTransitionEvent) => {
    if (!event.persisted) return;
    release();
    setPageActive(true);
  });
  useEffect(() => {
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      release();
    };
  }, [pageId]);
  const warnBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    const current = operationRef.current;
    if (
      !current ||
      current.discarded ||
      current.status === OPERATION_STATUS.TERMINAL
    )
      return;
    event.preventDefault();
    event.returnValue = "";
  });
  const protectedOperation = Boolean(
    operation && operation.status !== OPERATION_STATUS.TERMINAL,
  );
  useEffect(() => {
    if (!protectedOperation) return;
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [protectedOperation]);
  const requestDeparture = (action: () => void) => {
    const current = operationRef.current;
    if (
      !current ||
      current.status === OPERATION_STATUS.TERMINAL ||
      current.discarded
    ) {
      action();
      return;
    }
    modalRef.current = modal.confirm({
      title: "Rời thao tác tồn kho đang chờ?",
      content:
        "Kết quả có thể đã được ghi nhận. Rời đi sẽ bỏ khả năng thử lại trong trang này; hãy đối chiếu lịch sử trước khi nhập hoặc xuất lại.",
      okText: "Rời và đối chiếu sau",
      cancelText: "Ở lại",
      onCancel: () => {
        modalRef.current = null;
      },
      onOk: () => {
        modalRef.current = null;
        if (operationRef.current !== current) {
          requestDeparture(action);
          return;
        }
        discard();
        action();
      },
    });
  };
  return { pageActive, requestDeparture };
};
