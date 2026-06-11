package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type googleUserInfo struct {
	ID      string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// exchangeGoogleCode exchanges an OAuth authorization code for Google user info.
func exchangeGoogleCode(code, redirectURI string) (*googleUserInfo, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured")
	}

	// 1. Exchange code for access token
	tokenResp, err := http.PostForm("https://oauth2.googleapis.com/token", url.Values{
		"code":          {code},
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"redirect_uri":  {redirectURI},
		"grant_type":    {"authorization_code"},
	})
	if err != nil {
		return nil, fmt.Errorf("token endpoint request: %w", err)
	}
	defer tokenResp.Body.Close()

	if tokenResp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		json.NewDecoder(tokenResp.Body).Decode(&errBody)
		return nil, fmt.Errorf("token exchange failed: %v", errBody)
	}

	var tokenData struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(tokenResp.Body).Decode(&tokenData); err != nil {
		return nil, fmt.Errorf("decode token response: %w", err)
	}

	// 2. Fetch user info
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)
	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("userinfo request: %w", err)
	}
	defer userResp.Body.Close()

	if userResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("userinfo failed with status %d", userResp.StatusCode)
	}

	var user googleUserInfo
	if err := json.NewDecoder(userResp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("decode userinfo: %w", err)
	}
	return &user, nil
}

// OAuthRedirectURL builds the Google OAuth consent screen URL.
func OAuthRedirectURL(redirectURI string) string {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	params := url.Values{
		"client_id":     {clientID},
		"redirect_uri":  {redirectURI},
		"response_type": {"code"},
		"scope":         {strings.Join([]string{"openid", "email", "profile"}, " ")},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}
