"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type Props = {
  action: () => Promise<void>;
  variant?: "outline" | "default" | "secondary" | "ghost" | "destructive" | null;
  size?: "icon" | "default" | "sm" | "lg" | null;
  className?: string;
  title?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({
  action,
  variant = "outline",
  size = "icon",
  className = "rounded-full h-9 w-9",
  title = "Cerrar sesión",
  children,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant={variant as any}
      size={size as any}
      className={className}
      title={title}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
            await action();                 // borra cookie
            window.location.assign("/");    // ✅ recarga real (no SPA)
        })
        }


    >
      {children ?? <LogOut className="h-4 w-4" />}
    </Button>
  );
}
