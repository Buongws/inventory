"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTE } from "../../../components/auth/constants/auth";
import { authApi } from "../../../components/auth/api/auth-api";
export default function GoogleCallbackPage() {
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập Google…");
  const router = useRouter();
  useEffect(() => {
    authApi
      .refresh()
      .then(() => router.replace(AUTH_ROUTE.DASHBOARD))
      .catch(() =>
        setMessage(
          "Không thể tạo phiên đăng nhập. Hãy thử lại từ trang login.",
        ),
      );
  }, [router]);
  return <main className="centered">{message}</main>;
}
