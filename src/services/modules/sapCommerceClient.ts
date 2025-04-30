import axios, { AxiosInstance } from 'axios';
import https from 'https';
import crypto from 'crypto';
import { withRetry } from '../../utils/retryUtils.js';
import { logger } from '../../utils/logger.js';
import { AuthToken, SapCommerceConfig, TimestampedRequestConfig } from '../types/interfaces.js';

export class SapCommerceClient {
    private readonly client: AxiosInstance;
    private authToken: AuthToken | null = null;
    private readonly config: SapCommerceConfig;

    constructor(config: SapCommerceConfig) {
        this.config = config;
        
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false, // Disable certificate verification
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
        });

        this.client = axios.create({
            baseURL: this.config.baseUrl,
            timeout: config.timeout || 15000, // Increased to 15 seconds to account for retries
            httpsAgent,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Add request timing interceptor
        this.client.interceptors.request.use(async (request: TimestampedRequestConfig) => {
            request.timestamp = Date.now();

            // Add baseSite to URL if not auth request
            if (!request.url?.includes('authorizationserver')) {
                const site = this.config.baseSite || 'electronics';
                request.url = `/${site}${request.url}`;
            }

            // Add auth token if available
            const token = await this.getAuthToken();
            if (token) {
                request.headers.Authorization = `Bearer ${token.access_token}`;
            }

            return request;
        });
    }

    async getAuthToken(): Promise<AuthToken | null> {
        if (!this.config.clientId || !this.config.clientSecret) {
            return null;
        }

        try {
            return await withRetry(async () => {
                // Check if we have a valid token
                if (this.authToken) {
                    const bufferTime = 5 * 60 * 1000;
                    const tokenExpiration = new Date().getTime() + (this.authToken.expires_in * 1000) - bufferTime;
                    if (tokenExpiration > new Date().getTime()) {
                        return this.authToken;
                    }
                }

                const params = new URLSearchParams();
                params.append('grant_type', 'client_credentials');
                params.append('client_id', this.config.clientId as string);
                params.append('client_secret', this.config.clientSecret as string);

                const response = await this.client.post(
                    '/authorizationserver/oauth/token',
                    params,
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );

                this.authToken = response.data;
                return this.authToken;
            }, this.config.retryConfig);
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    getAxiosClient(): AxiosInstance {
        return this.client;
    }
    
    getRetryConfig() {
        return this.config.retryConfig;
    }
}