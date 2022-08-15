package endpoints

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"rapidvote/api/database"
	"rapidvote/api/models"
	"rapidvote/api/requests"
	"rapidvote/api/responses"
	"rapidvote/api/util"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const pollIdLength uint = 8

var (
	PollsColl *mongo.Collection = database.Mongo.Database("test").Collection("polls")
	VotesColl *mongo.Collection = database.Mongo.Database("test").Collection("votes")
)

/* CheckExpire (bool, error)
* Returns -1 upon error, 0 when poll was not expired, and 1 when poll was expired
* Calls MongoDB to retrieve the expiration date of it and checks whether it has passed.
If so, it updates the poll in MongoDB
*/
func CheckExpire(c *gin.Context, pollId string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	filter := bson.M{"pollId": pollId}
	var poll models.Poll
	err := PollsColl.FindOne(ctx, filter, options.FindOne()).Decode(&poll)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't find poll", gin.H{
			"reason": err.Error(),
		})
		return false, errors.New("couldn't find poll")
	}

	if poll.Status && (poll.Expiration.Before(time.Now())) {
		filter := bson.M{"pollId": poll.PollId}
		close := bson.D{
			{"$set", bson.D{{"status", false}}},
		}
		_, err := PollsColl.UpdateOne(ctx, filter, close)
		if err != nil {
			responses.Send(c, http.StatusInternalServerError, "Couldn't expire poll", gin.H{
				"reason": err.Error(),
			})
			return false, errors.New("couldn't expire poll")
		}
		log.Printf("Poll with ID:[%s] was successfully closed\n", poll.PollId)
		return true, nil
	}
	return false, nil
}

func CreatePoll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req requests.CreatePoll
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Got CreatePoll request: %+v\n", req)

	// Get the user id from the request
	creator := primitive.NilObjectID
	if len(req.Creator) > 0 {
		var err error
		creator, err = primitive.ObjectIDFromHex(req.Creator)
		if err != nil {
			responses.Send(c, http.StatusInternalServerError, "Malformed poll creator", gin.H{
				"reason": err.Error(),
			})
			return
		}
	}

	poll := models.Poll{
		Name:         req.Name,
		Description:  req.Description,
		Options:      req.Options,
		Expiration:   req.Expiration,
		Status:       req.Status,
		AuthRequired: req.AuthRequired,
		Creator:      creator,
	}

	// Generate a new, unique poll ID
	createdNewPollId := false
	for !createdNewPollId {
		newPollId := util.GenRandomString(pollIdLength)
		err := PollsColl.FindOne(ctx, bson.M{"pollId": newPollId}, options.FindOne()).Err()
		if err == nil {
			// If a poll with `newPollId` already exists, retry
			continue
		} else if err != mongo.ErrNoDocuments {
			responses.Send(c, http.StatusInternalServerError, "Something went wrong", gin.H{
				"reason": err.Error(),
			})
			return
		} else {
			poll.PollId = newPollId
			createdNewPollId = true
		}
	}
	log.Printf("Creating new poll: %+v\n", poll)

	// Insert the poll into MongoDB
	_, err := PollsColl.InsertOne(ctx, poll)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't create poll", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("New poll was created with ID: %s\n", poll.PollId)

	// Send back successful response
	responses.Send(c, http.StatusOK, "Poll created", gin.H{
		"pollId": poll.PollId,
	})
}

func ViewPoll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pollId := c.Params.ByName("pollId")

	// Parse ViewPoll request
	var req requests.ViewPoll
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Got ViewPoll request: %+v\n", req)
	log.Printf("Client IP: %s\n", c.ClientIP())

	// Check if the vote expired
	expired, err := CheckExpire(c, pollId)
	if err != nil {
		log.Printf("Couldn't find or decode poll %s because %s\n", pollId, err.Error())
		responses.Send(c, http.StatusNotFound, "Couldn't find poll", gin.H{})
		return
	}
	if expired {
		log.Printf("Changed poll [%s] to expired\n", pollId)
	}

	filter := bson.M{"pollId": pollId}

	// Check if poll exists
	var poll models.Poll
	err = PollsColl.FindOne(ctx, filter, options.FindOne()).Decode(&poll)
	if err != nil {
		log.Printf("Couldn't find or decode poll %s because %s\n", pollId, err.Error())
		responses.Send(c, http.StatusNotFound, "Couldn't find poll", gin.H{})
		return
	}

	// Check to see who the user is, and if they can vote or not
	var userId primitive.ObjectID
	if len(req.UserId) == 0 {
		userId = primitive.NilObjectID
		userAddr := c.ClientIP()
		log.Printf("Anonymous User, using IP: %s\n", userAddr)
		filter["voterAddr"] = userAddr
	} else {
		userId, err = primitive.ObjectIDFromHex(req.UserId)
		if err != nil {
			responses.Send(c, http.StatusInternalServerError, "Malformed user ID", gin.H{
				"reason": err.Error(),
			})
			return
		}

		// Check if the user is actually a valid user
		err = UsersColl.FindOne(ctx, bson.M{"_id": userId}, options.FindOne()).Err()
		if err != nil {
			log.Printf("User %s does not exist\n", userId.Hex())
			responses.Send(c, http.StatusBadRequest, "User does not exist", gin.H{
				"reason": err.Error(),
			})
			return
		}

		log.Printf("Registered User, using ID: %s\n", userId)
		filter["voterId"] = userId
	}

	canVote := false
	var pastVote models.Vote
	err = VotesColl.FindOne(ctx, filter, options.FindOne()).Decode(&pastVote)
	if err != nil {
		// If a Vote document wasn't found for this user, they can vote on the poll
		if err == mongo.ErrNoDocuments {
			canVote = true
		} else {
			responses.Send(c, http.StatusInternalServerError, "Something went wrong", gin.H{
				"reason": err.Error(),
			})
			return
		}
	} else {
		log.Printf("Vote found for user: %+v\n", pastVote)
	}
	log.Printf("canVote: %v\n", canVote)

	responses.Send(c, http.StatusOK, "Found poll", gin.H{
		"poll":     poll,
		"canVote":  canVote,
		"pastVote": pastVote,
	})
}

