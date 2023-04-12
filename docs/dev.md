# Developer Documentation

## Frontend Setup

Install:

* Node.js 16, at least Node 16.16.0

In the root directory, run:

* `npm install` to install dependencies

## Certificates

To secure the frontend and backend, you will need to use SSL certificates. For production models you should acquired certs from a trusted CA like Lets Encrypt.

For development work ONLY, you can generate self-signed certificates. See the following [guide](https://www.makeuseof.com/create-react-app-ssl-https/) to use `mkcert` utility. The certificates should be saved to the [/cert](/cert/) folder, with SSL secret key file named `key.pem` and public certificate file named `cert.pem`.

