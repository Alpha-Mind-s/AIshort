package internal

import (
    "github.com/gin-gonic/gin"
    "github.com/jackc/pgx/v5/pgxpool"

    "github.com/ai-shot/content-svc/internal/handler"
    "github.com/ai-shot/content-svc/internal/repository"
)

func SetupRouter(pool *pgxpool.Pool) *gin.Engine {
    r := gin.Default()

    dramaRepo := repository.NewDramaRepository(pool)
    episodeRepo := repository.NewEpisodeRepository(pool)
    categoryRepo := repository.NewCategoryRepository(pool)

    dramaHandler := handler.NewDramaHandler(dramaRepo)
    episodeHandler := handler.NewEpisodeHandler(episodeRepo)
    categoryHandler := handler.NewCategoryHandler(categoryRepo)

    api := r.Group("/api/v1")
    {
        api.GET("/dramas", dramaHandler.List)
        api.GET("/dramas/:id", dramaHandler.Detail)
        api.GET("/dramas/:id/episodes", episodeHandler.ListByDrama)
        api.GET("/episodes/:id", episodeHandler.Detail)
        api.GET("/categories", categoryHandler.List)
    }

    return r
}
