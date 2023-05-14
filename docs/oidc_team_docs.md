# For Unofficial-Oidc-Client Developers

# Setup - Certs

For development work, install mkcert and create your own self-signed certificate in the cert folder. The public cert should be named `cert.pem` while secret key is `key.pem`. See this tutorial: <https://www.makeuseof.com/create-react-app-ssl-https/?newsletter_popup=1>

If you're on Ubuntu, you'll need to install mkcert by downloading the pre-compiled binary: <https://kifarunix.com/create-locally-trusted-ssl-certificates-with-mkcert-on-ubuntu-20-04/>

## Setup - Secrets

Get a copy of the secrets.json that contains the OIDC registration information for unofficial-oidc-client.xvm.mit.edu. You'll need to copy the `client_secret` from there into the corresponding field in [backend/src/authConfig.ts](../backend/src/authConfig.ts). Make sure you **DO NOT** commit this file after making this change (else all hell breaks loose).

## Setup - SSH

To be able to directly SSH into the production server, first let a current maintainer know your SSH public key so they can add it. Then, you should be able to login with `ssh oidc@unofficial-oidc-client.xvm.mit.edu`. Be sure to also get the `oidc`'s user password from a maintainer. A recommended workflow is to SSH into the XVM server from vscode, since it allows you to easily spawn terminals and edit files directly.

# Setup - Testing

Because of how the OpenID Connect system is set up, generally any testing you do that requires interactions from the OIDC server (that can't be simulated yourself) will require you to copy your backend and/or frontend **build** files to the remote server, and then see the results there.

To build, navigate to either `frontend/` or `backend/` and run `npm run build`.

Quick command to copy the build from your local filesystem to the server:

`scp -r /home/huydai/Documents/mit-oidc-client/frontend/build/* oidc@unofficial-oidc-client.xvm.mit.edu:~/mit-oidc-client/frontend/build`

`scp -r /home/huydai/Documents/mit-oidc-client/backend/build/* oidc@unofficial-oidc-client.xvm.mit.edu:~/mit-oidc-client/backend/build`

Since the OpenSSH server is set to only use pubkey authentication, this command will not require you to input a password.

The frontend files are served statically with Nginx, so you don't have to run anything. For the backend server, when doing testing, you will need to run it with `node build/index.js` (assuming you are cd'ed in the `backend/` folder). Note that this server will only run while your terminal is alive, unless you add the background `&` sign to the end of the command. 

When you are confident in your implementation and wants to run the backend in production mode, you should run it with `pm2 start oidc` (**Note:** We already created the oidc process by running `pm2 start build/index.js --name oidc` the first time we ran pm2). Do `pm2 status` to get status about CPU and Memory usage on running pm2 processes. To stop the oidc process, do `pm2 stop oidc`.

If you get an error about connection refused or IP address in use, do `ps` to list running processes, and then `kill [process_num]` to kill a running process, or `kill -9 [process_num]` to force kill it.


## Final Deployment Tasks

-   Switch backend server to use Let's Encrypt certs instead of self-signed certs (these expire in 2 years)
    -   Note: This is the cert that is used to talk between the Nginx proxy and the Express backend server, which happens all internally on the XVM. Thus it's acceptable to use self-signed certs for now.
-   Remove extraneous console.log statements for OpenPubKey parts
-   Turn on prevent implicit any Typescript check in backend + fix issues (if time permits)
-   Fix camel case in AuthConfig (frontend and backend)
