import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import { initCloud } from "./services/db";
import "./app.css";

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    initCloud();
  });

  return <>{children}</>;
}

export default App;
