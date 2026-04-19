"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "ghost" | "soft";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, children, className, ...rest }: Props) {
  const cls = classNames(
    "btn",
    variant === "primary" && "btn-primary",
    variant === "ghost" && "btn-ghost",
    variant === "soft" && "btn-soft",
    className
  );
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
