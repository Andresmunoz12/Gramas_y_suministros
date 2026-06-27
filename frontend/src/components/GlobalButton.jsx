import "../styles/GlobalButton.css";

export default function GlobalButton({ children, onClick, className = "", ...props }) {
  return (
    <button className={`auth-button ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
