package internal

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-shot/payment-svc/internal/handler"
	"github.com/ai-shot/payment-svc/internal/repository"
	svc "github.com/ai-shot/payment-svc/internal/service"
)

func SetupRouter(pool *pgxpool.Pool) *gin.Engine {
	r := gin.Default()

	subRepo := repository.NewSubscriptionRepository(pool)
	subSvc := svc.NewSubscriptionService(subRepo)
	subHandler := handler.NewSubscriptionHandler(subSvc)
	webhookHandler := handler.NewWebhookHandler()

	api := r.Group("/api/v1")
	{
		api.GET("/subscriptions/plans", subHandler.GetPlans)
		api.POST("/subscriptions/create", subHandler.Create)
		api.POST("/subscriptions/cancel", subHandler.Cancel)
		api.GET("/subscriptions/status", subHandler.Status)

		api.POST("/payments/webhook/:channel", webhookHandler.Handle)
	}

	return r
}
