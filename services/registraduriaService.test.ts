import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import * as registraduriaService from "./registraduriaService";

describe("registraduriaService", () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    global.fetch = mock();
    console.error = mock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  describe("fetchApi", () => {
    it("should return JSON data on success", async () => {
      const mockData = [{ id: "01", n: "ANTIOQUIA" }];
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await registraduriaService.getDepartments("ALC");
      expect(result).toEqual([{ id: "01", n: "ANTIOQUIA" }]);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should return null (and trigger fallbacks) when response is not ok", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
      });

      const result = await registraduriaService.getDepartments("ALC");
      // getDepartments has a specific fallback
      expect(result).toEqual([
        { id: '01', n: 'ANTIOQUIA' },
        { id: '11', n: 'BOGOTA D.C.' },
        { id: '27', n: 'VALLE' },
        { id: '07', n: 'BOYACA' }
      ]);

      const munResult = await registraduriaService.getMunicipalities("ALC", "99");
      expect(munResult).toEqual([]);
    });

    it("should handle fetch errors and return null (triggering fallbacks)", async () => {
      const error = new Error("Network failure");
      (global.fetch as any).mockRejectedValue(error);

      const result = await registraduriaService.getDepartments("ALC");

      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual([
        { id: '01', n: 'ANTIOQUIA' },
        { id: '11', n: 'BOGOTA D.C.' },
        { id: '27', n: 'VALLE' },
        { id: '07', n: 'BOYACA' }
      ]);

      const munResult = await registraduriaService.getMunicipalities("ALC", "99");
      expect(munResult).toEqual([]);
    });
  });

  describe("getCorporations", () => {
    it("should return the list of corporations", async () => {
      const result = await registraduriaService.getCorporations();
      expect(result).toBeArray();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("n");
    });
  });

  describe("Location functions success cases", () => {
    it("getMunicipalities should map data correctly", async () => {
      const mockData = [{ id: "001", n: "MEDELLIN", other: "data" }];
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await registraduriaService.getMunicipalities("ALC", "01");
      expect(result).toEqual([{ id: "001", n: "MEDELLIN" }]);
    });

    it("getZones should map data correctly", async () => {
        const mockData = [{ id: "01", n: "ZONA 1" }];
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockData,
        });

        const result = await registraduriaService.getZones("ALC", "01", "001");
        expect(result).toEqual([{ id: "01", n: "ZONA 1" }]);
    });

    it("getPollingStations should map data correctly", async () => {
        const mockData = [{ id: "01", n: "PUESTO 1" }];
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockData,
        });

        const result = await registraduriaService.getPollingStations("ALC", "01", "001", "01");
        expect(result).toEqual([{ id: "01", n: "PUESTO 1" }]);
    });

    it("getTables should map data correctly", async () => {
        const mockData = [{ id: "1", n: "1", u: "http://example.com/e14.jpg" }];
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockData,
        });

        const result = await registraduriaService.getTables("ALC", "01", "001", "01", "01");
        expect(result).toEqual([{ id: "1", n: "1", u: "http://example.com/e14.jpg" }]);
    });
  });

  describe("searchByPrompt", () => {
      it("should return a simulated search result", async () => {
          const result = await registraduriaService.searchByPrompt("test prompt");
          expect(result).toHaveProperty("suggestion");
          expect(result).toHaveProperty("target");
      });
  });

  describe("getTablesRecursively", () => {
      it("should return tables with parent_info", async () => {
        const mockData = [{ id: "1", n: "1", u: "url" }];
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockData,
        });

        const result = await registraduriaService.getTablesRecursively("ALC", "01", "001", "01", "01");
        expect(result[0].parent_info).toBe("01/001/01/01");
      });
  });
});