func VotePoll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req requests.VotePoll
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Got VotePoll request: %+v\n", req)

	filter := bson.M{"pollId": req.PollId}

	var err error
	var userId primitive.ObjectID
	userAddr := c.ClientIP()

	if len(req.UserId) == 0 {
		userId = primitive.NilObjectID
		log.Printf("Anonymous User, using IP: %s\n", userAddr)
		filter["voterAddr"] = userAddr
	} else {
		userId, err = primitive.ObjectIDFromHex(req.UserId)
		if err != nil {
			responses.Send(c, http.StatusInternalServerError, "Malformed user ID", gin.H{
				"reason": err.Error(),
			})
			return
		}
		log.Printf("Registered User, using ID: %s\n", userId.Hex())
		filter["voterId"] = userId

		// Check if the user is actually a valid user
		err = UsersColl.FindOne(ctx, bson.M{"_id": userId}, options.FindOne()).Err()
		if err != nil {
			log.Printf("User %s does not exist\n", userId.Hex())
			responses.Send(c, http.StatusBadRequest, "User does not exist", gin.H{
				"reason": err.Error(),
			})
			return
		}
	}

	vote := models.Vote{
		PollId:    req.PollId,
		Choice:    req.Choice,
		VoterId:   userId,
		VoterAddr: userAddr,
	}

	// Check if this user has already voted
	var pastVote models.Vote
	err = VotesColl.FindOne(ctx, filter, options.FindOne()).Decode(&pastVote)
	if err == nil {
		// If the user already voted
		log.Printf("User %s already voted: %+v", pastVote.VoterId.Hex(), pastVote)
		responses.Send(c, http.StatusBadRequest, "Vote already found for user", gin.H{
			"userId": pastVote.VoterId,
		})
		return
	} else if err != mongo.ErrNoDocuments {
		responses.Send(c, http.StatusInternalServerError, "Something went wrong", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// Insert the vote into the database
	_, err = VotesColl.InsertOne(ctx, vote)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't cast vote", gin.H{
			"reason": err.Error(),
		})
		return
	}
	responses.Send(c, http.StatusOK, "Vote was cast", gin.H{})
}

func ClosePoll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req requests.ClosePoll
	if err := c.ShouldBindJSON(&req); err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't parse request as JSON", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Got ClosePoll request: %+v\n", req)

	poll := models.Poll{
		PollId: req.PollId,
		Status: false,
	}

	filter := bson.M{"pollId": poll.PollId}
	closeMe := bson.D{
		{"$set", bson.D{{"status", false}}},
	}
	_, err := PollsColl.UpdateOne(ctx, filter, closeMe)
	if err != nil {
		responses.Send(c, http.StatusInternalServerError, "Couldn't close poll", gin.H{
			"reason": err.Error(),
		})
		return
	}
	log.Printf("Poll with ID:[%s] was successfully closed\n", poll.PollId)

	responses.Send(c, http.StatusOK, "Vote was closed", gin.H{})
}

func GetPollResult(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get the poll ID
	pollId := c.Params.ByName("pollId")

	// Find the poll with the given Id
	var poll models.Poll
	err := PollsColl.FindOne(ctx, bson.M{"pollId": pollId}, options.FindOne()).Decode(&poll)
	if err != nil {
		responses.Send(c, http.StatusBadRequest, "Couldn't find poll", gin.H{
			"reason": err.Error(),
		})
		return
	}

	// Count the votes for each option, and store them in a map
	count := make(map[int]int64)
	for optionIndex := range poll.Options {
		filter := bson.M{"pollId": pollId, "choice": optionIndex}
		optionVoteCount, err := VotesColl.CountDocuments(ctx, filter, options.Count())
		if err != nil {
			responses.Send(c, http.StatusInternalServerError, "Couldn't count vote for poll result", gin.H{
				"reason": err.Error(),
			})
		}
		count[optionIndex] = optionVoteCount
	}

	responses.Send(c, http.StatusOK, "Successfully got poll results", gin.H{
		"poll":  poll,
		"count": count,
	})
}
