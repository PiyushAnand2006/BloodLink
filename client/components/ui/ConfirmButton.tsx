"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { TrashIcon } from "./icons";

/**
 * Two-step destructive action button: first click arms it ("Sure?"),
 * second click (within 4s) fires, clicking elsewhere disarms.
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Sure? Click again",
  variant = "danger",
  size = "sm",
  icon,
  className = "",
}: {
  onConfirm: () => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  variant?: "danger" | "secondary";
  size?: "sm" | "md";
  icon?: ReactNode;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleClick = async () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    await onConfirm();
  };

  return (
    <Button
      type="button"
      variant={armed ? "primary" : variant}
      size={size}
      className={className}
      onClick={handleClick}
      aria-label={label}
    >
      {icon ?? <TrashIcon className="h-4 w-4" />}
      {armed ? confirmLabel : label}
    </Button>
  );
}
