/**
 * Centralized TypeScript Type Definitions
 * This file consolidates all shared types across the application
 * to avoid duplication and maintain consistency.
 */

// ============= AUTH & USER =============
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "umkm";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ProfileUser {
  id: number;
  email: string;
  name: string;
  owner?: string;
  phone?: string;
  address?: string;
  role: string;
  created_at?: string;
  umkm?: Partial<Umkm>;
}

// ============= UMKM =============
export interface Umkm {
  id: number;
  name?: string;
  owner: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export type UmkmData = Partial<Umkm>;

// ============= HOTEL =============
export interface Hotel {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  category: string;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export type HotelItem = Hotel;

// ============= PRODUCT =============
export interface Product {
  id: number;
  name: string;
  category?: string;
  price: number | string;
  quantity: number;
  description?: string;
  status: "available" | "unavailable";
  umkm_id: number | string;
  has_completed_consignment?: boolean;
  umkm?: Partial<Umkm> & { status?: string; owner?: string; name?: string };
  created_at?: string;
  updated_at?: string;
}

// ============= CONSIGNMENT (PENITIPAN) =============
export interface Consignment {
  id: number;
  company: string;
  product_id: number;
  umkm_id: number;
  quantity: number;
  duration_days: number;
  start_date: string;
  end_date?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at?: string;
  umkm?: Partial<Umkm> & { name?: string; owner?: string; status?: string };
  product?: Partial<Product> & { name?: string; price?: number | string; quantity?: number };
}

export interface ConsignmentFormData {
  company: string;
  product_id: string;
  umkm_id: string;
  quantity: number;
  duration_days: number;
  start_date: string;
  status: string;
}

// ============= DASHBOARD & ACTIVITY =============
export interface Stat {
  title: string;
  value: string;
  icon?: any;
}

export interface Activity {
  date: string;
  type: string;
  partner: string;
  product: string;
  qty: number;
  status: string;
}

export interface AdminDashboardStats {
  total_umkm: number;
  total_products: number;
  barang_masuk_hari_ini: number;
  total_nilai_distribusi: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  status: string;
  date: string;
  amount?: string;
  type: "consignment" | "dispute" | "request" | string;
}

export interface DashboardData {
  umkm: Umkm;
  stats: {
    total_titipan: number;
    produk_aktif: number;
    selesai: number;
  };
  recent_activities: DashboardActivity[];
}

// ============= LAPORAN (REPORT) =============
export interface MonthlyRow {
  month: string;
  total_value: number;
  total_items: number;
}

// ============= NOTIFICATIONS & UI =============
export interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

// ============= COMPONENT PROPS =============
export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info";
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined";
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export interface TableProps {
  data: any[];
  columns: { key: string; label: string; render?: (value: any) => React.ReactNode }[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  className?: string;
}

export type ToastProps = {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  duration?: number;
};
