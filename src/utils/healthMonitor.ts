import { logger } from './logger.js';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    details: {
        apiLatency?: number;
        errorRate?: number;
        cacheHitRate?: number;
    };
}

export class HealthMonitor {
    private status: HealthStatus = {
        status: 'healthy',
        lastCheck: new Date(),
        details: {}
    };
    private errorCount: number = 0;
    private requestCount: number = 0;
    private cacheHits: number = 0;
    private cacheMisses: number = 0;
    private readonly checkInterval: number;

    constructor(checkInterval: number = 60000) { // Default 1 minute
        this.checkInterval = checkInterval;
        this.startMonitoring();
    }

    private startMonitoring(): void {
        setInterval(() => this.checkHealth(), this.checkInterval);
    }

    private checkHealth(): void {
        const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
        const cacheHitRate = (this.cacheHits + this.cacheMisses) > 0 
            ? this.cacheHits / (this.cacheHits + this.cacheMisses)
            : 1;

        this.status = {
            status: this.determineStatus(errorRate, cacheHitRate),
            lastCheck: new Date(),
            details: {
                apiLatency: this.status.details.apiLatency,
                errorRate,
                cacheHitRate
            }
        };

        logger.info('Health check completed', {
            status: this.status.status,
            metrics: this.status.details
        });

        // Reset counters after check
        this.errorCount = 0;
        this.requestCount = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    private determineStatus(errorRate: number, cacheHitRate: number): 'healthy' | 'degraded' | 'unhealthy' {
        if (errorRate >= 0.1 || cacheHitRate < 0.3) { // 10% error rate or 30% cache hit rate thresholds
            return 'unhealthy';
        }
        if (errorRate >= 0.05 || cacheHitRate < 0.5) { // 5% error rate or 50% cache hit rate thresholds
            return 'degraded';
        }
        return 'healthy';
    }

    recordRequestComplete(latencyMs: number, hasError: boolean = false): void {
        this.requestCount++;
        if (hasError) {
            this.errorCount++;
        }
        this.status.details.apiLatency = latencyMs;

        logger.debug('Request completed', {
            latency: latencyMs,
            hasError,
            currentErrorRate: this.errorCount / this.requestCount
        });
    }

    recordCacheAccess(hit: boolean): void {
        if (hit) {
            this.cacheHits++;
        } else {
            this.cacheMisses++;
        }

        logger.debug('Cache access recorded', {
            hit,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses)
        });
    }

    getStatus(): HealthStatus {
        return { ...this.status };
    }
}