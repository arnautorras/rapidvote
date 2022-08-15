package requests

import (
	"time"
)

type CreatePoll struct {
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	Options      []string     `json:"options"`
	Expiration   time.Time    `json:"expiration"`
	Status       bool         `json:"status"`
	AuthRequired bool         `json:"authRequired"`
	PollId       string       `json:"pollId"`
	Creator      string       `json:"creator"`
}

type ViewPoll struct {
	UserId string `json:"userId"`
}

type VotePoll struct {
	PollId    string 	`json:"pollId"`
	Choice    uint		`json:"choice"`
	UserId    string    `json:"userId"`
}

type ClosePoll struct {
	PollId    string 	`json:"pollId"`
	UserId    string    `json:"userId"`
}
