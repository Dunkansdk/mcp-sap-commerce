import { TimestampedRequestConfig, SapCommerceConfig } from './types/interfaces.js';
import { SapCommerceClient } from './modules/sapCommerceClient.js';
import { ProductService } from './modules/productService.js';
import { CatalogService } from './modules/catalogService.js';
import { CartService } from './modules/cartService.js';
import { OrderService } from './modules/orderService.js';
import { Cache } from '../utils/cache.js';
import { HealthMonitor } from '../utils/healthMonitor.js';

// Re-export all types from the interfaces file
export * from './types/interfaces.js';

export class SapCommerceService {
    private readonly client: SapCommerceClient;
    private readonly productService: ProductService;
    private readonly catalogService: CatalogService;
    private readonly cartService: CartService;
    private readonly orderService: OrderService;
    private readonly cache: Cache<any>;
    private readonly healthMonitor: HealthMonitor;

    constructor(config: SapCommerceConfig) {
        this.cache = new Cache({ ttl: 5 * 60 * 1000 }); // 5 minute TTL
        this.healthMonitor = new HealthMonitor();
        
        // Initialize the client
        this.client = new SapCommerceClient(config);
        
        // Initialize service modules
        this.productService = new ProductService(this.client);
        this.catalogService = new CatalogService(this.client);
        this.cartService = new CartService(this.client);
        this.orderService = new OrderService(this.client);
        
        // Add response timing and health monitoring interceptor
        this.client.getAxiosClient().interceptors.response.use(
            response => {
                const config = response.config as TimestampedRequestConfig;
                const latency = Date.now() - (config.timestamp || Date.now());
                this.healthMonitor.recordRequestComplete(latency);
                return response;
            },
            error => {
                const config = error.config as TimestampedRequestConfig;
                const latency = Date.now() - (config?.timestamp || Date.now());
                this.healthMonitor.recordRequestComplete(latency, true);
                throw error;
            }
        );
    }

    private getCacheKey(method: string, path: string, params?: any): string {
        return `${method}:${path}:${JSON.stringify(params || {})}`;
    }

    private async withCache<T>(
        cacheKey: string,
        operation: () => Promise<T>
    ): Promise<T> {
        const cached = this.cache.get(cacheKey);
        if (cached) {
            this.healthMonitor.recordCacheAccess(true);
            return cached;
        }

        this.healthMonitor.recordCacheAccess(false);
        const result = await operation();
        this.cache.set(cacheKey, result);
        return result;
    }

    // Health monitor
    async getHealthStatus() {
        return this.healthMonitor.getStatus();
    }

    // Product service methods
    async searchProducts(query: string, currentPage: number = 0, pageSize: number = 20) {
        const cacheKey = this.getCacheKey('GET', '/products/search', { query, currentPage, pageSize });
        return this.withCache(cacheKey, () => this.productService.searchProducts(query, currentPage, pageSize));
    }

    async searchProductsAdvanced(options: any) {
        return this.productService.searchProductsAdvanced(options);
    }

    async getProductDetails(productCode: string) {
        const cacheKey = this.getCacheKey('GET', `/products/${productCode}`);
        return this.withCache(cacheKey, () => this.productService.getProductDetails(productCode));
    }

    async checkProductStock(productCode: string, location?: string) {
        return this.productService.checkProductStock(productCode, location);
    }

    async getProductReviews(productCode: string) {
        return this.productService.getProductReviews(productCode);
    }

    async getProductSuggestions(productCode: string, options: any = {}) {
        return this.productService.getProductSuggestions(productCode, options);
    }

    // Catalog service methods
    async getCatalogs() {
        return this.catalogService.getCatalogs();
    }

    async getCatalogById(catalogId: string) {
        return this.catalogService.getCatalogById(catalogId);
    }

    async getCatalogVersion(catalogId: string, versionId: string) {
        return this.catalogService.getCatalogVersion(catalogId, versionId);
    }

    async getCategories(categoryId?: string, catalogId: string = 'electronicsProductCatalog', catalogVersionId: string = 'Online') {
        return this.catalogService.getCategories(categoryId, catalogId, catalogVersionId);
    }

    async getProductsByCategory(categoryId: string, options: any = {}) {
        return this.catalogService.getProductsByCategory(categoryId, options);
    }

    // Order service methods
    async getPromotions(promotionId?: string) {
        return this.orderService.getPromotions(promotionId);
    }

    async getOrderStatus(orderCode: string) {
        return this.orderService.getOrderStatus(orderCode);
    }

    async getOrderHistory(currentPage: number = 0, pageSize: number = 10) {
        return this.orderService.getOrderHistory(currentPage, pageSize);
    }

    // Cart service methods
    async createCart() {
        return this.cartService.createCart();
    }

    async getCart(cartId: string) {
        return this.cartService.getCart(cartId);
    }

    async addToCart(cartId: string, productCode: string, quantity: number = 1) {
        return this.cartService.addToCart(cartId, productCode, quantity);
    }

    async updateCartEntry(cartId: string, entryNumber: number, quantity: number) {
        return this.cartService.updateCartEntry(cartId, entryNumber, quantity);
    }

    async removeCartEntry(cartId: string, entryNumber: number) {
        return this.cartService.removeCartEntry(cartId, entryNumber);
    }
}