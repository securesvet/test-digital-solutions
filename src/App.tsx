import VirtualList from "./VirtualList/VirtualList";
import "./App.css";
import "./hooks/useWindowDimensions";
import MacWindow from "./MacWindow/MacWindow";
import Header from "./Header/Header";
import arrow from "./assets/arrow.svg";
import { SearchContext } from "./context";
import { useState } from "react";
import Footer from "./Footer/Footer";

function App() {
  const [searchValue, setSearchValue] = useState("");
  return (
    <>
      <main className="content hint">
        <MacWindow>
          <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <Header />
            <VirtualList />
          </SearchContext.Provider>
        </MacWindow>
        <Hint />
      </main>
      <Footer />
    </>
  );
}

function Hint() {
  return (
    <>
      <h4>
        Да, можно двигать окно мышкой
      </h4>
      <img src={arrow} className="arrow" />
    </>
  );
}

export default App;
