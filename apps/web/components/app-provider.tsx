"use client";
import { Provider } from "react-redux";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { store } from "../lib/store";
import { AppToastContainer } from "../lib/toast";
import { SessionBootstrap } from "./auth/session-bootstrap";
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigProvider locale={viVN}>
        <App>
          <SessionBootstrap />
          {children}
          <AppToastContainer />
        </App>
      </ConfigProvider>
    </Provider>
  );
}
