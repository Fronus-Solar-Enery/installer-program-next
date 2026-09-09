import { describe, it, expect } from "vitest";
import {
  bucketSequence,
  fillSeriesGaps,
  formatBucketLabel,
  formatBucketRange,
  formatPkr,
  formatPkrCompact,
  percentDelta,
  pickGranularity,
  previousPeriod,
  shareOf,
  spanInDays,
  truncateToBucket,
  volumeBand,
  VOLUME_BANDS,
} from "@/lib/analytics";

const utc = (iso: string) => new Date(iso);

describe("pickGranularity", () => {
  it("uses daily buckets for short ranges", () => {
    expect(
      pickGranularity(utc("2026-01-01T00:00:00Z"), utc("2026-01-31T00:00:00Z")),
    ).toBe("day");
  });

  it("switches to weekly past two months", () => {
    expect(
      pickGranularity(utc("2026-01-01T00:00:00Z"), utc("2026-05-01T00:00:00Z")),
    ).toBe("week");
  });

  it("switches to monthly past ~13 months", () => {
    expect(
      pickGranularity(utc("2023-01-01T00:00:00Z"), utc("2026-01-01T00:00:00Z")),
    ).toBe("month");
  });

  it("holds daily right at the 62-day boundary and flips just past it", () => {
    const start = utc("2026-01-01T00:00:00Z");
    const at62 = new Date(start.getTime() + 62 * 86_400_000);
    const at63 = new Date(start.getTime() + 63 * 86_400_000);
    expect(pickGranularity(start, at62)).toBe("day");
    expect(pickGranularity(start, at63)).toBe("week");
  });
});

describe("spanInDays", () => {
  it("never returns less than one day", () => {
    const d = utc("2026-03-04T09:00:00Z");
    expect(spanInDays(d, d)).toBe(1);
  });

  it("counts whole days across a range", () => {
    expect(
      spanInDays(utc("2026-03-01T00:00:00Z"), utc("2026-03-11T00:00:00Z")),
    ).toBe(10);
  });
});

describe("previousPeriod", () => {
  it("returns an equally long window that ends just before the current one", () => {
    const start = utc("2026-03-01T00:00:00.000Z");
    const end = utc("2026-03-31T00:00:00.000Z");
    const prev = previousPeriod(start, end);

    expect(prev.end.getTime()).toBe(start.getTime() - 1);
    expect(prev.end.getTime() - prev.start.getTime()).toBe(
      end.getTime() - start.getTime(),
    );
  });

  it("never overlaps the current window", () => {
    const start = utc("2026-06-01T00:00:00.000Z");
    const end = utc("2026-06-30T23:59:59.999Z");
    const prev = previousPeriod(start, end);
    expect(prev.end < start).toBe(true);
  });
});

