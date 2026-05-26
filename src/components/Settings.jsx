//screen to capture and setup settings
import { useState, useEffect } from "react";
import { getSetting, setSettings } from "../db/settingsDb";
import { exitDemoMode, clearAllData } from "../db/seedData";

export default function Settings({
  storeName,
  setStoreName,
  demoMode,
  setDemoMode,
}) {
  //states
  const [diningTypes, setDiningTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newDiningType, setNewDiningType] = useState("");
  const [newPaymentMethodId, setNewPaymentMethodId] = useState("");
  const [newPaymentMethodLabel, setNewPaymentMethodLabel] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [taxRate, setTaxRate] = useState("");
  // const [storeName, setStoreName] = useState("");

  //effects
  //load settings function to get current settings
  const loadSettings = async () => {
    const [rate, methods, symbol, types] = await Promise.all([
      getSetting("taxRate"),
      getSetting("paymentMethods"),
      getSetting("currencySymbol"),
      getSetting("diningTypes"),
    ]);
    setTaxRate(rate * 100);
    setCurrencySymbol(symbol);
    setDiningTypes(types);
    setPaymentMethods(methods);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  //handlers
  //handles adding of dining types
  const handleAddDiningType = () => {
    //if diningType is blank, return nothing
    if (!newDiningType.trim()) return;
    setDiningTypes([...diningTypes, newDiningType.trim()]);
    setNewDiningType("");
  };

  //handles adding of payment methods
  const handleAddPaymentMethod = () => {
    //if paymentMethodId or paymentMethodLabel are blank, return nothing
    if (!newPaymentMethodId.trim() || !newPaymentMethodLabel.trim()) return;
    setPaymentMethods([
      ...paymentMethods,
      { id: newPaymentMethodId.trim(), label: newPaymentMethodLabel.trim() },
    ]);
    setNewPaymentMethodId("");
    setNewPaymentMethodLabel("");
  };

  //handles removal of dining type
  const handleRemoveDiningType = (type) => {
    setDiningTypes((prevDiningTypes) =>
      prevDiningTypes.filter((c) => c !== type),
    );
  };

  //handles removal of payment methods
  const handleRemovePaymentMethod = (id) => {
    setPaymentMethods((prevPaymentMethod) =>
      prevPaymentMethod.filter((c) => c.id !== id),
    );
  };

  //handles saving of settings
  const handleSaveSettings = async () => {
    await setSettings({
      taxRate: taxRate / 100,
      currencySymbol,
      diningTypes,
      paymentMethods,
      //storeName,
    });
  };

  //handles exiting of demo mode
  const handleExitDemoMode = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to Exit Demo Mode? This will clear everything and set the POS to LIVE and cannot be undone!",
    );
    if (!confirmed) return;
    await exitDemoMode();
    setDemoMode(false);
  };

  //handles clearing of data for fresh installations
  const handleStartFromScratch = async () => {
    const confirmed = window.confirm(
      "Start from Scratch? This will clear ALL data! Settings will be kept.",
    );
    if (!confirmed) return;
    await clearAllData();
  };

  //render
  return (
    <div className="settings">
      <h2>Settings</h2>

      {/* Store Name*/}
      <div className="settings-section">
        <h3>Store Name</h3>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="Enter Store Name Here"
        />
      </div>

      {/* Tax Rates */}
      <div className="settings-sections">
        <h3>Tax Rate</h3>
        <input
          type="text"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          placeholder="Enter Tax Rate (in Percentage)"
        />
      </div>

      {/* Dining Types */}
      <div className="settings-section">
        <h3>Dining Types</h3>
        {diningTypes.map((type) => (
          <div key={type}>
            <span>{type}</span>
            <button
              className="remove-btn"
              onClick={() => {
                handleRemoveDiningType(type);
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <input
          type="text"
          value={newDiningType}
          onChange={(e) => setNewDiningType(e.target.value)}
          placeholder="New dining type"
        />
        <button className="add-btn" onClick={handleAddDiningType}>
          Add
        </button>
      </div>

      {/* Payment Methods */}
      <div className="settings-section">
        <h3>Payment Methods</h3>
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <span>{method.label}</span>
            <button
              className="remove-btn"
              onClick={() => {
                handleRemovePaymentMethod(method.id);
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <input
          type="text"
          value={newPaymentMethodId}
          onChange={(e) => setNewPaymentMethodId(e.target.value)}
          placeholder="Payment method ID (e.g. gcash)"
        />
        <input
          type="text"
          value={newPaymentMethodLabel}
          onChange={(e) => setNewPaymentMethodLabel(e.target.value)}
          placeholder="Payment method label (e.g. GCash)"
        />
        <button className="add-btn" onClick={handleAddPaymentMethod}>
          Add
        </button>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h3>Data Management</h3>
        {demoMode && (
          <div>
            <button className="danger-btn" onClick={handleExitDemoMode}>
              Exit Demo Mode
            </button>
            <p>Clears all demo data and marks your go-live date.</p>
          </div>
        )}
        <div>
          <button className="danger-btn" onClick={handleStartFromScratch}>
            Start from Scratch
          </button>
          <p>
            Clears all menu items, inventory, and transactions. Settings are
            kept.
          </p>
        </div>
      </div>

      <button className="save-settings-btn" onClick={handleSaveSettings}>
        Save Settings
      </button>
    </div>
  );
}
