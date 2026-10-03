import { useCallback, useState } from "react";

export function useOneExpander<K extends string>(): {
  open: K | null;
  toggle: (key: K) => void;
  close: () => void;
} {
  const [open, setOpen] = useState<K | null>(null);
  const toggle = useCallback(
    (key: K) => setOpen((current) => (current === key ? null : key)),
    [],
  );
  const close = useCallback(() => setOpen(null), []);
  return { open, toggle, close };
}
