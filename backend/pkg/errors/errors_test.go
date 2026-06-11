package errors

import (
	"testing"
)

func TestAppError(t *testing.T) {
	if ErrOK.Code != 0 {
		t.Errorf("expected code 0, got %d", ErrOK.Code)
	}

	if ErrUnauthorized.Error() != "unauthorized" {
		t.Errorf("expected 'unauthorized', got '%s'", ErrUnauthorized.Error())
	}

	if ErrEmailExists.HTTPStatus != 409 {
		t.Errorf("expected 409 Conflict, got %d", ErrEmailExists.HTTPStatus)
	}
}
