import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type Data = {
  id: number;
  title: string;
  content: string;
};

type MemoMainProps = {
  setComponent: React.Dispatch<React.SetStateAction<string>>;
  memoData: Data[];
};

type WeightedMemo = {
  id: number;
  content: string;
  detail: string;
  is_uploaded: boolean;
  category: string;
  display_count: number;
  created_at: number;
  created_by: string;
  weight: number;
};

const MemoMain = ({ setComponent }: MemoMainProps) => {
  const [memo, setMemo] = useState<WeightedMemo | null>(null);
  // const [index, setIndex] = useState(0);

  const handleChangePage = (page: string) => {
    setComponent(page);
  };

  const handleUpload = async () => {
    if (!memo) return;
    const response = await invoke("upload_memo", { memo });
    if (response) {
      console.log("アップロード成功");
      setMemo((prevMemo) =>
        prevMemo ? { ...prevMemo, is_uploaded: true } : null
      );
    }
  };

  // const handlePrevClick = (index: number) => {
  //   if (index === 0) {
  //     return;
  //   }
  //   console.log(index - 1);
  //   setIndex(index - 1);
  // };

  const handleNextClick = async () => {
    const memo: WeightedMemo = await invoke("get_next_memo");
    setMemo(memo);
  };

  useEffect(() => {
    (async () => {
      await invoke("get_sorted_memos");
      const memo: WeightedMemo = await invoke("get_next_memo");
      console.log(memo);
      setMemo(memo);
    })();
  }, []);

  useEffect(() => {
    console.log(memo);
  }, [memo]);

  return (
    <div className="memo-main">
      {memo ? (
        <div>
          <h1 className="text-2xl font-bold">{memo.content}</h1>
          <p className="m-3">{memo.detail}</p>
        </div>
      ) : (
        <div>メモがありません</div>
      )}
      <div className="flex m-auto justify-center">
        {/* <div>
          <button onClick={() => handlePrevClick(index)} className="w-7 p-1">
            ◀
          </button>
        </div>
        <div className="w-5"></div> */}
        <div>
          <button onClick={() => handleNextClick()} className="p-1">
            次のメモ
          </button>
        </div>
        {/* {memo && (
          <div>
            {memo.is_uploaded ? <p>アップロード済み</p> : <p>未アップロード</p>}
          </div>
        )} */}
        {memo && !memo.is_uploaded && (
          <button onClick={handleUpload} className="p-1">
            アップロード
          </button>
        )}
        {memo && memo.is_uploaded && <button>アップロード済み</button>}
      </div>
      {/* {memos && <p>{memos}</p>} */}
      <button
        className="absolute left-10 bottom-10 bg-slate-600 text-cyan-100"
        onClick={() => handleChangePage("memoList")}
      >
        メモ一覧
      </button>
      <button
        className="absolute right-10 bottom-10 bg-slate-600 text-cyan-100"
        onClick={() => handleChangePage("newMemo")}
      >
        新規作成
      </button>
    </div>
  );
};

export default MemoMain;
