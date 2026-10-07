"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Layout,
  Menu,
  Result,
  Select,
  Spin,
  Typography,
} from "antd";
import { AUTH_ROUTE, USER_ROLE } from "../auth/constants/auth";
import type { DatePickerProps } from "antd";
import { PRODUCT_STATUS, READ_STATUS } from "./constants/inventory";
import { OPERATION_STATUS } from "./constants/movement";
import { authApi } from "../auth/api/auth-api";
import type { StockItem } from "./types/inventory-types";
import { useAuth } from "../auth/hooks/use-auth";
import { InventoryDetails } from "./inventory-details";
import { InventoryTable } from "./inventory-table";
import { useInventoryData } from "./hooks/use-inventory-data";
import { useInventoryOperation } from "./hooks/use-inventory-operation";
import { useInventoryDeparture } from "./hooks/use-inventory-departure";
const { Content, Sider } = Layout;
type FilterFields = {
  q?: string;
  status?: StockItem["product"]["status"];
  createdFrom?: Exclude<DatePickerProps["value"], unknown[]>;
  createdTo?: Exclude<DatePickerProps["value"], unknown[]>;
};

export const InventoryManagement = () => {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const { productId } = useParams<{ productId?: string }>();
  const [form] = Form.useForm<FilterFields>();
  const selectionRef = useRef<string | null>(productId ?? null);
  useEffect(() => {
    selectionRef.current = productId ?? null;
  }, [productId]);
  const movement = useInventoryOperation({
    productId,
    isStockReady: () => data.detail.status === READ_STATUS.READY,
    selectionRef,
    refreshAfterMovement: (outcome) => data.refreshAfterMovement(outcome),
  });
  const { operation, ownerMismatch: operationOwnerMismatch } = movement;
  const { pageActive, requestDeparture } = useInventoryDeparture({
    pageId: productId,
    operation,
    operationRef: movement.operationRef,
    discard: movement.discard,
    clearPage: () => {
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
    productId,
  });
  useEffect(() => {
    if (pageActive && initialized && !user && !operation)
      router.replace(AUTH_ROUTE.LOGIN);
  }, [initialized, pageActive, router, user, operation]);
  const selectProduct = (product: StockItem) =>
    requestDeparture(() => router.push(`/inventory/${product.productId}`));
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
      <Sider breakpoint="lg" collapsedWidth="0" theme="light">
        <div className="flex items-center gap-3 border-0 border-b border-solid border-slate-200 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            I
          </span>
          <span className="text-base font-semibold text-slate-900">
            Inventory
          </span>
        </div>
        <div className="px-2 py-3">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={["inventory"]}
            items={[
              { key: "inventory", label: "Inventory" },
              { key: "dashboard", label: "Dashboard" },
            ]}
            onClick={({ key }) => {
              if (key === "inventory" && productId)
                requestDeparture(() => router.push("/inventory"));
              if (key === "dashboard")
                requestDeparture(() => router.push(AUTH_ROUTE.DASHBOARD));
            }}
          />
        </div>
        <div className="mt-auto border-0 border-t border-solid border-slate-200 p-3">
          <Button
            block
            type="text"
            onClick={() =>
              requestDeparture(() => {
                void logout();
              })
            }
          >
            Đăng xuất
          </Button>
        </div>
      </Sider>
      <Layout>
        <Content className="inventory-content min-w-0 bg-slate-50 px-4 py-5 sm:px-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Typography.Title level={2} className="inventory-heading">
              {productId ? "Chi tiết tồn kho" : "Inventory"}
            </Typography.Title>
            {productId ? (
              <>
                <Button
                  className="mb-4"
                  onClick={() =>
                    requestDeparture(() => router.push("/inventory"))
                  }
                >
                  Quay lại danh sách
                </Button>
                <Alert
                  className="mb-6"
                  type="info"
                  showIcon
                  title="Đối chiếu lịch sử nếu đã rời trang khi giao dịch đang chờ."
                />
                <InventoryDetails
                  productId={productId}
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
                  onStockRetry={data.retryStock}
                  onHistoryRetry={data.retryHistory}
                  onHistoryPageChange={data.changeHistoryPage}
                />
              </>
            ) : (
              <div className="rounded-xl border border-solid border-slate-200 bg-white shadow-sm">
                <div className="border-0 border-b border-solid border-slate-200 p-4 sm:p-5">
                  <Form<FilterFields>
                    form={form}
                    layout="vertical"
                    className="inventory-filters grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-[minmax(200px,2fr)_minmax(130px,1fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto]"
                    initialValues={{ q: "" }}
                    onFinish={({ q, status, createdFrom, createdTo }) =>
                      data.applyFilters({
                        q: q?.trim() || undefined,
                        status,
                        createdFrom: createdFrom?.format("YYYY-MM-DD"),
                        createdTo: createdTo?.format("YYYY-MM-DD"),
                      })
                    }
                  >
                    <Form.Item
                      name="q"
                      label="Tên sản phẩm hoặc SKU"
                      rules={[
                        {
                          validator: (_, value: string | undefined) =>
                            !value || Array.from(value.trim()).length <= 200
                              ? Promise.resolve()
                              : Promise.reject(
                                  new Error(
                                    "Tối đa 200 ký tự sau khi bỏ khoảng trắng.",
                                  ),
                                ),
                        },
                      ]}
                    >
                      <Input allowClear placeholder="Nhập tên hoặc SKU" />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái">
                      <Select
                        allowClear
                        placeholder="Tất cả"
                        options={[
                          { value: PRODUCT_STATUS.ACTIVE, label: "ACTIVE" },
                          { value: PRODUCT_STATUS.INACTIVE, label: "INACTIVE" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="createdFrom" label="Ngày tạo từ">
                      <DatePicker
                        inputReadOnly
                        format="YYYY-MM-DD"
                        placeholder="Từ ngày"
                        disabledDate={(date) =>
                          date.year() < 1 || date.year() > 9999
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      name="createdTo"
                      label="Ngày tạo đến"
                      dependencies={["createdFrom"]}
                      rules={[
                        {
                          validator: (_, to: FilterFields["createdTo"]) => {
                            const from = form.getFieldValue(
                              "createdFrom",
                            ) as FilterFields["createdFrom"];
                            return !from ||
                              !to ||
                              from.format("YYYY-MM-DD") <=
                                to.format("YYYY-MM-DD")
                              ? Promise.resolve()
                              : Promise.reject(
                                  new Error(
                                    "Ngày đến phải bằng hoặc sau ngày từ.",
                                  ),
                                );
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        inputReadOnly
                        format="YYYY-MM-DD"
                        placeholder="Đến ngày"
                        disabledDate={(date) =>
                          date.year() < 1 || date.year() > 9999
                        }
                      />
                    </Form.Item>
                    <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:pt-[30px]">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={data.stock.status === READ_STATUS.LOADING}
                      >
                        Tìm kiếm
                      </Button>
                      <Button
                        onClick={() => {
                          form.resetFields();
                          data.applyFilters({});
                        }}
                      >
                        Làm mới
                      </Button>
                    </div>
                  </Form>
                </div>
                <InventoryTable
                  stock={data.stock}
                  page={data.query.page}
                  size={data.query.size}
                  total={data.total}
                  onPageChange={data.changePage}
                  onSelect={selectProduct}
                  onRetry={data.retryCatalog}
                />
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
