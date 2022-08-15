package requests

type Login struct {
	Email      		string `json:"email"`
	Password   		string `json:"password"`
}

type Register struct {
	Email      		string `json:"email"`
	Password   		string `json:"password"`
}

type Reset struct {
	Email       	string `json:"email"`
	Password		string `json:"Password"`
	NewEmail     	string `json:"newEmail"`
	NewPassword		string `json:"newPassword"`
}

type Logout struct {
	AccessToken 	string `json:"accessToken"`
}

type RefreshToken struct {
	RefreshToken 	string `json:"refreshToken"`
}
