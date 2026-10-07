"use client";

import { useState } from "react";
import { TERMINAL_OUTCOME } from "../constants/movement";
import {
  CATALOG_PAGE_SIZE,
  HISTORY_PAGE_SIZE,
  FIRST_PAGE,
  READ_STATUS,
} from "../constants/inventory";
import type { InventoryFilters } from "../api/api-types";
import type { InventoryDataOptions } from "../types/hook-types";
import { inventoryApi } from "../api/inventory-api";
import { createAbortScope } from "../../../lib/abort-scope";
import type { TerminalOutcome } from "../types/inventory-types";
import { useInventoryResource } from "./use-inventory-resource";

export const useInventoryData = ({
  enabled,
  actorId,
  productId = "",
}: InventoryDataOptions) => {
  const [scope] = useState(createAbortScope);
  const [query, setQuery] = useState({
    filters: {} as InventoryFilters,
    page: FIRST_PAGE,
    size: CATALOG_PAGE_SIZE,
    historyPage: FIRST_PAGE,
    historySize: HISTORY_PAGE_SIZE,
    catalogVersion: 0,
    stockVersion: 0,
    historyVersion: 0,
  });
  const catalogId = JSON.stringify([
    actorId,
    query.filters,
    query.page,
    query.size,
    query.catalogVersion,
  ]);
  const stockId = `${actorId ?? ""}:${productId ?? ""}:${query.stockVersion}`;
  const historyId = `${actorId ?? ""}:${productId ?? ""}:${query.historyPage}:${query.historySize}:${query.historyVersion}`;
  const stock = useInventoryResource({
    enabled: enabled && !productId,
    queryId: catalogId,
    scope,
    load: (signal) =>
      inventoryApi.listStock(
        { ...query.filters, page: query.page, limit: query.size },
        signal,
      ),
    errorMessage: "Không thể tải danh sách tồn kho. Hãy thử tải lại.",
  });

  const detail = useInventoryResource({
    enabled: enabled && Boolean(productId),
    queryId: stockId,
    scope,
    load: (signal) =>
      inventoryApi
        .getStock(productId, signal)
        .then(({ inventory }) => inventory),
    errorMessage: "Không thể tải tồn kho hiện tại. Hãy thử tải lại.",
  });

  const history = useInventoryResource({
    enabled: enabled && Boolean(productId),
    queryId: historyId,
    scope,
    load: (signal) =>
      inventoryApi.listMovements(
        productId,
        { page: query.historyPage, limit: query.historySize },
        signal,
      ),
    errorMessage: "Không thể tải lịch sử tồn kho. Hãy thử tải lại.",
  });

  const applyFilters = (filters: InventoryFilters) =>
    setQuery((q) => ({
      ...q,
      filters,
      page: FIRST_PAGE,
      catalogVersion: q.catalogVersion + 1,
    }));

  const changePage = (page: number, size: number) =>
    setQuery((q) => ({
      ...q,
      page: size === q.size ? page : FIRST_PAGE,
      size,
    }));

  const changeHistoryPage = (page: number, size: number) =>
    setQuery((q) => ({
      ...q,
      historyPage: size === q.historySize ? page : FIRST_PAGE,
      historySize: size,
    }));

  const retryCatalog = () =>
    setQuery((q) => ({ ...q, catalogVersion: q.catalogVersion + 1 }));
  const retryStock = () =>
    setQuery((q) => ({ ...q, stockVersion: q.stockVersion + 1 }));
  const retryHistory = () =>
    setQuery((q) => ({ ...q, historyVersion: q.historyVersion + 1 }));
  const refreshAfterMovement = (outcome: TerminalOutcome) => {
    if (outcome.kind === TERMINAL_OUTCOME.SUCCESS)
      setQuery((q) => ({
        ...q,
        catalogVersion: q.catalogVersion + 1,
        stockVersion: q.stockVersion + 1,
        historyVersion: q.historyVersion + 1,
        historyPage: FIRST_PAGE,
      }));
    else if (
      outcome.kind === TERMINAL_OUTCOME.STOCK_REJECTION ||
      outcome.kind === TERMINAL_OUTCOME.PRODUCT_MISSING
    )
      retryStock();
  };
  const clear = () => {
    scope.abortAll();
    setQuery((q) => ({
      ...q,
      historyPage: FIRST_PAGE,
      historySize: HISTORY_PAGE_SIZE,
      catalogVersion: q.catalogVersion + 1,
      stockVersion: q.stockVersion + 1,
      historyVersion: q.historyVersion + 1,
    }));
  };
  return {
    query,
    stock: stock.visible,
    detail: detail.visible,
    history: history.visible,
    total:
      stock.resource.status === READ_STATUS.READY &&
      stock.resource.queryId.startsWith(
        `${JSON.stringify([actorId, query.filters]).slice(0, -1)},`,
      )
        ? stock.resource.data.total
        : 0,
    historyTotal:
      history.resource.status === READ_STATUS.READY &&
      history.resource.queryId.startsWith(
        `${actorId ?? ""}:${productId ?? ""}:`,
      )
        ? history.resource.data.total
        : 0,
    applyFilters,
    changePage,
    changeHistoryPage,
    retryCatalog,
    retryStock,
    retryHistory,
    refreshAfterMovement,
    clear,
  };
};
