export type QRKind = "machine" | "user";

export type QRPayload = {
  kind: QRKind;
  id: string;
  assetTag?: string;
  label?: string;
  timestamp: string;
};

const QR_PREFIX = "SMI_QR";

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createQRPayload(payload: QRPayload) {
  return `${QR_PREFIX}:${toBase64Url(JSON.stringify(payload))}`;
}

export function parseQRPayload(value: string): QRPayload | null {
  if (!value.startsWith(`${QR_PREFIX}:`)) {
    return null;
  }

  try {
    const encoded = value.slice(QR_PREFIX.length + 1);
    const parsed = JSON.parse(fromBase64Url(encoded)) as QRPayload;

    if (!parsed?.kind || !parsed?.id || !parsed?.timestamp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isValidQRPayload(value: string) {
  return parseQRPayload(value) !== null;
}

export function buildMachineQRPayload(input: {
  machineId: string;
  assetTag: string;
  label: string;
}) {
  return createQRPayload({
    kind: "machine",
    id: input.machineId,
    assetTag: input.assetTag,
    label: input.label,
    timestamp: new Date().toISOString(),
  });
}

export function getQRCodeFileName(prefix: string) {
  return `${prefix}-${Date.now()}.png`;
}