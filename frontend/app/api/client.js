import { GraphQLClient } from 'graphql-request';

let client;

/**
 * Returns a singleton GraphQLClient configured with the Vendure shop API URL.
 * Uses Nuxt's runtimeConfig for the API URL.
 */
export function getClient() {
  if (!client) {
    const config = useRuntimeConfig();
    client = new GraphQLClient(config.public.apiUrl, {
      credentials: 'include',
    });
  }
  return client;
}

export default { getClient };