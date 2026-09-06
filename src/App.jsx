import { useState } from "react";

import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import NewInspectionScreen from "./screens/NewInspectionScreen";
import UploadScreen from "./screens/UploadScreen";
import ScanScreen from "./screens/ScanScreen";
import ReviewScreen from "./screens/ReviewScreen";
import FindingsScreen from "./screens/FindingsScreen";
import ReportScreen from "./screens/ReportScreen";
import InspectionHistoryScreen from "./screens/InspectionHistoryScreen";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [officerName, setOfficerName] = useState("");
  const [currentScreen, setCurrentScreen] = useState("dashboard");

  const [productInfo, setProductInfo] = useState({});
  const [uploadedImages, setUploadedImages] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [declarationRows, setDeclarationRows] = useState([]);
  const [findings, setFindings] = useState([]);
  const [ocrCompletedAt, setOcrCompletedAt] = useState(null);
  const [findingsReviewedAt, setFindingsReviewedAt] = useState(null);

  const handleLogin = (id) => {
    setOfficerName(id);
    setIsLoggedIn(true);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setOfficerName("");
    setCurrentScreen("dashboard");
  };

  const startNewInspection = () => {
    setProductInfo({});
    setUploadedImages({});
    setAnalysisResult(null);
    setDeclarationRows([]);
    setFindings([]);
    setOcrCompletedAt(null);
    setFindingsReviewedAt(null);
    setCurrentScreen("new-inspection");
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === "new-inspection") {
    return (
      <NewInspectionScreen
        onBack={() => setCurrentScreen("dashboard")}
        onContinue={(info) => {
          setProductInfo(info);
          setCurrentScreen("upload");
        }}
      />
    );
  }

  if (currentScreen === "upload") {
    return (
      <UploadScreen
        onBack={() => setCurrentScreen("new-inspection")}
        onContinue={(images) => {
          setUploadedImages(images);
          setCurrentScreen("scan");
        }}
      />
    );
  }

  if (currentScreen === "scan") {
    return (
      <ScanScreen
        images={uploadedImages}
        onBack={() => setCurrentScreen("upload")}
        onContinue={(result) => {
          setAnalysisResult(result);
          setOcrCompletedAt(result?.ocrCompletedAt || null);
          setCurrentScreen("review");
        }}
      />
    );
  }

  if (currentScreen === "review") {
    return (
      <ReviewScreen
        analysis={analysisResult}
        productInfo={productInfo}
        officerName={officerName}
        onBack={() => setCurrentScreen("scan")}
        onContinue={(rows) => {
          if (!productInfo?.isExempt && (!rows || rows.length === 0)) {
            alert(
              "Something went wrong — no declaration data was received. Please go back and try again."
            );
            return;
          }
          setDeclarationRows(rows);
          setCurrentScreen("findings");
        }}
      />
    );
  }

  if (currentScreen === "findings") {
    return (
      <FindingsScreen
        declarationRows={declarationRows}
        onBack={() => setCurrentScreen("review")}
        onContinue={(finalFindings, reviewedAt) => {
          setFindings(finalFindings);
          setFindingsReviewedAt(reviewedAt);
          setCurrentScreen("report");
        }}
      />
    );
  }

  if (currentScreen === "report") {
    return (
      <ReportScreen
        images={uploadedImages}
        productInfo={productInfo}
        declarationRows={declarationRows}
        findings={findings}
        officerName={officerName}
        ocrCompletedAt={ocrCompletedAt}
        findingsReviewedAt={findingsReviewedAt}
        onBack={() => setCurrentScreen("findings")}
        onDashboard={() => setCurrentScreen("dashboard")}
      />
    );
  }

  if (currentScreen === "inspection-history") {
    return (
      <InspectionHistoryScreen
        onBack={() => setCurrentScreen("dashboard")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <DashboardScreen
      onLogout={handleLogout}
      onNewInspection={startNewInspection}
      onViewHistory={() => setCurrentScreen("inspection-history")}
    />
  );
}

export default App;