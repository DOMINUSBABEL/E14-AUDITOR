import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

GlobalRegistrator.register();

afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
});
