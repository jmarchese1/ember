"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "ghost" | "soft";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  icon,
  loading,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  const cls = classNames(
    "btn",
    variant === "primary" && "btn-primary",
    variant === "ghost" && "btn-ghost",
    variant === "soft" && "btn-soft",
    className
  );
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
