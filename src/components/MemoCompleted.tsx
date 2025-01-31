import React from "react";

type Props = {
  setComponent: React.Dispatch<React.SetStateAction<string>>;
};
const MemoCompleted = ({ setComponent }: Props) => {
  return (
    <div>
      <h1>作成完了</h1>
      <button onClick={() => setComponent("memoMain")}>メインに戻る</button>
    </div>
  );
};

export default MemoCompleted;
