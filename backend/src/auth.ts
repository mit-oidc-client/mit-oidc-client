import {AxiosResponse} from 'axios';

/**
 * Expected response format after querying /token endpoint of OIDC server
*/
interface oidcToken {
    id_token?: string,
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token?: string,
    scope?: string
}

interface jwkResponse {
    keys: Array<object>
}

export { oidcToken, jwkResponse } 