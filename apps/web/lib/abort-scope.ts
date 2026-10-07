export const createAbortScope = () => {
  const controllers = new Set<AbortController>();
  return {
    create: () => {
      const controller = new AbortController();
      controllers.add(controller);
      return controller;
    },
    release: (controller: AbortController) => {
      controller.abort();
      controllers.delete(controller);
    },
    abortAll: () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    },
  };
};
export type AbortScope = ReturnType<typeof createAbortScope>;
