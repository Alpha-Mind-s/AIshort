package errors

import (
	"errors"
	"net/http"
)

type AppError struct {
	Code       int    `json:"code"`
	Message    string `json:"message"`
	HTTPStatus int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

// AsAppError unwraps an error chain to find an *AppError, returning nil if not found.
func AsAppError(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return nil
}

// 通用错误
var (
	ErrOK              = &AppError{Code: 0, Message: "success", HTTPStatus: http.StatusOK}
	ErrBadRequest      = &AppError{Code: 10001, Message: "bad request", HTTPStatus: http.StatusBadRequest}
	ErrUnauthorized    = &AppError{Code: 10002, Message: "unauthorized", HTTPStatus: http.StatusUnauthorized}
	ErrForbidden       = &AppError{Code: 10003, Message: "forbidden", HTTPStatus: http.StatusForbidden}
	ErrNotFound        = &AppError{Code: 10004, Message: "not found", HTTPStatus: http.StatusNotFound}
	ErrConflict        = &AppError{Code: 10005, Message: "conflict", HTTPStatus: http.StatusConflict}
	ErrTooManyRequests = &AppError{Code: 10006, Message: "too many requests", HTTPStatus: http.StatusTooManyRequests}
	ErrInternal        = &AppError{Code: 10007, Message: "internal server error", HTTPStatus: http.StatusInternalServerError}
)

// 认证错误 (20xxx)
var (
	ErrEmailExists        = &AppError{Code: 20001, Message: "email already exists", HTTPStatus: http.StatusConflict}
	ErrInvalidCredentials = &AppError{Code: 20002, Message: "invalid email or password", HTTPStatus: http.StatusUnauthorized}
	ErrTokenExpired       = &AppError{Code: 20003, Message: "token expired", HTTPStatus: http.StatusUnauthorized}
	ErrTokenInvalid       = &AppError{Code: 20004, Message: "invalid token", HTTPStatus: http.StatusUnauthorized}
	ErrOAuthFailed        = &AppError{Code: 20005, Message: "OAuth login failed", HTTPStatus: http.StatusUnauthorized}
)

// 收藏错误 (30xxx)
var (
	ErrFavoriteExists   = &AppError{Code: 30001, Message: "already favorited", HTTPStatus: http.StatusConflict}
	ErrFavoriteNotFound = &AppError{Code: 30002, Message: "favorite not found", HTTPStatus: http.StatusNotFound}
	ErrCommentForbidden = &AppError{Code: 30003, Message: "no permission to delete comment", HTTPStatus: http.StatusForbidden}
)

// 订阅支付错误 (40xxx)
var (
	ErrSubscriptionExists = &AppError{Code: 40001, Message: "active subscription exists", HTTPStatus: http.StatusConflict}
	ErrPaymentFailed      = &AppError{Code: 40002, Message: "payment failed", HTTPStatus: http.StatusPaymentRequired}
)

// 视频错误 (50xxx)
var (
	ErrUploadFailed    = &AppError{Code: 50001, Message: "upload failed", HTTPStatus: http.StatusInternalServerError}
	ErrTranscodeFailed = &AppError{Code: 50002, Message: "transcode failed", HTTPStatus: http.StatusInternalServerError}
)
