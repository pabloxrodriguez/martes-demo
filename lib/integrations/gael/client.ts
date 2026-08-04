type GaelRequestOptions = {
  path: string;
  searchParams?: Record<string, string | number | undefined>;
};

function getGaelConfig() {
  const baseUrl =
    process.env.GAEL_API_BASE_URL?.replace(/\/$/, "") ??
    "https://api.gael.cloud";
  const apiKey = process.env.GAEL_API_KEY;

  if (!apiKey) {
    throw new Error("Falta configurar GAEL_API_KEY.");
  }

  return {
    baseUrl,
    apiKey,
  };
}

export async function gaelRequest<T>({
  path,
  searchParams,
}: GaelRequestOptions): Promise<T> {
  const { baseUrl, apiKey } = getGaelConfig();
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gael respondió ${response.status}: ${responseText.slice(0, 500)}`
    );
  }

  if (!responseText) {
    return null as T;
  }

  return JSON.parse(responseText) as T;
}
