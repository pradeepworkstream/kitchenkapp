// src/components/CartButton.jsx
import { useCart } from "../hooks/useCart.js";
import "./CartButton.css";

export default function CartButton({ onClick }) {
  const { count } = useCart();

  return (
    <button className="cb-btn" onClick={onClick} aria-label={`Cart, ${count} items`}>
      🛒
      {count > 0 && (
        <span className="cb-badge">{count > 99 ? "99+" : count}</span>
      )}
    </button>
  );
}
