## Resources Use for Setting Up This Project



## MIT OpenID Connect Implementation

1. Main webpage - MIT OpenID Connect Pilot: <https://oidc.mit.edu/>
2. Self-registration with MIT OpenID Connect Pilot: https://oidc.mit.edu/\
3. IS&T Guide for Client Implementation: <https://kb.mit.edu/confluence/display/istcontrib/Applications+with+MIT%27s+OpenID+Connect+Server>
4. Additional IS&T Guide: <https://kb.mit.edu/confluence/display/istcontrib/Logging+in+Users+to+your+application+using+OpenID+Connect>

## OpenID Connect (OIDC)

1. Illustrative guide to OpenID: <https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc>
2. OpenID Implementer's Guide: <https://openid.net/specs/openid-connect-basic-1_0.html>
3. OpenID Nonce Replay Attack: <https://security.stackexchange.com/questions/147529/openid-connect-nonce-replay-attack>
4. Public vs. Confidential Client: <https://www.youtube.com/watch?v=5cQNwifDq1U>
5. Client ID secret: <https://www.oauth.com/oauth2-servers/client-registration/client-id-secret/>
## Related Works

1. Guide for implementing OIDC auth with React: <https://medium.com/@franciscopa91/>
2. Certified OpenID Connect implementations: <https://openid.net/developers/certified/>
3. Browser-side OIDC client library: <https://github.com/authts/oidc-client-ts> 
   1. NOTE: To avoid security issues with handling `client_secret` on a public client, this library needs provider to support PKCE extension, which MIT OpenID Connect service does not have

## Crytographic libraries

1. Node.js crypto.randomBytes(): <https://stackoverflow.com/a/69358886>
2. SHA-256 of hex value in Node.js: <https://stackoverflow.com/questions/27970431/using-sha-256-with-nodejs-crypto>
3. Crytographically strong random values in browser: <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>
4. Subtle crypto hash digest in browser: <https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest>

### Backend Setup 

1. Typescript + Node project: <https://khalilstemmler.com/blogs/typescript/node-starter-project/>
2. Setting up Express template with TS: <https://blog.logrocket.com/how-to-set-up-node-typescript-express/>
3. Microsoft recommendations for Typescript/Node start code: <https://github.com/microsoft/TypeScript-Node-Starter#typescript--node>

## Frontend Setup 

1. Setup React project with Typescript: <https://create-react-app.dev/docs/adding-typescript/>
2. Replace src/ with code from React-Router Auth example: <https://github.com/remix-run/react-router/tree/dev/examples/auth>
3. React-router-dom Example Auth project: <https://github.com/remix-run/react-router/tree/dev/examples/auth>
4. Understanding Context Managers and Context API: <https://dev.to/shareef/context-api-with-typescript-and-next-js-2m25>

### Cookies

1. Cookies security flags: <https://www.invicti.com/learn/cookie-security-flags/>
2. Cookies security flags part 2: <https://medium.com/swlh/secure-httponly-samesite-http-cookies-attributes-and-set-cookie-explained-fc3c753dfeb6>
3. Universal cookies: <https://www.npmjs.com/package/universal-cookie>
4. Sending cookies with fetch: <https://stackoverflow.com/questions/34558264/fetch-api-with-cookie>
5. Parsing cookies in requests: <http://expressjs.com/en/resources/middleware/cookie-parser.html>
6. Deleting cookies server-side: <https://stackoverflow.com/questions/5285940/correct-way-to-delete-cookies-server-side>

# JSON Web Tokens (JWT), JSON Web Key (JWK)

1. JSON Web Token: <https://jwt.io/>
2. JWK libraries: <https://jwt.io/libraries>
3. Verifying tokens: <https://www.geeksforgeeks.org/how-to-create-and-verify-jwts-with-node-js/#>
4. Converting JWK to PEM format: <https://github.com/Brightspace/node-jwk-to-pem>

# Making Web Requests

1. Axios.get() and post(): <https://axios-http.com/docs/api_intro>
2. Axios authorization header: <https://flaviocopes.com/axios-send-authorization-header/>
3. Javascript fetch API: <https://www.javascripttutorial.net/javascript-fetch-api/>

# React (Functional Components, Routers, Query Parameters)

1. In-depth guide to React functional components: <https://www.knowledgehut.com/blog/web-development/react-functional-components>
2. Run useEffect() only once: <https://css-tricks.com/run-useeffect-only-once/>
3. React Router v6 routes: <https://reactrouter.com/en/main/components/routes>
4. Accessing query parameters inside route: <https://stackoverflow.com/questions/45731522/question-mark-inside-react-router-path>

## Certificates

1. Self-signed certs (DEV PURPOSES ONLY) + enable HTTPS in React: <https://www.makeuseof.com/create-react-app-ssl-https/>
2. Adding HTTPS to Express: <https://adamtheautomator.com/https-nodejs/>
3. Let's Encrypt: <https://letsencrypt.org/getting-started/>
4. Setting up certbot: <https://certbot.eff.org/instructions?ws=nginx&os=ubuntubionic>
5. Configuring nginx with certbot: <https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04>

## Hosting 

1. Getting a VM via XVM service: <https://xvm.mit.edu/>
2. Install Node v16.19.0: <https://tecadmin.net/how-to-install-nvm-on-ubuntu-18-04/>
3. Setting up Nginx
   1. Serve React app using Nginx on VM: <https://betterprogramming.pub/deploy-react-node-js-application-in-a-virtual-machine-5b910d6f3aac>
   2. Allow Nginx user to execute folder in a non-default location: <https://cwiki.apache.org/confluence/display/httpd/13permissiondenied>
   3. Deploy with Nginx in React + Express project: <https://javascript.plainenglish.io/how-to-deploy-a-react-app-with-expressjs-and-nginx-29abeef08c67>
4. Setting up OpenSSH server
   1. <https://ubuntu.com/server/docs/service-openssh>
   2. <https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server>
   3. <https://www.cyberciti.biz/faq/ubuntu-18-04-setup-ssh-public-key-authentication/>
   4. <https://www.ionos.com/help/server-cloud-infrastructure/server-administration/creating-a-sudo-enabled-user/>
5. Serving Express.js server using pm2 (don't serve against Node directly!)
   1. <https://www.freecodecamp.org/news/you-should-never-ever-run-directly-against-node-js-in-production-maybe-7fdfaed51ec6/>
   2. <https://pm2.keymetrics.io/docs/usage/quick-start/>