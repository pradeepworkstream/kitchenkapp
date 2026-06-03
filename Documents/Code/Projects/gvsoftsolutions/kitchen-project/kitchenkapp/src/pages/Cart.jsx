import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./Cart.css";

export default function Cart({ reorderCart = [], setReorderCart, onNavigate }) {
  const [sendingReorder, setSendingReorder] = useState(false);
  const [showContactForm, setShowContactForm] = useState(null);
  const [contactForm, setContactForm] = useState({
    whatsappNumber: '',
    emailTo: '',
    emailSubject: 'KitchenK Reorder Request',
    emailFrom: 'KitchenK Admin <admin@kitchenk.com>'
  });
  const [vendorEmailSuggestions, setVendorEmailSuggestions] = useState([]);

  // Fetch vendor names from inventory and build simple email suggestions
  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get('/api/inventory/list', { params: { limit: 200 } });
        if (!res.data?.success) return;
        const vendors = Array.from(new Set((res.data.data || []).map((i) => i.vendor).filter(Boolean)));
        const emails = vendors.map((v) => `${v.toLowerCase().replace(/\s+/g, '')}@vendor.com`);
        setVendorEmailSuggestions(emails);
      } catch {
        // ignore
      }
    };

    fetchVendors();
  }, []);

  const removeFromReorderCart = (id) => {
    setReorderCart((prev) => prev.filter((i) => i._id !== id));
  };

  const updateReorderQty = (id, qty) => {
    if (qty <= 0) {
      removeFromReorderCart(id);
      return;
    }
    setReorderCart((prev) =>
      prev.map((i) => (i._id === id ? { ...i, reorderQty: qty } : i))
    );
  };

  const sendReorderToVendor = async (method, contactDetails) => {
    if (reorderCart.length === 0) {
      toast.error("Reorder cart is empty");
      return;
    }
    setSendingReorder(true);
    try {
      const message = `Reorder Request:\n${reorderCart
        .map((item) => `- ${item.name} (${item.category}): ${item.reorderQty}`)
        .join("\n")}\n\nPlease deliver as soon as possible.`;

      console.log('Sending reorder:', { method, message, contactDetails });

      let res;
      if (method === "whatsapp") {
        res = await api.post("/api/whatsapp/send-reorder", { 
          text: message,
          toPhone: contactDetails.whatsappNumber 
        });
      } else if (method === "email") {
        res = await api.post("/send-email/reorder", { 
          text: message, 
          toEmail: contactDetails.emailTo,
          subject: contactDetails.emailSubject,
          fromEmail: contactDetails.emailFrom
        });
      }

      console.log('API response:', res.data);

      if (res.data.success) {
        toast.success(`Reorder sent to vendor via ${method}`);
        setReorderCart([]);
        setShowContactForm(null);
        setContactForm({
          whatsappNumber: '',
          emailTo: '',
          emailSubject: 'KitchenK Reorder Request',
          emailFrom: 'KitchenK Admin <admin@kitchenk.com>'
        });
        onNavigate("products");
      } else {
        throw new Error(res.data.message);
      }
    } catch (e) {
      console.error('Send reorder error:', e);
      console.error('Error response:', e.response?.data);
      toast.error("Failed to send reorder");
    } finally {
      setSendingReorder(false);
    }
  };

  return (
    <div className="invPage">
      <div className="invCard">
        <h2>Reorder Cart</h2>
        {reorderCart.length === 0 ? (
          <div className="invStatus">Your reorder cart is empty. Add items from the Products page.</div>
        ) : (
          <>
            <div className="cartItems">
              {reorderCart.map((item) => (
                <div key={item._id} className="cartItem">
                  <div className="cartItemInfo">
                    <strong>{item.name}</strong> ({item.category})
                    <br />
                    {/* unit removed */}
                  </div>
                  <div className="cartItemControls">
                    <label>Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.reorderQty}
                      onChange={(e) => updateReorderQty(item._id, parseInt(e.target.value) || 1)}
                      style={{ width: "60px", marginLeft: "5px" }}
                    />
                    <button className="btnSmall" onClick={() => removeFromReorderCart(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sendOptions">
              <button
                className="btnPrimary"
                onClick={() => {
                  setShowContactForm('whatsapp');
                  setTimeout(() => {
                    const input = document.querySelector('input[type="tel"]');
                    if (input) input.focus();
                  }, 100);
                }}
                disabled={sendingReorder}
              >
                📱 Send WhatsApp Message
              </button>
              <button
                className="btnSecondary"
                onClick={() => {
                  setShowContactForm('email');
                  setTimeout(() => {
                    const input = document.querySelector('input[type="email"]:first-of-type');
                    if (input) input.focus();
                  }, 100);
                }}
                disabled={sendingReorder}
              >
                ✉️ Send Email Message
              </button>
            </div>

            {showContactForm === 'whatsapp' && (
              <div className="contactForm">
                <h5>📱 Send WhatsApp Message</h5>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Enter the vendor's WhatsApp number and click "Send WhatsApp Message" to send the reorder request.
                </p>
                <div className="invField">
                  <label>Vendor WhatsApp Number *</label>
                  <input
                    type="tel"
                    value={contactForm.whatsappNumber}
                    onChange={(e) => setContactForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="e.g., +1234567890"
                  />
                </div>
                <div className="formActions">
                  <button
                    className="btnPrimary"
                    onClick={() => sendReorderToVendor('whatsapp', contactForm)}
                    disabled={sendingReorder || !contactForm.whatsappNumber.trim()}
                  >
                    {sendingReorder ? "Sending…" : "📤 Send WhatsApp Message"}
                  </button>
                  <button
                    className="btnGhost"
                    onClick={() => setShowContactForm(null)}
                    disabled={sendingReorder}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showContactForm === 'email' && (
              <div className="contactForm">
                <h5>✉️ Send Email Message</h5>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Fill in the email details and click "Send Email Message" to send the reorder request.
                </p>
                <div className="invField">
                  <label>From *</label>
                  <input
                    type="email"
                    value={contactForm.emailFrom}
                    onChange={(e) => setContactForm(prev => ({ ...prev, emailFrom: e.target.value }))}
                    placeholder="sender@example.com"
                  />
                </div>
                <div className="invField">
                  <label>To *</label>
                  <input
                    list="emailSuggestions"
                    type="email"
                    value={contactForm.emailTo}
                    onChange={(e) => setContactForm(prev => ({ ...prev, emailTo: e.target.value }))}
                    placeholder="vendor@example.com"
                  />
                  <datalist id="emailSuggestions">
                    {vendorEmailSuggestions.map((em) => (
                      <option key={em} value={em} />
                    ))}
                    <option value="vendor@example.com" />
                  </datalist>
                </div>
                <div className="invField">
                  <label>Subject *</label>
                  <input
                    value={contactForm.emailSubject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, emailSubject: e.target.value }))}
                    placeholder="Reorder Request"
                  />
                </div>
                <div className="formActions">
                  <button
                    className="btnPrimary"
                    onClick={() => sendReorderToVendor('email', contactForm)}
                    disabled={sendingReorder || !contactForm.emailTo.trim() || !contactForm.emailFrom.trim() || !contactForm.emailSubject.trim()}
                  >
                    {sendingReorder ? "Sending…" : "📤 Send Email Message"}
                  </button>
                  <button
                    className="btnGhost"
                    onClick={() => setShowContactForm(null)}
                    disabled={sendingReorder}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}