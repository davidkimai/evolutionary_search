import { spawn } from "node:child_process";
import readline from "node:readline";

import { config } from "../core/config.js";
import type { Objective, Opportunity, RunEvent } from "../core/types.js";
import { makeId, nowIso } from "../utils/helpers.js";

type JsonRpcId = string | number;

type JsonRpcMessage = {
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export type KickoffResult = {
  threadId: string;
  turnId: string;
  events: RunEvent[];
  summary: string | null;
};

export type ReviewResult = {
  turnId: string;
  reviewThreadId: string | null;
  events: RunEvent[];
  reviewText: string | null;
};

export interface SearchAppServerClient {
  kickoffRun(runId: string, objective: Objective, mode: string): Promise<KickoffResult>;
  reviewRun(runId: string, threadId: string, opportunities: Opportunity[]): Promise<ReviewResult>;
}

export function createAppServerClient(): SearchAppServerClient {
  if (config.codexAppServerMode !== "real") {
    return new MockAppServerClient();
  }
  return new CodexAppServerClient();
}

class MockAppServerClient implements SearchAppServerClient {
  async kickoffRun(runId: string, objective: Objective, mode: string): Promise<KickoffResult> {
    const turnId = makeId("turn");
    return {
      threadId: makeId("thr"),
      turnId,
      summary: `Mock Codex session initialized for ${objective.title} in ${mode} mode.`,
      events: [
        makeEvent(runId, "thread/started", "Mock app-server thread created."),
        makeEvent(runId, "turn/started", "Mock kickoff turn started."),
        makeEvent(runId, "item/completed", "Mock kickoff summary emitted."),
        makeEvent(runId, "turn/completed", "Mock kickoff turn completed.")
      ]
    };
  }

  async reviewRun(runId: string): Promise<ReviewResult> {
    return {
      turnId: makeId("turn"),
      reviewThreadId: null,
      reviewText: "Mock review: replay flow is deterministic, ranking is inspectable, and evidence is surfaced.",
      events: [
        makeEvent(runId, "review/start", "Mock review started."),
        makeEvent(runId, "item/completed", "Mock review completed.")
      ]
    };
  }
}

class CodexAppServerClient implements SearchAppServerClient {
  async kickoffRun(runId: string, objective: Objective, mode: string): Promise<KickoffResult> {
    const connection = await JsonRpcConnection.create();
    try {
      await connection.initialize();
      const threadResponse = await connection.request<{ thread: { id: string } }>("thread/start", {
        cwd: config.repoRoot,
        approvalPolicy: "never",
        sandbox: "workspace-write",
        personality: "pragmatic"
      });
      const threadId = threadResponse.thread.id;
      const kickoff = await connection.request<{ turn: { id: string } }>("turn/start", {
        threadId,
        input: [
          {
            type: "text",
            text: buildKickoffPrompt(objective, mode)
          }
        ],
        cwd: config.repoRoot,
        approvalPolicy: "never",
        sandboxPolicy: {
          type: "workspaceWrite",
          writableRoots: [config.repoRoot],
          networkAccess: true
        },
        summary: "concise",
        personality: "pragmatic"
      });

      const turnId = kickoff.turn.id;
      const result = await connection.collectTurn(runId, turnId);
      return {
        threadId,
        turnId,
        events: result.events,
        summary: result.message
      };
    } finally {
      await connection.close();
    }
  }

  async reviewRun(runId: string, threadId: string, opportunities: Opportunity[]): Promise<ReviewResult> {
    const connection = await JsonRpcConnection.create();
    try {
      await connection.initialize();
      await connection.request("thread/resume", {
        threadId,
        personality: "pragmatic"
      });
      const review = await connection.request<{ turn: { id: string }; reviewThreadId: string }>("review/start", {
        threadId,
        delivery: "inline",
        target: {
          type: "custom",
          instructions: buildReviewPrompt(opportunities)
        }
      });
      const result = await connection.collectTurn(runId, review.turn.id);
      return {
        turnId: review.turn.id,
        reviewThreadId: review.reviewThreadId,
        events: result.events,
        reviewText: result.reviewText ?? result.message
      };
    } finally {
      await connection.close();
    }
  }
}

class JsonRpcConnection {
  private readonly child = spawn(config.codexExecutable, ["app-server"], {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: config.repoRoot,
    env: process.env
  });
  private readonly reader = readline.createInterface({ input: this.child.stdout });
  private readonly pending = new Map<JsonRpcId, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private readonly notifications: JsonRpcMessage[] = [];
  private nextId = 1;

  static async create(): Promise<JsonRpcConnection> {
    const connection = new JsonRpcConnection();
    connection.reader.on("line", (line) => {
      if (!line.trim()) {
        return;
      }
      const message = JSON.parse(line) as JsonRpcMessage;
      if (message.id !== undefined) {
        if (typeof message.method === "string") {
          connection.rejectUnsupportedServerRequest(message);
          return;
        }
        const pending = connection.pending.get(message.id);
        if (!pending) {
          return;
        }
        connection.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
        return;
      }
      if (typeof message.method === "string") {
        connection.notifications.push(message);
      }
    });

    thisWireErrors(connection);
    return connection;
  }

  async initialize(): Promise<void> {
    await this.request("initialize", {
      clientInfo: {
        name: "owes_app_server_client",
        title: "Open Web Evolutionary Search",
        version: "0.1.0"
      }
    });
    this.notify("initialized", {});
  }

  request<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    this.child.stdin.write(`${payload}\n`);
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method: string, params: Record<string, unknown>): void {
    const payload = JSON.stringify({ method, params });
    this.child.stdin.write(`${payload}\n`);
  }

  async collectTurn(runId: string, turnId: string): Promise<{ events: RunEvent[]; message: string | null; reviewText: string | null }> {
    const startedAt = Date.now();
    let completedMessage: JsonRpcMessage | undefined;
    while (Date.now() - startedAt < 120_000) {
      completedMessage = this.notifications.find((message) => message.method === "turn/completed" && extractTurnId(message) === turnId);
      if (completedMessage) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!completedMessage) {
      throw new Error(`Timed out waiting for turn/completed for turn ${turnId}.`);
    }

    const terminal = extractTerminalTurnState(completedMessage);
    if (terminal.status && terminal.status !== "completed") {
      throw new Error(`Turn ${turnId} completed with terminal status ${terminal.status}.`);
    }
    if (terminal.error) {
      throw new Error(`Turn ${turnId} completed with error: ${terminal.error}`);
    }

    const events = this.notifications
      .filter((message) => relatesToTurn(message, turnId))
      .map((message) => mapNotificationToEvent(runId, message));
    const message = findAgentMessage(this.notifications, turnId);
    const reviewText = findReviewText(this.notifications, turnId);
    return { events, message, reviewText };
  }

  async close(): Promise<void> {
    this.reader.close();
    this.child.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  private rejectUnsupportedServerRequest(message: JsonRpcMessage): void {
    const payload = JSON.stringify({
      id: message.id,
      error: {
        code: -32601,
        message: `Unsupported app-server server request: ${message.method ?? "unknown"}`
      }
    });
    this.child.stdin.write(`${payload}\n`);
  }
}

function thisWireErrors(connection: JsonRpcConnection): void {
  // The app-server writes tracing to stderr; keep the process alive and ignore the stream here.
}

function mapNotificationToEvent(runId: string, message: JsonRpcMessage): RunEvent {
  return {
    eventId: makeId("evt"),
    runId,
    type: message.method ?? "notification",
    message: summarizeNotification(message),
    at: nowIso(),
    data: (message.params as Record<string, unknown> | undefined) ?? {}
  };
}

function summarizeNotification(message: JsonRpcMessage): string {
  if (message.method === "item/completed") {
    const item = (message.params?.item as Record<string, unknown> | undefined) ?? {};
    if (typeof item.type === "string") {
      return `Item completed: ${item.type}`;
    }
  }
  if (message.method === "item/started") {
    const item = (message.params?.item as Record<string, unknown> | undefined) ?? {};
    if (typeof item.type === "string") {
      return `Item started: ${item.type}`;
    }
  }
  if (message.method === "turn/started") {
    return "Turn started.";
  }
  if (message.method === "turn/completed") {
    return "Turn completed.";
  }
  if (message.method === "thread/started") {
    return "Thread started.";
  }
  return message.method ?? "notification";
}

function extractTurnId(message: JsonRpcMessage): string | null {
  const params = message.params ?? {};
  if (typeof params.turnId === "string") {
    return params.turnId;
  }
  const turn = params.turn as Record<string, unknown> | undefined;
  if (turn && typeof turn.id === "string") {
    return turn.id;
  }
  return null;
}

function extractTerminalTurnState(message: JsonRpcMessage): { status: string | null; error: string | null } {
  const turn = (message.params?.turn as Record<string, unknown> | undefined) ?? {};
  const status = typeof turn.status === "string" ? turn.status.toLowerCase() : null;
  const error = turn.error;

  if (typeof error === "string") {
    return { status, error };
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return { status, error: (error as { message: string }).message };
  }
  return { status, error: null };
}

function relatesToTurn(message: JsonRpcMessage, turnId: string): boolean {
  return extractTurnId(message) === turnId || message.method === "thread/started";
}

function findAgentMessage(messages: JsonRpcMessage[], turnId: string): string | null {
  for (const message of messages) {
    if (extractTurnId(message) !== turnId || message.method !== "item/completed") {
      continue;
    }
    const item = (message.params?.item as Record<string, unknown> | undefined) ?? {};
    if (item.type !== "agentMessage") {
      continue;
    }
    if (typeof item.text === "string" && item.text.trim()) {
      return item.text.trim();
    }
    const content = item.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(content)) {
      continue;
    }
    const text = content
      .filter((entry) => entry.type === "text" && typeof entry.text === "string")
      .map((entry) => entry.text as string)
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }
  return null;
}

