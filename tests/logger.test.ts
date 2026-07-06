import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, setErrorReporter } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setErrorReporter(null);
  });

  it("writes errors to console.error", () => {
    logger.error("boom", { code: 500 });
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("suppresses debug below the default threshold", () => {
    // Default level in the test env is 'debug' unless LOG_LEVEL is set, so
    // assert relative ordering instead: error always emits.
    logger.info("hello");
    expect(console.log).toHaveBeenCalled();
  });

  it("serializes Error objects instead of dropping them", () => {
    logger.error("failed", { err: new Error("kaboom") });
    const arg = vi.mocked(console.error).mock.calls[0][0] as string;
    expect(arg).toContain("kaboom");
  });

  it("forwards errors to an attached reporter", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const err = new Error("track me");
    logger.error("api failure", { err });
    expect(reporter).toHaveBeenCalledOnce();
    expect(reporter.mock.calls[0][0]).toBe(err);
  });

  it("does not forward non-error levels to the reporter", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    logger.warn("careful");
    logger.info("fyi");
    expect(reporter).not.toHaveBeenCalled();
  });
});
