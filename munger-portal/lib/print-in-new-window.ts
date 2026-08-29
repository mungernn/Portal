/**
 * Prints a specific element by opening it in a fresh, separate
 * browser window containing ONLY that element - nothing else. This
 * replaces an earlier approach of hiding everything else on the
 * current page via CSS (visibility/position tricks), which kept
 * producing blank pages before the actual content: that technique
 * depends on every ancestor and sibling correctly collapsing to zero
 * height, which is fragile on a page with deeply nested or varied
 * layout (headers, wrappers, min-height utility classes, etc.) and
 * didn't work reliably across attempts. A dedicated print window
 * sidesteps the problem entirely, since there is nothing else on the
 * page to accidentally include.
 *
 * Copies every stylesheet/style tag from the current document into
 * the new window so the printed output looks identical to what's
 * shown on screen.
 */
export function printElementInNewWindow(element: HTMLElement) {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow pop-ups for this site to print this document.");
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("\n");

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print</title>
    ${styles}
    <style>
      html, body { margin: 0; padding: 24px; background: #fff; }
      @media print {
        html, body { padding: 0; }
      }
    </style>
  </head>
  <body>${element.outerHTML}</body>
</html>`);
  printWindow.document.close();

  // Give the copied stylesheets a moment to actually load before
  // printing - printing immediately can produce an unstyled page.
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => printWindow.print(), 150);
  };
}
