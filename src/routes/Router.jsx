import { useEffect, useState } from "react";
import AuthPage from "../pages/AuthPage";
import Main from "../pages/Main";

const routes = {
  "/": Main,
  "/main": Main,
  "/auth": AuthPage,
};

function getCurrentPath() {
  return window.location.pathname || "/";
}

function Router() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const handleNavigation = () => {
      setPath(getCurrentPath());
    };

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("app:navigate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("app:navigate", handleNavigation);
    };
  }, []);

  const Page = routes[path] || Main;

  return <Page />;
}

export function navigateTo(path) {
  if (window.location.pathname === path) return;

  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("app:navigate"));
}

export default Router;
