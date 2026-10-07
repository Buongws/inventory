"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Layout, Menu, Result, Spin, Typography } from "antd";
import { AUTH_ROUTE, USER_ROLE } from "../auth/constants/auth";
import { READ_STATUS } from "./constants/inventory";
import { OPERATION_STATUS } from "./constants/movement";
import { authApi } from "../auth/api/auth-api";
import type { StockItem } from "./types/inventory-types";
import { useAuth } from "../auth/hooks/use-auth";
import { InventoryDrawer } from "./inventory-drawer";
import { InventoryTable } from "./inventory-table";
import { useInventoryData } from "./hooks/use-inventory-data";
import { useInventoryOperation } from "./hooks/use-inventory-operation";
import { useInventoryDeparture } from "./hooks/use-inventory-departure";
const { Content, Sider } = Layout;

export const InventoryManagement = () => {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const selectionRef = useRef<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(
    null,
  );
  const movement = useInventoryOperation({
    productId: selectedProduct?.productId,
    isStockReady: () => data.detail.status === READ_STATUS.READY,
    selectionRef,
    refreshAfterMovement: (outcome) => data.refreshAfterMovement(outcome),
  });
  const { operation, ownerMismatch: operationOwnerMismatch } = movement;
  const closeDrawer = () => {
    selectionRef.current = null;
    setSelectedProduct(null);
  };
  const { pageActive, requestDeparture } = useInventoryDeparture({
    operation,
    operationRef: movement.operationRef,
    discard: movement.discard,
    clearPage: () => {
      closeDrawer();
      movement.clearDraft();
      data.clear();
    },
  });
  const data = useInventoryData({
    enabled:
      pageActive &&
      initialized &&
      user?.role === USER_ROLE.ADMIN &&
      !operationOwnerMismatch,
    actorId: user?.id,
    product: selectedProduct,
  });
  useEffect(() => {
    if (pageActive && initialized && !user && !operation)
      router.replace(AUTH_ROUTE.LOGIN);
  }, [initialized, pageActive, router, user, operation]);
  const selectProduct = (product: StockItem) =>
    requestDeparture(() => {
      selectionRef.current = product.productId;
      movement.selectProduct();
      data.openProduct();
      setSelectedProduct(product);
    });
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      router.replace(AUTH_ROUTE.LOGIN);
    }
  };
  if (!initialized) {
    return (
      <main className="centered">
        <Spin size="large" aria-label="Đang kiểm tra phiên đăng nhập" />
      </main>
    );
  }
  if (!user)
    return (
      <main className="centered">
        Phiên đăng nhập không còn sẵn sàng.
        <Button
          onClick={() => requestDeparture(() => router.push(AUTH_ROUTE.LOGIN))}
        >
          Đăng nhập
        </Button>
      </main>
    );
  if (user.role !== USER_ROLE.ADMIN) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Chỉ quản trị viên được xem tồn kho."
        extra={
          <Button
            onClick={() =>
              requestDeparture(() => router.push(AUTH_ROUTE.LOGIN))
            }
          >
            Đăng nhập
          </Button>
        }
      />
    );
  }
  if (operationOwnerMismatch) {
    return (
      <Result
        status="403"
        title="Thao tác tồn kho thuộc phiên quản trị khác"
        subTitle="Danh sách, lịch sử và nội dung thao tác đang được ẩn. Hãy khôi phục đúng phiên quản trị hoặc xác nhận rời thao tác để đăng nhập lại."
        extra={
          <Button
            onClick={() =>
              requestDeparture(() => router.push(AUTH_ROUTE.LOGIN))
            }
          >
            Đăng nhập lại
          </Button>
        }
      />
    );
  }

  return (
    <Layout className="inventory-layout">
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="inventory-brand">INVENTORY ADMIN</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["inventory"]}
          items={[
            { key: "inventory", label: "Inventory" },
            { key: "dashboard", label: "Dashboard" },
          ]}
          onClick={({ key }) => {
            if (key === "dashboard")
              requestDeparture(() => router.push(AUTH_ROUTE.DASHBOARD));
          }}
        />
        <Button
          type="text"
          className="inventory-logout"
          onClick={() =>
            requestDeparture(() => {
              void logout();
            })
          }
        >
          Đăng xuất
        </Button>
      </Sider>
      <Layout>
        <Content className="inventory-content">
          <Typography.Title level={2}>Inventory</Typography.Title>
          <Alert
            className="inventory-section"
            type="info"
            showIcon
            title="Đối chiếu lịch sử tồn kho sau khi quay lại Inventory"
            description="Nếu đã rời trang khi một thao tác đang chờ, hãy kiểm tra lịch sử trước khi nhập hoặc xuất lại."
          />
          <InventoryTable
            stock={data.stock}
            page={data.query.page}
            size={data.query.size}
            total={data.total}
            onPageChange={data.changePage}
            onSelect={selectProduct}
            onRetry={data.retryCatalog}
          />
          <InventoryDrawer
            product={selectedProduct}
            stock={data.detail}
            history={data.history}
            historyPage={data.query.historyPage}
            historySize={data.query.historySize}
            historyTotal={data.historyTotal}
            operationLocked={Boolean(
              operation && operation.status !== OPERATION_STATUS.TERMINAL,
            )}
            onSubmit={movement.submitMovement}
            resetDraftVersion={movement.resetDraftVersion}
            validationErrors={movement.validationErrors}
            operationMessage={operation?.message}
            retryRemainingMs={movement.retryRemainingMs}
            onRetry={
              operation && operation.status !== OPERATION_STATUS.TERMINAL
                ? movement.retryMovement
                : undefined
            }
            retryDisabled={movement.retryDisabled}
            operationStatus={operation?.status}
            operationPayload={operation?.payload}
            firstDispatchedAt={operation?.firstDispatchedAt}
            retryUntil={operation?.retryUntil}
            onClose={() => requestDeparture(closeDrawer)}
            onStockRetry={data.retryStock}
            onHistoryRetry={data.retryHistory}
            onHistoryPageChange={data.changeHistoryPage}
          />
        </Content>
      </Layout>
    </Layout>
  );
};
