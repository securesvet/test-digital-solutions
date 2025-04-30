import VirtualList from "./VirtualList/VirtualList";
import "./App.css";
import "./hooks/useWindowDimensions";
import MacWindow from "./MacWindow/MacWindow";
import arrow from "./assets/arrow.svg";

function App() {
  return (
    <main className="content hint">
      <MacWindow>
        <Input />
        <VirtualList />
      </MacWindow>
      <Hint />
    </main>
  );
}

function Input() {
  return <input type="text" className="search-input" placeholder={"Search..."}/>;
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
