# Developer Documentation

## Frontend Setup

Install:

* Node.js 16, at least Node 16.16.0

In the root directory, run:

* `npm install` to install dependencies

## Certificates

To secure the frontend and backend, you will need to use SSL certificates. For production models you should acquired certs from a trusted CA like Lets Encrypt.

For development work ONLY, you can generate self-signed certificates. See the following [guide](https://www.makeuseof.com/create-react-app-ssl-https/) to use `mkcert` utility. The certificates should be saved to the [/cert](/cert/) folder, with SSL secret key file named `key.pem` and public certificate file named `cert.pem`.

On our live example, we used Let's Encrypt Certbot tool configured for Nginx for the acquiring and the auto-renewal of TLS certificates.
## OIDC Registration

TODO: Fill in

## Hosting

Our client implementation does not require a specific hosting solution, and indeed you can deploy it on platforms like Heroku and Render.com or MIT-specific hosting services like [XVM](XVM.mit.edu) offered by the [Student Information Processing Board (SIPB)](https://sipb.mit.edu/). Indeed, Heroku and Render.com offers fully managed TLS certificates to allow for HTTPS encryption.

For our purposes, we hosted our example website on an Ubuntu 18.02 VM running on SIPB's XVM service. Both the frontend and backend are run and managed by Nginx.

