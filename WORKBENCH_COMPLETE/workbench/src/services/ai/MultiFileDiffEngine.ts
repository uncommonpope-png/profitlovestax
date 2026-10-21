export interface FilePatch {
  filePath: string;
  originalContent: string;
  suggestedContent: string;
  status: "pending" | "accepted" | "rejected";
}

export class MultiFileDiffEngine {
  private activePatches: Map<string, FilePatch> = new Map();

  public registerPatch(filePath: string, original: string, suggested: string): void {
    this.activePatches.set(filePath, {
      filePath,
      originalContent: original,
      suggestedContent: suggested,
      status: "pending",
    });
  }

  public async applyPatch(filePath: string): Promise<boolean> {
    const patch = this.activePatches.get(filePath);
    if (!patch || patch.status !== "pending") return false;

    const res = await fetch("/api/ide/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, content: patch.suggestedContent }),
    });

    const ok = (await res.json()).success;
    if (ok) patch.status = "accepted";
    return ok;
  }

  public rejectPatch(filePath: string): void {
    const patch = this.activePatches.get(filePath);
    if (patch) patch.status = "rejected";
  }

  public getPendingPatches(): FilePatch[] {
    return Array.from(this.activePatches.values()).filter((p) => p.status === "pending");
  }

  public clear(): void {
    this.activePatches.clear();
  }
}
