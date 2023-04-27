## Setting up the project

## MIT OpenID Connect(OIDC)

1. Main webpage - MIT OpenID Connect Pilot: <https://oidc.mit.edu/>
2. IS&T Guide for Client Implementation: <https://kb.mit.edu/confluence/display/istcontrib/Applications+with+MIT%27s+OpenID+Connect+Server>
3. Additional IS&T Guide: <https://kb.mit.edu/confluence/display/istcontrib/Logging+in+Users+to+your+application+using+OpenID+Connect>
4. OpenID Implementer's Guide: <https://openid.net/specs/openid-connect-basic-1_0.html>
5. Guide for implementing OIDC auth with React: <https://medium.com/@franciscopa91/
6. how-to-implement-oidc-authentication-with-react-context-api-and-react-router-205e13f2d49>
7. Self-registration with MIT OpenID Connect Pilot: https://oidc.mit.edu/

## Pseudorandom Generators

1. (Backend only) Use crypto.randomBytes: <https://stackoverflow.com/questions/58325771/how-to-generate-random-hex-string-in-javascript>
2. Crytographically strong random values in browser: <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>

### Backend

1. Typescript + Node project: <https://khalilstemmler.com/blogs/typescript/node-starter-project/>
2. Setting up Express template with TS: <https://blog.logrocket.com/how-to-set-up-node-typescript-express/>
3. Microsoft recommendations for Typescript/Node start code: <https://github.com/microsoft/TypeScript-Node-Starter#typescript--node>

## Frontend

1. Setup React project with Typescript: <https://create-react-app.dev/docs/adding-typescript/>
2. Replace src/ with code from React-Router Auth example: <https://github.com/remix-run/react-router/tree/dev/examples/auth>

## Certificates

1. Self-signed certs (DEV PURPOSES ONLY) + enable HTTPS in React: <https://www.makeuseof.com/create-react-app-ssl-https/>
2. Adding HTTPS to Express: <https://adamtheautomator.com/https-nodejs/>
3. Let's Encrypt: <https://letsencrypt.org/getting-started/>
4. Setting up certbot: <https://certbot.eff.org/instructions?ws=nginx&os=ubuntubionic>
5. Configuring nginx with certbot: <https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04>

## Hosting

1. Change Scripts VM version to Fedora 30: <https://scripts.mit.edu/upgrade/>
2. Install Python 3.10: <https://computingforgeeks.com/how-to-install-python-on-ubuntu-linux-system/>
3. Install Node v16.19.0: <https://tecadmin.net/how-to-install-nvm-on-ubuntu-18-04/>
4. Install pip: <https://stackoverflow.com/questions/6587507/how-to-install-pip-with-python-3>
5. Serve React app using Nginx on VM: <https://betterprogramming.pub/deploy-react-node-js-application-in-a-virtual-machine-5b910d6f3aac>
6. Allow Nginx user to execute folder in a non-default location: <https://cwiki.apache.org/confluence/display/httpd/13permissiondenied>
7. Setting up OpenSSH server
   1. <https://ubuntu.com/server/docs/service-openssh>
   2. <https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server>
   3. <https://www.cyberciti.biz/faq/ubuntu-18-04-setup-ssh-public-key-authentication/>
   4. <https://www.ionos.com/help/server-cloud-infrastructure/server-administration/creating-a-sudo-enabled-user/>
8. Serving Express.js server using pm2 (don't serve against Node directly!): <https://www.freecodecamp.org/news/you-should-never-ever-run-directly-against-node-js-in-production-maybe-7fdfaed51ec6/>