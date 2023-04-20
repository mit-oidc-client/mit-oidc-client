# mit-oidc-client 

Unofficial client template for MIT OpenID Connect (OIDC) service

Live example (UPCOMING) can be found at: <https://unofficial-oidc-client.xvm.mit.edu>

## Goal

We want to provide an easy-to-use template for MIT students looking to develop secure web services that supports MIT Touchstone authentication. 

While supporting [documentation](https://ist.mit.edu/oidc) exists to do user authentication using [MIT OpenID Connect](https://oidc.mit.edu/) service, we feel there is a knowledge gap and technical barrier that prevents its widespread adoption. In this project, we hope to provide a simple and secure client implementation that MIT student developers can adopt to quickly get authentication in their web services.

## What is included? (IN DEVELOPMENT)

- Basic template for a **secure web service** containing front-end (React.JS) and API back-end (Express.js)
- Features for **integration with Touchstone authentication** via MIT OpenID Connect (OIDC) service
  - Includes code for securely requesting, parsing, and validating OAuth tokens from MIT OIDC
  - Provides logic for how to use those tokens to request information about users
- Extensions (TODO)
  - OpenPubKey
- **Support developer documentation** for how to use our template and how Touchstone + OpenID Connect works

## Security

To ensure the security of our system, we made the following design choices:

- HTTPS is required in development for both the front-end and back-end
  - HTTPS/SSL encryption ensures all communication between the user and the web service is protected. This is a hard requirement for safe-handling of OAuth ID and access tokens
  - **Note:** Self-signed certificates should be used for development work __only__. We recommend using Let's Encrypt or other reputable certificate authority when deploying to production. If you're using platforms like Heroku or Render.com for hosting, they often will have their own SSL certificates management services. See [this](https://devcenter.heroku.com/articles/automated-certificate-management) and [this](https://render.com/docs/tls).
- CORS (Cross-Origin Resource Sharing) is enabled for MIT OpenID Connect server only
  - Need further research

# Questions/ Feature Requests?

Contact us at unofficial-oidc-client@mit.edu
