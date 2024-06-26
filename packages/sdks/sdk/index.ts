export interface OpenpanelEventOptions {
  profileId?: string;
}

export interface PostEventPayload {
  name: string;
  timestamp: string;
  profileId?: string;
  properties?: Record<string, unknown> & OpenpanelEventOptions;
}

export interface UpdateProfilePayload {
  profileId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  properties?: Record<string, unknown>;
}

export interface IncrementProfilePayload {
  profileId: string;
  property: string;
  value: number;
}

export interface DecrementProfilePayload {
  profileId?: string;
  property: string;
  value: number;
}

export interface OpenpanelSdkOptions {
  url?: string;
  clientId: string;
  clientSecret?: string;
  verbose?: boolean;
}

export interface OpenpanelState {
  profileId?: string;
  properties: Record<string, unknown>;
}

function awaitProperties(
  properties: Record<string, string | Promise<string | null>>
): Promise<Record<string, string>> {
  return Promise.all(
    Object.entries(properties).map(async ([key, value]) => {
      return [key, (await value) ?? ''];
    })
  ).then((entries) => Object.fromEntries(entries));
}

function createApi(_url: string) {
  const headers: Record<string, string | Promise<string | null>> = {
    'Content-Type': 'application/json',
  };
  return {
    headers,
    async fetch<ReqBody, ResBody>(
      path: string,
      data: ReqBody,
      options?: RequestInit
    ): Promise<ResBody | null> {
      const url = `${_url}${path}`;
      let timer: ReturnType<typeof setTimeout>;
      const h = await awaitProperties(headers);
      return new Promise((resolve) => {
        const wrappedFetch = (attempt: number) => {
          clearTimeout(timer);
          fetch(url, {
            headers: h,
            method: 'POST',
            body: JSON.stringify(data ?? {}),
            keepalive: true,
            ...(options ?? {}),
          })
            .then(async (res) => {
              if (res.status === 401) {
                return null;
              }

              if (res.status !== 200 && res.status !== 202) {
                return retry(attempt, resolve);
              }

              const response = await res.text();

              if (!response) {
                return resolve(null);
              }

              resolve(response as ResBody);
            })
            .catch(() => {
              return retry(attempt, resolve);
            });
        };

        function retry(
          attempt: number,
          resolve: (value: ResBody | null) => void
        ) {
          if (attempt > 1) {
            return resolve(null);
          }

          timer = setTimeout(
            () => {
              wrappedFetch(attempt + 1);
            },
            Math.pow(2, attempt) * 500
          );
        }

        wrappedFetch(0);
      });
    },
  };
}

export class OpenpanelSdk<
  Options extends OpenpanelSdkOptions = OpenpanelSdkOptions,
> {
  public options: Options;
  public api: ReturnType<typeof createApi>;
  private state: OpenpanelState = {
    properties: {},
  };

  constructor(options: Options) {
    this.options = options;
    this.api = createApi(options.url ?? 'https://api.openpanel.dev');
    this.api.headers['openpanel-client-id'] = options.clientId;
    if (this.options.clientSecret) {
      this.api.headers['openpanel-client-secret'] = this.options.clientSecret;
    }
  }

  // Public

  public setProfileId(profileId: string) {
    this.state.profileId = profileId;
  }

  public async setProfile(payload: UpdateProfilePayload) {
    this.setProfileId(payload.profileId);
    return this.api.fetch<UpdateProfilePayload, string>('/profile', {
      ...payload,
      properties: {
        ...this.state.properties,
        ...payload.properties,
      },
    });
  }

  public async increment(
    property: string,
    value: number,
    options?: OpenpanelEventOptions
  ) {
    const profileId = options?.profileId ?? this.state.profileId;
    if (!profileId) {
      return console.log('No profile id');
    }
    return this.api.fetch<IncrementProfilePayload, string>(
      '/profile/increment',
      {
        profileId,
        property,
        value,
      }
    );
  }

  public async decrement(
    property: string,
    value: number,
    options?: OpenpanelEventOptions
  ) {
    const profileId = options?.profileId ?? this.state.profileId;
    if (!profileId) {
      return console.log('No profile id');
    }
    return this.api.fetch<DecrementProfilePayload, string>(
      '/profile/decrement',
      {
        profileId,
        property,
        value,
      }
    );
  }

  public async event(
    name: string,
    properties?: PostEventPayload['properties']
  ) {
    const profileId = properties?.profileId ?? this.state.profileId;
    delete properties?.profileId;
    return this.api.fetch<PostEventPayload, string>('/event', {
      name,
      properties: {
        ...this.state.properties,
        ...(properties ?? {}),
      },
      timestamp: this.timestamp(),
      profileId,
    });
  }

  public setGlobalProperties(properties: Record<string, unknown>) {
    this.state.properties = {
      ...this.state.properties,
      ...properties,
    };
  }

  public clear() {
    this.state.profileId = undefined;
  }

  // Private

  private timestamp() {
    return new Date().toISOString();
  }
}
