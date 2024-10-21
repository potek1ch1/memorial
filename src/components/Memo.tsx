import React, { useState } from "react";
import "./css/Menu.css";
import Header from "./Header";
import MemoMain from "./MemoMain";
import NewMemo from "./NewMemo";
import NotFound from "./NotFound";
import MemoList from "./MemoList";
import MemoCompleted from "./MemoCompleted";

interface MenuProps {
  setSuccessLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

// type Data = {
//   id: number;
//   title: string;
//   content: string;
// };
const Menu = ({ setSuccessLogin }: MenuProps) => {
  const [component, setComponent] = useState("memoMain");
  const [data, setData] = useState([
    {
      id: 1,
      title: "母の言葉",
      content: "どんなに辛くても、笑顔を忘れないで。笑顔は君の強さの証だから。",
    },
    {
      id: 2,
      title: "静かな夕暮れ",
      content:
        "日が沈む瞬間の空の色は、いつも新しい希望を感じさせる。今日の終わりは、明日の始まり。",
    },
    {
      id: 3,
      title: "友との再会",
      content:
        "長い年月を経ても、変わらない友情。再会の瞬間に感じる温かさは、心の支えとなる。",
    },
    {
      id: 4,
      title: "大切な人への感謝",
      content: "大切な人に感謝の気持ちを伝えることは、愛情を深めること。",
    },
    {
      id: 5,
      title: "未来への希望",
      content: "明日への希望を持つことは、前進する力となる。",
    },
    { id: 6, title: " 心の平穏", content: "心が穏やかな時、人は最も美しい。" },
  ]);
  const addData = (title: string, content: string) => {
    const newData = {
      id: data.length + 1,
      title: title,
      content: content,
    };
    setData([...data, newData]);
  };
  const selectedComponent = () => {
    switch (component) {
      case "memoMain":
        return <MemoMain setComponent={setComponent} memoData={data} />;
      case "newMemo":
        return <NewMemo setComponent={setComponent} addData={addData} />;
      case "memoList":
        return <MemoList setComponent={setComponent} />;
      case "memoCompleted":
        return <MemoCompleted setComponent={setComponent} />;
      default:
        return <NotFound setComponent={setComponent} />;
    }
  };

  return (
    <div>
      <Header setSuccessLogin={setSuccessLogin} />
      <div className="m-5">{selectedComponent()}</div>
    </div>
  );
};

export default Menu;
