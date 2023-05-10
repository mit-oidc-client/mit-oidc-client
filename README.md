# mit-oidc-client

Unofficial client template for MIT OpenID Connect (OIDC) service

Live example can be found at: <https://unofficial-oidc-client.xvm.mit.edu>

## Goal

We want to provide an easy-to-use template for MIT students looking to develop secure web services that supports MIT Touchstone authentication.

While supporting [documentation](https://ist.mit.edu/oidc) exists to do user authentication using [MIT OpenID Connect](https://oidc.mit.edu/) service, we feel there is a knowledge gap and technical barrier that prevents its widespread adoption. In this project, we hope to provide a simple and secure client implementation that MIT student developers can adopt to quickly get authentication in their web services.

## What is included? 

-   Basic template for a **secure web service** containing front-end (React.JS) and API back-end (Express.js)
-   Features for **integration with Touchstone authentication** via MIT OpenID Connect (OIDC) service
    -   Includes code for securely requesting, parsing, and validating OAuth tokens from MIT OIDC
    -   Provides logic for how to use those tokens to request information about users
-   Extensions (TODO)
    -   OpenPubKey
-   **Support developer documentation** for how to use our template and how OpenID Connect works

## Extension: OpenPubKey

As an extension to providing authentication via MIT OpenID Connect (OIDC) service, we supply the client with a [PK Token](https://eprint.iacr.org/2023/296) generated from the client's ID Token. The PK Token is a committment of a public/private key pair to the ID Token, which augments the method of authentication from Bearer's Authentication to Proof-of-Possession. This protocol is built upon and is fully compatible with the OpenID Connect service. We will show a possible use case of PK Tokens with an implementation of an authenticated chatroom.

### Example Usage: Authenticated Chatroom

Note: to access the chatroom, you must login with your MIT credientials through the MIT OpenID Connect service. We decided to implement a chatroom to display how PK Token can be use to verify that pieces of data come from a trusted user, which fundamentally is what authentication is about. In our case, these pieces of data is a text message and the trusted user is an identity holding an MIT crediential. But later, we will discuss other ideas made possible with PK Tokens. In the authenticated chatroom, a user may submit a message along with a signture of the message using their signing key. Any other user may verify any messages at any time using the respective public key. The verification may either accept (green check) or reject (red exclamation).

### Other implementation ideas

-   **Committing bets**: Two friends make a bet on something, and they want to prove they made it with their commitment. Say later one person tries to say they never made this bet, but because they signed their message (which is stored on the server), we have irrefutable proof that they did make the bet.

-  ** Code signing:** Have a trusted verifier to have mapping of ID tokens to public keys, and then whenever a user signs a commit they made, they can send it to the verifier and have it put into an append-only log.

-   **SSH:** SSH keys are difficult to manage. Instead, have users sign in through Google (or some other OpenID provider), and then have a PK Token that can act as their public SSH key.

## Security Design

To ensure the security of our overall client framework, we made the following design choices:

-   HTTPS is required in development for both the front-end and back-end
    -   HTTPS/SSL encryption ensures all communication between the user and the web service is protected. This is a hard requirement for safe-handling of OAuth ID and access tokens
    -   **Note:** Self-signed certificates should be used for development work **only**. We recommend using Let's Encrypt or other reputable certificate authority when deploying to production. If you're using platforms like Heroku or Render.com for hosting, they often will have their own SSL certificates management services. See [this](https://devcenter.heroku.com/articles/automated-certificate-management) and [this](https://render.com/docs/tls).
-   Dependency on secure cryptographic libraries
    -   When generating randomness or relying on cryptographic primitives like hash functions, we use secure libraries like built in browser's `Crypto.getRandomValues()` and `Crypto.subtle.digest()` function set to SHA-256 hash.
-   Utilization of nonce in authorization request
    -   TODO
-   Securing cookies using Secure and HTTPonly flags
    -   TODO
-   Safe type checking using Typescript

## Developer Information

### Setup

Install:

* Node.js 16, at least Node 16.16.0

#### Running Code (frontend and backend)

In the root directory, run:

* `npm install` to install dependencies
* `npm run build` to create build production 
* `npm run start` to run frontend code locally

### Certificates

To secure the frontend and backend, you will need to use SSL certificates. For production models you should acquired certs from a trusted CA like Lets Encrypt.

For development work ONLY, you can generate self-signed certificates. See the following [guide](https://www.makeuseof.com/create-react-app-ssl-https/) to use `mkcert` utility. The certificates should be saved to the [/cert](/cert/) folder, with SSL secret key file named `key.pem` and public certificate file named `cert.pem`.

On our live example, we used Let's Encrypt Certbot tool configured for Nginx for the acquiring and the auto-renewal of TLS certificates.
### OIDC Registration

TODO: Fill in

### Hosting

Our client implementation does not require a specific hosting solution, and indeed you can deploy it on platforms like Heroku and Render.com or MIT-specific hosting services like [XVM](XVM.mit.edu) offered by the [Student Information Processing Board (SIPB)](https://sipb.mit.edu/). Indeed, Heroku and Render.com offers fully managed TLS certificates to allow for HTTPS encryption.

For our purposes, we hosted our example website on an Ubuntu 18.02 VM running on SIPB's XVM service. Both the frontend and backend are run and managed by Nginx.

node build/index.js


# Questions/ Feature Requests?

Contact us at unofficial-oidc-client@mit.edu
