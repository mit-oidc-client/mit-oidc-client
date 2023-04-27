# For Unofficial-Oidc-Client Developers

## Setup

To be able to directly SSH into the production server, first let a current maintainer know your SSH public key so they can add it. Then, you should be able to login with `ssh oidc@unofficial-oidc-client.xvm.mit.edu`. Be sure to also get the `oidc`'s user password from a maintainer.

Quick command to copy the build from your local filesystem to the server:

`scp -r /home/huydai/Documents/mit-oidc-client/frontend/build/* oidc@unofficial-oidc-client.xvm.mit.edu:~/mit-oidc-client/frontend/build`

`scp -r /home/huydai/Documents/mit-oidc-client/backend/build/* oidc@unofficial-oidc-client.xvm.mit.edu:~/mit-oidc-client/backend/build`


## Final Deployment

- Switch backend server to use Let's Encrypt certs instead of self-signed certs (these expire in 2 years)
- 