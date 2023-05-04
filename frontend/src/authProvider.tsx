import * as React from "react";
import {
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AUTH_CONFIG } from "./authConfig";

/****************************************************************************************/
/** Definition for Auth Context API *****************************************************/
/****************************************************************************************/
interface AuthContextType {
    user: any;
    signin: (user: string, callback: VoidFunction) => void;
    signout: (callback: VoidFunction) => void;
  }
  
let AuthContext = React.createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  let [user, setUser] = React.useState<any>(null);

  let signin = (newUser: string, callback: VoidFunction) => {
    setUser(newUser);
    callback();
  };

  let signout = (callback: VoidFunction) => {
    setUser(null);
    localStorage.removeItem(AUTH_CONFIG.idtoken_localstorage_name);
    callback();
  };

  let value = { user, signin, signout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return React.useContext(AuthContext);
}


/**
 * Provide information on whether the user is logged in
 */
function AuthStatus(): React.ReactElement {
  let auth = useAuth();
  let navigate = useNavigate();

  if (!auth.user) {
    return <p>You are not logged in.</p>;
  }

  return (
    <p>
      Welcome {auth.user}!{" "}
      <button
        onClick={() => {
          auth.signout(() => navigate("/"));
        }}
      >
        Sign out
      </button>
    </p>
  );
}

/**
 * Provide wrapper element that requires user to be authenticated whenever 
 * they want to access a child element inside it
 */
function RequireAuth({ children }: { children: JSX.Element }): React.ReactElement {
  let auth = useAuth();
  let location = useLocation();

  if (!auth.user) {
      // Redirect them to the /login page, but save the current location they were
      // trying to go to when they were redirected. This allows us to send them
      // along to that page after they login, which is a nicer user experience
      // than dropping them off on the home page.
      return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export {AuthProvider, RequireAuth, AuthStatus, useAuth};