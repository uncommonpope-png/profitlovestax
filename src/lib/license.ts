import crypto from "crypto";
import fs from "fs";
import path from "path";

const LICENSE_FILE = path.join(process.cwd(), ".vault", "licenses.json");

interface License {
  key: string;
  email: string;
  orderId: string;
  createdAt: string;
  active: boolean;
}

function loadLicenses(): License[] {
  if (!fs.existsSync(LICENSE_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LICENSE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveLicenses(licenses: License[]): void {
  const vaultDir = path.join(process.cwd(), ".vault");
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenses, null, 2));
}

export function generateLicenseKey(): string {
  const segments = ["BUY", "SOUL"];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return segments.join("-");
}

export function createLicense(email: string, orderId: string): License {
  const licenses = loadLicenses();

  const existing = licenses.find(
    (l) => l.email === email && l.orderId === orderId
  );
  if (existing) {
    return existing;
  }

  const license: License = {
    key: generateLicenseKey(),
    email,
    orderId,
    createdAt: new Date().toISOString(),
    active: true,
  };

  licenses.push(license);
  saveLicenses(licenses);

  return license;
}

export function validateLicense(key: string): {
  valid: boolean;
  license?: License;
  error?: string;
} {
  if (!key || !key.startsWith("BUY-SOUL-")) {
    return { valid: false, error: "Invalid license key format." };
  }

  const licenses = loadLicenses();
  const license = licenses.find((l) => l.key === key);

  if (!license) {
    return { valid: false, error: "License key not found." };
  }

  if (!license.active) {
    return { valid: false, error: "License key has been deactivated." };
  }

  return { valid: true, license };
}

export function deactivateLicense(key: string): boolean {
  const licenses = loadLicenses();
  const license = licenses.find((l) => l.key === key);

  if (!license) {
    return false;
  }

  license.active = false;
  saveLicenses(licenses);
  return true;
}

export function listLicenses(): License[] {
  return loadLicenses();
}
