"use client";

import { Button } from "@/components/ui/button";

export default function PrintButton({ className = "" }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => window.print()}
      className={className}
    >
      Imprimir
    </Button>
  );
}
