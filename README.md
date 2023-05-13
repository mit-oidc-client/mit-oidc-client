# mit-oidc-client

Unofficial client template for MIT OpenID Connect (OIDC) service

Live example can be found at: <https://unofficial-oidc-client.xvm.mit.edu>

## Goal

We want to provide an easy-to-use template for MIT students looking to develop secure web services that supports MIT Touchstone authentication.

While supporting [documentation](https://ist.mit.edu/oidc) exists to do user authentication using [MIT OpenID Connect](https://oidc.mit.edu/) service, we feel there is a knowledge gap and technical barrier that prevents its widespread adoption. In this project, we hope to provide a simple and secure client implementation that MIT student developers can adopt to quickly get authentication in their web services.

## What is included? 

- Basic template for a **secure web service** containing front-end (React.JS) and API back-end (Express.js)
- Features for **integration with Touchstone authentication** via MIT OpenID Connect (OIDC) service
  - Includes code for securely requesting, parsing, and validating OAuth tokens from MIT OIDC
  - Provides logic for how to use those tokens to request information about users
- [Support developer documentation](#developer-information) for how to use our template and how OpenID Connect works
- Implementation of OpenPubKey, which is a client-side extension that extends the OIDC protcol and adds to its security by allowing for secure signing and verification of messages.
  - As an example usage, we provide a simple chatroom service that uses this feature. Users can verify the signature of messages to check if they actually came from the declared user.

## What is OpenID Connect?


## Extension: OpenPubKey

As an extension to providing authentication via MIT OpenID Connect (OIDC) service, we supply the client with a [PK Token](https://eprint.iacr.org/2023/296) generated from the client's ID Token. The PK Token is a committment of a public/private key pair to the ID Token, which augments the method of authentication from Bearer's Authentication to Proof-of-Possession. This protocol is built upon and is fully compatible with the OpenID Connect service. We will show a possible use case of PK Tokens with an implementation of an authenticated chatroom.

### Example Application: Authenticated Chatroom

**Note:** To access the chatroom, you must login with your MIT credentials through the MIT OpenID Connect service. 

As part of the OpenPubKey extension, We decided to implement a chatroom to display how PK Token can be use to verify that pieces of data come from a trusted user, which fundamentally is what authentication is about. In our case, these pieces of data is a text message and the trusted user is an identity holding an MIT crediential. 

In the authenticated chatroom, a user may submit a message along with a signture of the message using their signing key. Any other user may verify any messages at any time using the respective public key. The verification may either accept (green check) or reject (red exclamation).

### Other possible OpenPubKey usage:

- **Committing bets**: Two friends make a bet on something, and they want to prove they made it with their commitment. Say later one person tries to say they never made this bet, but because they signed their message (which is stored on the server), we have irrefutable proof that they did make the bet.

- **Code signing:** Have a trusted verifier to have mapping of ID tokens to public keys, and then whenever a user signs a commit they made, they can send it to the verifier and have it put into an append-only log.

- **SSH:** SSH keys are difficult to manage. Instead, have users sign in through Google (or some other OpenID provider), and then have a PK Token that can act as their public SSH key.

## Security Design

To ensure the security of our overall client framework, we made the following design choices:

- HTTPS is required in development for both the front-end and back-end
  - HTTPS/SSL encryption ensures all communication between the user and the web service is protected. This is a hard requirement for safe-handling of OAuth ID and access tokens
  - **Note:** Self-signed certificates should be used for development work **only**. We recommend using Let's Encrypt or other reputable certificate authority when deploying to production. If you're using platforms like Heroku or Render.com for hosting, they often will have their own SSL certificates management services. See [this](https://devcenter.heroku.com/articles/automated-certificate-management) and [this](https://render.com/docs/tls).
- Dependency on secure cryptographic libraries
  - When generating randomness or relying on cryptographic primitives like hash functions, we use secure libraries like built in browser's `Crypto.getRandomValues()` and `Crypto.subtle.digest()` functions, along with official JWT libraries. This ensures that we are generating secure randomness in our application and depends only on secure primitive implementation for signing and verification of data.
- Utilization of state and nonce in authorization request
  - As part of the [OpenID Connect Basic Implementer's Guide 1.0](https://openid.net/specs/openid-connect-basic-1_0.html), it is optional, but recommended to implement the state and nonce parameter in the authentication request flow. The state parameter is used to mitigate against Cross-Site Request Forgery (CSRF, XSRF) attacks, and the nonce parameter mitigate replay attacks.
  - For our application, we decided to implement both of these variables, storing them in as a variable in localStorage and a cookie, respectively. Both contain high levels of entropy (2^128) for security. **Note:** In the optional OpenPubKey flow, the nonce is replaced by a different format than a random string. See the [original paper](https://eprint.iacr.org/2023/296.pdf) for arguments about its security.
- Securing handling of cookies
  - Whenever cookies are used in our implementation, namely the state parameter, we secure it by setting security parameters including:
    - `path`: Restrict sending the cookie to a specific API endpoint on the backend only
    - `sameSite`: Disallow sending cookie on cross-site requests
    - `secure`: Force cookie to be sent over secure connections (HTTPS)
- Safe type checking using Typescript
  - At MIT, especially in course 6.031, we promote the user of Typescript over Javascript because it allows for static typing, which helps code be more readable, bug-safe, and more easily maintainable. It's also the language of choice for most MIT students creating web services.

#### Security Discussion of Login System + Authenticated Actions

An important thing to note is that in our example React app, we require the user to authenticate to be able to access the content of the "Protected" page. However, this measure simply *hides* the chatroom React component, but **doesn't actually prevent a malicious user from sending messages to the backend**. 

For example, a bad actor can call the `auth.signin()` function themselves in the browser's console, provided with a fake email to simulate a user login and see the chatroom. Alternatively, they can directly send a POST request to the backend `/api/messages` endpoint with a message of their choice.

Thus, it's important when developing an app that has a login system such as this one that you have a method of authenticating user actions *after* they have logged in. Indeed, in our [Future Works](#future-works) section, we discuss the use of adding a session management system that allows for the backend application to keep track of logged in users via **session cookies** and verify that a user provide a valid session cookie whenever they want to perform an authenticated action.

## Developer Information

### Setup

Install:

* Node.js 16, at least Node 16.16.0

#### Running Code (frontend and backend)

In the root directory, run:

* `npm install` to install dependencies
* `npm run build` to create build production 
* `npm run start` to run code locally (for development purposes)

When deploying to production, you should build your code using `npm run build` for both the frontend and backend so that it's optimized for performance. You should then use a web server like Nginx to serve your static frontend files and a process manager for Node like `pm2` to run your backend server (don't run against Node directly!).

#### How our code works

The primary structure of our frontend code is as follows:

```js
    <AuthProvider>
      ...
      <Routes>
      <Route element={<Layout />}>
        ...
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
```

In App.tsx, we define an auth context manager `<AuthProvider>`, which keeps track of the current logged in user. It provides a property `auth.user` through `useAuth()`, which stores the email of the current user as a string. Default value is an empty string.

We provide two React router paths, namely `/login` and `/oidc-response`, to handle the frontend login logic. 

1. `/login` handles the redirect from the current website to the OIDC's authentication endpoint. It supplies the client_id and redirect_uri to the OIDC server (in addition to other required fields) as query parameters. 
2. Once the user successfully authenticates to the OIDC server, they are redirected to the `/oidc-response` endpoint on the webpage. The browser takes in the authorization code in the URL, verifies the returned state parameter is correct, and forwards the auth code to the backend using the backend's POST `/login` API endpoint.
3. The backend returns a response of type `loginResponse`, which looks like the following:

    ```js
    interface loginResponse {
        success: boolean; //Whether or not the login succeeded
        error_msg: string; //If failed, provide error message. Else, empty string.

        //If success, these values should be populated. Else, empty string.
        id_token: string;
        email: string;
    }
    ```

    The frontend then checks the `success` parameter. If it is true, then it stores the `id_token` to localStorage and signs the user in with `email` using the `auth.signin()` function. Otherwise, it outputs the error message to the user via the `OidcResponseHandler` React component.

4. The webpage then reloads to show a `Welcome user_email@mit.edu!` message at the top (via AuthStatus component), along with a signout button. The user can then access the Protected page, which in this case allows them to interact with the OpenPubKey-enabled chatroom. 

#### Things you will need to do to use this template

#### 1. OIDC registration

First thing you will need to do is to register your web app with the MIT OIDC service. 

One of the advantages of OpenID Connect protocol is that third-party applications like ours can register to use the OIDC server dynamically without needing to be pre-approved. For the MIT OIDC service, navigate to <https://oidc.mit.edu/> and log in to your Touchstone account. Then on the left hand side, click on `Self-service client registration` -> `Register a new client`. 

You will need to supply fields for: Client name, redirect URIs, application type (choose `web` if you are using this template), and contacts. For example, in our live server, we had:

- Client name: `unofficial-oidc-client`
- Redirect URIs: `https://unofficial-oidc-client.xvm.mit.edu/oidc-response`
- Home page: `https://github.com/mit-oidc-client/mit-oidc-client`
- Application Type: `web`
- Contacts: `unofficial-oidc-client@mit.edu`

Once you click save, it will generate the client ID + secret, as well as other fields, for your application. **Be sure to save this information somewhere safe!** To work with our template, you will need to navigate to the `JSON` tab and save the json there as a `secrets.json` file stored in the `cert` folder of the github repo. This JSON is read by the Express backend to access the `client_secret` parameter, which is needed as part of the authorization code flow.

Also, in the future, when you want to edit your application's info again, you will need the `client_id` and `registration_access_token` to get access. Otherwise, your information is essentially lost and you will need to register again (it's possible to re-register for the same domain).

#### Certificates

To secure the frontend and backend, you will need to use SSL certificates. For production, you should acquired certs from a trusted CA like Lets Encrypt.

For development work ONLY, you can generate self-signed certificates. See the following [guide](https://www.makeuseof.com/create-react-app-ssl-https/) to use `mkcert` utility. The certificates should be saved to the [/cert](/cert/) folder, with SSL secret key file named `key.pem` and public certificate file named `cert.pem`.

On our live example, we used Let's Encrypt Certbot tool configured for Nginx for the acquiring and the auto-renewal of TLS certificates.

#### Hosting

Our client implementation does not require a specific hosting solution, and indeed you can deploy it on platforms like Heroku and Render.com, or MIT-specific hosting services like [XVM](XVM.mit.edu) offered by the [Student Information Processing Board (SIPB)](https://sipb.mit.edu/). Indeed, Heroku and Render.com offers fully managed TLS certificates to allow for HTTPS encryption.

For our purposes, we hosted our example website on an Ubuntu 18.02 VM running on SIPB's XVM service. We use Nginx as our web server and reverse proxy with TLS enabled, and `pm2` as the process manager for the Express backend.

### Future Works

## Questions/ Feature Requests?

Contact us at unofficial-oidc-client@mit.edu
