"use client";

import { Alert, Button, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import {
  PAGE_SIZE_OPTIONS,
  PRODUCT_STATUS,
  READ_STATUS,
} from "./constants/inventory";
import type { StockItem } from "./types/inventory-types";
import type { InventoryTableProps } from "./types/component-types";

export const InventoryTable = ({
  stock,
  page,
  size,
  total,
  onPageChange,
  onSelect,
  onRetry,
}: InventoryTableProps) => {
  const columns: TableColumnsType<StockItem> = [
    { title: "Tên sản phẩm", dataIndex: ["product", "name"] },
    { title: "SKU", dataIndex: ["product", "sku"] },
    {
      title: "Trạng thái",
      dataIndex: ["product", "status"],
      render: (status: StockItem["product"]["status"]) => (
        <Tag color={status === PRODUCT_STATUS.ACTIVE ? "green" : "default"}>
          {status}
        </Tag>
      ),
    },
    { title: "Tồn hiện tại", dataIndex: "onHandQty", align: "right" },
    {
      title: "Thao tác",
      key: "inventory",
      render: (_, record) => (
        <Button onClick={() => onSelect(record)}>Inventory</Button>
      ),
    },
  ];

  return (
    <section className="inventory-section" aria-label="Danh sách tồn kho">
      {stock.status === READ_STATUS.ERROR ? (
        <Alert
          type="error"
          showIcon
          title={stock.message}
          action={<Button onClick={onRetry}>Thử lại</Button>}
        />
      ) : (
        <Table<StockItem>
          rowKey="productId"
          columns={columns}
          dataSource={
            stock.status === READ_STATUS.READY ? stock.data.items : []
          }
          loading={stock.status === READ_STATUS.LOADING}
          locale={{ emptyText: "Không có sản phẩm trong trang này" }}
          scroll={{ x: 720 }}
          pagination={{
            current: page,
            pageSize: size,
            total:
              stock.status === READ_STATUS.READY ? stock.data.total : total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (value) => `Tổng ${value} sản phẩm`,
            onChange: onPageChange,
          }}
        />
      )}
    </section>
  );
};
