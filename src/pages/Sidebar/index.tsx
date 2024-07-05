import { Inter } from "@next/font/google";
import { Scrollbar } from "react-scrollbars-custom";
import styles from "./sidebar.module.css";

const inter = Inter({
  variable: "--font-inter",
  weight: "400",
  subsets: ["latin-ext"],
});

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <Scrollbar
        noScrollX={true}
        removeTracksWhenNotUsed={false}
        //   maximalThumbYSize={80}
        disableTrackYWidthCompensation={true}
        trackClickBehavior={"jump" as any}
        trackYProps={{
          style: {
            width: "15px",
            borderRadius: "10px",
            backgroundColor: "#f0f0f0",
            top: "0",
            bottom: "0",
          },
        }}
        thumbYProps={{
          style: {
            backgroundColor: "#d9d9d9",
            borderRadius: "10px",
            boxShadow: "0 5px 6px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <div style={{ padding: 20 }}>
          <h1 className="text-2xl font-black text-center text-3xl">
            WHAT is an GNN model?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining the GNN model. The quick brown fox
            jumps over the lazy dog. The quick brown fox jumps over the lazy
            dog. The quick brown fox jumps over the lazy dog. The quick brown
            fox jumps over the lazy dog. The quick brown fox jumps over the lazy
            dog. The quick brown fox jumps over the lazy dog. The quick brown
            fox jumps over the lazy dog.
          </p>

          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
          <p className="text-center text-lg">
            This is a paragraph explaining the GNN model. The quick brown fox
            jumps over the lazy dog. The quick brown fox jumps over the lazy
            dog. The quick brown fox jumps over the lazy dog. The quick brown
            fox jumps over the lazy dog. The quick brown fox jumps over the lazy
            dog. The quick brown fox jumps over the lazy dog. The quick brown
            fox jumps over the lazy dog.
          </p>

          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
          <h1 className="text-2xl font-black text-center text-3xl">
            How to interact with this demo?
          </h1>
          <p className="text-center text-lg">
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>
        </div>
      </Scrollbar>
    </div>
  );
}
