export const READ_STATUS = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const FIRST_PAGE = 1;
export const CATALOG_PAGE_SIZE = 10;
export const HISTORY_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const INVENTORY_DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm:ss";
