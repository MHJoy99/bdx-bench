"use client";

import { useState } from "react";
import { SearchCommand, useCmdK } from "@/components/search-command";
import { SiteNav } from "@/components/site-nav";

/** Binds CmdK + renders nav + palette mount. Used by layout (client boundary). */
export function SiteNavWithSearch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SearchCommandHostInner onOpen={() => setOpen(true)} />
      <SiteNav onSearch={() => setOpen(true)} />
      <SearchCommand open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SearchCommandHostInner({ onOpen }: { onOpen: () => void }) {
  useCmdK(onOpen);
  return null;
}

/** Back-compat host (no-op; palette lives in SiteNavWithSearch). */
export function SearchCommandHost() {
  return null;
}
