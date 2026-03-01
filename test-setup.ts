import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

import { afterEach, mock } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Set dummy API key for testing
process.env.GEMINI_API_KEY = 'dummy-key-for-testing';

// Mock GoogleGenAI globally to prevent initialization errors
mock.module('@google/genai', () => {
    return {
        GoogleGenAI: class {
            constructor() {}
            models = {
                generateContent: mock(() => Promise.resolve({ text: '{}' }))
            };
        },
        Type: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            ARRAY: 'ARRAY',
            INTEGER: 'INTEGER',
            BOOLEAN: 'BOOLEAN',
            NUMBER: 'NUMBER'
        }
    };
});


// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  (URL.createObjectURL as any) = () => 'blob:mock-url';
  (URL.revokeObjectURL as any) = () => {};
} else {
    // In case it exists but needs overriding or just in case happy-dom updates
    const originalCreate = URL.createObjectURL;
    (URL.createObjectURL as any) = (obj: any) => 'blob:mock-url';
    (URL.revokeObjectURL as any) = () => {};
}

afterEach(() => {
    cleanup();
});
