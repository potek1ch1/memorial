import { useState } from "react";
import "./App.css";
import Memo from "./components/Memo";
import Login from "./components/Login";

function App() {
  // const [successLogin, setSuccessLogin] = useState(false);
  const [successLogin, setSuccessLogin] = useState(true);

  return (
    <div className="container">
      <h1 className="text-3xl font-bold">Memorial</h1>
      {successLogin ? (
        <Memo setSuccessLogin={setSuccessLogin} />
      ) : (
        <Login setSuccessLogin={setSuccessLogin} />
      )}
    </div>
  );
}

export default App;
