import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";

GlobalRegistrator.register({
    url: 'http://localhost:3000',
    width: 1024,
    height: 768,
});

// Mock URL APIs
// @ts-ignore
if (!global.URL.createObjectURL) {
  // @ts-ignore
  global.URL.createObjectURL = (blob: Blob) => `blob:${blob.size}`;
}
// @ts-ignore
if (!global.URL.revokeObjectURL) {
  // @ts-ignore
  global.URL.revokeObjectURL = () => {};
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
