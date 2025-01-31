let oddPdfBytes, evenPdfBytes;

// Dropzone configuration
Dropzone.options.upload = {
  url: "/",
  maxFiles: 1,
  acceptedFiles: ".pdf",
  clickable: true,
  autoProcessQueue: false,

  init: function () {
    this.on("addedfile", async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      document.querySelector("#clear-dropzone").classList.remove("hidden");
      const originalFileName = file.name.split(".").slice(0, -1).join(".");

      if (totalPages === 1) {
        const originalPdfBytes = await pdfDoc.save();
        download(originalPdfBytes, `${originalFileName}.pdf`);
        return;
      }

      if (totalPages % 2 !== 0) {
        const lastPage = pdfDoc.getPage(totalPages - 1);
        const { width, height } = lastPage.getSize();
        pdfDoc.addPage([width, height]);
      }

      const oddPdf = await PDFLib.PDFDocument.create();
      for (let i = 0; i < totalPages; i += 2) {
        const [copiedPage] = await oddPdf.copyPages(pdfDoc, [i]);
        oddPdf.addPage(copiedPage);
      }
      oddPdfBytes = await oddPdf.save();
      document.getElementById("downloadOdd").classList.remove("hidden");

      const evenPdf = await PDFLib.PDFDocument.create();
      for (let i = totalPages; i >= 0; i -= 2) {
        const [copiedPage] = await evenPdf.copyPages(pdfDoc, [i]);
        evenPdf.addPage(copiedPage);
      }
      evenPdfBytes = await evenPdf.save();
      document.getElementById("downloadEven").classList.remove("hidden");

      document.getElementById(
        "downloadOdd"
      ).innerText = `${originalFileName}-part-1.pdf`;
      document.getElementById("downloadOdd").addEventListener("click", () => {
        download(oddPdfBytes, `${originalFileName}-part-1.pdf`);
      });

      document.getElementById(
        "downloadEven"
      ).innerText = `${originalFileName}-part-2.pdf`;
      document.getElementById("downloadEven").addEventListener("click", () => {
        download(evenPdfBytes, `${originalFileName}-part-2.pdf`);
      });
    });
  },
};

// Corrected event listener for the clear button
document
  .getElementById("clear-dropzone")
  .addEventListener("click", function () {
    Dropzone.forElement("#upload").removeAllFiles(true); // Clear the dropzone
    document.querySelectorAll(".download").forEach((e) => {
      e.classList.add("hidden");
    });
    document.getElementById("clear-dropzone").classList.add("hidden");
  });

function download(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
