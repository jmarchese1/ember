"use client";
import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={classNames("card p-5 md:p-6", hover && "card-hover", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold display text-primary tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-tertiary mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
