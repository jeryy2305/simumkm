"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UmkmLayout from "@/layouts/UmkmLayout";
import { getAuthToken, clearAuthToken } from "@/lib/auth";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      clearAuthToken();
      router.replace("/login");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return <UmkmLayout>{children}</UmkmLayout>;
}
