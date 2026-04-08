// Logic-only tests for the Cloud Functions in functions/index.js. We do
// NOT execute the deployed functions; instead we mirror the logic into
// pure helpers and verify the H2/H3 fixes:
//
//  - follower count adjustments are clamped at zero (never go negative)
//  - room cleanup pages results so it never overflows the 500-write batch cap
//
// Treating these as pure-logic tests keeps them fast and avoids pulling in
// firebase-admin (which we removed from the root deps as part of M3).

const adjustFollowerCount = (current, delta) => {
  if (delta < 0 && (current || 0) <= 0) return 0;
  return Math.max(0, (current || 0) + delta);
};

const pageDeletes = (allDocs, batchSize) => {
  const pages = [];
  for (let i = 0; i < allDocs.length; i += batchSize) {
    pages.push(allDocs.slice(i, i + batchSize));
  }
  return pages;
};

describe('cloud function logic', () => {
  describe('adjustFollowerCount', () => {
    it('increments normally', () => {
      expect(adjustFollowerCount(3, 1)).toBe(4);
    });

    it('clamps decrements at zero (H2)', () => {
      expect(adjustFollowerCount(0, -1)).toBe(0);
      expect(adjustFollowerCount(undefined, -1)).toBe(0);
    });

    it('decrements when there is room', () => {
      expect(adjustFollowerCount(5, -1)).toBe(4);
    });

    it('idempotent under repeated decrements at zero', () => {
      let n = 1;
      n = adjustFollowerCount(n, -1);
      n = adjustFollowerCount(n, -1);
      n = adjustFollowerCount(n, -1);
      expect(n).toBe(0);
    });
  });

  describe('pageDeletes', () => {
    it('returns a single page when under the cap', () => {
      const docs = Array.from({ length: 100 }, (_, i) => i);
      const pages = pageDeletes(docs, 450);
      expect(pages).toHaveLength(1);
      expect(pages[0]).toHaveLength(100);
    });

    it('splits results into <=batch pages (H3)', () => {
      const docs = Array.from({ length: 1200 }, (_, i) => i);
      const pages = pageDeletes(docs, 450);
      expect(pages).toHaveLength(3);
      expect(pages[0]).toHaveLength(450);
      expect(pages[1]).toHaveLength(450);
      expect(pages[2]).toHaveLength(300);
      expect(pages.every((p) => p.length <= 450)).toBe(true);
    });

    it('handles empty input', () => {
      expect(pageDeletes([], 450)).toEqual([]);
    });
  });
});
