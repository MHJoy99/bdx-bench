"use client";

/**
 * NotEnoughData — neutral honest fallback shared by every chart.
 * Always links to the sibling data table so the measured values stay
 * one click away. No invented values, no status branding.
 */

import React from "react";

export interface NotEnoughDataProps {
  /** Anchor id of the sibling data table <details> (ChartShell tableId). */
  tableId?: string;
  /** What is missing (e.g. "price", "speed", "trend history"). */
  what?: string;
}

export function NotEnoughData({ tableId, what }: NotEnoughDataProps) {
  return (
    <div className="bdx-state" role="status">
      <p>
        <strong>Not enough measured data yet.</strong>
        {what ? (
          <>
            <br />
            <span>No measured {what} for these models.</span>
          </>
        ) : null}
      </p>
      {tableId ? (
        <p style={{ margin: 0 }}>
          <a className="bdx-btn" href={`#${tableId}`} style={{ textDecoration: "none" }}>
            View data table
          </a>
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 12 }}>See the data table below.</p>
      )}
    </div>
  );
}
