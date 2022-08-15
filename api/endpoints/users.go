package endpoints

import (
	"context"
	"log"
	"net/http"
	"time"

	"rapidvote/api/auth"
	"rapidvote/api/database"
	"rapidvote/api/models"
	"rapidvote/api/requests"
	"rapidvote/api/responses"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

const (
	saltRounds int = 12
)

var (
	UsersColl *mongo.Collection = database.Mongo.Database("test").Collection("users")
)

func LoginUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse and unmarshal the incoming request into `models.Login` type
	var login requests.Login
	if err := c.ShouldBindJSON(&login); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return 
	}
	log.Printf("Verifying Login: %+v\n", login)

	// Check if user exists with the given email
	var user models.User
	err := UsersColl.FindOne(ctx, bson.M{"email": login.Email}, options.FindOne()).Decode(&user)
	if err != nil {
		responses.Send(c, http.StatusNotFound, "Account doesn't exist with given email", gin.H{})
		return 
	}

	// Compare hashes of user's password. If they don't match, send HTTP error code 401 (Unauthorized)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(login.Password))
	if err != nil { // If err != nil, that means it doesn't match
		responses.Send(c, http.StatusUnauthorized, "Wrong email/password combination", gin.H{})
		return
	}

	// Generate access & refresh JWTs
	tokens, err := auth.GenerateTokens(user.Id.Hex())
	if err != nil {
		log.Printf("Couldn't generate JWT: %s\n", err.Error())
		responses.Send(c, http.StatusInternalServerError, "Couldn't generate JWT", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// TODO: Change the domain in production, and set secure to true
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("accessToken", tokens.AccessToken, 604800, "/", "", false, true)

	responses.Send(c, http.StatusOK, "Successfully logged in", gin.H{
		"userEmail": user.Email,
		"userId": user.Id,
		"refreshToken": tokens.RefreshToken,
	})
}

func LogoutUser(c *gin.Context) {
	// TODO: Change the domain in production, and set secure to true
	// Make the cookie expire for the client
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("accessToken", "", 0, "/", "", false, true)	
	responses.Send(c, http.StatusOK, "Logged out", gin.H{})
}

func RegisterUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse and unmarshal the incoming request into `models.Login` type
	var register requests.Register
	if err := c.ShouldBindJSON(&register); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Got Register: %+v\n", register)

	// Check if user with this email has already signed up
	var user models.User
	err := UsersColl.FindOne(ctx, bson.M{"email": register.Email}, options.FindOne()).Decode(&user)
	if err == nil { // err will be nil here if the user exists!
		responses.Send(c, http.StatusBadRequest, "Account exists with given email", gin.H{})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(register.Password), saltRounds)
	if err != nil {
		log.Printf("Couldn't hash password: %s\n", err.Error())
		responses.Send(c, http.StatusInternalServerError, "Couldn't hash password", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// Create the newAccount struct that will be inserted into MongoDB
	newAccount := models.User{
		Email:    register.Email,
		Password: string(hashedPassword),
	}
	log.Printf("Creating new Registration: %+v\n", newAccount)

	// Insert the poll into MongoDB
	_, err = UsersColl.InsertOne(ctx, newAccount)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't create account", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// Send back successful response
	responses.Send(c, http.StatusOK, "Account registered successfully", gin.H{})
}

func ResetUserEmail(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	accessClaims, exists := c.Get("accessClaims")
	if !exists {
		responses.Send(c, http.StatusUnauthorized, "Couldn't get accessClaims", gin.H{})
		return
	}

	claims := accessClaims.(*jwt.StandardClaims)
	log.Printf("Got claims for user: %+v\n", claims)

	// Parse and unmarshal the incoming request into `models.Login` type
	var reset requests.Reset

	if err := c.ShouldBindJSON(&reset); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return 
	}


	userId, err := primitive.ObjectIDFromHex(claims.Issuer)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Malformed userID from claims", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// Check if user exists with the given email
	var user models.User
	err = UsersColl.FindOne(ctx, bson.M{"email": reset.Email}, options.FindOne()).Decode(&user)
	if err != nil {
		responses.Send(c, http.StatusNotFound, "Account doesn't exist with given email", gin.H{})
		return 
	}

	//Trying to change someone else's email.
	if userId.Hex() != user.Id.Hex(){
		responses.Send(c, http.StatusNotFound, "Account doesn't exist with given email", gin.H{})
		return
	}


	// Compare hashes of user's password. If they don't match, send HTTP error code 401 (Unauthorized)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(reset.Password))
	if err != nil { // If err != nil, that means it doesn't match
		responses.Send(c, http.StatusUnauthorized, "Wrong email/password combination", gin.H{})
		return
	}


	log.Printf("Verifying Password: %+v\n", reset)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(reset.Password))
	if err != nil {
		responses.Send(c, http.StatusUnauthorized, "Wrong password", gin.H{})
		return
	}


	log.Printf("Resetting email for user: %s\n", user.Id)

	result,err := UsersColl.UpdateOne(ctx, bson.M{"_id": user.Id}, bson.D{{"$set",bson.D{{"email", reset.NewEmail}}}})
	if result.MatchedCount != 1 || err != nil {
		responses.Send(c, http.StatusNotFound, "Account doesn't exist", gin.H{})
		return 
	}
	responses.Send(c, http.StatusOK, "Updated user email", gin.H{})
}