describe("percentDelta", () => {
  it("computes a signed percentage change", () => {
    expect(percentDelta(150, 100)).toBe(50);
    expect(percentDelta(50, 100)).toBe(-50);
  });

  it("returns null when there is no baseline to compare against", () => {
    // 0 -> 12 is new activity, not "+infinity%".
    expect(percentDelta(12, 0)).toBeNull();
  });

  it("treats an unchanged zero as no movement", () => {
    expect(percentDelta(0, 0)).toBe(0);
  });

  it("returns null for non-finite inputs", () => {
    expect(percentDelta(Number.NaN, 10)).toBeNull();
    expect(percentDelta(10, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("shareOf", () => {
  it("computes a percentage of the total", () => {
    expect(shareOf(25, 200)).toBe(12.5);
  });

  it("returns 0 rather than dividing by zero", () => {
    expect(shareOf(5, 0)).toBe(0);
    expect(shareOf(5, -10)).toBe(0);
  });
});

describe("truncateToBucket", () => {
  it("floors to midnight UTC for day buckets", () => {
    expect(
      truncateToBucket(utc("2026-04-17T18:42:11Z"), "day").toISOString(),
    ).toBe("2026-04-17T00:00:00.000Z");
  });

  it("floors to the first of the month for month buckets", () => {
    expect(
      truncateToBucket(utc("2026-04-17T18:42:11Z"), "month").toISOString(),
    ).toBe("2026-04-01T00:00:00.000Z");
  });

  it("floors to Monday for week buckets", () => {
    // 2026-04-17 is a Friday; its week starts Monday 2026-04-13.
    expect(
      truncateToBucket(utc("2026-04-17T18:42:11Z"), "week").toISOString(),
    ).toBe("2026-04-13T00:00:00.000Z");
  });

  it("leaves a Monday on its own week", () => {
    expect(
      truncateToBucket(utc("2026-04-13T00:00:00Z"), "week").toISOString(),
    ).toBe("2026-04-13T00:00:00.000Z");
  });

  it("walks a Sunday back to the preceding Monday", () => {
    // 2026-04-19 is a Sunday — it belongs to the week that began 2026-04-13.
    expect(
      truncateToBucket(utc("2026-04-19T23:59:59Z"), "week").toISOString(),
    ).toBe("2026-04-13T00:00:00.000Z");
  });
});

describe("bucketSequence", () => {
  it("emits every day in an inclusive range", () => {
    const seq = bucketSequence(
      utc("2026-01-01T06:00:00Z"),
      utc("2026-01-05T23:00:00Z"),
      "day",
    );
    expect(seq).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
      "2026-01-04T00:00:00.000Z",
      "2026-01-05T00:00:00.000Z",
    ]);
  });

  it("steps weekly from Monday", () => {
    const seq = bucketSequence(
      utc("2026-04-15T00:00:00Z"),
      utc("2026-05-02T00:00:00Z"),
      "week",
    );
    expect(seq[0]).toBe("2026-04-13T00:00:00.000Z");
    expect(seq[1]).toBe("2026-04-20T00:00:00.000Z");
    expect(seq.at(-1)).toBe("2026-04-27T00:00:00.000Z");
  });

  it("steps monthly across a year boundary", () => {
    const seq = bucketSequence(
      utc("2025-11-14T00:00:00Z"),
      utc("2026-02-02T00:00:00Z"),
      "month",
    );
    expect(seq).toEqual([
      "2025-11-01T00:00:00.000Z",
      "2025-12-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
    ]);
  });

  it("returns a single bucket when start and end share one", () => {
    const seq = bucketSequence(
      utc("2026-01-01T01:00:00Z"),
      utc("2026-01-01T23:00:00Z"),
      "day",
    );
    expect(seq).toHaveLength(1);
  });

  it("returns nothing for an inverted or invalid range", () => {
    expect(
      bucketSequence(utc("2026-05-01T00:00:00Z"), utc("2026-01-01T00:00:00Z"), "day"),
    ).toEqual([]);
    expect(bucketSequence(new Date("nope"), utc("2026-01-01T00:00:00Z"), "day")).toEqual(
      [],
    );
  });
});

describe("fillSeriesGaps", () => {
  it("inserts zero rows for buckets the server had no data for", () => {
    const buckets = bucketSequence(
      utc("2026-01-01T00:00:00Z"),
      utc("2026-01-04T00:00:00Z"),
      "day",
    );
    const rows = [
      { bucket: "2026-01-01T00:00:00.000Z", installations: 4 },
      { bucket: "2026-01-04T00:00:00.000Z", installations: 7 },
    ];

    const filled = fillSeriesGaps(rows, buckets, (bucket) => ({
      bucket,
      installations: 0,
    }));

    expect(filled.map((r) => r.installations)).toEqual([4, 0, 0, 7]);
    expect(filled).toHaveLength(buckets.length);
  });

  it("keeps the bucket order of the sequence, not of the rows", () => {
    const buckets = [
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
    ];
    const rows = [
      { bucket: "2026-01-02T00:00:00.000Z", installations: 2 },
      { bucket: "2026-01-01T00:00:00.000Z", installations: 1 },
    ];
    const filled = fillSeriesGaps(rows, buckets, (bucket) => ({
      bucket,
      installations: 0,
    }));
    expect(filled.map((r) => r.installations)).toEqual([1, 2]);
  });
});

describe("volumeBand", () => {
  it("maps counts onto the documented bands", () => {
    expect(volumeBand(1)).toBe("1");
    expect(volumeBand(3)).toBe("2–3");
    expect(volumeBand(6)).toBe("4–6");
    expect(volumeBand(12)).toBe("7–12");
    expect(volumeBand(25)).toBe("13–25");
    expect(volumeBand(400)).toBe("26+");
  });

  it("covers every integer from 1 upward with exactly one band", () => {
    for (let n = 1; n <= 60; n++) {
      const matches = VOLUME_BANDS.filter((b) => n >= b.min && n <= b.max);
      expect(matches).toHaveLength(1);
    }
  });
});

describe("bucket labels", () => {
  it("labels day and month buckets compactly", () => {
    expect(formatBucketLabel("2026-04-13T00:00:00.000Z", "day")).toBe("13 Apr");
    expect(formatBucketLabel("2026-04-01T00:00:00.000Z", "month")).toBe(
      "Apr 26",
    );
  });

  it("spells a week bucket out as its full seven-day span", () => {
    expect(formatBucketRange("2026-04-13T00:00:00.000Z", "week")).toBe(
      "13 Apr 2026 – 19 Apr 2026",
    );
  });

  it("returns an empty label for an unparseable bucket", () => {
    expect(formatBucketLabel("not-a-date", "day")).toBe("");
    expect(formatBucketRange("not-a-date", "week")).toBe("");
  });
});

describe("currency formatting", () => {
  it("compacts thousands and millions for axis ticks", () => {
    expect(formatPkrCompact(950)).toBe("Rs 950");
    expect(formatPkrCompact(12_500)).toBe("Rs 12.5K");
    expect(formatPkrCompact(3_000_000)).toBe("Rs 3M");
  });

  it("spells the full amount for tooltips", () => {
    expect(formatPkr(1_234_567)).toBe("Rs 1,234,567");
  });

  it("degrades to zero on non-finite input", () => {
    expect(formatPkrCompact(Number.NaN)).toBe("Rs 0");
    expect(formatPkr(Number.POSITIVE_INFINITY)).toBe("Rs 0");
  });
});
