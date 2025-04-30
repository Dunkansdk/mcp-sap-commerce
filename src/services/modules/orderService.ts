import { withRetry } from '../../utils/retryUtils.js';
import { OrderStatus, Promotion } from '../types/interfaces.js';
import { SapCommerceClient } from './sapCommerceClient.js';

export class OrderService {
    private client: SapCommerceClient;

    constructor(client: SapCommerceClient) {
        this.client = client;
    }

    async getPromotions(promotionId?: string): Promise<Promotion[]> {
        return withRetry(async () => {
            const endpoint = promotionId ? `/promotions/${promotionId}` : '/promotions';
            const response = await this.client.getAxiosClient().get(endpoint);
            return response.data.promotions || [response.data];
        }, this.client.getRetryConfig());
    }

    async getOrderStatus(orderCode: string): Promise<OrderStatus> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/users/anonymous/orders/${orderCode}`, {
                params: {
                    fields: 'FULL'
                }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }

    async getOrderHistory(currentPage: number = 0, pageSize: number = 10): Promise<{
        orders: OrderStatus[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalResults: number;
        };
    }> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get('/users/anonymous/orders', {
                params: {
                    currentPage,
                    pageSize,
                    fields: 'FULL'
                }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }
}