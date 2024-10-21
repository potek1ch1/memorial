import React from 'react'

type Props = {
  setComponent: React.Dispatch<React.SetStateAction<string>>;
};
const NotFound = ({setComponent}:Props) => {
  return (
    <div><h1>ページが見つかりません</h1>
    <button onClick={() => setComponent("memoMain")}>メインに戻る</button></div>
  )
}

export default NotFound