"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import type { AdminOrderDesignPreviewDto } from "@/lib/admin/orders/adminOrderDtos";

type AdminOrderPreviewProps = {
  preview: AdminOrderDesignPreviewDto;
};

export function AdminOrderPreview({ preview }: AdminOrderPreviewProps) {
  return (
    <SignPreview
      design={preview.design}
      size="hero"
      integratedFinalPreview={preview.integratedFinalPreview}
      ariaLabel="תצוגת השלט כפי שאושרה על ידי הלקוח"
    />
  );
}
