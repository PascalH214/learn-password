import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function exportSharesPdf({
  shares,
  threshold,
  totalShares,
  includeMeta = false,
  blockTitle = "",
  fileName = "password-shares.pdf",
}) {
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new Error("No shares available to export.");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 8;
  const marginTop = 8;
  const marginBottom = 8;
  const cols = 2;
  const gutterX = 3;
  const gutterY = 3;
  const minBlockHeight = includeMeta ? 36 : 30;

  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = pageHeight - marginTop - marginBottom;
  const dynamicRowsPerPage = Math.max(
    1,
    Math.floor((contentHeight + gutterY) / (minBlockHeight + gutterY))
  );
  const blocksPerPage = cols * dynamicRowsPerPage;
  const blockWidth = (contentWidth - gutterX * (cols - 1)) / cols;
  const blockHeight = (contentHeight - gutterY * (dynamicRowsPerPage - 1)) / dynamicRowsPerPage;

  const qrDataUrls = await Promise.all(
    shares.map((share) =>
      QRCode.toDataURL(share, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 400,
      })
    )
  );

  const normalizedBlockTitle = typeof blockTitle === "string" ? blockTitle.trim() : "";

  for (let pageStartIndex = 0; pageStartIndex < shares.length; pageStartIndex += blocksPerPage) {
    if (pageStartIndex > 0) {
      pdf.addPage();
    }

    const sharesRemaining = shares.length - pageStartIndex;
    const sharesOnPage = Math.min(sharesRemaining, blocksPerPage);

    for (let pageShareIndex = 0; pageShareIndex < sharesOnPage; pageShareIndex += 1) {
      const index = pageStartIndex + pageShareIndex;
      const row = Math.floor(pageShareIndex / cols);
      const col = pageShareIndex % cols;

      const x = marginX + col * (blockWidth + gutterX);
      const y = marginTop + row * (blockHeight + gutterY);

      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.35);
      pdf.rect(x, y, blockWidth, blockHeight);

      const innerPad = 2.5;
      const titleY = y + innerPad + 1.5;
      const shareLabel = `Secret Sharing Share`;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(shareLabel, x + innerPad, titleY);

      if (normalizedBlockTitle) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.2);

        const availableWidth =
          blockWidth - innerPad * 2 - pdf.getTextWidth(shareLabel) - 2;

        if (availableWidth > 8) {
          let fittedTitle = normalizedBlockTitle;
          while (pdf.getTextWidth(fittedTitle) > availableWidth && fittedTitle.length > 1) {
            fittedTitle = `${fittedTitle.slice(0, -1)}…`;
          }

          pdf.text(fittedTitle, x + blockWidth - innerPad, titleY, {
            align: "right",
          });
        }
      }

      let headerCursorY = titleY + 3.1;

      const qrY = headerCursorY + 0.8;

      const maxQrByHeight = blockHeight - (qrY - y) - innerPad;
      const qrSize = Math.min(blockWidth * 0.34, Math.max(8, maxQrByHeight));
      const qrX = x + innerPad;
      const qrBottomY = qrY + qrSize;

      pdf.addImage(qrDataUrls[index], "PNG", qrX, qrY, qrSize, qrSize);

      const textX = qrX + qrSize + 2.5;
      const textY = qrY + 2;
      const textWidth = blockWidth - (textX - x) - innerPad;

      const metaY = qrBottomY - 0.8;
      const textBottomLimit = includeMeta ? metaY - 1.4 : blockHeight + y - innerPad;

      pdf.setFont("courier", "normal");
      pdf.setFontSize(6.3);
      const shareLines = pdf.splitTextToSize(shares[index], textWidth);

      const maxLines = Math.floor((textBottomLimit - textY) / 2.6);
      const visibleLines = shareLines.slice(0, Math.max(maxLines, 1));

      pdf.text(visibleLines, textX, textY, { lineHeightFactor: 1.2 });

      if (includeMeta) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text(`Total: ${totalShares}   Threshold: ${threshold}`, textX, metaY);
      }
    }
  }

  pdf.save(fileName);
}
