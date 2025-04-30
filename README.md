# SAP Commerce MCP Server

This Model Context Protocol (MCP) server integrates with SAP Commerce Cloud's OCC APIs to enable natural language interactions with product data through Claude.

## Features

- **Product Search**: Search through products using natural language queries
- **Advanced Search**: Filter products by category, price range, and more
- **Product Details**: Get detailed information about specific products
- **Stock Availability**: Check product stock levels and availability
- **Categories**: Browse and search products by categories
- **Promotions**: Get information about active promotions
- **Reviews**: Access product reviews and ratings
- **Product Suggestions**: Get personalized product recommendations
- **Cart Management**: Full shopping cart operations support
- **Health Monitoring**: Real-time service health tracking
- **Performance Analytics**: Historical performance analysis and insights

## Tools Available

1. `search-products`: Basic product search with pagination support
   - Parameters:
     - `query`: Search query string
     - `currentPage`: (Optional) Page number
     - `pageSize`: (Optional) Results per page

2. `search-products-advanced`: Advanced product search with filters
   - Parameters:
     - `query`: (Optional) Search query string
     - `categoryCode`: (Optional) Category code filter
     - `minPrice`: (Optional) Minimum price filter
     - `maxPrice`: (Optional) Maximum price filter
     - `sort`: (Optional) Sort order
     - `currentPage`: (Optional) Page number
     - `pageSize`: (Optional) Results per page

3. `get-product-details`: Get detailed product information
   - Parameters:
     - `productCode`: Product code/SKU

4. `check-product-availability`: Check product stock levels
   - Parameters:
     - `productCode`: Product code/SKU
     - `location`: (Optional) Warehouse/store location code

5. `get-categories`: Browse product categories
   - Parameters:
     - `categoryId`: (Optional) Specific category ID

6. `get-products-by-category`: Get products in a category
   - Parameters:
     - `categoryId`: Category ID
     - `currentPage`: (Optional) Page number
     - `pageSize`: (Optional) Results per page
     - `sort`: (Optional) Sort order

7. `get-promotions`: Get promotion information
   - Parameters:
     - `promotionId`: (Optional) Specific promotion ID

8. `get-product-reviews`: Get product reviews
   - Parameters:
     - `productCode`: Product code/SKU

9. `get-product-suggestions`: Get product recommendations
   - Parameters:
     - `productCode`: Reference product code/SKU
     - `maxResults`: (Optional) Maximum number of suggestions

10. `create-cart`: Create a new shopping cart
    - Parameters: None

11. `get-cart`: Get cart details
    - Parameters:
      - `cartId`: Cart ID to retrieve

12. `add-to-cart`: Add a product to cart
    - Parameters:
      - `cartId`: Cart ID
      - `productCode`: Product code/SKU
      - `quantity`: (Optional) Quantity to add (default: 1)

13. `update-cart-entry`: Update product quantity in cart
    - Parameters:
      - `cartId`: Cart ID
      - `entryNumber`: Entry number in cart
      - `quantity`: New quantity

14. `remove-from-cart`: Remove a product from cart
    - Parameters:
      - `cartId`: Cart ID
      - `entryNumber`: Entry number to remove

15. `get-order-status`: Check order status
    - Parameters:
      - `orderId`: Order ID

16. `get-order-history`: View order history
    - Parameters:
      - `userId`: User ID

17. `check-service-health`: Get current service health status
    - Parameters: None

18. `analyze-performance`: Get historical performance insights
    - Parameters: None

## Configuration

The server can be configured using environment variables:

```env
# SAP Commerce Cloud Configuration
SAP_COMMERCE_URL=https://your-commerce-url/occ/v2
SAP_COMMERCE_SITE=your-site-name
SAP_COMMERCE_TIMEOUT=10000
SAP_COMMERCE_VALIDATE_SSL=false

# OAuth2 Authentication (optional)
SAP_COMMERCE_CLIENT_ID=your-client-id
SAP_COMMERCE_CLIENT_SECRET=your-client-secret

# Logging Configuration
LOG_LEVEL=info # debug, info, warn, or error
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Claude Integration Example Queries

- "Search for all products related to 'hacendado'"
- "Find electronics products under $500"
- "Get details for product with code 'ABC123'"
- "Check stock availability for product 'XYZ789'"
- "Show me all products in the 'electronics' category"
- "What promotions are currently active?"
- "Show me reviews for product 'ABC123'"
- "Suggest products similar to 'ABC123'"
- "Create a new shopping cart"
- "Add 2 units of product 'ABC123' to my cart"
- "Update the quantity of item 1 in my cart to 3"
- "Remove item 2 from my cart"
- "Show me my cart details"
- "What's the status of order 'ORD123456'?"
- "Show me my order history"
- "Check the current health status of the service"
- "Analyze performance for the last 12 hours"
- "Show me performance insights"
- "Get cache hit rates for today"

## Development

The project includes VS Code integration through `.vscode/mcp.json` for easy debugging and development. Make sure to update the configuration with your SAP Commerce instance details.

### Running in Development Mode

For development, you can use:
```bash
npm run dev
```

This will start TypeScript in watch mode, recompiling on changes.

## Performance Monitoring

### Real-time Health Checks
The server includes real-time health monitoring with metrics for:
- API latency
- Error rates
- Cache hit rates
- Service status (healthy/degraded/unhealthy)

### Historical Analysis
Performance data is stored and analyzed with:
- 24-hour historical trends
- P95 latency tracking
- Error rate patterns
- Cache efficiency metrics
- Automated performance insights

### Logging
Logs are stored in the `logs` directory with automatic rotation:
- Error logs: `logs/error-YYYY-MM-DD.log`
- Combined logs: `logs/combined-YYYY-MM-DD.log`
- Health metrics: `logs/health-YYYY-MM-DD.log`

Logs are automatically rotated daily and kept for 30 days.

## Error Handling

The server includes comprehensive error handling for common SAP Commerce API issues:
- Invalid product codes
- Network connectivity problems
- Authentication errors
- API rate limiting
- Invalid category or promotion IDs
- Price range validation
- Sorting parameter validation
- Cart operation failures

## Authentication

The server supports OAuth2 client credentials flow for authenticated requests to SAP Commerce. Configure the client ID and secret in the environment variables to enable authenticated requests.

### Token Management
- Automatic token refresh handling
- Buffer time for token expiration (5 minutes)
- Graceful fallback for authentication failures

## Caching

The server implements intelligent caching with:
- 5-minute TTL for product data
- Automatic cache invalidation
- Cache hit rate monitoring
- Eviction policies for memory management

## Cart Session Management

The server maintains cart sessions for anonymous users with the following features:
- Automatic cart creation
- Persistent cart ID tracking
- Cart entry management
- Cart totals calculation
- Product availability validation

## Security Notes

- SSL certificate validation can be disabled for development using `SAP_COMMERCE_VALIDATE_SSL=false`
- For production, ensure proper SSL certification and authentication are configured
- Store sensitive credentials (client ID/secret) in environment variables, never in code
- Regular security audits recommended for production deployments
- Cart IDs should be treated as sensitive information

## Performance Optimization

The server includes several performance optimization features:
- Automatic request retries with exponential backoff
- Response caching for frequently accessed data
- Request batching and throttling
- Performance monitoring and alerting
- Historical performance analysis
- Automated performance insights and recommendations