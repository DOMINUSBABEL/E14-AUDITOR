import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

// Mock GoogleGenAI globally to prevent actual API calls
const generateContentMock = mock();
global.generateContentMock = generateContentMock;

mock.module("@google/genai", () => {
    return {
        GoogleGenAI: class {
            constructor() {
                return {
                    models: {
                        generateContent: generateContentMock
                    }
                };
            }
        },
        Type: {
            OBJECT: "OBJECT",
            STRING: "STRING",
            ARRAY: "ARRAY",
            INTEGER: "INTEGER",
            BOOLEAN: "BOOLEAN",
            NUMBER: "NUMBER"
        }
    };
});

GlobalRegistrator.register();

afterEach(() => {
    cleanup();
    generateContentMock.mockReset();
});
