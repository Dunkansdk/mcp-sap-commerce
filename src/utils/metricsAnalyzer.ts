import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

interface MetricEntry {
    timestamp: string;
    type: 'apiLatency' | 'errorRate' | 'cacheHitRate';
    value: number;
}

interface MetricAnalysis {
    min: number;
    max: number;
    avg: number;
    p95: number;
    count: number;
}

interface HealthMetricsAnalysis {
    apiLatency: MetricAnalysis;
    errorRate: MetricAnalysis;
    cacheHitRate: MetricAnalysis;
    period: {
        start: Date;
        end: Date;
    };
}

interface AnalysisTimeRange {
    start?: Date;
    end?: Date;
}

export class MetricsAnalyzer {
    private readonly logsDir: string;

    constructor(logsDir: string) {
        this.logsDir = logsDir;
    }

    async analyzeHealthMetrics(timeRange?: AnalysisTimeRange): Promise<HealthMetricsAnalysis> {
        const metrics = {
            apiLatency: [] as number[],
            errorRate: [] as number[],
            cacheHitRate: [] as number[]
        };

        try {
            const logFiles = await fs.readdir(this.logsDir);
            const healthLogs = logFiles.filter(file => file.startsWith('health-'));

            for (const logFile of healthLogs) {
                const content = await fs.readFile(path.join(this.logsDir, logFile), 'utf-8');
                const entries = content.split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line) as MetricEntry)
                    .filter(entry => this.isWithinTimeRange(entry.timestamp, timeRange));

                for (const entry of entries) {
                    metrics[entry.type].push(entry.value);
                }
            }
        } catch (error) {
            logger.error('Error analyzing health metrics:', error);
        }

        const period = {
            start: timeRange?.start || new Date(0),
            end: timeRange?.end || new Date()
        };

        return {
            apiLatency: this.calculateMetrics(metrics.apiLatency),
            errorRate: this.calculateMetrics(metrics.errorRate),
            cacheHitRate: this.calculateMetrics(metrics.cacheHitRate),
            period
        };
    }

    async getPerformanceInsights(): Promise<string[]> {
        const insights: string[] = [];
        const analysis = await this.analyzeHealthMetrics({
            start: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        });

        if (analysis.apiLatency.count > 0) {
            if (analysis.apiLatency.avg > 1000) {
                insights.push(`High average latency (${analysis.apiLatency.avg.toFixed(2)}ms) detected. Consider optimizing API calls or enabling caching.`);
            }
            if (analysis.apiLatency.p95 > 2000) {
                insights.push(`95th percentile latency (${analysis.apiLatency.p95.toFixed(2)}ms) is concerning. Check for slow endpoints or network issues.`);
            }
        }

        if (analysis.errorRate.count > 0) {
            if (analysis.errorRate.avg > 0.05) {
                insights.push(`High error rate (${(analysis.errorRate.avg * 100).toFixed(1)}%) detected. Review error logs and API stability.`);
            }
        }

        if (analysis.cacheHitRate.count > 0) {
            if (analysis.cacheHitRate.avg < 0.7) {
                insights.push(`Low cache hit rate (${(analysis.cacheHitRate.avg * 100).toFixed(1)}%). Consider adjusting cache TTL or caching strategy.`);
            }
        }

        return insights;
    }

    private calculateMetrics(values: number[]): MetricAnalysis {
        if (values.length === 0) {
            return {
                min: 0,
                max: 0,
                avg: 0,
                p95: 0,
                count: 0
            };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const p95Index = Math.ceil(values.length * 0.95) - 1;

        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            p95: sorted[p95Index],
            count: values.length
        };
    }

    private isWithinTimeRange(timestamp: string, range?: AnalysisTimeRange): boolean {
        if (!range) return true;

        const date = new Date(timestamp);
        if (range.start && date < range.start) return false;
        if (range.end && date > range.end) return false;
        return true;
    }
}