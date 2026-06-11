package internal

import (
    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
    "github.com/jackc/pgx/v5/pgxpool"

    "github.com/ai-shot/pkg/auth"
    "github.com/ai-shot/pkg/config"
    "github.com/ai-shot/user-svc/internal/handler"
    "github.com/ai-shot/user-svc/internal/repository"
    svc "github.com/ai-shot/user-svc/internal/service"
)

func SetupRouter(pool *pgxpool.Pool, rdb *redis.Client, cfg config.JWTConfig) *gin.Engine {
    r := gin.Default()

    userRepo := repository.NewUserRepository(pool)
    favoriteRepo := repository.NewFavoriteRepository(pool)
    commentRepo := repository.NewCommentRepository(pool)

    jwtAuth := auth.NewJWTAuth(cfg)
    authSvc := svc.NewAuthService(userRepo, jwtAuth, rdb)
    authHandler := handler.NewAuthHandler(authSvc)

    favSvc := svc.NewFavoriteService(favoriteRepo)
    favHandler := handler.NewFavoriteHandler(favSvc)

    commentSvc := svc.NewCommentService(commentRepo)
    commentHandler := handler.NewCommentHandler(commentSvc)

    api := r.Group("/api/v1")
    {
        auth := api.Group("/auth")
        {
            auth.POST("/register", authHandler.Register)
            auth.POST("/login", authHandler.Login)
            auth.POST("/refresh", authHandler.RefreshToken)
            auth.POST("/logout", authHandler.Logout)
        }

        fav := api.Group("/favorites")
        {
            fav.POST("", favHandler.Add)
            fav.GET("", favHandler.List)
            fav.DELETE("/:id", favHandler.Delete)
        }

        api.POST("/dramas/:id/comments", commentHandler.Create)
        api.GET("/dramas/:id/comments", commentHandler.List)
        api.DELETE("/comments/:id", commentHandler.Delete)
    }

    return r
}
