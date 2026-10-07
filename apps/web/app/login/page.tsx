"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_MODE, AUTH_ROUTE } from "../../components/auth/constants/auth";
import { AuthCard } from "../../components/auth/auth-card";
import { useAuth } from "../../components/auth/hooks/use-auth";
export default function LoginPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (initialized && user) router.replace(AUTH_ROUTE.DASHBOARD);
  }, [initialized, router, user]);
  return <AuthCard mode={AUTH_MODE.LOGIN} />;
}
