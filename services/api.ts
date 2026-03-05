/**
 * Infozerv backend API client for infoapp.
 * Base: EXPO_PUBLIC_API_URL or https://promoter-api.infozerv.com, path /api/v1
 * Auth: JWT Bearer; tokens stored via storage (AsyncStorage with in-memory fallback).
 */
import { storage } from "../utils/storage";

const DEFAULT_API_URL = "https://promoter-api.infozerv.com";
const BASE_URL = (
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  DEFAULT_API_URL
).replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api/v1`;

const TOKEN_KEY = "infozerv_access";
const REFRESH_KEY = "infozerv_refresh";
const USER_KEY = "infozerv_user";

export function getApiBase(): string {
  return API_BASE;
}

export function getMediaBase(): string {
  return BASE_URL;
}

export async function getAccessToken(): Promise<string | null> {
  return storage.getItem(TOKEN_KEY);
}

export async function setAuth(
  access: string,
  refresh: string,
  user: { id: number; name: string; email: string; role: string }
): Promise<void> {
  await storage.setItem(TOKEN_KEY, access);
  await storage.setItem(REFRESH_KEY, refresh);
  await storage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth(): Promise<void> {
  await storage.removeItem(TOKEN_KEY);
  await storage.removeItem(REFRESH_KEY);
  await storage.removeItem(USER_KEY);
}

export async function getStoredUser(): Promise<{
  id: number;
  name: string;
  email: string;
  role: string;
} | null> {
  try {
    const raw = await storage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await storage.getItem(TOKEN_KEY);
  return !!token;
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (
    !headers["Content-Type"] &&
    typeof (init.body as string) === "string" &&
    !(init.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && !skipAuth && (await getAccessToken())) {
    const refresh = await storage.getItem(REFRESH_KEY);
    if (refresh) {
      const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { access: string; refresh?: string };
        await storage.setItem(TOKEN_KEY, data.access);
        if (data.refresh) await storage.setItem(REFRESH_KEY, data.refresh);
        headers["Authorization"] = `Bearer ${data.access}`;
        res = await fetch(url, { ...init, headers });
      } else {
        await clearAuth();
        throw new Error("Session expired");
      }
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string;
      detail?: string;
      error?: string;
    };
    throw new Error(
      err.message ?? err.detail ?? err.error ?? res.statusText ?? "Request failed"
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---
export interface TokenResponse {
  access: string;
  refresh: string;
  user: { id: number; name: string; email: string; role: string };
}

export async function login(
  phoneOrEmail: string,
  password: string
): Promise<TokenResponse> {
  const body = { email: phoneOrEmail.trim(), password };
  const data = await request<TokenResponse>("/auth/token/", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
  if (data.user?.role !== "promoter") {
    await clearAuth();
    throw new Error("This login is for promoters only.");
  }
  return data;
}

export async function logout(): Promise<void> {
  const refresh = await storage.getItem(REFRESH_KEY);
  if (refresh) {
    try {
      await request("/auth/token/blacklist/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
        skipAuth: true,
      });
    } catch {
      // ignore
    }
  }
  await clearAuth();
}

// --- Promoter me ---
export interface PromoterRelatedPayment {
  batch_id: string;
  date: string;
  amount: string;
  status: string;
  campaign_title: string;
}

export interface PromoterMe {
  id: number;
  name: string;
  whatsapp: string;
  email: string;
  district: { id: number; name: string } | null;
  town: number | null;
  local_body: number | null;
  location_text: string;
  status: string;
  total_earnings: string;
  submission_count: number;
  registered_at: string;
  related_payments?: PromoterRelatedPayment[];
}

export async function getPromoterMe(): Promise<PromoterMe> {
  return request<PromoterMe>("/promoters/me/");
}

// --- Promoter bank accounts ---
export interface PromoterBankAccount {
  id: number;
  account_holder_name: string;
  bank_name: string;
  account_number_display: string;
  ifsc: string;
  branch: string;
  is_active: boolean;
  created_at: string;
}

export async function getPromoterBankAccounts(
  promoterId: number
): Promise<PromoterBankAccount[]> {
  const data = await request<PromoterBankAccount[]>(
    `/promoters/${promoterId}/bank-accounts/`
  );
  return Array.isArray(data) ? data : [];
}

export interface CreatePromoterBankAccountBody {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  branch?: string;
}

export async function createPromoterBankAccount(
  promoterId: number,
  body: CreatePromoterBankAccountBody
): Promise<PromoterBankAccount> {
  return request<PromoterBankAccount>(
    `/promoters/${promoterId}/bank-accounts/`,
    {
      method: "POST",
      body: JSON.stringify({
        account_holder_name: (body.account_holder_name ?? "").trim(),
        bank_name: (body.bank_name ?? "").trim(),
        account_number: (body.account_number ?? "").trim(),
        ifsc: (body.ifsc ?? "").trim(),
        branch: (body.branch ?? "").trim(),
      }),
    }
  );
}

export async function setPromoterBankAccountActive(
  promoterId: number,
  accountId: number
): Promise<PromoterBankAccount> {
  return request<PromoterBankAccount>(
    `/promoters/${promoterId}/bank-accounts/${accountId}/set-active/`,
    { method: "POST" }
  );
}

export async function deletePromoterBankAccount(
  promoterId: number,
  accountId: number
): Promise<void> {
  await request<void>(
    `/promoters/${promoterId}/bank-accounts/${accountId}/`,
    { method: "DELETE" }
  );
}

// --- Promoter campaigns ---
export interface PromoterCampaign {
  id: number;
  title: string;
  shop: string;
  category: string;
  status: string;
  media_type: string;
  media_url: string;
  media_text: string;
}

export async function getPromoterCampaigns(): Promise<PromoterCampaign[]> {
  return request<PromoterCampaign[]>("/promoters/campaigns/");
}

// --- Paginated ---
export interface Paginated<T> {
  count: number;
  results: T[];
  next?: string | null;
  previous?: string | null;
}

// --- Submissions ---
export interface ApiSubmissionItem {
  id: number;
  campaign: { id: number; title: string };
  view_count: number;
  payout_amount: string | null;
  status: string;
  submitted_at: string;
  campaign_day: number | null;
}

export async function getMySubmissions(
  campaignId?: number
): Promise<Paginated<ApiSubmissionItem>> {
  const params = new URLSearchParams();
  params.set("page_size", "25");
  if (campaignId != null) params.set("campaign", String(campaignId));
  return request<Paginated<ApiSubmissionItem>>(
    `/promoters/submissions/?${params.toString()}`
  );
}

/** Create a campaign submission (proof): view count + screenshot. Promoter is taken from JWT. */
export async function createSubmission(
  campaignId: number,
  viewCount: number,
  screenshotUri: string
): Promise<ApiSubmissionItem> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not logged in");

  const form = new FormData();
  form.append("campaign", String(campaignId));
  form.append("view_count", String(viewCount));
  const filename = screenshotUri.split("/").pop() || "screenshot.jpg";
  form.append("screenshot", {
    uri: screenshotUri,
    type: "image/jpeg",
    name: filename.endsWith(".jpg") || filename.endsWith(".jpeg") ? filename : "screenshot.jpg",
  } as unknown as Blob);

  const url = `${API_BASE}/promoters/submissions/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string;
      detail?: string;
      error?: string;
    };
    throw new Error(
      err.message ?? err.detail ?? err.error ?? res.statusText ?? "Submission failed"
    );
  }
  return res.json() as Promise<ApiSubmissionItem>;
}

