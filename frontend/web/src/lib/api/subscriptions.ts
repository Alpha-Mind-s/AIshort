import { apiFetch } from "./client";

export interface SubscriptionPlan {
  id: number;
  name: "monthly" | "quarterly" | "yearly";
  price: number;
  currency: string;
  description: string;
  features: string[];
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_type: "monthly" | "quarterly" | "yearly";
  start_at: string;
  end_at: string;
  status: "active" | "cancelled" | "expired";
  auto_renew: boolean;
}

export interface CreateSubscriptionRequest {
  plan_type: "monthly" | "quarterly" | "yearly";
  channel: "paypal" | "stripe" | "apple_pay" | "google_pay";
  return_url?: string;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiFetch<SubscriptionPlan[]>("/subscriptions/plans");
  return res.data;
}

export async function createSubscription(
  data: CreateSubscriptionRequest
): Promise<{ subscription_id: number; payment_url: string }> {
  const res = await apiFetch<{
    subscription_id: number;
    payment_url: string;
  }>("/subscriptions/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function cancelSubscription(): Promise<void> {
  await apiFetch("/subscriptions/cancel", { method: "POST" });
}

export async function getSubscriptionStatus(): Promise<Subscription | null> {
  const res = await apiFetch<Subscription>("/subscriptions/status");
  return res.data ?? null;
}
