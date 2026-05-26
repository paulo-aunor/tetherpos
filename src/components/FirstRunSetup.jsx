//renders the screen for the first time the app is run. After setup, it will set a setting to indicate that the first run setup has been completed so it won't show again
import { useState } from "react";
import { setSetting } from "../db/settingsDb";
import { seedDemoData } from "../db/seedData";

export default function FirstRunSetup({ onComplete }) {
  //handler functions
  //handles if user selects to seed demo data. It will set the demo_mode setting to true and seed the demo data, then call onComplete callback to proceed to the app
  const handleDemoMode = async () => {
    await setSetting("demo_mode", true);
    await seedDemoData();
    await setSetting("installationDate", new Date().toISOString());
    onComplete();
  };

  //handles if user selects to start with empty data. It will set the demo_mode setting to false, then call onComplete callback to proceed to the app
  const handleFreshStart = async () => {
    await setSetting("demo_mode", false);
    await setSetting("installationDate", new Date().toISOString());
    onComplete();
  };

  return (
    <div className="first-run-setup-wrapper">
      <h1>Welcome To TetherPOS!</h1>
      <h3>How would you like to start?</h3>
      <div className="demo-mode-wrapper">
        <button className="demo-mode-btn" onClick={handleDemoMode}>
          Load Demo Data
        </button>
        <p>Sample data for demonstration purposes</p>
      </div>
      <div className="fresh-start-wrapper">
        <button className="fresh-start-btn" onClick={handleFreshStart}>
          Fresh Start
        </button>
        <p>Fresh Start (empty data)</p>
      </div>
    </div>
  );
}
