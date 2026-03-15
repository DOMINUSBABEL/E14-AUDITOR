import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';
process.env.GEMINI_MODEL = 'gemini-2.5-flash-latest';

GlobalRegistrator.register();

afterEach(() => {
    cleanup();
});
