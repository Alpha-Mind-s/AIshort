package logger

import (
	"testing"
)

func TestInit(t *testing.T) {
	Init("debug", true)
	L().Info().Msg("test log")
}

func TestWithRequestID(t *testing.T) {
	Init("info", false)
	l := WithRequestID("req-123")
	l.Info().Msg("test with request id")
}
