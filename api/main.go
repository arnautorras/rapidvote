package main

import (
	"math/rand"
	"time"

	"rapidvote/api/endpoints"
	"rapidvote/api/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	r := gin.Default()
	r.Use(middleware.CORS())

	api := r.Group("/api")

	// Poll endpoints
	polls := api.Group("/polls")
	{
		polls.POST("/view/:pollId", endpoints.ViewPoll)
		polls.GET("/results/:pollId", endpoints.GetPollResult)
		polls.POST("/vote", endpoints.VotePoll)
		polls.POST("/create", endpoints.CreatePoll)
		polls.POST("/close", endpoints.ClosePoll)
	}

	// User endpoints
	users := api.Group("/users")
	{
		users.POST("/register", endpoints.RegisterUser)
		users.POST("/login", endpoints.LoginUser)
		users.POST("/logout", endpoints.LogoutUser).Use(middleware.JWT())
		users.POST("/reset/email", endpoints.ResetUserEmail).Use(middleware.JWT())
		users.POST("/reset/password", endpoints.ResetUserPassword).Use(middleware.JWT())
		users.POST("/polls", endpoints.FetchPolls).Use(middleware.JWT())
		users.POST("/deactivate", endpoints.DeactivateUser).Use(middleware.JWT())
	}

	r.Run(":8080")
}
