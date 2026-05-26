export type AppConfig = {
  serviceToken: string;
};

export function loadConfig(): AppConfig {
  return {
    serviceToken: process.env.XUANZHI_API_TOKEN ?? 'dev-token',
  };
}
