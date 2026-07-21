"use client";

import { usePathname } from "next/navigation";

export default function WorkspaceLink() {
  const pathname = usePathname();
  if (pathname === "/workspace") return null;
  return (
    <a className="workspace-link" href="/workspace" aria-label="Open Browser Scan">
      Project workspace ↗
    </a>
  );
}
