import { RouterProvider } from "react-router-dom";
import Providers from "./providers";
import { router } from "./router";
import { ThemeProvider } from "../components/theme-provider";
export default function App() {
  console.log("[App] render");
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ThemeProvider>
  );
}
