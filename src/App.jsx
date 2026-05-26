import ImportMenu from "./components/ImportMenu";
import ImportInventory from "./components/ImportInventory";
import InventoryManager from "./components/InventoryManager";
import POSScreen from "./components/POSScreen";
import SalesReport from "./components/SalesReport";
import Settings from "./components/Settings";
import FirstRunSetup from "./components/FirstRunSetup";
import { useState, useEffect } from "react";
//import getSetting function from settingsDb.js
import { getSetting } from "./db/settingsDb";
//import seedData functions from seedData.js
import { seedDemoData, resetDemoData } from "./db/seedData";

export default function App() {
  //state for navigation
  const [activeView, setActiveView] = useState("pos");
  //state for current restaurant name
  const [storeName, setStoreName] = useState("Resto Name");
  //state if the POS is in demo mode
  const [demoMode, setDemoMode] = useState(false);
  //state to check if seeding data completes. Only applicable in Demo Mode
  const [isDbReady, setIsDbReady] = useState(false);
  //state to check if this is the first installation of the system in the local machine
  //it sets initially to null because it's still checking
  const [isFirstRun, setIsFirstRun] = useState(null);

  //view object to render based on active view
  const views = {
    pos: (
      <POSScreen
        demoMode={demoMode}
        onResetDemo={() => {
          resetDemoData().then(() => setDemoMode(true));
        }}
        isDbReady={isDbReady}
      />
    ),
    report: <SalesReport />,
    inventory: <InventoryManager />,
    importMenu: <ImportMenu />,
    importInventory: <ImportInventory />,
    settings: (
      <Settings
        storeName={storeName}
        setStoreName={setStoreName}
        demoMode={demoMode}
        setDemoMode={setDemoMode}
      />
    ),
  };

  //effects
  //gets the store name from the Settings
  //used .then instead of async/await for cleaner code (cannot mark callback as async in this case)
  //also lets POSScreen.jsx know if the demo data has been seeded before it renders
  //to avoid showing blank data on the initial render during Demo Mode
  useEffect(() => {
    getSetting("installationDate").then((date) => {
      if (!date) {
        setIsFirstRun(true);
      } else {
        setIsFirstRun(false);
        getSetting("demo_mode").then((val) => {
          const isDemo = val === true;
          setDemoMode(isDemo);
          if (isDemo) {
            seedDemoData().then(() => setIsDbReady(true));
          } else {
            setIsDbReady(true);
          }
        });
      }
      getSetting("storeName").then((name) => setStoreName(name));
    });
  }, []);

  //if it's still checking if it's the first run, show loading message
  if (isFirstRun === null) return <div className="app-layout">Loading...</div>;
  if (isFirstRun)
    return (
      <FirstRunSetup
        onComplete={() => {
          setIsFirstRun(false);
          setIsDbReady(true);
          getSetting("demo_mode").then((val) => setDemoMode(val === true));
        }}
      />
    );

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <h2>{storeName}</h2>
        <button
          className={activeView === "pos" ? "active" : ""}
          onClick={() => setActiveView("pos")}
        >
          POS
        </button>
        <button
          className={activeView === "report" ? "active" : ""}
          onClick={() => setActiveView("report")}
        >
          Sales Report
        </button>
        <button
          className={activeView === "inventory" ? "active" : ""}
          onClick={() => setActiveView("inventory")}
        >
          Inventory
        </button>
        <button
          className={activeView === "importMenu" ? "active" : ""}
          onClick={() => setActiveView("importMenu")}
        >
          Import Menu
        </button>
        <button
          className={activeView === "importInventory" ? "active" : ""}
          onClick={() => setActiveView("importInventory")}
        >
          Import Inventory
        </button>
        <button
          className={activeView === "settings" ? "active" : ""}
          onClick={() => setActiveView("settings")}
        >
          Settings
        </button>
      </aside>
      <main className="main-content">{views[activeView]}</main>
    </div>
  );
}
