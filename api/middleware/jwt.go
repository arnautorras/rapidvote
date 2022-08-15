package middleware

import (
	"log"
	"net/http"
	"rapidvote/api/auth"
	"rapidvote/api/responses"

	"github.com/gin-gonic/gin"
)

func JWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("Private endpoint hit: %s\n", c.Request.URL)

		cookie, _ := c.Request.Cookie("accessToken")
		if cookie == nil || cookie.Value == "" {
			responses.Send(c, http.StatusUnauthorized, "User is not authorized", gin.H{
				"reason": "accessToken cookie nil or undefined",
			})
			c.Abort()
			return
		} 

		accessToken := cookie.Value
		accessClaims, err := auth.ParseToken(accessToken, auth.TokenTypeAccess)
		if err != nil {
			log.Printf("Error: %+v\n", err)
			reauthRequired := true
			responses.Send(c, http.StatusInternalServerError, "Couldn't parse accessToken", gin.H{
				"reason": err.Error(),
				"reauthRequired": reauthRequired,
			})
			c.Abort()
			return
		}

		c.Set("accessClaims", accessClaims)
	}
}
