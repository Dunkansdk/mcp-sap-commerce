import { SapCommerceService } from '../services/sapCommerceService.js';
import dotenv from 'dotenv';

// Force immediate console output
const log = (msg: string) => process.stdout.write(msg + '\n');

dotenv.config();

const baseUrl = process.env.SAP_COMMERCE_URL || 'https://localhost:9002/occ/v2';
const baseSite = process.env.SAP_COMMERCE_SITE || 'electronics';

log('Starting extended API tests...');

async function testConnection() {
    try {
        const service = new SapCommerceService({
            baseUrl,
            baseSite,
            validateSSL: false,
            timeout: 10000
        });

        // Test 1: Get all catalogs
        log('\n1. Testing catalogs retrieval...');
        const catalogs = await service.getCatalogs();
        log(`✓ Found ${catalogs.length} catalogs`);
        
        // Test 2: Get specific catalog details
        log('\n2. Testing specific catalog retrieval...');
        const targetCatalog = 'electronicsProductCatalog';
        const catalog = await service.getCatalogById(targetCatalog);
        if (!catalog) {
            throw new Error(`Catalog ${targetCatalog} not found`);
        }
        log(`✓ Retrieved catalog: ${catalog.name}`);
        log('Catalog versions:');
        catalog.catalogVersions.forEach(version => {
            log(`  - ${version.id}`);
            log(`    Categories: ${version.categories?.length || 0}`);
        });

        // Test 3: Get categories from the catalog
        log('\n3. Testing category retrieval...');
        log('Attempting to get categories with:');
        log(`- Catalog ID: ${targetCatalog}`);
        log(`- Version: Online`);
        const categories = await service.getCategories(undefined, targetCatalog, 'Online');
        log(`✓ Retrieved ${categories.length} categories from ${catalog.name}`);
        categories.forEach(cat => {
            log(`  - ${cat.name} (${cat.id})`);
            if (cat.subcategories) {
                cat.subcategories.forEach(sub => {
                    log(`    └─ ${sub.name} (${sub.id})`);
                    if (sub.subcategories) {
                        sub.subcategories.forEach(subSub => {
                            log(`        └─ ${subSub.name} (${subSub.id})`);
                        });
                    }
                });
            }
        });

        // Test 4: Get products from a specific category with pagination
        const categoryId = '1'; // Spare Parts Catalogue
        log('\n4. Testing product retrieval from category...');
        try {
            const products = await service.getProductsByCategory(categoryId, { pageSize: 20 });
            log(`✓ Retrieved products from category ${categoryId}`);
            log(`Found ${products.pagination?.totalResults || 0} total products`);
            log(`Current page: ${products.pagination?.currentPage || 0}`);
            log(`Total pages: ${products.pagination?.totalPages || 0}`);
            
            // Test pagination by getting next page if available
            if (products.pagination && products.pagination.currentPage < products.pagination.totalPages - 1) {
                const nextPage = await service.getProductsByCategory(categoryId, { 
                    currentPage: 1,
                    pageSize: 20 
                });
                log(`✓ Retrieved page 2 with ${nextPage.products.length} products`);
            }
        } catch (error: any) {
            log(`✗ Product retrieval failed: ${error.message}`);
        }

        // Test 5: Test product search with pagination
        log('\n5. Testing product search...');
        try {
            const searchResults = await service.searchProducts('', 0, 10);
            log(`✓ Search successful`);
            log(`Found ${searchResults.pagination?.totalResults || 0} total products`);
            log(`Current page: ${searchResults.pagination?.currentPage || 0}`);
            log(`Total pages: ${searchResults.pagination?.totalPages || 0}`);

            // Test search with specific category
            const categorySearch = await service.searchProductsAdvanced({
                query: '',
                currentPage: 0,
                pageSize: 10,
                categoryCode: '1'
            });
            log(`✓ Category-specific search successful`);
            log(`Found ${categorySearch.pagination?.totalResults || 0} products in category 1`);
        } catch (error: any) {
            log(`✗ Search failed: ${error.message}`);
        }

        // Test 6: Test cart operations with detailed logging
        log('\n6. Testing cart operations...');
        try {
            // Create cart
            log('Creating cart...');
            const cart = await service.createCart();
            log(`✓ Cart created successfully with ID: ${cart.code}`);

            // Try to add first product from search results
            log('Searching for a product to add...');
            const products = await service.searchProducts('', 0, 1);
            if (products.products.length > 0) {
                const productToAdd = products.products[0];
                log(`Found product ${productToAdd.code} - attempting to add to cart...`);
                
                // Check stock before adding
                // log(`Checking stock for product ${productToAdd.code}...`);
                // const stock = await service.checkProductStock(productToAdd.code);
                // log(`Stock status: ${JSON.stringify(stock)}`);
                
                log(`Adding to the cart product ${productToAdd.code}...`);
                if (!cart.guid) {
                    throw new Error('Cart GUID is undefined');
                }
                const updatedCart = await service.addToCart(cart.guid, productToAdd.code, 1);
                log(`✓ Product ${productToAdd.code} added to cart`);
                log(`Cart now has ${updatedCart.entries?.length || 0} items`);

                if (updatedCart.entries && updatedCart.entries.length > 0) {
                    const entry = updatedCart.entries[0];
                    log(`First entry details: ${JSON.stringify(entry)}`);
                    
                    // Try updating quantity
                    log(`Updating quantity for entry ${entry.entryNumber} to 2...`);
                    const updatedCartWithQty = await service.updateCartEntry(cart.code, entry.entryNumber || 0, 2);
                    log(`✓ Updated product quantity to 2`);
                    log(`Cart total items: ${updatedCartWithQty.totalItems}`);

                    // Try removing item
                    log(`Removing entry ${entry.entryNumber} from cart...`);
                    await service.removeCartEntry(cart.code, entry.entryNumber || 0);
                    log(`✓ Removed product from cart`);
                }
            } else {
                log('✗ No products found to add to cart');
            }
        } catch (error: any) {
            log('\n✗ Cart operation failed:');
            log(`Error message: ${error.message}`);
            if (error.response) {
                log(`Response status: ${error.response.status}`);
                log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw error;
        }

        log('\n✓ All connection tests completed successfully');
        
    } catch (error: any) {
        log('\n✗ Test failed:');
        log(`Error: ${error.message}`);
        
        if (error.response) {
            log(`Status: ${error.response.status}`);
            log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        process.exit(1);
    }
}

// Add error handlers for the process
process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error}`);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    log(`Unhandled rejection: ${error}`);
    process.exit(1);
});

testConnection();