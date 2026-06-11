package config

import (
	"os"
	"testing"
	"time"
)

func TestConfigLoadDefaults(t *testing.T) {
	os.Unsetenv("SVC_ADDR")
	os.Unsetenv("SVC_SECRET")

	var s ServerConfig
	s.Load("SVC")
	if s.Addr != ":8080" {
		t.Errorf("expected :8080, got %s", s.Addr)
	}

	var j JWTConfig
	j.Load("SVC")
	if j.AccessTokenTTL != 900*time.Second {
		t.Errorf("expected 900s, got %v", j.AccessTokenTTL)
	}
}

func TestConfigLoadEnv(t *testing.T) {
	os.Setenv("TEST_ADDR", ":9090")
	os.Setenv("TEST_SECRET", "mysecret")
	defer func() {
		os.Unsetenv("TEST_ADDR")
		os.Unsetenv("TEST_SECRET")
	}()

	var s ServerConfig
	s.Load("TEST")
	if s.Addr != ":9090" {
		t.Errorf("expected :9090, got %s", s.Addr)
	}

	var j JWTConfig
	j.Load("TEST")
	if j.Secret != "mysecret" {
		t.Errorf("expected mysecret, got %s", j.Secret)
	}
}
