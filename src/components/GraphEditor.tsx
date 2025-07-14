import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";

type Position = { x: number; y: number };

export default function GraphEditor(): JSX.Element {
  const [defaultPos, setDefaultPos] = useState<Position>({
    x: 200 / 2.2,
    y: 120,
  });

  useEffect(() => {
    setDefaultPos({ x: window.innerWidth / 2.2, y: 120 });
  }, []);

  return (
    <div>
      <p style={{ textAlign: "center" }}>Check the floating boxes</p>

      <Draggable defaultPosition={defaultPos}>
        <div
          style={{
            position: "fixed", 
            cursor: "move",
            zIndex: 10,
            touchAction: "none",
            padding: 10,
            border: "solid 1px",
            background: "white",
          }}
        >
          👋 Drag me!
          <div>
          </div>
        </div>
      </Draggable>
    </div>
  );
}


