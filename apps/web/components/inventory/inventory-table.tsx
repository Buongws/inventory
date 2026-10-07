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
    { title: "Tên sản phẩm", dataIndex: ["product", "name"], width: "40%" },
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
    <section
      className="inventory-table"
      aria-label="Danh sách tồn kho"
      aria-busy={stock.status === READ_STATUS.LOADING}
    >
      {stock.status === READ_STATUS.ERROR ? (
        <Alert
          type="error"
          showIcon
          title={stock.message}
          action={<Button onClick={onRetry}>Thử lại</Button>}
        />
      ) : (
        <Table<StockItem>
          size="middle"
          rowKey="productId"
          columns={columns}
          dataSource={
            stock.status === READ_STATUS.READY ? stock.data.items : []
          }
          loading={{
            spinning: stock.status === READ_STATUS.LOADING,
            delay: 0,
            description: "Đang tải sản phẩm…",
          }}
          locale={{
            emptyText:
              stock.status === READ_STATUS.LOADING ? (
                <div className="min-h-128" />
              ) : stock.status === READ_STATUS.READY && stock.data.total > 0 ? (
                "Trang này không có sản phẩm. Hãy chọn trang trong phạm vi."
              ) : (
                "Không có sản phẩm phù hợp với bộ lọc."
              ),
          }}
          scroll={{ x: 720 }}
          pagination={{
            responsive: true,
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
