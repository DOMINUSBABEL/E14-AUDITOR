let GlobalRegistrator: any;
try {
    GlobalRegistrator = require('@happy-dom/global-registrator').GlobalRegistrator;
    GlobalRegistrator.register();
} catch (e) {
    // console.warn('Happy-dom not available');
}

import { afterEach, mock } from 'bun:test';
let cleanup: any = () => {};
try {
    cleanup = require('@testing-library/react').cleanup;
} catch (e) {
    // console.warn('testing-library/react not available');
}

// Set dummy API key for testing
process.env.GEMINI_API_KEY = 'dummy-key-for-testing';

// Mock openai
mock.module('openai', () => {
    return {
        default: class {
            chat = {
                completions: {
                    create: mock(() => Promise.resolve({ choices: [{ message: { content: '{}' } }] }))
                }
            }
        }
    };
});

// Mock lucide-react
mock.module('lucide-react', () => {
    return {
        ChartColumn: () => null,
        Server: () => null,
        Database: () => null,
        BrainCircuit: () => null,
        Scale: () => null
    };
});

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
