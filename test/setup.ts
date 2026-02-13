import { JSDOM } from 'jsdom';
import { afterEach } from 'bun:test';
import '@testing-library/jest-dom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});

global.document = dom.window.document;
global.window = dom.window as unknown as Window & typeof globalThis;
global.navigator = dom.window.navigator;

const keys = Object.getOwnPropertyNames(dom.window) as Array<keyof Window>;
keys.forEach((key) => {
  if (typeof key === 'string' && !key.startsWith('_') && !(key in global)) {
    try {
      // @ts-ignore
      global[key] = dom.window[key];
    } catch {
      // ignore
    }
  }
});

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
