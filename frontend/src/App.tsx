import * as React from "react";
import {
  Routes,
  Route,
  Link,
  Outlet,
} from "react-router-dom";
import { OidcResponseHandler, redirectToLogin } from "./auth";
import { AuthProvider, RequireAuth, AuthStatus } from "./authProvider";

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


function LoginPage() {
  return (
    <div>
      <p>You must log in to view the Protected page</p>
      <button onClick={redirectToLogin}>Login</button>
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