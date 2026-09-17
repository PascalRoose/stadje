"use client";

import { Component, type ReactNode } from "react";

interface ConsentBannerBoundaryState {
  hasError: boolean;
}

/**
 * Cookie-banner-blocking browser extensions (e.g. "I still don't care about cookies") remove the
 * banner's DOM nodes directly, outside React's control. When React next reconciles that subtree
 * it can throw (a well-known class of bug where extensions and React's commit phase conflict —
 * see facebook/react#11538), and with no boundary that crash takes down the whole app, freezing
 * every click handler on the page. Scoping the boundary to just the banner means a crash here
 * only drops the banner — the same visible outcome as declining (FR-017's game-unaffected
 * guarantee) — instead of soft-locking the whole game.
 */
export class ConsentBannerBoundary extends Component<
  { children: ReactNode },
  ConsentBannerBoundaryState
> {
  state: ConsentBannerBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
