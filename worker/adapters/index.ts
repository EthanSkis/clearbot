import type { Adapter } from "./types";
import { txTabcAdapter } from "./tx_tabc";
import { caAbcAdapter } from "./ca_abc";
import { idIsldAdapter } from "./id_isld";
import { idIspAbcAdapter } from "./id_isp_abc";
import { idTaxAdapter } from "./id_tax";
import { idCdhAdapter } from "./id_cdh";
import { idBoiseAdapter } from "./id_boise";
import { idMccallAdapter } from "./id_mccall";

const all: Adapter[] = [
  txTabcAdapter,
  caAbcAdapter,
  idIsldAdapter,
  idIspAbcAdapter,
  idTaxAdapter,
  idCdhAdapter,
  idBoiseAdapter,
  idMccallAdapter,
];

export const adapters = new Map<string, Adapter>(all.map((a) => [a.agencyCode, a]));

export function findAdapter(agencyCode: string | null | undefined): Adapter | null {
  if (!agencyCode) return null;
  return adapters.get(agencyCode) ?? null;
}
