import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';

// Register Happy DOM BEFORE importing testing-library
GlobalRegistrator.register();

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

const { cleanup } = await import('@testing-library/react');

afterEach(() => {
    cleanup();
});
