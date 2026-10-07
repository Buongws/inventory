"use client";

import { toast, ToastContainer } from "react-toastify";

export const appToast = {
  success: toast.success,
  warning: toast.warning,
  error: toast.error,
  info: toast.info,
  unknown: toast,
};

export type ToastStatus = keyof typeof appToast;

export function AppToastContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      closeOnClick
      pauseOnHover
      theme="light"
    />
  );
}