function findReviewText(messages: JsonRpcMessage[], turnId: string): string | null {
  for (const message of messages) {
    if (extractTurnId(message) !== turnId || message.method !== "item/completed") {
      continue;
    }
    const item = (message.params?.item as Record<string, unknown> | undefined) ?? {};
    if (item.type === "exitedReviewMode" && typeof item.review === "string") {
      return item.review;
    }
  }
  return null;
}

function buildKickoffPrompt(objective: Objective, mode: string): string {
  return [
    "You are the Codex-native control plane for one Open Web Evolutionary Search run.",
    "# Task",
    "Initialize this run by restating the decision objective, the current wedge, and the ranking lens.",
    "# Constraints",
    "- Do not browse.",
    "- Do not inspect files or run tools.",
    "- This turn is session initialization only.",
    "- Keep the broader product frame separate from the current wedge.",
    "# Run context",
    `Title: ${objective.title}`,
    `Query: ${objective.query}`,
    `Profile: ${objective.profile}`,
    `Geography: ${objective.geography}`,
    `Source types: ${objective.sourceTypes.join(", ")}`,
    `Mode: ${mode}`,
    "# Output",
    "Return exactly these three bullets and nothing else:",
    "- Objective: <one sentence>",
    "- Current wedge: <one sentence>",
    "- Ranking lens: <one sentence>"
  ].join("\n");
}

