import { useState } from "react";
import { useFeatureFlags } from "../../context/FeatureFlagContext";
import { EXPERIENCE_FLAG } from "../../config/pwaExperience";
import ChurchBranding from "../ChurchBranding";
import PwaExperienceEditor from "./PwaExperienceEditor";
export default function PwaCustomization({
  selectedOrganization,
  selectedCampusId,
}: {
  selectedOrganization: any;
  selectedCampusId: string;
}) {
  const { isFeatureEnabled } = useFeatureFlags();
  const [tab, setTab] = useState("experience");
  if (!isFeatureEnabled(EXPERIENCE_FLAG, false))
    return <ChurchBranding selectedOrganization={selectedOrganization} />;
  return (
    <>
      <nav className="pe-tabs" aria-label="Marca e experiência">
        <button
          className={tab === "experience" ? "active" : ""}
          onClick={() => setTab("experience")}
        >
          Personalizar PWA
        </button>
        <button
          className={tab === "identity" ? "active" : ""}
          onClick={() => setTab("identity")}
        >
          Identidade e contatos
        </button>
      </nav>
      <div style={{ display: tab === "experience" ? "block" : "none" }}>
        <PwaExperienceEditor
          organizationId={selectedOrganization.id}
          initialCampus={selectedCampusId}
        />
      </div>
      <div style={{ display: tab === "identity" ? "block" : "none" }}>
        <ChurchBranding selectedOrganization={selectedOrganization} />
      </div>
    </>
  );
}
