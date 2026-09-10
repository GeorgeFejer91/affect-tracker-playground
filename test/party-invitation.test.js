import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  FLUBBER_PARTY_GUEST_PARAMETER,
  FLUBBER_PARTY_GUEST_URL,
  FLUBBER_PARTY_GUEST_VALUE,
  flubberPartyGuestInvitationRequested,
} from "../site/src/party-invitation.js";
import { createQrMatrix, renderQrCode } from "../site/src/remote-study/qr-code.js";

const SITE_ROOT = new URL("../site/", import.meta.url);

test("the party QR targets the canonical public GitHub Pages guest route", () => {
  const invitation = new URL(FLUBBER_PARTY_GUEST_URL);
  assert.equal(invitation.origin, "https://georgefejer91.github.io");
  assert.equal(invitation.pathname, "/affect-tracker-playground/");
  assert.equal(invitation.searchParams.get(FLUBBER_PARTY_GUEST_PARAMETER), FLUBBER_PARTY_GUEST_VALUE);
  assert.equal(new TextEncoder().encode(FLUBBER_PARTY_GUEST_URL).byteLength <= 154, true);
  const matrix = createQrMatrix(FLUBBER_PARTY_GUEST_URL);
  assert.equal(matrix.length, 45);
  assert.equal(matrix.every((row) => row.length === 45), true);
});

test("party guest mode is opt-in and recognizes local preview URLs", () => {
  assert.equal(flubberPartyGuestInvitationRequested("?party=join"), true);
  assert.equal(flubberPartyGuestInvitationRequested("http://localhost:8000/?party=join"), true);
  assert.equal(flubberPartyGuestInvitationRequested(new URLSearchParams("party=join")), true);
  assert.equal(flubberPartyGuestInvitationRequested("?party=host"), false);
  assert.equal(flubberPartyGuestInvitationRequested(""), false);
});

test("the shared QR renderer accepts a purpose-specific accessible label", () => {
  const nodes = [];
  const document = {
    createElementNS(_namespace, tagName) {
      const node = {
        tagName,
        attributes: new Map(),
        children: [],
        setAttribute(name, value) { this.attributes.set(name, value); },
        append(child) { this.children.push(child); },
      };
      nodes.push(node);
      return node;
    },
  };
  const host = { replaceChildren(node) { this.child = node; } };
  const svg = renderQrCode(host, FLUBBER_PARTY_GUEST_URL, {
    document,
    ariaLabel: "QR code for a FLUBBER party",
  });
  assert.equal(host.child, svg);
  assert.equal(svg.attributes.get("aria-label"), "QR code for a FLUBBER party");
  assert.equal(svg.children.length, 2);
  assert.equal(nodes.length, 3);
});

test("Ground Control exposes QR display and guest naming without auto-joining", async () => {
  const [index, app, styles] = await Promise.all([
    readFile(new URL("index.html", SITE_ROOT), "utf8"),
    readFile(new URL("src/app.js", SITE_ROOT), "utf8"),
    readFile(new URL("styles.css", SITE_ROOT), "utf8"),
  ]);
  const groundPanel = index.slice(index.indexOf('<section id="ground-control-panel"'), index.indexOf('<section id="experiment-layer"'));
  assert.match(groundPanel, /id="ground-party-qr-button"/);
  assert.match(groundPanel, /<strong>Display party QR<\/strong>/);
  assert.match(index, /id="ground-party-qr-dialog"/);
  assert.match(index, /id="party-guest-form"/);
  assert.match(index, /id="party-guest-name"[^>]+maxlength="64"[^>]+required/);
  assert.match(index, /Nothing is broadcast until you press Join\./);
  assert.match(index, /The host must explicitly invite you/);
  assert.match(app, /groundPartyQrButton\.addEventListener\("click", openGroundPartyQr\)/);
  assert.match(app, /partyGuestForm\.addEventListener\("submit", async \(event\) =>/);
  assert.match(app, /const started = await startLiveFlubberBroadcast\(sourceName\)/);
  assert.match(app, /if \(changedParty\) \{\s+showPartyGuestController\(\)/);
  assert.match(app, /setAccordionProtocolOpen\(state, "settings", true\)/);
  assert.match(app, /Choose a Party character, then move it and the 2D affect grid while the party host invites you/);
  const promptFunction = app.slice(app.indexOf("function openPartyGuestInvitation()"), app.indexOf("function updatePictureInPictureSupport()"));
  assert.doesNotMatch(promptFunction, /flubberBroadcaster\.start|startLiveFlubberBroadcast/);
  assert.match(styles, /\.ground-party-qr-code svg/);
});
