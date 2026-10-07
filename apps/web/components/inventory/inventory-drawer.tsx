"use client";

import { useEffect } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { PAGE_SIZE_OPTIONS, READ_STATUS } from "./constants/inventory";
import {
  MILLISECONDS_PER_SECOND,
  MOVEMENT_FIELDS,
  MOVEMENT_QUANTITY_MAX,
  MOVEMENT_QUANTITY_MIN,
  MOVEMENT_REASON_MAX_LENGTH,
  MOVEMENT_REASON_MIN_LENGTH,
  MOVEMENT_TYPE,
  MOVEMENT_TYPE_OPTIONS,
} from "./constants/movement";
import type { InventoryDrawerProps } from "./types/component-types";
import type { HistoryItem, MovementPayload } from "./types/inventory-types";

export const InventoryDrawer = ({
  product,
  stock,
  history,
  historyPage,
  historySize,
  historyTotal,
  onClose,
  onStockRetry,
  onHistoryRetry,
  onHistoryPageChange,
  operationLocked = false,
  onSubmit,
  resetDraftVersion = 0,
  validationErrors,
  operationMessage,
  retryRemainingMs = 0,
  onRetry,
  retryDisabled = true,
  operationStatus,
  operationPayload,
  firstDispatchedAt,
  retryUntil,
}: InventoryDrawerProps) => {
  const [form] = Form.useForm<MovementPayload>();
  const open = product !== null;
  useEffect(() => {
    if (!open) return;
    form.resetFields();
  }, [form, open, product?.productId]);
  useEffect(() => {
    if (!open) return;
    form.resetFields(["quantity", "reason"]);
  }, [form, open, resetDraftVersion]);
  useEffect(() => {
    if (open && operationPayload)
      form.setFieldValue("type", operationPayload.type);
  }, [form, open, operationPayload]);
  useEffect(() => {
    if (!open) return;
    form.setFields(
      MOVEMENT_FIELDS.map((name) => ({
        name,
        errors: validationErrors?.[name] ? [validationErrors[name]] : [],
      })),
    );
  }, [form, open, validationErrors]);

  const columns: TableColumnsType<HistoryItem> = [
    { title: "Loại", dataIndex: "type" },
    { title: "Số lượng", dataIndex: "quantity", align: "right" },
    { title: "Tồn trước", dataIndex: "balanceBefore", align: "right" },
    { title: "Tồn sau", dataIndex: "balanceAfter", align: "right" },
    { title: "Người thực hiện (UUID)", dataIndex: "actorId" },
    { title: "Lý do", dataIndex: "reason" },
    {
      title: "Thời gian (UTC)",
      dataIndex: "createdAt",
      render: (value: string) => new Date(value).toISOString(),
    },
  ];

  return (
    <Drawer
      title={product?.product.name ?? "Inventory"}
      open={open}
      forceRender
      onClose={onClose}
      size={960}
      destroyOnHidden
    >
      {product && (
        <>
          <Descriptions
            column={1}
            items={[
              { key: "sku", label: "SKU", children: product.product.sku },
              {
                key: "status",
                label: "Trạng thái",
                children: product.product.status,
              },
            ]}
          />
          <section className="inventory-section" aria-label="Tồn kho hiện tại">
            <Typography.Title level={4}>Tồn kho hiện tại</Typography.Title>
            {stock.status === READ_STATUS.LOADING && (
              <Spin aria-label="Đang tải tồn kho hiện tại" />
            )}
            {stock.status === READ_STATUS.ERROR && (
              <Alert
                type="error"
                showIcon
                title={stock.message}
                action={<Button onClick={onStockRetry}>Thử lại tồn kho</Button>}
              />
            )}
            {stock.status === READ_STATUS.READY && (
              <Descriptions
                column={1}
                items={[
                  {
                    key: "quantity",
                    label: "Tồn hiện tại",
                    children: stock.data.onHandQty,
                  },
                  {
                    key: "current-name",
                    label: "Tên hiện tại",
                    children: stock.data.product.name,
                  },
                  {
                    key: "current-status",
                    label: "Trạng thái hiện tại",
                    children: stock.data.product.status,
                  },
                ]}
              />
            )}
          </section>
          <section className="inventory-section" aria-label="Lịch sử tồn kho">
            <Typography.Title level={4}>Lịch sử tồn kho</Typography.Title>
            {history.status === READ_STATUS.ERROR ? (
              <Alert
                type="error"
                showIcon
                title={history.message}
                action={
                  <Button onClick={onHistoryRetry}>Thử lại lịch sử</Button>
                }
              />
            ) : (
              <Table<HistoryItem>
                rowKey="id"
                columns={columns}
                dataSource={
                  history.status === READ_STATUS.READY ? history.data.items : []
                }
                loading={history.status === READ_STATUS.LOADING}
                locale={{
                  emptyText: "Chưa có lịch sử tồn kho trong trang này",
                }}
                scroll={{ x: 1100 }}
                pagination={{
                  current: historyPage,
                  pageSize: historySize,
                  total: historyTotal,
                  showSizeChanger: true,
                  pageSizeOptions: PAGE_SIZE_OPTIONS,
                  showTotal: (total) => `Tổng ${total} giao dịch`,
                  onChange: onHistoryPageChange,
                }}
              />
            )}
          </section>
          <section
            className="inventory-section"
            aria-label="Nhập hoặc xuất tồn kho"
          >
            <Typography.Title level={4}>Nhập / xuất tồn kho</Typography.Title>
            {operationMessage && (
              <Alert
                className="inventory-section"
                type={operationLocked ? "warning" : "info"}
                title={operationMessage}
                showIcon
                action={
                  onRetry ? (
                    <Button disabled={retryDisabled} onClick={onRetry}>
                      {retryRemainingMs > 0
                        ? `Thử lại sau ${Math.ceil(retryRemainingMs / MILLISECONDS_PER_SECOND)} giây`
                        : "Thử lại cùng thao tác"}
                    </Button>
                  ) : undefined
                }
              />
            )}
            {operationStatus && operationPayload && (
              <Descriptions
                className="inventory-section"
                title="Thông tin đối chiếu của thao tác đang giữ"
                column={1}
                items={[
                  {
                    key: "state",
                    label: "Trạng thái phục hồi",
                    children: operationStatus,
                  },
                  {
                    key: "type",
                    label: "Loại đã gửi",
                    children: operationPayload.type,
                  },
                  {
                    key: "quantity",
                    label: "Số lượng đã gửi",
                    children: operationPayload.quantity,
                  },
                  {
                    key: "reason",
                    label: "Lý do đã gửi",
                    children: operationPayload.reason,
                  },
                  {
                    key: "dispatched",
                    label: "Đã gửi lần đầu lúc",
                    children: firstDispatchedAt
                      ? new Date(firstDispatchedAt).toISOString()
                      : "Chưa gửi đến API",
                  },
                  {
                    key: "deadline",
                    label: "Hạn thử lại (UTC)",
                    children: retryUntil
                      ? new Date(retryUntil).toISOString()
                      : "Chưa có",
                  },
                ]}
              />
            )}
            <Form<MovementPayload>
              form={form}
              layout="vertical"
              initialValues={{ type: MOVEMENT_TYPE.RECEIPT }}
              disabled={operationLocked}
              onFinish={(values) => {
                if (!operationLocked && stock.status === READ_STATUS.READY) {
                  onSubmit?.({ ...values, reason: values.reason.trim() });
                }
              }}
            >
              <Form.Item
                name="type"
                label="Loại giao dịch"
                rules={[
                  {
                    required: true,
                    enum: [MOVEMENT_TYPE.RECEIPT, MOVEMENT_TYPE.ISSUE],
                    type: "enum",
                    message: "Chọn RECEIPT hoặc ISSUE.",
                  },
                ]}
              >
                <Select options={MOVEMENT_TYPE_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[
                  {
                    validator: (_, value: unknown) =>
                      typeof value === "number" &&
                      Number.isInteger(value) &&
                      value >= MOVEMENT_QUANTITY_MIN &&
                      value <= MOVEMENT_QUANTITY_MAX
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("Nhập số nguyên từ 1 đến 1.000.000."),
                          ),
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="reason"
                label="Lý do"
                rules={[
                  {
                    validator: (_, value: unknown) => {
                      const length =
                        typeof value === "string"
                          ? Array.from(value.trim()).length
                          : 0;
                      return length >= MOVEMENT_REASON_MIN_LENGTH &&
                        length <= MOVEMENT_REASON_MAX_LENGTH
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "Lý do sau khi bỏ khoảng trắng đầu/cuối phải có từ 1 đến 500 ký tự Unicode.",
                            ),
                          );
                    },
                  },
                ]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={
                  operationLocked ||
                  stock.status !== READ_STATUS.READY ||
                  !onSubmit
                }
              >
                Gửi giao dịch
              </Button>
            </Form>
          </section>
        </>
      )}
    </Drawer>
  );
};
