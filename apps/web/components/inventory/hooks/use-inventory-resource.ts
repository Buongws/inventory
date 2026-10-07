"use client";

import { useEffect, useEffectEvent, useState } from "react";
import axios from "axios";
import { READ_STATUS } from "../constants/inventory";
import type { InventoryResourceOptions } from "../types/hook-types";
import type { ReadResource } from "../types/inventory-types";

// All three Inventory reads share cancellation and query-identity protection.
export const useInventoryResource = <T>({
  enabled,
  queryId,
  scope,
  load,
  errorMessage,
}: InventoryResourceOptions<T>) => {
  const [resource, setResource] = useState<ReadResource<T>>({
    status: READ_STATUS.LOADING,
    queryId: "",
  });
  const fetchResource = useEffectEvent(load);
  useEffect(() => {
    if (!enabled) return;
    const controller = scope.create();
    fetchResource(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResource({ status: READ_STATUS.READY, queryId, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !axios.isCancel(error)) {
          setResource({
            status: READ_STATUS.ERROR,
            queryId,
            message: errorMessage,
          });
        }
      });
    return () => scope.release(controller);
  }, [enabled, queryId, scope, errorMessage]);
  const visible: ReadResource<T> =
    resource.queryId === queryId
      ? resource
      : { status: READ_STATUS.LOADING, queryId };
  return { visible, resource };
};