func ResetUserPassword(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	accessClaims, exists := c.Get("accessClaims")
	if !exists {
		responses.Send(c, http.StatusUnauthorized, "Couldn't get accessClaims", gin.H{})
		return
	}

	claims := accessClaims.(*jwt.StandardClaims)
	log.Printf("Got claims for user: %+v\n", claims)

	// Parse and unmarshal the incoming request into `models.Login` type
	var reset requests.Reset

	if err := c.ShouldBindJSON(&reset); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return 
	}
	userId, err := primitive.ObjectIDFromHex(claims.Issuer)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Malformed userID from claims", gin.H{
			"reason": err.Error(),
		})
		return
	}
	var user models.User
	err = UsersColl.FindOne(ctx, bson.M{"_id": userId}, options.FindOne()).Decode(&user)
	if err != nil {
		responses.Send(c, http.StatusNotFound, "Account not found", gin.H{})
		return 
	}
	log.Printf("Verifying Password: %+v\n", reset)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(reset.Password))
	if err != nil {
		responses.Send(c, http.StatusUnauthorized, "Wrong password", gin.H{})
		return
	}

	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(reset.NewPassword), saltRounds)
	if err != nil {
		log.Printf("Couldn't hash new password: %s\n", err.Error())
		responses.Send(c, http.StatusInternalServerError, "Couldn't hash password", gin.H{
			"reason": err.Error(),
		})
		return
	}

	log.Printf("Resetting password for user: %s\n", userId)

	results,err := UsersColl.UpdateOne(ctx, bson.M{"_id": userId}, bson.D{{"$set",bson.D{{"password", hashedNewPassword}}}})
	if results.MatchedCount != 1 || err != nil {
		responses.Send(c, http.StatusNotFound, "Account doesn't exist", gin.H{})
		return 
	}
	responses.Send(c, http.StatusOK, "Updated user password",gin.H{})
}


func FetchPolls(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	accessClaims, exists := c.Get("accessClaims")
	if !exists {
		responses.Send(c, http.StatusUnauthorized, "Couldn't get accessClaims", gin.H{})
		return
	}

	claims := accessClaims.(*jwt.StandardClaims)
	log.Printf("Got claims for user: %+v\n", claims)

	userId, err := primitive.ObjectIDFromHex(claims.Issuer)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Malformed userID from claims", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Retrieving polls for user: %s\n", userId)

	// Find poll creator with given userId
	var polls []models.Poll 
	filter := bson.M{"creator": userId}
	findOptions := options.Find()
	cursor, err := PollsColl.Find(ctx, filter, findOptions)
	if err != nil {
		log.Printf("Couldn't find or decode polls of user %s because %s\n", userId, err.Error())
		responses.Send(c, http.StatusNotFound, "Couldn't find poll", gin.H{})
		return
	}

	for cursor.Next(ctx) {
		//Create a value into which the single document can be decoded
		var userPoll models.Poll
		err := cursor.Decode(&userPoll)
		if err != nil {
			log.Fatal(err)
		}
		polls = append(polls, userPoll)
	}
	log.Printf("Found %d polls for user %s\n", len(polls), userId)

	if err != nil {
		log.Printf("Couldn't parse polls of user %s because %s\n", userId, err.Error())
		responses.Send(c, http.StatusInternalServerError, "Couldn't parse polls", gin.H{
			"reason": err.Error(),
		})
		return
	}

	responses.Send(c, http.StatusOK, "Found polls for user", gin.H{
		"polls": polls,
	})
}

func DeactivateUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	accessClaims, exists := c.Get("accessClaims")
	if !exists {
		responses.Send(c, http.StatusUnauthorized, "Couldn't get accessClaims", gin.H{})
		return
	}

	claims := accessClaims.(*jwt.StandardClaims)
	log.Printf("DeactivateUser: got claims for user: %+v\n", claims)

	userId, err := primitive.ObjectIDFromHex(claims.Issuer)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Malformed userID from claims", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Deactivating user: %s\n", userId)

	// Delete User document in Users collection
	_, err = UsersColl.DeleteOne(ctx, bson.M{"_id": userId}, options.Delete())
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't deactivate user", gin.H{
			"reason": err.Error(),
		})
		return
	}

	responses.Send(c, http.StatusOK, "User account successfully deactivated", gin.H{})
}
