import type { ReactNode } from "react";
import { InventoryManagement } from "../../components/inventory/inventory-management";

// Keep filters, pagination and pending-operation ownership across inventory routes.
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <InventoryManagement />
      {children}
    </>
  );
}
