import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExamplePdf, HomeScreen } from "@h2-fe/home";

// The route that owns the file handoff. It holds the busy flag for the
// example-generation moment and navigates with the file in tow; the screen
// itself stays dumb.
export default function HomeRoute() {
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);

  const openViewerWith = (file: File) => {
    navigate("/viewer", { state: { file } });
  };

  const onUseExample = async () => {
    setIsBusy(true);
    try {
      openViewerWith(await createExamplePdf());
    } finally {
      setIsBusy(false);
    }
  };

  return <HomeScreen isBusy={isBusy} onFileChosen={openViewerWith} onUseExample={onUseExample} />;
}
