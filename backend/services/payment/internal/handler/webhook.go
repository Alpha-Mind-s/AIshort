package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/pkg/response"
)

type WebhookHandler struct{}

func NewWebhookHandler() *WebhookHandler {
	return &WebhookHandler{}
}

func (h *WebhookHandler) Handle(c *gin.Context) {
	channel := c.Param("channel")

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	_ = channel
	_ = body

	response.OK(c, gin.H{"status": "received"})
}
