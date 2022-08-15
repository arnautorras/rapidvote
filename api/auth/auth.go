package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var (
	jwtAccessSecretKey = []byte(os.Getenv("JWT_ACCESS_SECRET"))
	jwtRefreshSecretKey = []byte(os.Getenv("JWT_REFRESH_SECRET"))
)

type TokenType int
const (	
	TokenTypeAccess = iota
	TokenTypeRefresh
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

func GenerateTokens(userId string) (TokenPair, error) {
	var err error
	tokens := TokenPair{}

	accessClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		Issuer: userId,
		ExpiresAt: time.Now().Add(time.Hour * 24).Unix(),
	})

	tokens.AccessToken, err = accessClaims.SignedString(jwtAccessSecretKey)
	if err != nil {
		return TokenPair{}, err
	}

	refreshClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		Issuer: userId,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokens.RefreshToken, err = refreshClaims.SignedString(jwtRefreshSecretKey)
	if err != nil {
		return TokenPair{}, err
	}

	return tokens, nil
}

func ParseToken(tokenString string, tokenType TokenType) (*jwt.StandardClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.StandardClaims{}, 
	func(token *jwt.Token) (interface{}, error) {
		switch (tokenType) {
		case TokenTypeAccess:
			return jwtAccessSecretKey, nil
		case TokenTypeRefresh:
			return jwtRefreshSecretKey, nil
		default:
			return nil, errors.New("couldn't parse token due to unknown TokenType")
		}
	})

	if err != nil {
		return nil, err 
	}

	claims := token.Claims.(*jwt.StandardClaims)
	return claims, nil
}
