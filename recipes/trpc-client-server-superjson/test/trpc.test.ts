import { describe, it, expect, vi } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { handler } from "../src/server";
import { makeClient } from "../src/client";

const fetchSpy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => handler(new Request(input, init)));
const client = makeClient("http://local/trpc", fetchSpy as unknown as typeof fetch);

describe("trpc over fetch", () => {
  it("round-trips Dates and Maps", async () => {
    const at = new Date("2026-11-01T10:00:00Z");
    await client.addEvent.mutate({ name: "launch", at });
    const next = await client.nextEvent.query();
    expect(next?.at).toBeInstanceOf(Date);
    expect(next?.at.toISOString()).toBe(at.toISOString());
    const tally = await client.tally.query();
    expect(tally).toBeInstanceOf(Map);
    expect(tally.get("launch")).toBeInstanceOf(Date);
  });

  it("batches parallel calls into one request", async () => {
    fetchSpy.mockClear();
    await Promise.all([client.nextEvent.query(), client.tally.query()]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns typed validation errors", async () => {
    const err = await client.addEvent.mutate({ name: "", at: new Date() }).catch((e) => e);
    expect(err).toBeInstanceOf(TRPCClientError);
    expect(err.data?.code).toBe("BAD_REQUEST");
  });
});
