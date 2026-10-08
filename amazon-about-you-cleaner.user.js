// ==UserScript==
// @name         Amazon "About you" cleaner
// @namespace    removeamazon
// @version      1.1
// @description  Removes every item from Amazon's "About you" (personalization memory) page.
// @match        https://www.amazon.com/slc/hub*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const ROW = '.memory-item-container';
  const DELAY_BETWEEN_MS = 1500; // be gentle; Amazon may throttle fast requests
  const TIMEOUT_MS = 10000;

  let running = false;
  const skipped = new Set(); // rows that would not go away, so we don't loop on them

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => !!el && el.getClientRects().length > 0;
  const label = (row) => row.getAttribute('aria-label') || row.textContent.trim();

  async function waitFor(fn, timeout = TIMEOUT_MS, interval = 150) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(interval);
    }
    return null;
  }

  function visibleButtons(re) {
    return [...document.querySelectorAll('.a-popover-modal button, [role="dialog"] button')]
      .filter((b) => visible(b) && re.test(b.textContent.trim()));
  }

  function nextRow() {
    return [...document.querySelectorAll(ROW)].find((r) => visible(r) && !skipped.has(label(r)));
  }

  function closeModal() {
    const c = [...document.querySelectorAll('.a-popover-modal button.a-button-close')].find(visible);
    if (c) c.click();
  }

  async function removeOne(row) {
    const name = label(row);
    row.click();

    // Step 1: the edit view's "Remove" (has class "edit") switches the popover
    // to a confirmation view. Clicks made right as the popover opens are
    // ignored, so keep clicking until the confirmation view ("Back") shows up.
    const editRemove = () => visibleButtons(/^Remove$/).find((b) => b.classList.contains('edit'));
    const inConfirmView = () => visibleButtons(/^Back$/).length > 0;
    if (!(await waitFor(editRemove))) {
      console.warn('[About-you cleaner] No Remove button for:', name);
      closeModal();
      return false;
    }
    await sleep(500);
    const confirmShown = await waitFor(() => {
      if (inConfirmView()) return true;
      const b = editRemove();
      if (b) b.click();
      return false;
    }, TIMEOUT_MS, 400);
    if (!confirmShown) {
      console.warn('[About-you cleaner] Confirmation view never appeared for:', name);
      closeModal();
      return false;
    }

    // Step 2: click the confirmation view's "Remove" once, then wait for the row to go.
    const confirmBtn = visibleButtons(/^Remove$/).find((b) => !b.classList.contains('edit'));
    if (!confirmBtn) {
      console.warn('[About-you cleaner] No confirm button for:', name);
      closeModal();
      return false;
    }
    confirmBtn.click();
    const gone = await waitFor(
      () => ![...document.querySelectorAll(ROW)].some((r) => label(r) === name)
    );

    if (!gone) {
      console.warn('[About-you cleaner] Item did not disappear, skipping:', name);
      closeModal();
      return false;
    }
    // Make sure no modal is left open before the next item
    await waitFor(() => !visibleButtons(/^Remove$/).length, 3000);
    closeModal();
    return true;
  }

  async function run() {
    running = true;
    btn.textContent = 'Stop';
    let removed = 0;
    let row;
    while (running && (row = nextRow())) {
      status.textContent = `Removing… ${removed} done, ${document.querySelectorAll(ROW).length} left`;
      if (await removeOne(row)) removed++;
      else skipped.add(label(row));
      await sleep(DELAY_BETWEEN_MS);
    }
    running = false;
    btn.textContent = 'Remove all';
    status.textContent = `Finished: removed ${removed}` + (skipped.size ? `, skipped ${skipped.size} (see console)` : '');
  }

  // --- floating control panel ---
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#fff;border:1px solid #888;' +
    'border-radius:8px;padding:10px 12px;font:13px sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);';
  const btn = document.createElement('button');
  btn.textContent = 'Remove all';
  btn.style.cssText = 'padding:6px 12px;cursor:pointer;';
  const status = document.createElement('div');
  status.style.marginTop = '6px';
  status.textContent = 'About-you cleaner ready';
  panel.append(btn, status);
  document.body.appendChild(panel);

  btn.addEventListener('click', () => {
    if (running) {
      running = false;
      btn.textContent = 'Stopping…';
      return;
    }
    const n = document.querySelectorAll(ROW).length;
    if (!n) {
      status.textContent = 'No items found (page still loading?)';
      return;
    }
    if (confirm(`Remove all ${n} "About you" items? This cannot be undone.`)) run();
  });
})();
