# Amazon "About you" cleaner

Amazon keeps an **About you** page listing details it has inferred about you, such as where you live, your hobbies, and the brands you like. It uses them to personalize recommendations and ads. You can remove these one at a time, but each one takes several clicks. This userscript removes all of them for you.

Page: https://www.amazon.com/slc/hub?useAiMode=1

## Install (Tampermonkey)

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser (Chrome, Firefox, Edge, Safari).
2. **Chrome / Edge only:** turn on userscripts. Go to `chrome://extensions` (or `edge://extensions`) and either turn on **Developer mode** or open Tampermonkey's **Details** and enable **Allow User Scripts**. Without this, Tampermonkey can't run scripts.
3. Click the Tampermonkey icon in the toolbar, then **Create a new script…**
4. Delete the template text in the editor.
5. Paste in the full contents of [`amazon-about-you-cleaner.user.js`](amazon-about-you-cleaner.user.js).
6. Press **Ctrl+S** (**Cmd+S** on Mac) to save.

## Use

1. Sign in to Amazon and open the [About you page](https://www.amazon.com/slc/hub?useAiMode=1). Reload it if it was already open.
2. A small panel with a **Remove all** button appears in the bottom-right corner.
3. Click **Remove all** and confirm.
4. Leave the tab open while it works. It removes one item about every 2–3 seconds, so 100 items take around 4–5 minutes. The panel shows progress.
5. Click **Stop** at any time to pause. Click **Remove all** again to resume.

When it finishes, the panel shows how many items were removed. If an item couldn't be removed, the script skips it. To see which ones, open the browser console (F12 → Console) and look for `[About-you cleaner]` messages.

## Notes

- **Removals can't be undone.**
- The script only runs on `amazon.com/slc/hub`. For another Amazon country site, add a matching `// @match` line at the top of the script, for example `// @match https://www.amazon.co.uk/slc/hub*`.
- Amazon keeps learning from your activity, so new items may show up later. Run the script again whenever you like.
- The script clicks the page's own buttons, just like you would. If Amazon redesigns the page, the script may stop working until it's updated.
