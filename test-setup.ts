import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

// Register Happy DOM before importing any React testing libraries
GlobalRegistrator.register();

afterEach(async () => {
    // Dynamic import to ensure cleanup is called after Happy DOM is registered
    const { cleanup } = await import('@testing-library/react');
    cleanup();
});
