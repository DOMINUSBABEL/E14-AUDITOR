import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";

// Register DOM first
GlobalRegistrator.register();

// Import cleanup after DOM is registered
const { cleanup } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
});
