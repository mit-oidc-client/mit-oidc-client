## Setting up the project

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

sudo certbot --nginx -d unofficial-oidc-client.xvm.mit.edu -d www.unofficial-oidc-client.xvm.mit.edu
## MIT OpenID Connect (OIDC)

1. Self-registration with MIT OpenID Connect Pilot: https://oidc.mit.edu/

## Hosting

1. Change Scripts VM version to Fedora 30: <https://scripts.mit.edu/upgrade/>
2. Install Python 3.10: <https://computingforgeeks.com/how-to-install-python-on-ubuntu-linux-system/>
3. Install Node v16.19.0: <https://tecadmin.net/how-to-install-nvm-on-ubuntu-18-04/>
4. Install pip: <https://stackoverflow.com/questions/6587507/how-to-install-pip-with-python-3>
5. Serve React app using Nginx on VM: <https://betterprogramming.pub/deploy-react-node-js-application-in-a-virtual-machine-5b910d6f3aac>
6. Allow Nginx user to execute folder in a non-default location: <https://cwiki.apache.org/confluence/display/httpd/13permissiondenied>