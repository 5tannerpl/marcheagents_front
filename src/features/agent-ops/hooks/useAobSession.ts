import { useEffect, useState } from 'react';
import { ApiError } from '../api/AobApi';
import { LiveAobApi } from '../api/LiveAobApi';

export interface AobSession {
  authenticated: true;
  user: { display_name: string };
  can_start_demo: boolean;
  csrf_token: string;
}

export type AobSessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'authorised'; session: AobSession }
  | { status: 'denied'; message: string }
  | { status: 'expired'; message: string }
  | { status: 'unavailable'; message: string };

const sessionUrl = (origin: string) => `${origin.replace(/\/+$/, '')}/bff/session`;

export function useAobSession(api: LiveAobApi | null) {
  const [state, setState] = useState<AobSessionState>({ status: 'loading' });

  useEffect(() => {
    if (!api) return;
    const controller = new AbortController();
    fetch(sessionUrl(api.origin), { credentials: 'include', headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(async (response) => {
        let body: unknown = null;
        const text = await response.text();
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = null;
          }
        }
        if (response.status === 401) {
          setState({ status: 'signed-out' });
          return;
        }
        if (response.status === 403) {
          setState({ status: 'denied', message: 'This account is not on the demo whitelist.' });
          return;
        }
        if (response.status === 503) {
          setState({ status: 'unavailable', message: 'Auth0 is not configured on the server.' });
          return;
        }
        if (!response.ok) {
          throw new ApiError('The authentication service is unavailable.', response.status);
        }
        if (
          !body ||
          typeof body !== 'object' ||
          !('authenticated' in body) ||
          typeof body.authenticated !== 'boolean'
        ) {
          throw new ApiError('The authentication service returned an invalid session response.', response.status);
        }
        const session = body as Partial<AobSession> & { authenticated: boolean };
        if (!session.authenticated) {
          setState({ status: 'signed-out' });
          return;
        }
        if (!session.csrf_token || typeof session.csrf_token !== 'string') {
          setState({ status: 'unavailable', message: 'Authentication is missing CSRF configuration.' });
          return;
        }
        if (session.can_start_demo !== true) {
          setState({ status: 'denied', message: 'This account is not authorised to use the Agent Ops demo.' });
          return;
        }
        const displayName =
          session.user && typeof session.user === 'object' && typeof session.user.display_name === 'string'
            ? session.user.display_name
            : 'user';
        const authorised: AobSession = {
          authenticated: true,
          user: { display_name: displayName },
          can_start_demo: true,
          csrf_token: session.csrf_token,
        };
        api.setCsrfToken(authorised.csrf_token);
        setState({ status: 'authorised', session: authorised });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: 'expired', message: 'Your session expired or the token is invalid. Log out and sign in again.' });
        } else {
          setState({ status: 'unavailable', message: error instanceof Error ? error.message : 'The authentication service is unavailable.' });
        }
      });
    return () => controller.abort();
  }, [api]);

  return state;
}
