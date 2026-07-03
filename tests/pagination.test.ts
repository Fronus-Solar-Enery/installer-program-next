import { describe, it, expect } from "vitest";
import {
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/pagination";

describe("getPaginationParams", () => {
  it("applies defaults when nothing is provided", () => {
    expect(getPaginationParams(new URLSearchParams())).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("computes skip from page and limit", () => {
    const params = new URLSearchParams("page=3&limit=25");
    expect(getPaginationParams(params)).toEqual({ page: 3, limit: 25, skip: 50 });
  });

  it("clamps limit to maxLimit", () => {
    const params = new URLSearchParams("limit=999");
    expect(getPaginationParams(params, { maxLimit: 100 }).limit).toBe(100);
  });

  it("floors invalid page/limit to safe minimums", () => {
    const params = new URLSearchParams("page=0&limit=0");
    const result = getPaginationParams(params);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it("honors a custom defaultLimit", () => {
    expect(getPaginationParams(new URLSearchParams(), { defaultLimit: 50 }).limit).toBe(50);
  });
});

describe("createPaginationMeta", () => {
  it("computes pages and next/prev flags", () => {
    expect(createPaginationMeta(45, 2, 10)).toEqual({
      total: 45,
      page: 2,
      limit: 10,
      pages: 5,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("flags no next on the last page and no prev on the first", () => {
    expect(createPaginationMeta(10, 1, 10)).toMatchObject({
      pages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });
});
