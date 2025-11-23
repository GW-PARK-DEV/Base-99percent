export interface X402RouteConfig {
  price: string;
  network: string;
  recipientAddress: string;
  description?: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
  outputSchema?: Record<string, any>;
}

export interface X402ModuleOptions {
  facilitatorUrl?: string;
}