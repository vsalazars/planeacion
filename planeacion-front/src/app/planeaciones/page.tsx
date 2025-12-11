// src/app/planeaciones/page.tsx
import { redirect } from "next/navigation";

export default function PlaneacionesLegacyPage() {
  // Cualquier visita a /planeaciones se manda al nuevo dashboard
  redirect("/dashboard-planeacion");
}
