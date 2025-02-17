import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './WebSocketProvider';

import MainPage from './pages/MainPage';
import SearchResultPage from './pages/SearchResultPage';
import StockPage from './pages/StockPage';

const App = () => {
  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/search" element={<SearchResultPage />} />
          <Route path="/stock/:stockId" element={<StockPage />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
};

export default App;
