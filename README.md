# mit-oidc-client
Unofficial client template for MIT OpenID Connect (OIDC) service


## Goal

We want to provide an easy-to-use template for MIT students looking to develop secure web services that supports MIT Touchstone authentication. 

While supporting [documentation](https://ist.mit.edu/oidc) exists to do user authentication using [MIT OpenID Connect](https://oidc.mit.edu/) service, we feel there is a knowledge gap and technical barrier that prevents its widespread adoption. In this project, we hope to provide a simple and secure client implementation that MIT student developers can quickly adopt to get authentication in their web services.

## What is included? (CURRENTLY IN DEVELOPMENT)

- Basic template for a **secure web service** containing front-end (React.JS) and API back-end (Express.js)
- Features for **integration with Touchstone authentication** via MIT OpenID Connect (OIDC) service
  - Includes code for securely requesting, parsing, and validating OAuth tokens from MIT OIDC
  - Provides logic for how to use those tokens to request information about users
- **Support developer documentation** for how to use our template and how Touchstone + OpenID Connect works