import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the main map page", () => {
  render(<App />);
  expect(screen.getByLabelText("카카오 지도")).toBeInTheDocument();
});
