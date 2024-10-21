import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

const Login = ({
  setSuccessLogin,
}: {
  setSuccessLogin: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  useEffect(() => {
    isLogin && setSuccessLogin(isLogin);
    console.log("状態" + isLogin);
  }, [isLogin]);
  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setIsLogin(await invoke("auth", { username: userName, password }));
  }
  return (
    <div>
      {" "}
      <p>名前とパスワードを入力してください</p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <div className="input">
          <input
            id="username-input"
            onChange={(e) => setUsername(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <input
            id="password-input"
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="Enter a password..."
          />
        </div>

        <button type="submit" className="px-3 py-1">
          送信
        </button>
      </form>
    </div>
  );
};

export default Login;
