import Backdrop from "./Backdrop.jsx";
import Logo from "./Logo.jsx";
import ThemeSwitcher from "./ThemeSwitcher.jsx";

// The shared frame of the login and sign up pages.
export default function AuthCard({ title, lead, onSubmit, footer, children }) {
  return (
    <div className="auth-page chai-page">
      <Backdrop />
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <Logo asLink={false} />
        <h1>{title}</h1>
        <p className="auth-subtitle">{lead}</p>
        {children}
        {footer && <p className="auth-footer">{footer}</p>}
      </form>
      <div className="auth-theme">
        <ThemeSwitcher />
      </div>
    </div>
  );
}
