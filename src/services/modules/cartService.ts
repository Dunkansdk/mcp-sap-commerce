import { withRetry, RetryConfig } from '../../utils/retryUtils.js';
import { Cart } from '../types/interfaces.js';
import { SapCommerceClient } from './sapCommerceClient.js';
import { logger } from '../../utils/logger.js';

export class CartService {
    private client: SapCommerceClient;
    private readonly cartOperationsRetryConfig: RetryConfig = {
        maxRetries: 2,
        initialDelay: 2000,  // 2 seconds
        maxDelay: 10000,     // 10 seconds
        backoffFactor: 2,
        retryableStatuses: [408, 429, 500, 502, 503, 504]
    };

    constructor(client: SapCommerceClient) {
        this.client = client;
    }

    async createCart(): Promise<Cart> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().post('/users/anonymous/carts');
            return response.data;
        }, this.cartOperationsRetryConfig);
    }

    async getCart(cartId: string): Promise<Cart> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/users/anonymous/carts/${cartId}`);
            return response.data;
        }, this.cartOperationsRetryConfig);
    }

    async addToCart(cartId: string, productCode: string, quantity: number = 1): Promise<Cart> {
        return withRetry(async () => {
            // Now try to add to cart
            try {
                const response = await this.client.getAxiosClient().post(
                    `/users/anonymous/carts/${cartId}/entries`,
                    {
                        product: { code: productCode },
                        quantity
                    }
                );
                logger.info(`Successfully added product ${productCode} to cart ${cartId}`);
                return response.data;
            } catch (error: any) {
                logger.error(`Failed to add product ${productCode} to cart ${cartId}: ${error.message}`);
                
                // If we get a 400 error, try to get the cart first and use its GUID instead
                if (error.response?.status === 400) {
                    try {
                        // Get the cart to retrieve its GUID
                        const cart = await this.getCart(cartId);
                        
                        if (cart.guid) {
                            logger.info(`Retrying with cart GUID ${cart.guid} instead of cartId ${cartId}`);
                            
                            // Retry with GUID
                            const retryResponse = await this.client.getAxiosClient().post(
                                `/users/anonymous/carts/${cart.guid}/entries`,
                                {
                                    product: { code: productCode },
                                    quantity
                                }
                            );
                            
                            logger.info(`Successfully added product ${productCode} to cart using GUID ${cart.guid}`);
                            return retryResponse.data;
                        }
                    } catch (retryError: any) {
                        logger.error(`Failed to add product with GUID fallback: ${retryError.message}`);
                    }
                    
                    throw new Error(`Invalid cart operation: ${error.response?.data?.error || 'Unknown error'}`);
                }
                
                throw error;
            }
        }, this.cartOperationsRetryConfig);
    }

    async updateCartEntry(cartId: string, entryNumber: number, quantity: number): Promise<Cart> {
        return withRetry(async () => {
            try {
                // Verify cart exists first
                await this.getCart(cartId);
                
                const response = await this.client.getAxiosClient().patch(
                    `/users/anonymous/carts/${cartId}/entries/${entryNumber}`,
                    {
                        quantity
                    }
                );
                logger.info(`Successfully updated quantity to ${quantity} for entry ${entryNumber} in cart ${cartId}`);
                return response.data;
            } catch (error: any) {
                logger.error(`Failed to update entry ${entryNumber} in cart ${cartId}: ${error.message}`);
                if (error.response?.status === 404) {
                    throw new Error(`Cart ${cartId} or entry ${entryNumber} not found`);
                }
                throw error;
            }
        }, this.cartOperationsRetryConfig);
    }

    async removeCartEntry(cartId: string, entryNumber: number): Promise<void> {
        return withRetry(async () => {
            try {
                // Verify cart exists first
                await this.getCart(cartId);
                
                await this.client.getAxiosClient().delete(`/users/anonymous/carts/${cartId}/entries/${entryNumber}`);
                logger.info(`Successfully removed entry ${entryNumber} from cart ${cartId}`);
            } catch (error: any) {
                logger.error(`Failed to remove entry ${entryNumber} from cart ${cartId}: ${error.message}`);
                if (error.response?.status === 404) {
                    throw new Error(`Cart ${cartId} or entry ${entryNumber} not found`);
                }
                throw error;
            }
        }, this.cartOperationsRetryConfig);
    }
}