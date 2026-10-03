import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Center, Spinner } from "@h2-fe/ui";
import HomeRoute from "./routes/home-route";

// The route table is the whole app: home first, the document canvas lazily so
// tldraw, pdfjs and its css leave the initial bundle. Each route wrapper owns
// its redirect and fallback semantics; this file owns only the table and the
// chunk boundary.
const PdfViewerRoute = lazy(() => import("./routes/pdf-viewer-route"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/viewer"
        element={
          <Suspense
            fallback={
              <Center minH="100dvh">
                <Spinner size="xl" />
              </Center>
            }
          >
            <PdfViewerRoute />
          </Suspense>
        }
      />
    </Routes>
  );
}
