"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { AUTH_ROUTE, USER_ROLE } from "./auth/constants/auth";
import { authApi } from "./auth/api/auth-api";
import { useAuth } from "./auth/hooks/use-auth";

export function ProtectedDashboard() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (initialized && !user) router.replace(AUTH_ROUTE.LOGIN);
  }, [initialized, router, user]);
  if (!initialized || !user)
    return <main className="centered">Đang kiểm tra phiên đăng nhập…</main>;
  const name = user.email.split("@")[0];
  async function logout() {
    try {
      await authApi.logout();
    } finally {
      router.replace(AUTH_ROUTE.LOGIN);
    }
  }
  return (
    <main className="dashboard">
      <section>
        <p className="eyebrow">INVENTORY API</p>
        <h1>Xin chào, {name}</h1>
        <p className="muted">
          Bạn đã đăng nhập với email <strong>{user.email}</strong>.
        </p>
        {user.role === USER_ROLE.ADMIN && (
          <Button type="primary" onClick={() => router.push("/inventory")}>
            Inventory
          </Button>
        )}
        <dl>
          <div>
            <dt>Vai trò</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>Đã xác thực</dd>
          </div>
        </dl>
        <button onClick={logout}>Đăng xuất</button>
      </section>
    </main>
  );
}
