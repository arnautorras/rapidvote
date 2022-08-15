package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	PollId    string			 `bson:"pollId"`
	Choice    uint				 `bson:"choice"`
	VoterId   primitive.ObjectID `bson:"voterId"`
	VoterAddr string			 `bson:"voterAddr"`
	Id        primitive.ObjectID `bson:"_id,omitempty"`
}

// TODO: Add field validation for all models
type Poll struct {
	Name         string             `bson:"name"`
	Description  string             `bson:"description"`
	Options      []string           `bson:"options"`
	Expiration   time.Time          `bson:"expiration"`
	Status       bool               `bson:"status"`
	AuthRequired bool               `bson:"authRequired"`
	PollId       string             `bson:"pollId"`
	Creator      primitive.ObjectID `bson:"creator"`
	Id           primitive.ObjectID `bson:"_id,omitempty"`
}
