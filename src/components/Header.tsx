import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface HeaderProps {
  setSuccessLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({ setSuccessLogin }: HeaderProps) => {
  const [userName, setUserName] = useState<string>("");
  useEffect(() => {
    (async () => {
      const response: string = await invoke("get_user");
      setUserName(response);
    })();
  }, []);
  return (
    <div className="flex border-b-2 border-cyan-400">
      {userName}さん
      <button onClick={() => setSuccessLogin(false)} className="bg-blue-100">
        ログアウト
      </button>
    </div>
  );
};

export default Header;
