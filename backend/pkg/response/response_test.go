package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestOK(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	OK(c, map[string]string{"name": "test"})

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.Code != 0 {
		t.Errorf("expected code 0, got %d", resp.Code)
	}
	if resp.Message != "success" {
		t.Errorf("expected success, got %s", resp.Message)
	}
}

func TestError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Error(c, http.StatusBadRequest, 10001, "bad request")

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.Code != 10001 {
		t.Errorf("expected code 10001, got %d", resp.Code)
	}
	if resp.Message != "bad request" {
		t.Errorf("expected bad request, got %s", resp.Message)
	}
}
