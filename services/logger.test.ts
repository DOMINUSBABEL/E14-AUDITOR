import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { logger } from "./logger";

describe("Logger Service", () => {
    let originalConsoleInfo = console.info;
    let originalConsoleWarn = console.warn;
    let originalConsoleError = console.error;
    let originalConsoleDebug = console.debug;

    let consoleInfoMock: any;
    let consoleWarnMock: any;
    let consoleErrorMock: any;
    let consoleDebugMock: any;

    beforeEach(() => {
        consoleInfoMock = mock(() => {});
        consoleWarnMock = mock(() => {});
        consoleErrorMock = mock(() => {});
        consoleDebugMock = mock(() => {});

        console.info = consoleInfoMock;
        console.warn = consoleWarnMock;
        console.error = consoleErrorMock;
        console.debug = consoleDebugMock;
    });

    afterEach(() => {
        console.info = originalConsoleInfo;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        console.debug = originalConsoleDebug;
    });

    it("should call console.info when logger.info is called", () => {
        logger.info("Test Info");
        expect(consoleInfoMock).toHaveBeenCalledWith("Test Info");
    });

    it("should call console.warn when logger.warn is called", () => {
        logger.warn("Test Warn");
        expect(consoleWarnMock).toHaveBeenCalledWith("Test Warn");
    });

    it("should call console.error when logger.error is called", () => {
        logger.error("Test Error");
        expect(consoleErrorMock).toHaveBeenCalledWith("Test Error");
    });

    it("should call console.debug when logger.debug is called in development", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        logger.debug("Test Debug");
        expect(consoleDebugMock).toHaveBeenCalledWith("Test Debug");
        process.env.NODE_ENV = originalEnv;
    });

    it("should NOT call console.debug when logger.debug is called in production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        logger.debug("Test Debug");
        expect(consoleDebugMock).not.toHaveBeenCalled();
        process.env.NODE_ENV = originalEnv;
    });
});
