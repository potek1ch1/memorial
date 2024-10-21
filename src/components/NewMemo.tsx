import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type NewMemoProps = {
  setComponent: React.Dispatch<React.SetStateAction<string>>;
  addData: (title: string, content: string) => void;
};

// type Data = {
//   id: number;
//   title: string;
//   content: string;
// };

const newMemo = ({ setComponent }: NewMemoProps) => {
  const [categories, setCategories] = useState<string[]>([]);

  const handleClick = () => {
    console.log("作成");
    if (!detail || !content) {
      console.log("未入力です");
      setError(true);
      return;
    }
    console.log([detail, content]);
    setComponent("memoMain");
  };
  const [createCategory, setCreateCategory] = useState(false);
  const [detail, setdetail] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState(false);
  // const [isCompleted, setIsCompleted] = useState(false);
  const handleCreateMemo = async () => {
    try {
      handleClick();
      await invoke("add_memo", { content, detail, category });
      console.log("メモを追加しました");
      // setIsCompleted(true);
      setComponent("memoCompleted");
    } catch (e) {
      console.error("メモの作成に失敗しました", e);
    }
  };
  const handleDetailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setdetail(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    console.log(e.target.value);
  };

  useEffect(() => {
    const getCategories = async () => {
      const categories: string[] = await invoke("get_categories");
      console.log(categories);
      setCategories(categories);
    };
    getCategories();
  }, [createCategory]);
  const handleOnSubmit = (state: boolean) => {
    setCreateCategory(state);
  };

  return (
    <div className="relative">
      {categories.length > 0 && (
        <div>
          カテゴリー:
          <select name="" id="" onChange={handleCategoryChange}>
            <option value="">カテゴリーを選んでください</option>
            {categories.map((category: string) => {
              return (
                <option key={category} value={category}>
                  {category}
                </option>
              );
            })}
          </select>
          <button onClick={() => setCreateCategory(true)}>
            カテゴリー作成
          </button>
        </div>
      )}
      <div className="mb-3">
        <label htmlFor="title-input">題名:</label>
        <input
          id="title-input"
          type="text"
          required
          onInput={handleContentChange}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="content-input" className="align-top">
          内容:
        </label>
        <textarea
          id="content-input"
          className="resize-none rounded"
          required
          onInput={handleDetailChange}
        ></textarea>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => setComponent("memoMain")}
          className="p-1 bg-slate-400"
        >
          戻る
        </button>
        <span className="w-5"></span>
        <button onClick={handleCreateMemo} className="p-1 bg-slate-400">
          作成
        </button>
      </div>
      {error && <div className="text-red-500">未入力の項目があります</div>}
      {createCategory && <CreateCategory onSubmit={handleOnSubmit} />}
    </div>
  );
};

const CreateCategory = ({ onSubmit }: any) => {
  const [category, setCategory] = useState("");
  const handleOnSubmit = async () => {
    await invoke("add_category", { category: category });
    onSubmit(false);
  };

  return (
    <div className="border bg-gray-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2	rounded h-40 flex items-center">
      <div>
        <div>
          カテゴリー名:{" "}
          <input type="text" onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <button onClick={() => onSubmit(false)}>戻る</button>
          <button onClick={handleOnSubmit}>作成</button>
        </div>
      </div>
    </div>
  );
};

export default newMemo;
