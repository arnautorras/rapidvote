package responses

import "github.com/gin-gonic/gin"

type APIResponse struct {
	Status   int    `json:"status"`
	Message  string `json:"message"`
	Metadata gin.H  `json:"metadata"`
}

func Send(c *gin.Context, status int, message string, metadata gin.H) {
	response := APIResponse{
		Status: status,
		Message: message,
		Metadata: metadata,
	}
	c.JSON(status, response)
}
