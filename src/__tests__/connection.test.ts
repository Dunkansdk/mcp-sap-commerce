import { SapCommerceService } from '../services/sapCommerceService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const baseUrl = process.env.SAP_COMMERCE_URL || 'https://localhost:9002/occ/v2';
const baseSite = process.env.SAP_COMMERCE_SITE || 'electronics';

describe('SAP Commerce Connection Tests', () => {
  let service: SapCommerceService;
  
  beforeAll(() => {
    service = new SapCommerceService({
      baseUrl,
      baseSite,
      validateSSL: false,
      timeout: 10000
    });
  });

  test('should retrieve catalogs', async () => {
    const catalogs = await service.getCatalogs();
    expect(catalogs).toBeDefined();
    expect(Array.isArray(catalogs)).toBe(true);
    console.log(`Found ${catalogs.length} catalogs`);
  });

  test('should retrieve specific catalog details', async () => {
    const targetCatalog = 'electronicsProductCatalog';
    const catalog = await service.getCatalogById(targetCatalog);
    
    expect(catalog).toBeDefined();
    expect(catalog?.name).toBeDefined();
    expect(catalog?.catalogVersions).toBeDefined();
    
    console.log(`Retrieved catalog: ${catalog?.name}`);
    catalog?.catalogVersions.forEach(version => {
      console.log(`  - ${version.id}`);
      console.log(`    Categories: ${version.categories?.length || 0}`);
    });
  });

  test('should retrieve categories from catalog', async () => {
    const targetCatalog = 'electronicsProductCatalog';
    const categories = await service.getCategories(undefined, targetCatalog, 'Online');
    
    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    console.log(`Retrieved ${categories.length} categories`);
    
    // Optional: Log the category structure for debugging
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id})`);
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => {
          console.log(`    └─ ${sub.name} (${sub.id})`);
        });
      }
    });
  });

  test('should retrieve products from a specific category', async () => {
    const categoryId = '1'; // Spare Parts Catalogue
    const products = await service.getProductsByCategory(categoryId, { pageSize: 20 });
    
    expect(products).toBeDefined();
    expect(products.pagination).toBeDefined();
    console.log(`Found ${products.pagination?.totalResults || 0} total products in category ${categoryId}`);
    
    // Test pagination if there's more than one page
    if (products.pagination && products.pagination.currentPage < products.pagination.totalPages - 1) {
      const nextPage = await service.getProductsByCategory(categoryId, { 
        currentPage: 1,
        pageSize: 20 
      });
      
      expect(nextPage).toBeDefined();
      expect(nextPage.products).toBeDefined();
      expect(Array.isArray(nextPage.products)).toBe(true);
      console.log(`Retrieved page 2 with ${nextPage.products.length} products`);
    }
  });

  test('should perform product search with pagination', async () => {
    const searchResults = await service.searchProducts('', 0, 10);
    
    expect(searchResults).toBeDefined();
    expect(searchResults.pagination).toBeDefined();
    console.log(`Search found ${searchResults.pagination?.totalResults || 0} total products`);
    
    // Category-specific search
    const categorySearch = await service.searchProductsAdvanced({
      query: '',
      currentPage: 0,
      pageSize: 10,
      categoryCode: '1'
    });
    
    expect(categorySearch).toBeDefined();
    expect(categorySearch.pagination).toBeDefined();
    console.log(`Category-specific search found ${categorySearch.pagination?.totalResults || 0} products`);
  });

  test('should perform cart operations', async () => {
    // Create cart
    const cart = await service.createCart();
    expect(cart).toBeDefined();
    expect(cart.code).toBeDefined();
    console.log(`Cart created with ID: ${cart.code}`);

    // Add product to cart
    const products = await service.searchProducts('', 0, 1);
    expect(products.products.length).toBeGreaterThan(0);
    
    if (products.products.length > 0) {
      const productToAdd = products.products[0];
      console.log(`Found product ${productToAdd.code}`);
      
      // Add to cart
      expect(cart.guid).toBeDefined();
      if (cart.guid) {
        const updatedCart = await service.addToCart(cart.guid, productToAdd.code, 1);
        
        expect(updatedCart).toBeDefined();

        console.log(`Cart: ${cart.code}`);
    
        const updatedCartWithEntries = await service.getCart(cart.guid);
        expect(updatedCartWithEntries.entries).toBeDefined();
        expect(updatedCartWithEntries.entries?.length).toBeGreaterThan(0);
        console.log(`Product ${productToAdd.code} added to cart`);
        
        if (updatedCartWithEntries.entries && updatedCartWithEntries.entries.length > 0) {
          const entry = updatedCartWithEntries.entries[0];
          
          // Update quantity
          expect(entry.entryNumber).toBeDefined();
          const updatedCartWithQty = await service.updateCartEntry(
            cart.code, 
            entry.entryNumber || 0, 
            2
          );
          
          expect(updatedCartWithQty).toBeDefined();
          expect(updatedCartWithQty.totalItems).toBeDefined();
          console.log(`Updated product quantity to 2`);
          
          // Remove from cart
          const result = await service.removeCartEntry(cart.code, entry.entryNumber || 0);
          expect(result).toBeDefined();
          console.log(`Removed product from cart`);
        }
      }
    }
  });
});