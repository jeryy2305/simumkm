"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UmkmLayout from "@/layouts/UmkmLayout";
import { API_URL, authFetch, clearAuthToken, getAuthToken, parseJson } from "@/lib/auth";
import InactiveAccountNotice from "@/components/InactiveAccountNotice";

interface MeResponse {
  user?: {
    umkm?: {
      status?: "active" | "inactive";
    } | null;
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      clearAuthToken();
      router.replace("/login");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    const checkAccountStatus = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/me`);
        if (!response.ok) return;

        const data = await parseJson<MeResponse>(response);
        setAccountInactive(data.user?.umkm?.status === "inactive");
      } catch {
        setAccountInactive(false);
      } finally {
        setAccountChecked(true);
      }
    };

    checkAccountStatus();
  }, [authChecked]);

  if (!authChecked || !accountChecked) {
    return null;
  }

  if (accountInactive) {
    return <InactiveAccountNotice />;
  }

  return <UmkmLayout>{children}</UmkmLayout>;
}
