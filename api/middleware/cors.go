package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	// Setup CORS configuration & middleware
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, //TODO: Change domain in production
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{
			"Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization",
		}, 
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	corsMiddleware := cors.New(corsConfig)
	return corsMiddleware
}

