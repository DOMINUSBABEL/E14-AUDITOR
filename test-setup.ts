import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

GlobalRegistrator.register();

// Dynamic import to ensure DOM is ready before RTL loads
const { cleanup } = await import('@testing-library/react');

afterEach(() => {
    cleanup();
});
