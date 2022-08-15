export const DefaultSession = {
    userEmail: null,
    userId: null, 
    refreshToken: null,
};

export const localSession = _ => JSON.parse(localStorage.getItem('session'));
export const isAuthenticated = _ => localSession();

