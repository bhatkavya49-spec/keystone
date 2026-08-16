import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user ? "/dashboard" : "/login";

  return (
    <div className="not-found">
      <div className="not-found__card">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page not found</h2>
        <p className="not-found__text">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link className="btn-primary btn-primary--inline" to={homePath}>
          Back to {user ? "Dashboard" : "Login"}
        </Link>
      </div>
    </div>
  );
}