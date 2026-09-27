import assert from "node:assert/strict";
import test from "node:test";
import { ComposioReplier } from "../src/composio-replier.js";

function createReplier(config, connectedAccounts) {
  const replier = Object.create(ComposioReplier.prototype);
  replier.config = config;
  replier.client = { connectedAccounts };
  return replier;
}

test("verifies a configured connected account directly without requiring a user ID", async () => {
  let listed = false;
  const replier = createReplier(
    { composioConnectedAccountId: "ca_test", composioUserId: "" },
    {
      async get(id) {
        assert.equal(id, "ca_test");
        return { id, status: "ACTIVE", toolkit: { slug: "instagram" } };
      },
      async list() {
        listed = true;
        return { items: [] };
      },
    },
  );

  assert.deepEqual(await replier.verifyConnectedAccount(), {
    id: "ca_test",
    userId: "",
    status: "ACTIVE",
  });
  assert.equal(listed, false);
});

test("rejects a configured account that is not active Instagram", async () => {
  const replier = createReplier(
    { composioConnectedAccountId: "ca_test", composioUserId: "user-1" },
    {
      async get() {
        return { id: "ca_test", status: "INACTIVE", toolkit: { slug: "instagram" } };
      },
    },
  );

  await assert.rejects(
    () => replier.verifyConnectedAccount(),
    /not an active Instagram account/,
  );
});
