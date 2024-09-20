const setLoggedInUser = (user) => {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
};

const getLoggedInUser = () => {
    const userJson = localStorage.getItem('loggedInUser');
    return userJson ? JSON.parse(userJson) : null;
};

const clearLoggedInUser = () => {
    localStorage.removeItem('loggedInUser');
};
