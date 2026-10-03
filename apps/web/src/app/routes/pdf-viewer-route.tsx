import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PdfViewerScreen, usePdfPages } from "@h2-fe/pdf-viewer";
import type { PdfDocumentSummary } from "@h2-fe/pdf-viewer";

// The route that owns the document: it reads the file home handed off through
// the navigation state, rasterises it through the lib's query hook, and
// populates the screen. A deep link or refresh with no handoff redirects home
// rather than showing a half-canvas.
export default function PdfViewerRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const file = (location.state as { file?: File } | null)?.file ?? null;
  const result = usePdfPages(file);
  const document = result.data;
  const activeDocument = useRef<PdfDocumentSummary | null>(null);

  // Hooks before branching; the early return below is presentation-only.
  const onOpenAnother = useCallback(() => navigate("/", { replace: true }), [navigate]);
  useEffect(() => {
    activeDocument.current = document ?? null;
    if (!document) return;
    return () => {
      activeDocument.current = null;
      queueMicrotask(() => {
        if (activeDocument.current !== document) void document.destroy();
      });
    };
  }, [document]);
  useEffect(() => {
    if (!file) navigate("/", { replace: true });
  }, [file, navigate]);

  if (!file) return null;

  return (
    <PdfViewerScreen
      isLoading={result.isLoading}
      isError={result.isError}
      onOpenAnother={onOpenAnother}
      onRetry={() => {
        void result.refetch();
      }}
      document={document}
    />
  );
}
