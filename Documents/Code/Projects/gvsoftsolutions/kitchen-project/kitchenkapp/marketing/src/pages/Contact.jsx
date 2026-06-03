import React, { useState } from "react";
import Button from "../components/Button.jsx";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", restaurant: "", message: "" });

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const onSubmit = (e) => { e.preventDefault(); alert("Thanks! We'll get back to you soon."); };

  return (
    <div className="contact-page">
      <h2>Contact / Get Started</h2>
      <form className="contact-form" onSubmit={onSubmit}>
        <label>Name</label>
        <input value={form.name} onChange={onChange("name")} required />

        <label>Email</label>
        <input type="email" value={form.email} onChange={onChange("email")} required />

        <label>Restaurant Name</label>
        <input value={form.restaurant} onChange={onChange("restaurant")} />

        <label>Message</label>
        <textarea value={form.message} onChange={onChange("message")} rows={5} />

        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
