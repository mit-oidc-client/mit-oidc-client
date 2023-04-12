/**
 * This represents some generic auth provider API, like Firebase.
 */
const oidcAuthProvider = {
  isAuthenticated: false,
  signin(callback: VoidFunction) {
    oidcAuthProvider.isAuthenticated = true;
    setTimeout(callback, 100); // fake async
  },
  signout(callback: VoidFunction) {
    oidcAuthProvider.isAuthenticated = false;
    setTimeout(callback, 100);
  },
};

export { oidcAuthProvider };
