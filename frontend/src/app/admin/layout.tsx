"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/layouts/AdminLayout";
import { getAuthToken } from "@/lib/auth";

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
