import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/env.js";

const BASE_ENV = {
  INGEST_MODE: "poll",
  COMPOSIO_API_KEY: "test-key",
  COMPOSIO_CONNECTED_ACCOUNT_ID: "ca_test",
};

test("requires the Instagram account ID before live replies are enabled", () => {
  assert.throws(
    () => loadConfig({ ...BASE_ENV, DRY_RUN: "false" }),
    /INSTAGRAM_ACCOUNT_ID is required in live mode/,
  );
});

test("keeps the Instagram account ID optional in dry-run mode", () => {
  const config = loadConfig({ ...BASE_ENV, DRY_RUN: "true" });
  assert.equal(config.dryRun, true);
  assert.equal(config.instagramAccountId, "");
});
