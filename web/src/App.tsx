import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as Module from 'tonstarter-contracts';

setTimeout(() => {
  const x = new Module.default()
  x.createJetton()
}, 1);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <div>
          {/* {} */}
        </div>
      </header>
    </div>
  );
}

export default App;
