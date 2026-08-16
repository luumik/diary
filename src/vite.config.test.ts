import { describe, expect, it } from "vitest";

import { localApiProxy } from "../vite.config";

describe("Vite development server", () => {
  it("proxies API requests to the loopback-only diary server", () => {
    expect(localApiProxy).toEqual({
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    });
  });
});
