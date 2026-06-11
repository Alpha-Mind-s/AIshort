import { http, HttpResponse } from "msw";
import { mockSubscriptionPlans, mockSubscriptions } from "../data/subscriptions";

export const subscriptionsHandlers = [
  // GET /subscriptions/plans
  http.get("*/api/v1/subscriptions/plans", () => {
    return HttpResponse.json({ code: 0, message: "success", data: mockSubscriptionPlans });
  }),

  // POST /subscriptions/create
  http.post("*/api/v1/subscriptions/create", async ({ request }) => {
    const body = (await request.json()) as { plan_type: string; channel: string; return_url?: string };
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        subscription_id: 2,
        payment_url: body.channel === "paypal"
          ? "https://www.paypal.com/checkout/mock"
          : "https://checkout.stripe.com/pay/mock",
        return_url: body.return_url ?? "/subscribe/success",
      },
    });
  }),

  // POST /subscriptions/cancel
  http.post("*/api/v1/subscriptions/cancel", () => {
    return HttpResponse.json({ code: 0, message: "Subscription cancelled", data: null });
  }),

  // GET /subscriptions/status
  http.get("*/api/v1/subscriptions/status", () => {
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: mockSubscriptions[0] ?? null,
    });
  }),

  // POST /payments/webhook/:channel
  http.post("*/api/v1/payments/webhook/:channel", () => {
    return HttpResponse.json({ code: 0, message: "success", data: null });
  }),
];
