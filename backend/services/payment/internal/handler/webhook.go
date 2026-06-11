package handler

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/webhook"

	"github.com/ai-shot/pkg/logger"
	svc "github.com/ai-shot/payment-svc/internal/service"
)

type WebhookHandler struct {
	svc    *svc.SubscriptionService
	secret string
}

func NewWebhookHandler(svc *svc.SubscriptionService, secret string) *WebhookHandler {
	return &WebhookHandler{svc: svc, secret: secret}
}

func (h *WebhookHandler) Handle(c *gin.Context) {
	channel := c.Param("channel")
	if channel != "stripe" {
		c.JSON(http.StatusOK, gin.H{"status": "ignored", "reason": "unsupported channel"})
		return
	}

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read webhook body")
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "reason": "cannot read body"})
		return
	}

	sigHeader := c.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEvent(payload, sigHeader, h.secret)
	if err != nil {
		logger.Error().Err(err).Msg("stripe webhook signature verification failed")
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "reason": "invalid signature"})
		return
	}

	logger.Info().Str("event_type", string(event.Type)).Str("event_id", event.ID).Msg("stripe webhook received")

	ctx := c.Request.Context()
	switch event.Type {
	case "checkout.session.completed":
		if err := h.handleCheckoutCompleted(ctx, event); err != nil {
			logger.Error().Err(err).Msg("checkout.session.completed failed")
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error"})
			return
		}

	case "customer.subscription.updated":
		if err := h.handleSubscriptionUpdated(ctx, event); err != nil {
			logger.Error().Err(err).Msg("customer.subscription.updated failed")
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error"})
			return
		}

	case "customer.subscription.deleted":
		if err := h.handleSubscriptionDeleted(ctx, event); err != nil {
			logger.Error().Err(err).Msg("customer.subscription.deleted failed")
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error"})
			return
		}

	default:
		logger.Debug().Str("event_type", string(event.Type)).Msg("unhandled stripe event type")
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

func (h *WebhookHandler) handleCheckoutCompleted(ctx context.Context, event stripe.Event) error {
	var cs stripe.CheckoutSession
	if err := webhookObject(event, &cs); err != nil {
		return err
	}
	if cs.PaymentStatus != stripe.CheckoutSessionPaymentStatusPaid {
		logger.Info().Str("session_id", cs.ID).Str("payment_status", string(cs.PaymentStatus)).Msg("checkout not paid yet")
		return nil
	}
	return h.svc.ActivateSubscriptionFromCheckout(ctx, &cs)
}

func (h *WebhookHandler) handleSubscriptionUpdated(ctx context.Context, event stripe.Event) error {
	var sub stripe.Subscription
	if err := webhookObject(event, &sub); err != nil {
		return err
	}
	return h.svc.HandleSubscriptionUpdated(ctx, sub)
}

func (h *WebhookHandler) handleSubscriptionDeleted(ctx context.Context, event stripe.Event) error {
	var sub stripe.Subscription
	if err := webhookObject(event, &sub); err != nil {
		return err
	}
	return h.svc.HandleSubscriptionDeleted(ctx, sub)
}

// webhookObject converts the raw event Data.Object into the target struct via JSON round-trip.
func webhookObject[T any](event stripe.Event, target *T) error {
	data, err := json.Marshal(event.Data.Object)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, target)
}
