import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SapCommerceService, type SapCommerceConfig } from "./services/sapCommerceService.js";
import { MetricsAnalyzer } from './utils/metricsAnalyzer.js';

// Configuration for SAP Commerce
const config: SapCommerceConfig = {
    baseUrl: process.env.SAP_COMMERCE_URL || 'https://localhost:9002/occ/v2',
    baseSite: process.env.SAP_COMMERCE_SITE || 'electronics',
    timeout: parseInt(process.env.SAP_COMMERCE_TIMEOUT || '10000'),
    validateSSL: process.env.SAP_COMMERCE_VALIDATE_SSL !== 'false',
    clientId: process.env.SAP_COMMERCE_CLIENT_ID,
    clientSecret: process.env.SAP_COMMERCE_CLIENT_SECRET
};

const sapCommerceService = new SapCommerceService(config);

// Create server instance
const server = new McpServer({
    name: "sap-commerce",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

function formatResponse(data: any): string {
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

function formatError(error: unknown): string {
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return `Error: ${String(error)}`;
}

// Register SAP Commerce tools
server.tool(
    "search-products",
    "Search for products in SAP Commerce",
    {
        query: z.string().describe("Search query for products"),
        currentPage: z.number().optional().describe("Page number to retrieve"),
        pageSize: z.number().optional().describe("Number of results per page"),
        fields: z.string().optional().describe("Fields to return in the response"),
    },
    async ({ query, currentPage = 0, pageSize = 20 }: { query: string; currentPage?: number; pageSize?: number }) => {
        try {
            const results = await sapCommerceService.searchProducts(query, currentPage, pageSize);
            const formattedResults = {
                products: results.products.map(product => ({
                    code: product.code,
                    name: product.name,
                    description: product.description,
                    price: product.price?.formattedValue,
                    stock: product.stock?.stockLevelStatus,
                })),
                pagination: results.pagination
            };

            return {
                content: [{ type: "text", text: formatResponse(formattedResults) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-product-details",
    "Get detailed information about a specific product",
    {
        productCode: z.string().describe("Product code/SKU"),
    },
    async ({ productCode }: { productCode: string }) => {
        try {
            const product = await sapCommerceService.getProductDetails(productCode);
            return {
                content: [{ type: "text", text: formatResponse(product) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "check-product-availability",
    "Check stock availability for a product",
    {
        productCode: z.string().describe("Product code/SKU"),
        location: z.string().optional().describe("Warehouse or store location code"),
    },
    async ({ productCode, location }: { productCode: string; location?: string }) => {
        try {
            const stock = await sapCommerceService.checkProductStock(productCode, location);
            return {
                content: [{ type: "text", text: formatResponse(stock) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-categories",
    "Get product categories from SAP Commerce",
    {
        categoryId: z.string().optional().describe("Optional category ID to get specific category details"),
    },
    async ({ categoryId }: { categoryId?: string }) => {
        try {
            const categories = await sapCommerceService.getCategories(categoryId);
            return {
                content: [{ type: "text", text: formatResponse(categories) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-products-by-category",
    "Get products from a specific category",
    {
        categoryId: z.string().describe("Category ID to get products from"),
        currentPage: z.number().optional().describe("Page number (starts from 0)"),
        pageSize: z.number().optional().describe("Number of products per page"),
        sort: z.string().optional().describe("Sort order (e.g., 'name:asc', 'price:desc')")
    },
    async ({ categoryId, currentPage, pageSize, sort }: { 
        categoryId: string; 
        currentPage?: number; 
        pageSize?: number; 
        sort?: string 
    }) => {
        try {
            const products = await sapCommerceService.getProductsByCategory(categoryId, {
                currentPage,
                pageSize,
                sort
            });
            return {
                content: [{ type: "text", text: formatResponse(products) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-promotions",
    "Get active promotions from SAP Commerce",
    {
        promotionId: z.string().optional().describe("Optional promotion ID to get specific promotion details"),
    },
    async ({ promotionId }: { promotionId?: string }) => {
        try {
            const promotions = await sapCommerceService.getPromotions(promotionId);
            return {
                content: [{ type: "text", text: formatResponse(promotions) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-product-reviews",
    "Get customer reviews for a specific product",
    {
        productCode: z.string().describe("Product code to get reviews for"),
    },
    async ({ productCode }: { productCode: string }) => {
        try {
            const reviews = await sapCommerceService.getProductReviews(productCode);
            return {
                content: [{ type: "text", text: formatResponse(reviews) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "search-products-advanced",
    "Advanced product search with filtering options",
    {
        query: z.string().optional().describe("Search query for products"),
        categoryCode: z.string().optional().describe("Category code to filter products"),
        minPrice: z.number().optional().describe("Minimum price filter"),
        maxPrice: z.number().optional().describe("Maximum price filter"),
        sort: z.string().optional().describe("Sort order (e.g., 'name:asc', 'price:desc')"),
        currentPage: z.number().optional().describe("Page number (starts from 0)"),
        pageSize: z.number().optional().describe("Number of products per page"),
    },
    async ({ query, categoryCode, minPrice, maxPrice, sort, currentPage, pageSize }: {
        query?: string;
        categoryCode?: string;
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
        currentPage?: number;
        pageSize?: number;
    }) => {
        try {
            const searchOptions = {
                query,
                categoryCode,
                priceRange: (minPrice || maxPrice) ? {
                    min: minPrice,
                    max: maxPrice
                } : undefined,
                sort,
                currentPage,
                pageSize
            };

            const results = await sapCommerceService.searchProductsAdvanced(searchOptions);
            const formattedResults = {
                products: results.products.map(product => ({
                    code: product.code,
                    name: product.name,
                    description: product.description,
                    price: product.price?.formattedValue,
                    stock: product.stock?.stockLevelStatus,
                })),
                pagination: results.pagination
            };

            return {
                content: [{ type: "text", text: formatResponse(formattedResults) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-product-suggestions",
    "Get product suggestions based on a reference product",
    {
        productCode: z.string().describe("Reference product code/SKU"),
        maxResults: z.number().optional().describe("Maximum number of suggestions to return"),
    },
    async ({ productCode, maxResults }: { 
        productCode: string;
        maxResults?: number;
    }) => {
        try {
            const suggestions = await sapCommerceService.getProductSuggestions(productCode, {
                maxResults
            });

            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        referenceProduct: productCode,
                        suggestions: suggestions.map(suggestion => ({
                            productCode: suggestion.product.code,
                            name: suggestion.product.name,
                            reason: suggestion.reason,
                            price: suggestion.product.price?.formattedValue
                        }))
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "create-cart",
    "Create a new shopping cart",
    {},
    async () => {
        try {
            const cart = await sapCommerceService.createCart();
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        message: "New cart created successfully",
                        cartId: cart.code,
                        totalItems: cart.totalItems,
                        totalPrice: cart.totalPrice?.formattedValue
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-cart",
    "Get cart details",
    {
        cartId: z.string().describe("Cart ID to retrieve"),
    },
    async ({ cartId }: { cartId: string }) => {
        try {
            const cart = await sapCommerceService.getCart(cartId);
            return {
                content: [{ type: "text", text: formatResponse(cart) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "add-to-cart",
    "Add a product to cart",
    {
        cartId: z.string().describe("Cart ID to add the product to"),
        productCode: z.string().describe("Product code to add"),
        quantity: z.number().optional().describe("Quantity to add (default: 1)"),
    },
    async ({ cartId, productCode, quantity = 1 }: { 
        cartId: string;
        productCode: string;
        quantity?: number;
    }) => {
        try {
            let cart;
            try {
                // First try to get the cart to check if it exists
                await sapCommerceService.getCart(cartId);
                // If cart exists, add the product
                cart = await sapCommerceService.addToCart(cartId, productCode, quantity);
            } catch (cartError) {
                // If cart doesn't exist, create a new one
                console.error(`Cart ${cartId} not found, creating a new cart`);
                const newCart = await sapCommerceService.createCart();
                // Then add the product to the new cart
                if (!newCart.guid) {
                    throw new Error("New cart GUID is undefined");
                }
                cart = await sapCommerceService.addToCart(newCart.guid, productCode, quantity);
            }
            
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        message: "Product added to cart successfully",
                        cartId: cart.code,
                        totalItems: cart.totalItems,
                        totalPrice: cart.totalPrice?.formattedValue,
                        lastAddedItem: cart.entries[cart.entries.length - 1]
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "update-cart-entry",
    "Update the quantity of a product in cart",
    {
        cartId: z.string().describe("Cart ID"),
        entryNumber: z.number().describe("Entry number of the product in cart"),
        quantity: z.number().describe("New quantity"),
    },
    async ({ cartId, entryNumber, quantity }: {
        cartId: string;
        entryNumber: number;
        quantity: number;
    }) => {
        try {
            const cart = await sapCommerceService.updateCartEntry(cartId, entryNumber, quantity);
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        message: "Cart entry updated successfully",
                        cartId: cart.code,
                        totalItems: cart.totalItems,
                        totalPrice: cart.totalPrice?.formattedValue
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "remove-from-cart",
    "Remove a product from cart",
    {
        cartId: z.string().describe("Cart ID"),
        entryNumber: z.number().describe("Entry number of the product to remove"),
    },
    async ({ cartId, entryNumber }: {
        cartId: string;
        entryNumber: number;
    }) => {
        try {
            await sapCommerceService.removeCartEntry(cartId, entryNumber);
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        message: "Product removed from cart successfully",
                        cartId
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-order-status",
    "Get the status of a specific order",
    {
        orderCode: z.string().describe("Order code to check status for"),
    },
    async ({ orderCode }: { orderCode: string }) => {
        try {
            const order = await sapCommerceService.getOrderStatus(orderCode);
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        orderCode: order.code,
                        status: order.status,
                        statusDate: order.statusDate,
                        consignmentStatus: order.consignmentStatus,
                        created: order.created,
                        totalPrice: order.totalPrice?.formattedValue,
                        items: order.entries?.map(entry => ({
                            productCode: entry.product.code,
                            productName: entry.product.name,
                            quantity: entry.quantity
                        }))
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "get-order-history",
    "Get order history",
    {
        currentPage: z.number().optional().describe("Page number (starts from 0)"),
        pageSize: z.number().optional().describe("Number of orders per page"),
    },
    async ({ currentPage, pageSize }: {
        currentPage?: number;
        pageSize?: number;
    }) => {
        try {
            const history = await sapCommerceService.getOrderHistory(currentPage, pageSize);
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        orders: history.orders.map(order => ({
                            orderCode: order.code,
                            status: order.status,
                            created: order.created,
                            totalPrice: order.totalPrice?.formattedValue
                        })),
                        pagination: history.pagination
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

server.tool(
    "check-service-health",
    "Check the health status of the SAP Commerce integration",
    {},
    async () => {
        try {
            const status = await sapCommerceService.getHealthStatus();
            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        status: status.status,
                        lastCheck: status.lastCheck,
                        metrics: {
                            apiLatency: `${status.details.apiLatency}ms`,
                            errorRate: `${(status.details.errorRate || 0) * 100}%`,
                            cacheHitRate: `${(status.details.cacheHitRate || 0) * 100}%`
                        }
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

// Initialize metrics analyzer
const metricsAnalyzer = new MetricsAnalyzer('logs');

// Add new performance analysis tool after existing tools
server.tool(
    "analyze-performance",
    "Analyze historical performance metrics and get insights",
    {
        timeRangeHours: z.number().optional().describe("Number of hours to analyze (default: 24)"),
    },
    async ({ timeRangeHours = 24 }: { timeRangeHours?: number }) => {
        try {
            const now = new Date();
            const analysis = await metricsAnalyzer.analyzeHealthMetrics({
                start: new Date(now.getTime() - (timeRangeHours * 60 * 60 * 1000)),
                end: now
            });

            const insights = await metricsAnalyzer.getPerformanceInsights();

            return {
                content: [{ 
                    type: "text", 
                    text: formatResponse({
                        timeRange: {
                            start: analysis.period.start,
                            end: analysis.period.end,
                            hours: timeRangeHours
                        },
                        metrics: {
                            apiLatency: {
                                p95: `${analysis.apiLatency.p95}ms`,
                                average: `${analysis.apiLatency.avg}ms`,
                                max: `${analysis.apiLatency.max}ms`
                            },
                            errorRate: {
                                average: `${(analysis.errorRate.avg * 100).toFixed(2)}%`,
                                max: `${(analysis.errorRate.max * 100).toFixed(2)}%`
                            },
                            cacheHitRate: {
                                average: `${(analysis.cacheHitRate.avg * 100).toFixed(2)}%`,
                                min: `${(analysis.cacheHitRate.min * 100).toFixed(2)}%`
                            }
                        },
                        insights,
                        recommendations: insights.length > 0 
                            ? "Action needed: Review the insights above and implement suggested improvements."
                            : "No critical issues detected. System is performing within acceptable parameters."
                    })
                }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: formatError(error) }],
            };
        }
    }
);

// Initialize and run the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`SAP Commerce MCP Server running on stdio (Site: ${config.baseSite})`);
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});