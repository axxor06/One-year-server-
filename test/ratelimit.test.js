import { test } from "node:test";
import assert from "node:assert/strict";
process.env.GUESTBOOK_RATE_LIMIT = "3";
const { default: app } = await import("../src/app.js");
test("429 after too many attempts", async () => {
  const s = app.listen(0); const url = `http://localhost:${s.address().port}/api/guestbook`; const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "" }) })).status);
  s.close(); assert.deepEqual(codes, [400, 400, 400, 429, 429]);
});