function buildReviewPrompt(opportunities: Opportunity[]): string {
  const preview = opportunities
    .slice(0, 3)
    .map((opportunity, index) => [
      `${index + 1}. ${opportunity.title}`,
      `score=${opportunity.weightedScore.toFixed(3)}`,
      `confidence=${opportunity.confidence.toFixed(2)}`,
      `verification=${opportunity.verificationStatus}`,
      `fit=${opportunity.fitReason}`,
      `evidence=${opportunity.evidenceSnippets.join(" | ")}`
    ].join(" | "))
    .join("\n");

  return [
    "# Task",
    "Review only the ranked shortlist below.",
    "# Constraints",
    "- Do not inspect repository files, diffs, or the wider environment.",
    "- Do not run tools.",
    "- Base the review only on the provided scores, confidence, verification status, fit text, and evidence snippets.",
    "# Output",
    "Return exactly these three bullets and nothing else:",
    "- Evidence quality: <assessment>",
    "- Ranking coherence: <assessment>",
    "- Uncertainty: <assessment>",
    "If there is no critical issue, say so explicitly.",
    "# Ranked shortlist",
    preview || "No opportunities were produced."
  ].join("\n\n");
}

function makeEvent(runId: string, type: string, message: string): RunEvent {
  return {
    eventId: makeId("evt"),
    runId,
    type,
    message,
    at: nowIso(),
    data: {}
  };
}
