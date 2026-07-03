export function createRequestGuard() {
  let latest = 0;
  return {
    next: () => {
      latest += 1;
      return latest;
    },
    isCurrent: (id: number) => id === latest,
  };
}
