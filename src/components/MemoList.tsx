import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type MemoListProps = {
  setComponent: React.Dispatch<React.SetStateAction<string>>;
};

const MemoList = ({ setComponent }: MemoListProps) => {
  const [memosStruct, setMemosStruct] = useState<any>(null);
  const [memos, setMemos] = useState<any>([]);
  const [categoryList, setCategoryList] = useState<any>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const memosPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastMemo = currentPage * memosPerPage;
  const indexOfFirstMemo = indexOfLastMemo - memosPerPage;
  const currentMemos = memos.slice(indexOfFirstMemo, indexOfLastMemo);
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    console.log(date)
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // const hours = date.getHours();
    // const minutes = date.getMinutes();
    return `${year}/${month}/${day}`;
  };
  const renderMemos = currentMemos.map((memo: any, index: number) => (
    <div key={index} className="border-2 rounded m-2 mx-auto w-[500px]">
      <div className="text-left">
        <p>・{memo.content}</p>
        <p>{memo.detail}</p>
        <p>{formatDateTime(memo.created_at)}</p>
      </div>
    </div>
  ));

  const totalPages = Math.ceil(memos.length / memosPerPage);

  const handleClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const renderPageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    renderPageNumbers.push(
      <span
        key={i}
        onClick={() => handleClick(i)}
        className={`m-1 hover:cursor-pointer ${
          i === currentPage ? "underline font-bold" : "text-cyan-600"
        }`}
      >
        {i}
      </span>
    );
  }

  useEffect(() => {
    async function fetchMemos() {
      try {
        const category = await invoke("get_all_memo", {});
        setMemosStruct(category);
      } catch (error) {
        console.error("Failed to fetch memos:", error);
      }
    }
    fetchMemos();
  }, []);

  useEffect(() => {
    console.log(memosStruct);
    if (!memosStruct) {
      return;
    }
    let memoList: any[] = [];
    if (selectedCategory) {
      console.log("selected: " + selectedCategory);
      memoList = [...memoList, ...memosStruct[selectedCategory]];
      setMemos(memoList);
      return;
    }
    const categories = Object.keys(memosStruct);
    setCategoryList(categories);
    for (const category of categories) {
      memoList = [...memoList, ...memosStruct[category]];
    }
    console.log(memoList);
    setMemos(memoList);
  }, [memosStruct, selectedCategory]);

  const selectCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      return;
    }
    setSelectedCategory(category);
  };
  return (
    <div>
      <div>
        <div>
          <h2>カテゴリー</h2>
          <div>
            {categoryList &&
              categoryList.map((category: string) => (
                <span
                  key={category}
                  className={`${
                    selectedCategory === category && "bg-cyan-500"
                  } rounded border border-cyan-500  mx-1 px-1 py-1 cursor-pointer`}
                  onClick={() => selectCategory(category)}
                >
                  {category}
                </span>
              ))}
          </div>
        </div>
        {memos && memos.length > 0 ? (
          <div>
            {/* {memos.map((memo: any) => {
              return (
                <div
                  key={memo.content}
                  className="border-2 rounded m-2 mx-auto w-[500px]"
                >
                  <div className="text-left">
                    <p>・{memo.content}</p>
                    <p>{memo.detail}</p>
                    <p>{formatDateTime(memo.created_at)}</p>
                  </div>
                </div>
              );
            })} */}
            {renderMemos}
            <div className="absolute left-[370px]">
              {renderPageNumbers}
            </div>
          </div>
        ) : (
          <p>メモがありません</p>
        )}
        {/* {renderMemos} */}
      </div>
      <div className="flex justify-center">
        <button
          className="absolute left-10 bg-slate-600 text-cyan-100"
          onClick={() => setComponent("memoMain")}
        >
          メイン画面に戻る
        </button>
        <button
          className="absolute right-10 bg-slate-600 text-cyan-100"
          onClick={() => setComponent("newMemo")}
        >
          新規作成
        </button>
      </div>
    </div>
  );
};

export default MemoList;
