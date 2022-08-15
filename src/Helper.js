
const Helper = {
	/* isValidPassword()
	 * Returns true if the string passed is a valid password.
	 * Source : https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters */
    isValidPassword: function(s){
	    return String(s).match(
	      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
	    );
	},
	/* isValidEmail()
	 * Returns true if the string passed is a valid email address.
	 * Source : https://stackoverflow.com/questions/46155/whats-the-best-way-to-validate-an-email-address-in-javascript */
	isValidEmail: function(s){
		return String(s).toLowerCase().match(
	      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	    );
    }
}

export default Helper;