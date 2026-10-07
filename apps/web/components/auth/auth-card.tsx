"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AUTH_MODE, AUTH_ROUTE, PASSWORD_MIN_LENGTH } from "./constants/auth";
import { authApi, googleStartUrl } from "./api/auth-api";
import { setSession } from "./state/auth-slice";
import type { AppDispatch } from "../../lib/store";
import type { AuthCardProps } from "./types/component-types";
export function AuthCard({ mode }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isLogin = mode === AUTH_MODE.LOGIN;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (isLogin) {
        dispatch(setSession(await authApi.login(email, password)));
        router.replace(AUTH_ROUTE.DASHBOARD);
      } else {
        await authApi.register(email, password);
        router.replace(AUTH_ROUTE.LOGIN);
      }
    } catch {
      setError(
        isLogin
          ? "Email hoặc mật khẩu không đúng."
          : "Không thể tạo tài khoản. Email có thể đã được dùng.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">INVENTORY API</p>
        <h1>{isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1>
        <p className="muted">
          {isLogin
            ? "Đăng nhập để vào trang quản lý."
            : "Tài khoản mới sẽ là customer."}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={pending}>
            {pending ? "Đang xử lý…" : isLogin ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
        {isLogin && (
          <>
            <div className="divider">
              <span>hoặc</span>
            </div>
            <a className="google-button" href={googleStartUrl}>
              Tiếp tục với Google
            </a>
          </>
        )}
        <p className="switch">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <Link href={isLogin ? AUTH_ROUTE.REGISTER : AUTH_ROUTE.LOGIN}>
            {isLogin ? "Đăng ký" : "Đăng nhập"}
          </Link>
        </p>
      </section>
    </main>
  );
}
