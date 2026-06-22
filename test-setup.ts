import React from 'react';
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

// Mock lucide-react dynamically with static exports to resolve Bun linking
mock.module('lucide-react', () => {
    const makeIconMock = (name: string) => {
        return (props: any) => React.createElement('div', { 'data-testid': `icon-${name.toLowerCase()}`, ...props });
    };
    return {
        AlertTriangle: makeIconMock('AlertTriangle'),
        CheckCircle: makeIconMock('CheckCircle'),
        Clock: makeIconMock('Clock'),
        FileText: makeIconMock('FileText'),
        Bell: makeIconMock('Bell'),
        Settings: makeIconMock('Settings'),
        X: makeIconMock('X'),
        Mail: makeIconMock('Mail'),
        MessageSquare: makeIconMock('MessageSquare'),
        Scale: makeIconMock('Scale'),
        Download: makeIconMock('Download'),
        Search: makeIconMock('Search'),
        Calendar: makeIconMock('Calendar'),
        Filter: makeIconMock('Filter'),
        Database: makeIconMock('Database'),
        FileSpreadsheet: makeIconMock('FileSpreadsheet'),
        Archive: makeIconMock('Archive'),
        ShieldCheck: makeIconMock('ShieldCheck'),
        Gavel: makeIconMock('Gavel'),
        Printer: makeIconMock('Printer'),
        Server: makeIconMock('Server'),
        Cpu: makeIconMock('Cpu'),
        ArrowRight: makeIconMock('ArrowRight'),
        FilterX: makeIconMock('FilterX'),
        Upload: makeIconMock('Upload'),
        Loader2: makeIconMock('Loader2'),
        Microscope: makeIconMock('Microscope'),
        Link: makeIconMock('Link'),
        Folder: makeIconMock('Folder'),
        Globe: makeIconMock('Globe'),
        FileJson: makeIconMock('FileJson'),
        Settings2: makeIconMock('Settings2'),
        MapPin: makeIconMock('MapPin'),
        Building2: makeIconMock('Building2'),
        Layers: makeIconMock('Layers'),
        Grid: makeIconMock('Grid'),
        AlertCircle: makeIconMock('AlertCircle'),
        Sparkles: makeIconMock('Sparkles'),
        FolderTree: makeIconMock('FolderTree'),
        Activity: makeIconMock('Activity'),
        Camera: makeIconMock('Camera'),
        Check: makeIconMock('Check'),
        ChartColumn: makeIconMock('ChartColumn'),
        BrainCircuit: makeIconMock('BrainCircuit')
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
