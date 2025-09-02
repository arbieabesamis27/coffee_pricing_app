import { useState } from "react";
import DrinksPage from "./pages/DrinksPage";
import IngredientsPage from "./pages/IngredientsPage";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function App() {
  const [active, setActive] = useState<"drinks" | "ingredients">("drinks");
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-amber-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">☕</div>
            <h1 className="text-lg font-semibold">Coffee Shop Manager</h1>
          </div>
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => setActive("drinks")}
              className={`${
                active === "drinks"
                  ? "bg-white text-amber-700"
                  : "text-white/90"
              } px-3 py-1 rounded`}
            >
              Drinks
            </button>
            <button
              onClick={() => setActive("ingredients")}
              className={`${
                active === "ingredients"
                  ? "bg-white text-amber-700"
                  : "text-white/90"
              } px-3 py-1 rounded`}
            >
              Ingredients
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setShowSidebar((s) => !s)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`bg-white border-r h-[calc(100vh-4rem)] absolute md:block md:relative ${
            showSidebar ? "block" : "hidden"
          } w-64`}
        >
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setActive("drinks");
                setShowSidebar(false);
              }}
              className={`w-full text-left px-3 py-2 rounded ${
                active === "drinks"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              Drinks
            </button>
            <button
              onClick={() => {
                setActive("ingredients");
                setShowSidebar(false);
              }}
              className={`w-full text-left px-3 py-2 rounded ${
                active === "ingredients"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              Ingredients
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          {active === "drinks" ? <DrinksPage /> : <IngredientsPage />}
        </main>
      </div>
    </div>
  );
}
