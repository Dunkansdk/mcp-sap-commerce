import { withRetry, RetryConfig } from '../../utils/retryUtils.js';
import { 
    Product, 
    ProductSearchResponse, 
    AdvancedSearchOptions,
    ProductSuggestion
} from '../types/interfaces.js';
import { SapCommerceClient } from './sapCommerceClient.js';

export class ProductService {
    private client: SapCommerceClient;

    constructor(client: SapCommerceClient) {
        this.client = client;
    }

    async searchProducts(query: string, currentPage: number = 0, pageSize: number = 20): Promise<ProductSearchResponse> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get('/products/search', {
                params: {
                    query,
                    currentPage,
                    pageSize,
                    fields: 'FULL'
                }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }

    async searchProductsAdvanced(options: AdvancedSearchOptions): Promise<ProductSearchResponse> {
        return withRetry(async () => {
            const params: Record<string, any> = {
                fields: options.fields || 'FULL',
                currentPage: options.currentPage || 0,
                pageSize: options.pageSize || 20
            };

            if (options.query) {
                params.query = options.query;
            }

            if (options.categoryCode) {
                params.categoryCode = options.categoryCode;
            }

            if (options.priceRange) {
                if (options.priceRange.min !== undefined) {
                    params.priceValue = `${options.priceRange.min}:`;
                }
                if (options.priceRange.max !== undefined) {
                    params.priceValue = `${params.priceValue || ''}${options.priceRange.max}`;
                }
            }

            if (options.sort) {
                params.sort = options.sort;
            }

            const response = await this.client.getAxiosClient().get('/products/search', { params });
            return response.data;
        }, this.client.getRetryConfig());
    }

    async getProductDetails(productCode: string): Promise<Product> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/products/${productCode}`, {
                params: { fields: 'FULL' }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }

    async checkProductStock(productCode: string, location?: string): Promise<Product['stock']> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/products/${productCode}/stock`, {
                params: {
                    fields: 'FULL',
                    ...(location && { location })
                }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }

    async getProductReviews(productCode: string): Promise<any> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/products/${productCode}/reviews`);
            return response.data;
        }, this.client.getRetryConfig());
    }

    async getProductSuggestions(
        productCode: string,
        options: {
            maxResults?: number;
            fields?: string;
        } = {}
    ): Promise<ProductSuggestion[]> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/products/${productCode}/suggestions`, {
                params: {
                    max: options.maxResults || 6,
                    fields: options.fields || 'FULL'
                }
            });

            return response.data.suggestions.map((suggestion: any) => ({
                product: suggestion.product,
                reason: suggestion.reason || 'Related product'
            }));
        }, this.client.getRetryConfig());
    }
}