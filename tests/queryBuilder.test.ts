import { describe, it, expect } from "vitest";
import { QueryBuilder, escapeRegex, parseSortParams } from "@/lib/queryBuilder";

// Row shape used for the builder under test (keys must be known, not `never`).
type Row = Record<string, unknown>;
const qb = () => new QueryBuilder<Row>();

describe("escapeRegex", () => {
  it("escapes every regex metacharacter", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\"
    );
  });

  it("leaves plain alphanumerics untouched", () => {
    expect(escapeRegex("INST-123 Lahore")).toBe("INST-123 Lahore");
  });

  it("neutralizes a ReDoS pattern into a literal (no backtracking)", () => {
    const evil = "(a+)+$";
    const input = "a".repeat(40) + "!";
    const start = Date.now();
    // Escaped => literal => linear; must not hang.
    new RegExp(escapeRegex(evil), "i").test(input);
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("makes a metachar match literally, not as a wildcard", () => {
    expect(new RegExp(escapeRegex("a.c"), "i").test("axc")).toBe(false);
    expect(new RegExp(escapeRegex("a.c"), "i").test("a.c")).toBe(true);
  });
});

describe("QueryBuilder", () => {
  it("search() escapes user input inside $regex across fields", () => {
    const q = qb()
      .search(["fullName", "cnic"], "a.*b")
      .build();
    expect(q.$or).toEqual([
      { fullName: { $regex: "a\\.\\*b", $options: "i" } },
      { cnic: { $regex: "a\\.\\*b", $options: "i" } },
    ]);
  });

  it("search() ignores empty/whitespace values", () => {
    expect(qb().search(["fullName"], "   ").build()).toEqual({});
    expect(qb().search(["fullName"], null).build()).toEqual({});
  });

  it("filter(regex) escapes the value", () => {
    const q = qb().filter("city", "La|ho", { regex: true }).build();
    expect(q).toEqual({ city: { $regex: "La\\|ho", $options: "i" } });
  });

  it("filter() without regex stores an exact value", () => {
    expect(qb().filter("city", "Lahore").build()).toEqual({
      city: "Lahore",
    });
  });

  it("boolean() coerces string to boolean", () => {
    expect(qb().boolean("certified", "true").build()).toEqual({
      certified: true,
    });
    expect(qb().boolean("certified", "false").build()).toEqual({
      certified: false,
    });
  });

  it("enumFilter() ignores 'all'", () => {
    expect(qb().enumFilter("status", "all").build()).toEqual({});
    expect(qb().enumFilter("status", "PAID").build()).toEqual({
      status: "PAID",
    });
  });
});

describe("parseSortParams", () => {
  it("defaults to createdAt desc", () => {
    expect(parseSortParams(new URLSearchParams())).toEqual({
      field: "createdAt",
      order: -1,
    });
  });

  it("reads sortBy and maps asc to 1", () => {
    const params = new URLSearchParams("sortBy=fullName&sortOrder=asc");
    expect(parseSortParams(params)).toEqual({ field: "fullName", order: 1 });
  });
});
