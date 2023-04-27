import * as React from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import { oidcAuthProvider, OidcResponseHandler, redirectToLogin } from "./auth";

export default function App() {
  return (
    <AuthProvider>
      <h1>MIT OIDC Login Example</h1>
      <p>
        This example demonstrates a simple login flow with three pages: a public
        page, a protected page, and a login page. In order to see the protected
        page, you must first login.
      </p>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oidc-response" element={<OidcResponseHandler />} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <ProtectedPage />
            </RequireAuth>
          }
        />
      </Route>
      </Routes>
    </AuthProvider>
  );
}

function Layout() {
  return (
    <div>
      <AuthStatus />
      <ul>
        <li>
          <Link to="/">Public Page</Link>
        </li>
        <li>
          <Link to="/protected">Protected Page</Link>
        </li>
      </ul>
      <Outlet />
      <Credit />
    </div>
  );
}

interface AuthContextType {
  user: any;
  signin: (user: string, callback: VoidFunction) => void;
  signout: (callback: VoidFunction) => void;
}

let AuthContext = React.createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  let [user, setUser] = React.useState<any>(null);

  let signin = (newUser: string, callback: VoidFunction) => {
    return oidcAuthProvider.signin(() => {
      setUser(newUser);
      callback();
    });
  };

  let signout = (callback: VoidFunction) => {
    return oidcAuthProvider.signout(() => {
      setUser(null);
      callback();
    });
  };

  let value = { user, signin, signout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return React.useContext(AuthContext);
}

function AuthStatus() {
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

function RequireAuth({ children }: { children: JSX.Element }) {
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

function LoginPage() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    redirectToLogin();
  }

  return (
    <div>
      <p>You must log in to view the Protected page</p>

      <form onSubmit={handleSubmit}>
        <label>
          Username: <input name="username" type="text" />
        </label>{" "}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function PublicPage() {
  return <div className="public">
      <h3>Public</h3>
      <p>You are currently viewing publicly-known information</p>
  </div>;
}

function ProtectedPage() {
  return <div className="protected">
      <h3>Protect</h3>
      <p>You are currently viewing protected (potentially sensitive) information</p>
  </div>;
}

function Credit() {
  return <p><b>Note:</b> This page is adapted from the "auth" example in React-Router Github <a href="https://github.com/remix-run/react-router/tree/dev/examples/auth">repo</a>.</p>
}