"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../../../lib/store";
export const useAuth = () => useSelector((state: RootState) => state.auth);
