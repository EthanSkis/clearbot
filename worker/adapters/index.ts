import type { Adapter } from "./types";
import { txTabcAdapter } from "./tx_tabc";
import { caAbcAdapter } from "./ca_abc";

const all: Adapter[] = [txTabcAdapter, caAbcAdapter];

export const adapters = new Map<string, Adapter>(all.map((a) => [a.agencyCode, a]));

export function findAdapter(agencyCode: string | null | undefined): Adapter | null {
  if (!agencyCode) return null;
  return adapters.get(agencyCode) ?? null;
}
