"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { authApi } from "./api/auth-api";
import { clearSession, markInitialized, setSession } from "./state/auth-slice";
import {
  accessTokenExpired,
  clearStoredSession,
  loadStoredSession,
} from "./services/session-storage";
import type { AppDispatch } from "../../lib/store";
export function SessionBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    const storedSession = loadStoredSession();

    if (!storedSession) {
      dispatch(clearSession());
      return;
    }

    if (!accessTokenExpired(storedSession.accessToken)) {
      dispatch(setSession(storedSession));
      return;
    }

    authApi
      .refresh()
      .catch(() => {
        clearStoredSession();
        dispatch(clearSession());
      })
      .finally(() => dispatch(markInitialized()));
  }, [dispatch]);
  return null;
}
