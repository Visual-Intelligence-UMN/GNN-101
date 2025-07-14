import React from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';

export class GraphEditor extends React.Component {

  eventLogger = (e: MouseEvent, data: Object) => {
    console.log('Event: ', e);
    console.log('Data: ', data);
  };

  handleStart = (e: any, data: any) => {
    this.eventLogger(e, data);
  };

  handleDrag = (e: any, data: any) => {
    this.eventLogger(e, data);
  };

  handleStop = (e: any, data: any) => {
    this.eventLogger(e, data);
  };

  render() {
    return (
      <Draggable
        axis="x"
        handle=".handle"
        defaultPosition={{x: 0, y: 0}}
        grid={[25, 25]}
        scale={1}
        onStart={this.handleStart}
        onDrag={this.handleDrag}
        onStop={this.handleStop}>
        <div>
          <div 
            className="handle"
            style={{
                zIndex: 9999,
                backgroundColor: 'white', 
            }}
          >
                Drag from here
            </div>
          <div>This readme is really dragging on...</div>
        </div>
      </Draggable>
    );
  }
}







