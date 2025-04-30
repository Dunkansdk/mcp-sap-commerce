import { withRetry } from '../../utils/retryUtils.js';
import { Catalog, Category, CatalogVersion } from '../types/interfaces.js';
import { SapCommerceClient } from './sapCommerceClient.js';

export class CatalogService {
    private client: SapCommerceClient;

    constructor(client: SapCommerceClient) {
        this.client = client;
    }

    async getCatalogs(): Promise<Catalog[]> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get('/catalogs');
            return response.data.catalogs;
        }, this.client.getRetryConfig());
    }

    async getCatalogById(catalogId: string): Promise<Catalog | null> {
        const catalogs = await this.getCatalogs();
        return catalogs.find(catalog => catalog.id === catalogId) || null;
    }

    async getCatalogVersion(catalogId: string, versionId: string): Promise<CatalogVersion | null> {
        const catalog = await this.getCatalogById(catalogId);
        return catalog?.catalogVersions.find(version => version.id === versionId) || null;
    }

    async getCategories(categoryId?: string, catalogId: string = 'electronicsProductCatalog', catalogVersionId: string = 'Online'): Promise<Category[]> {
        return withRetry(async () => {
            const catalog = await this.getCatalogById(catalogId);
            if (!catalog) {
                throw new Error(`Catalog ${catalogId} not found`);
            }

            const version = catalog.catalogVersions.find(v => v.id === catalogVersionId);
            if (!version) {
                throw new Error(`Catalog version ${catalogVersionId} not found in catalog ${catalogId}`);
            }

            if (categoryId) {
                // If specific category is requested, find it in the version's categories
                const findCategory = (categories: Category[]): Category | undefined => {
                    for (const category of categories) {
                        if (category.id === categoryId) {
                            return category;
                        }
                        if (category.subcategories) {
                            const found = findCategory(category.subcategories);
                            if (found) return found;
                        }
                    }
                    return undefined;
                };

                const category = findCategory(version.categories);
                if (!category) {
                    throw new Error(`Category ${categoryId} not found`);
                }
                return [category];
            }

            // Return all top-level categories if no specific category is requested
            return version.categories;
        }, this.client.getRetryConfig());
    }

    async getProductsByCategory(categoryId: string, options: {
        currentPage?: number;
        pageSize?: number;
        sort?: string;
    } = {}): Promise<any> {
        return withRetry(async () => {
            const response = await this.client.getAxiosClient().get(`/categories/${categoryId}/products`, {
                params: {
                    currentPage: options.currentPage || 0,
                    pageSize: options.pageSize || 20,
                    sort: options.sort,
                    fields: 'FULL'
                }
            });
            return response.data;
        }, this.client.getRetryConfig());
    }
}