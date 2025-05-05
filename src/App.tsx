import VirtualList from "./VirtualList/VirtualList";
import MacWindow from "./MacWindow/MacWindow";
import Header from "./Header/Header";
import arrow from "./assets/arrow.svg";
import Footer from "./Footer/Footer";
import { ListStateProvider } from "./context/ListStateProvider";
import "./App.css";

function App() {
  return (
    <>
      <main className="content hint">
        <MacWindow>
          <ListStateProvider>
            <Header />
            <VirtualList />
          </ListStateProvider>
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
