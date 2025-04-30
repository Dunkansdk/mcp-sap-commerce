export const mockRegistry = {
    resetMocks() {
        jest.clearAllMocks();
    },

    mockTimers() {
        jest.useFakeTimers();
    },

    restoreTimers() {
        jest.useRealTimers();
    }
};

export function createMockHealthMonitor() {
    return {
        recordRequestComplete: jest.fn(),
        recordCacheAccess: jest.fn(),
        getStatus: jest.fn().mockReturnValue({
            status: 'healthy',
            lastCheck: new Date(),
            details: {}
        })
    };
}

export function createMockCache() {
    return {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
        size: jest.fn(),
        getKeys: jest.fn(),
        getEntries: jest.fn()
    };
}