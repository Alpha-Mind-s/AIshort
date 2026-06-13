package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/pkg/response"
)

// RequireSubscription returns a middleware that checks whether the authenticated
// user has an active subscription by calling the payment service.
//
// It must run after JWTAuth (which sets user_id in the gin context).
func RequireSubscription(paymentSvcAddr string) gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
			c.Abort()
			return
		}

		url := fmt.Sprintf("http://%s/api/v1/subscriptions/status", paymentSvcAddr)
		req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, url, nil)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, "failed to check subscription")
			c.Abort()
			return
		}
		req.Header.Set("X-User-ID", fmt.Sprintf("%d", userID))

		resp, err := client.Do(req)
		if err != nil {
			response.Error(c, http.StatusBadGateway, pkgErr.ErrInternal.Code, "payment service unavailable")
			c.Abort()
			return
		}
		defer resp.Body.Close()

		// The /subscriptions/status endpoint returns {code: 0, message: "success", data: {...}}
		// data is null when there is no active subscription.
		var result struct {
			Code    int             `json:"code"`
			Message string          `json:"message"`
			Data    json.RawMessage `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			response.Error(c, http.StatusBadGateway, pkgErr.ErrInternal.Code, "invalid response from payment service")
			c.Abort()
			return
		}

		// data is null (JSON "null") when no active subscription
		if string(result.Data) == "null" || len(result.Data) == 0 {
			response.Error(c, http.StatusPaymentRequired, pkgErr.ErrSubscriptionRequired.Code, pkgErr.ErrSubscriptionRequired.Message)
			c.Abort()
			return
		}

		c.Next()
	}
}
