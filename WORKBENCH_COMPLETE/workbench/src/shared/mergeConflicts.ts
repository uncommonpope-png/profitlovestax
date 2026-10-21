/**
 * Shared conflict-region model — used by GitLens (server) and IdeTab (client)
 * so the wire format for the 3-way merge resolver stays identical on both ends.
 */

export interface ConflictRegion {
  kind: "same" | "conflict";
  text?: string;          // kind=same
  ours?: string;          // kind=conflict
  theirs?: string;
}

/** Parse standard <<<<<<< ======= >>>>>>> markers into renderable regions. */
export function parseConflictRegions(text: string): ConflictRegion[] {
  const lines = text.split(/\r?\n/);
  const regions: ConflictRegion[] = [];
  let sameBuf: string[] = [];
  let i = 0;
  const flushSame = () => { if (sameBuf.length) { regions.push({ kind: "same", text: sameBuf.join("\n") }); sameBuf = []; } };
  while (i < lines.length) {
    if (/^<{7}( |$)/.test(lines[i])) {
      flushSame();
      const oursLines: string[] = [];
      i++;
      while (i < lines.length && !/^={7}$/.test(lines[i])) { oursLines.push(lines[i]); i++; }
      const theirsLines: string[] = [];
      i++; // skip =======
      while (i < lines.length && !/^>{7}( |$)/.test(lines[i])) { theirsLines.push(lines[i]); i++; }
      i++; // skip >>>>>>>
      regions.push({ kind: "conflict", ours: oursLines.join("\n"), theirs: theirsLines.join("\n") });
    } else {
      sameBuf.push(lines[i]);
      i++;
    }
  }
  flushSame();
  return regions;
}

/** Apply per-conflict choices ("ours"|"theirs"|"both") back onto parsed regions. */
export function applyResolutions(regions: ConflictRegion[], choices: Array<"ours" | "theirs" | "both">): string {
  let ci = 0;
  const outLines: string[] = [];
  for (const r of regions) {
    if (r.kind === "same") { outLines.push(r.text || ""); continue; }
    const choice = choices[ci] || "both";
    ci++;
    if (choice === "ours") outLines.push(r.ours || "");
    else if (choice === "theirs") outLines.push(r.theirs || "");
    else outLines.push(`${r.ours || ""}\n${r.theirs || ""}`);
  }
  return outLines.join("\n");
}
