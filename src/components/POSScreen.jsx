//main POS screen is used by staff to punch in sales orders
//leftside is the menu browser
//right side is the current order with a checkout button
import { useState, useEffect, useMemo } from "react";
import { getAllMenuItems, getCategories } from "../db/menuDb";
import { saveTransaction } from "../db/transactionDb";
import { getSetting } from "../db/settingsDb";

//component
export default function POSScreen({ demoMode, onResetDemo, isDbReady }) {
  //state
  //all menu items from the database
  const [menuItems, setMenuItems] = useState([]);
  //all unique category names
  const [categories, setCategories] = useState([]);
  //current search text typed by the cashier
  const [searchText, setSearchText] = useState("");
  //currently selected category filter — 'All' means no filter
  const [activeCategory, setActiveCategory] = useState("All");
  //cart items — array of {sku, name, price, quantity, itemTotal}
  const [cart, setCart] = useState([]);
  //which payment method is selected
  const [paymentMethod, setPaymentMethod] = useState("cash");
  //amount the customer handed over (cash only)
  const [amountTendered, setAmountTendered] = useState("");
  //discount amount — 0 for now
  const [discount, setDiscount] = useState(0);
  //controls whether the payment panel is showing
  const [showPayment, setShowPayment] = useState(false);
  //success message after a completed sale
  const [saleComplete, setSaleComplete] = useState(false);
  //error message
  const [error, setError] = useState(null);
  //added states for taxRate, paymentMethods, and currencySymbol
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState("₱");
  //added states for dining type and customer
  const [diningTypes, setDiningTypes] = useState([]);
  const [diningType, setDiningType] = useState("dine-in");
  const [customerName, setCustomerName] = useState("");

  //effects
  //load menu items and categories on component mount
  const loadMenuData = async () => {
    const [items, cats] = await Promise.all([
      getAllMenuItems(),
      getCategories(),
    ]);
    setMenuItems(items);
    setCategories(cats);
  };

  //load settings function calls getSetting for each setting
  const loadSettings = async () => {
    const [rate, methods, symbol, types] = await Promise.all([
      getSetting("taxRate"),
      getSetting("paymentMethods"),
      getSetting("currencySymbol"),
      getSetting("diningTypes"),
    ]);
    setTaxRate(rate);
    setPaymentMethods(methods);
    setCurrencySymbol(symbol);
    setDiningTypes(types);
    //for setting the default dining type
    setDiningType(types[0]);
  };

  useEffect(() => {
    if (!isDbReady) return;
    loadMenuData();
    loadSettings();
  }, [isDbReady]);

  //derived state

  //useMemo computes a value and caches it
  //it only recomputes when its dependencies change (searchText or activeCategory)
  //without useMemo this filtering would run on every single render
  //with 200+ items that matters for performance
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      //check if item matches the search text
      //toLowerCase() on both sides makes search case-insensitive
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      //check if item matches the active category
      // All' means no category filter — everything passes
      const matchesCategory =
        searchText !== "" ||
        activeCategory === "All" ||
        item.category === activeCategory;

      // item must pass BOTH filters to appear in results
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchText, activeCategory]);

  //cart totals calculations

  //subtotal is the sum of all item totals in the cart
  //reduce() walks through the cart array and accumulates the total
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  //tax amount — 0 until taxes are enabled
  const taxAmount = subtotal * taxRate;

  //discount amount — 0 until discounts are enabled
  const discountAmount = discount;

  //final total
  const total = subtotal + taxAmount - discountAmount;

  //change due — only relevant for cash payments
  //Math.max(0, ...) prevents negative change if tendered < total
  const changeDue =
    paymentMethod === "cash" ? Math.max(0, Number(amountTendered) - total) : 0;

  //cart handlers

  //called when a menu item is clicked in the grid or search results
  //if item is already in cart → increase quantity by 1
  //if item is not in cart → add it with quantity 1
  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      //find checks if the item is already in the cart by sku
      const existing = prevCart.find((c) => c.sku === item.sku);

      if (existing) {
        //item exists — map through cart and update only the matching item
        //map() returns a new array — we never mutate state directly in React
        return prevCart.map((c) =>
          c.sku === item.sku
            ? {
                ...c,
                quantity: c.quantity + 1,
                itemTotal: (c.quantity + 1) * c.price,
              }
            : c,
        );
      } else {
        //item not in cart — add it as a new entry
        return [
          ...prevCart,
          {
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: 1,
            itemTotal: item.price,
          },
        ];
      }
    });
  };

  //called when cashier manually changes quantity in the cart
  const handleQuantityChange = (sku, newQuantity) => {
    const qty = parseInt(newQuantity);

    //if quantity is set to 0 or invalid, remove the item from cart
    if (!qty || qty < 1) {
      handleRemoveFromCart(sku);
      return;
    }

    //update the quantity and recalculate itemTotal for that item
    setCart((prevCart) =>
      prevCart.map((c) =>
        c.sku === sku ? { ...c, quantity: qty, itemTotal: qty * c.price } : c,
      ),
    );
  };

  //removes an item from the cart entirely
  //filter() returns a new array excluding the item with matching sku
  const handleRemoveFromCart = (sku) => {
    setCart((prevCart) => prevCart.filter((c) => c.sku !== sku));
  };

  //clears the entire cart
  const handleClearCart = () => {
    const confirmed = window.confirm("Clear the entire cart?");
    if (!confirmed) return;
    setCart([]);
    setAmountTendered("");
    setDiscount(0);
    setShowPayment(false);
    setError(null);
  };

  //payment and checkout handlers

  //called when the Charge button is clicked
  //validates the cart has items before showing the payment panel
  const handleShowPayment = () => {
    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }
    setError(null);
    setShowPayment(true);
  };

  //called when the Complete Sale button is clicked
  const handleCompleteSale = async () => {
    //validate cash payment has an amount tendered
    if (paymentMethod === "cash") {
      if (!amountTendered || Number(amountTendered) < total) {
        setError("Amount tendered must be equal to or greater than the total.");
        return;
      }
    }

    try {
      //save the transaction to IndexedDB
      await saveTransaction({
        items: cart,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        paymentMethod,
        amountTendered:
          paymentMethod === "cash" ? Number(amountTendered) : total,
        change: changeDue,
        //added diningType and customer name
        diningType,
        customerName,
      });

      //show success state
      setSaleComplete(true);
    } catch (err) {
      setError(err.message);
    }
  };

  //called when the New Sale button is clicked after a completed sale
  //resets everything back to a fresh state
  const handleNewSale = () => {
    setCart([]);
    setPaymentMethod("cash");
    setAmountTendered("");
    setDiscount(0);
    setShowPayment(false);
    setSaleComplete(false);
    setError(null);
    setDiningType(diningTypes[0]);
    setCustomerName("");
  };

  //render
  return (
    <>
      {/*Banner to show that the POS is in Demo Mode*/}
      {demoMode && (
        <div className="demo-banner">
          Demo mode - sample data loaded
          <button onClick={onResetDemo}>Reset Demo</button>
        </div>
      )}
      <div className="pos-screen">
        {/* ── Left side — menu browser ── */}
        <div className="pos-menu">
          {/* Search box — primary way to find items */}
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pos-search"
          />

          {/* Category filter buttons */}
          <div className="pos-categories">
            {/* All button — clears category filter */}
            <button
              className={activeCategory === "All" ? "active" : ""}
              onClick={() => setActiveCategory("All")}
            >
              All
            </button>

            {/* one button per category from the database */}
            {categories.map((cat) => (
              <button
                key={cat}
                className={activeCategory === cat ? "active" : ""}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Item grid — filtered results */}
          <div className="pos-items">
            {filteredItems.length === 0 && <p>No items found.</p>}

            {filteredItems.map((item) => (
              <button
                key={item.sku}
                className="pos-item-btn"
                onClick={() => handleAddToCart(item)}
              >
                <span className="item-name">{item.name}</span>
                <span className="item-price">
                  {/* toFixed(2) formats the number to 2 decimal places */}
                  {currencySymbol}
                  {item.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right side — cart ── */}
        <div className="pos-cart">
          <h3>Cart</h3>
          {/* Dining type selector */}
          <div className="dining-type-selector">
            {diningTypes.map((type) => (
              <button
                key={type}
                className={diningType === type ? "active" : ""}
                onClick={() => setDiningType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Customer name — optional */}
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="customer-name-input"
          />
          {cart.length === 0 && (
            <p className="cart-empty">
              No items in cart. Search or browse to add items.
            </p>
          )}

          {/* cart items */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.sku} className="cart-item">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-controls">
                  {/* quantity input — cashier can type directly */}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.sku, e.target.value)
                    }
                    className="cart-qty-input"
                  />
                  <span className="cart-item-total">
                    {currencySymbol}
                    {item.itemTotal.toFixed(2)}
                  </span>
                  {/* × button removes the item from the cart */}
                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemoveFromCart(item.sku)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* totals section */}
          {cart.length > 0 && (
            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {subtotal.toFixed(2)}
                </span>
              </div>

              {/* only show tax row when tax is enabled */}
              {taxRate > 0 && (
                <div className="cart-total-row">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span>
                    {currencySymbol}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* only show discount row when discount is applied */}
              {discountAmount > 0 && (
                <div className="cart-total-row">
                  <span>Discount</span>
                  <span>
                    -{currencySymbol}
                    {discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="cart-total-row total">
                <strong>Total</strong>
                <strong>
                  {currencySymbol}
                  {total.toFixed(2)}
                </strong>
              </div>
            </div>
          )}

          {/* error message */}
          {error && <p className="cart-error">⚠️ {error}</p>}

          {/* cart action buttons */}
          {!showPayment && !saleComplete && (
            <div className="cart-actions">
              <button onClick={handleClearCart} disabled={cart.length === 0}>
                Clear Cart
              </button>
              <button
                onClick={handleShowPayment}
                disabled={cart.length === 0}
                className="charge-btn"
              >
                Charge {currencySymbol}
                {total.toFixed(2)}
              </button>
            </div>
          )}

          {/* ── Payment panel ── */}
          {/* only shows after Charge is clicked */}
          {showPayment && !saleComplete && (
            <div className="payment-panel">
              <h4>Payment</h4>

              {/* payment method selector */}
              <div className="payment-methods">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    className={paymentMethod === method.id ? "active" : ""}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      // clear tendered amount when switching payment methods
                      setAmountTendered("");
                      setError(null);
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {/* cash tendered input — only shows for cash payment */}
              {paymentMethod === "cash" && (
                <div className="cash-tendered">
                  <label>Amount Tendered</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                  />
                  {/* show change due as soon as tendered >= total */}
                  {Number(amountTendered) >= total && (
                    <div className="change-due">
                      <strong>
                        Change Due: {currencySymbol}
                        {changeDue.toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="payment-actions">
                <button onClick={() => setShowPayment(false)}>Back</button>
                <button
                  className="complete-sale-btn"
                  onClick={handleCompleteSale}
                >
                  Complete Sale
                </button>
              </div>
            </div>
          )}

          {/* ── Sale complete screen ── */}
          {saleComplete && (
            <div className="sale-complete">
              <h3>✅ Sale Complete</h3>
              <p>
                Total:{" "}
                <strong>
                  {currencySymbol}
                  {total.toFixed(2)}
                </strong>
              </p>
              <p>
                Payment:{" "}
                <strong>
                  {paymentMethods.find((m) => m.id === paymentMethod)?.label}
                </strong>
              </p>
              {paymentMethod === "cash" && (
                <>
                  <p>
                    Tendered:{" "}
                    <strong>
                      {currencySymbol}
                      {Number(amountTendered).toFixed(2)}
                    </strong>
                  </p>
                  <p>
                    Change:{" "}
                    <strong>
                      {currencySymbol}
                      {changeDue.toFixed(2)}
                    </strong>
                  </p>
                </>
              )}
              <button className="new-sale-btn" onClick={handleNewSale}>
                New Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
