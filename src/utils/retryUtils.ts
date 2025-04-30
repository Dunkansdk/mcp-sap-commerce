import axios, { AxiosError } from 'axios';
import { logger } from './logger.js';

export class RetryError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'RetryError';
    }
}

export interface RetryConfig {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableStatuses?: number[];
}

export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxRetries: 2,
    initialDelay: 1000,  // Start with 1 second delay
    maxDelay: 5000,      // Max 5 seconds delay
    backoffFactor: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const finalConfig: Required<RetryConfig> = {
        ...DEFAULT_RETRY_CONFIG,
        ...config
    };

    let lastError: Error | undefined;
    let delay = finalConfig.initialDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === finalConfig.maxRetries) {
                throw new RetryError(
                    `Operation failed after ${attempt + 1} attempts`,
                    lastError
                );
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * finalConfig.backoffFactor, finalConfig.maxDelay);
        }
    }

    // This should never happen due to the throw in the loop
    throw new RetryError('Unexpected retry failure');
}

export function isRetryableError(error: any): boolean {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        return status ? DEFAULT_RETRY_CONFIG.retryableStatuses.includes(status) : false;
    }
    return false;
}