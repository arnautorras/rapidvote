package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	Email      string             `json:"email"`
	Password   string             `json:"password"`
	Id         primitive.ObjectID `bson:"_id,omitempty"`
}
