import { InternalAxiosRequestConfig } from 'axios';

export interface SapCommerceConfig {
    baseUrl: string;
    baseSite?: string;
    timeout?: number;
    validateSSL?: boolean;
    clientId?: string;
    clientSecret?: string;
    retryConfig?: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    };
}

export interface ProductSearchResponse {
    products: Product[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalResults: number;
    };
}

export interface Product {
    code: string;
    name: string;
    description?: string;
    price?: {
        formattedValue: string;
        value: number;
    };
    stock?: {
        stockLevel: number;
        stockLevelStatus: string;
    };
}

export interface AuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    products?: Product[];
    subcategories?: Category[];
}

export interface Promotion {
    code: string;
    title: string;
    description?: string;
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    priority?: number;
}

export interface AdvancedSearchOptions {
    query?: string;
    categoryCode?: string;
    priceRange?: {
        min?: number;
        max?: number;
    };
    sort?: string;
    currentPage?: number;
    pageSize?: number;
    fields?: string;
}

export interface ProductSuggestion {
    product: Product;
    reason: string;
}

export interface CartEntry {
    entryNumber?: number;
    product: {
        code: string;
        name: string;
    };
    quantity: number;
    basePrice?: {
        formattedValue: string;
        value: number;
    };
    totalPrice?: {
        formattedValue: string;
        value: number;
    };
}

export interface Cart {
    code: string;
    guid?: string;
    totalItems: number;
    totalPrice?: {
        formattedValue: string;
        value: number;
    };
    entries: CartEntry[];
}

export interface OrderStatus {
    code: string;
    status: string;
    statusDate?: string;
    consignmentStatus?: string;
    created?: string;
    totalPrice?: {
        formattedValue: string;
        value: number;
    };
    entries?: {
        product: {
            code: string;
            name: string;
        };
        quantity: number;
        entryNumber?: number;
    }[];
}

export interface CatalogVersion {
    id: string;
    url: string;
    categories: Category[];
}

export interface Catalog {
    id: string;
    name: string;
    url: string;
    catalogVersions: CatalogVersion[];
}

export interface CatalogsResponse {
    catalogs: Catalog[];
}

// Add custom type for Axios request config
export interface TimestampedRequestConfig extends InternalAxiosRequestConfig {
    timestamp?: number;
}