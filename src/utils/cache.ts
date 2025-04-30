import { logger } from './logger.js';

interface CacheConfig {
    ttl: number; // Time to live in milliseconds
    maxSize?: number; // Maximum number of items in cache
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class Cache<T> {
    private readonly cache: Map<string, CacheEntry<T>>;
    private readonly config: Required<CacheConfig>;

    constructor(config: CacheConfig) {
        this.cache = new Map();
        this.config = {
            ttl: config.ttl,
            maxSize: config.maxSize || 1000
        };
    }

    set(key: string, value: T): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.config.maxSize) {
            const entries = Array.from(this.cache.entries());
            const oldestEntry = entries.reduce((oldest, current) => 
                current[1].expiresAt < oldest[1].expiresAt ? current : oldest
            );
            this.cache.delete(oldestEntry[0]);
            logger.debug('Cache eviction', { key: oldestEntry[0] });
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.config.ttl
        });
        logger.debug('Cache set', { key });
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            logger.debug('Cache miss', { key });
            return undefined;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            logger.debug('Cache entry expired', { key });
            return undefined;
        }

        logger.debug('Cache hit', { key });
        return entry.value;
    }

    clear(): void {
        this.cache.clear();
        logger.debug('Cache cleared');
    }

    size(): number {
        return this.cache.size;
    }

    getKeys(): string[] {
        return Array.from(this.cache.keys());
    }

    getEntries(): Array<[string, T]> {
        return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
    }
}