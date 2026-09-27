import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./env.js";
import {
  extractCommentEvents,
  verifyChallenge,
  verifyMetaSignature,
} from "./meta-webhook.js";
import { loadPolicy } from "./policy.js";
import { JsonStateStore } from "./state-store.js";
import { ComposioReplier } from "./composio-replier.js";
import { createWorker } from "./worker.js";
import { createPoller } from "./poller.js";

const MAX_BODY_BYTES = 1_000_000;

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function send(response, statusCode, body, contentType = "application/json; charset=utf-8") {
  response.writeHead(statusCode, { "content-type": contentType });
  response.end(contentType.startsWith("application/json") ? JSON.stringify(body) : body);
}

export async function startServer({ env = process.env, logger = console } = {}) {
  const config = loadConfig(env);
  await loadPolicy(config.replyConfigPath);

  const store = new JsonStateStore(config.statePath);
  await store.init();
  const client = config.ingestMode === "poll" || !config.dryRun
    ? new ComposioReplier(config)
    : null;
  const worker = createWorker({ config, store, replier: client, logger });
  worker.start();
  const poller = config.ingestMode === "poll"
    ? createPoller({ config, store, client, worker, logger })
    : null;
  poller?.start();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

      if (request.method === "GET" && url.pathname === "/health") {
        send(response, 200, {
          ok: true,
          mode: config.dryRun ? "dry-run" : "live",
          ingestMode: config.ingestMode,
          queue: await store.summary(),
        });
        return;
      }

      if (
        config.ingestMode === "webhook" &&
        request.method === "GET" &&
        url.pathname === "/webhook"
      ) {
        const challenge = verifyChallenge(url.searchParams, config.metaVerifyToken);
        if (challenge == null) {
          send(response, 403, "Forbidden", "text/plain; charset=utf-8");
        } else {
          send(response, 200, challenge, "text/plain; charset=utf-8");
        }
        return;
      }

      if (
        config.ingestMode === "webhook" &&
        request.method === "POST" &&
        url.pathname === "/webhook"
      ) {
        const rawBody = await readBody(request);
        if (
          !config.allowUnsignedWebhooks &&
          !verifyMetaSignature(
            rawBody,
            request.headers["x-hub-signature-256"],
            config.metaAppSecret,
          )
        ) {
          send(response, 401, { accepted: false, error: "Invalid signature" });
          return;
        }

        let payload;
        try {
          payload = JSON.parse(rawBody.toString("utf8"));
        } catch {
          send(response, 400, { accepted: false, error: "Invalid JSON" });
          return;
        }

        const events = extractCommentEvents(payload);
        const queued = await store.enqueue(events);
        send(response, 200, { accepted: true, found: events.length, queued });
        worker.kick();
        return;
      }

      send(response, 404, { error: "Not found" });
    } catch (error) {
      logger.error("Request failed", { message: String(error?.message ?? error) });
      if (!response.headersSent) send(response, 500, { error: "Internal server error" });
      else response.end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, "0.0.0.0", resolve);
  });

  logger.info(`Instagram auto-reply listening on port ${config.port}`, {
    mode: config.dryRun ? "dry-run" : "live",
  });

  let closing = null;
  function close() {
    if (closing) return closing;
    closing = (async () => {
      const serverClosed = new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await poller?.stop();
      await serverClosed;
      await worker.stop();
    })();
    return closing;
  }

  return { server, close, config, store, worker, poller };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = await startServer();
  let shuttingDown = false;
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      if (shuttingDown) return;
      shuttingDown = true;
      void app.close().then(
        () => {
          process.exitCode = 0;
        },
        (error) => {
          console.error("Graceful shutdown failed", {
            message: String(error?.message ?? error),
          });
          process.exitCode = 1;
        },
      );
    });
  }
}
