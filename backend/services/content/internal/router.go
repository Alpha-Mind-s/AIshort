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
	internalRepo := repository.NewInternalRepository(pool)

	dramaHandler := handler.NewDramaHandler(dramaRepo)
	episodeHandler := handler.NewEpisodeHandler(episodeRepo)
	categoryHandler := handler.NewCategoryHandler(categoryRepo)
	internalHandler := handler.NewInternalHandler(episodeRepo, internalRepo)

	api := r.Group("/api/v1")
	{
		// Read
		api.GET("/dramas", dramaHandler.List)
		api.GET("/dramas/:id", dramaHandler.Detail)
		api.GET("/dramas/:id/episodes", episodeHandler.ListByDrama)
		api.GET("/episodes/:id", episodeHandler.Detail)
		api.GET("/episodes/:id/play", episodeHandler.Play)
		api.GET("/categories", categoryHandler.List)

		// Write
		api.POST("/dramas", dramaHandler.Create)
		api.PUT("/dramas/:id", dramaHandler.Update)
		api.DELETE("/dramas/:id", dramaHandler.Delete)
		api.PUT("/dramas/:id/status", dramaHandler.UpdateStatus)
		api.POST("/dramas/:id/episodes", episodeHandler.Create)
		api.PUT("/episodes/:id", episodeHandler.Update)
		api.DELETE("/episodes/:id", episodeHandler.Delete)

		// View tracking
		api.POST("/episodes/:id/view", episodeHandler.RecordView)
	}

	// Internal API (auth handled by Gateway via X-Internal-Api-Key)
	internal := r.Group("/internal")
	{
		internal.GET("/ai/jobs", internalHandler.ListJobs)
		internal.PUT("/ai/jobs/:id/status", internalHandler.UpdateJobStatus)
		internal.GET("/episodes/:id", internalHandler.GetEpisode)
		internal.PUT("/episodes/:id/localization", internalHandler.UpsertLocalization)
	}

	return r
}