// --- Ecom products ---
export interface EcomProduct {
  id: number;
  name: string;
  description: string;
  primary_category: number;
  secondary_category: number | null;
  base_cost_price: string;
  final_selling_price: string;
  image: string | null;
  whatsapp_status_image: string | null;
  whatsapp_share_text: string;
  stock_quantity: number;
  minimum_stock_alert: number;
  is_active: boolean;
}

export async function getEcomProducts(params?: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  primary_category?: number;
  secondary_category?: number;
  order_by?: string;
  name?: string;
}): Promise<Paginated<EcomProduct>> {
  const p = new URLSearchParams();
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.page_size != null) p.set("page_size", String(params.page_size));
  if (params?.is_active !== undefined)
    p.set("is_active", String(params.is_active));
  if (params?.primary_category != null)
    p.set("primary_category", String(params.primary_category));
  if (params?.secondary_category != null)
    p.set("secondary_category", String(params.secondary_category));
  if (params?.order_by) p.set("order_by", params.order_by);
  if (params?.name != null && params.name.trim() !== "")
    p.set("name", params.name.trim());
  const q = p.toString();
  return request<Paginated<EcomProduct>>(
    `/ecom/products/${q ? `?${q}` : ""}`
  );
}

export async function getEcomProduct(id: number): Promise<EcomProduct> {
  return request<EcomProduct>(`/ecom/products/${id}/`);
}

export interface EcomPrimaryCategory {
  id: number;
  name: string;
  is_active: boolean;
}

export interface EcomSecondaryCategory {
  id: number;
  primary: number;
  name: string;
  is_active: boolean;
}

export async function getEcomPrimaryCategories(): Promise<EcomPrimaryCategory[]> {
  const res = await request<
    EcomPrimaryCategory[] | { results: EcomPrimaryCategory[] }
  >("/ecom/primary-categories/");
  return Array.isArray(res) ? res : res?.results ?? [];
}

export async function getEcomSecondaryCategories(
  primaryId: number
): Promise<EcomSecondaryCategory[]> {
  const res = await request<
    EcomSecondaryCategory[] | { results: EcomSecondaryCategory[] }
  >(`/ecom/secondary-categories/?primary=${primaryId}`);
  return Array.isArray(res) ? res : res?.results ?? [];
}

// --- Ecom orders (my sales) ---
export interface EcomOrder {
  id: number;
  product: number;
  product_name: string;
  product_base_price?: string;
  product_selling_price?: string;
  customer_name: string;
  payment_verified: boolean;
  delivery_status: string;
  order_date: string | null;
  created_at: string;
}

export async function getEcomOrders(params: {
  promoter: number;
  page?: number;
  page_size?: number;
}): Promise<Paginated<EcomOrder>> {
  const p = new URLSearchParams();
  p.set("promoter", String(params.promoter));
  if (params?.page != null) p.set("page", String(params.page));
  p.set("page_size", String(params?.page_size ?? 25));
  return request<Paginated<EcomOrder>>(`/ecom/orders/?${p.toString()}`);
}

/** Resolve image URL: if relative, prepend media base. */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
