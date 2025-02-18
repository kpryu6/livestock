import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [stockData, setStockData] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // 특정 종목 데이터를 업데이트하는 함수
  const updateStockData = (stockId, newData) => {
    setStockData((prevData) => ({
      ...prevData,
      [stockId]: {
        ...prevData[stockId],
        ...newData,
      },
    }));
  };

  // 초기 데이터를 설정하는 함수
  const setInitialStockData = (initialData) => {
    setStockData(initialData);
  };

  useEffect(() => {
    // WebSocket 연결 생성
    const ws = new WebSocket(
      `wss://${process.env.REACT_APP_STOCK_BACKEND_URL}/ws/stock`
    );

    ws.onopen = () => {
      console.log('[LOG] WebSocket 연결 성공');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 수신한 데이터로 기존 상태 업데이트
      setStockData((prevData) => ({
        ...prevData,
        [data.stockId]: { ...prevData[data.stockId], ...data },
      }));
    };

    ws.onerror = (error) => {
      console.error('[ERROR] WebSocket 에러 발생:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[ERROR] WebSocket 연결 종료됨, 5초 후 재연결 시도...');
      setIsConnected(false);
      setTimeout(() => {
        setSocket(
          new WebSocket(
            `wss://${process.env.REACT_APP_STOCK_BACKEND_URL}/ws/stock`
          )
        );
      }, 5000);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        stockData,
        isConnected,
        updateStockData,
        setInitialStockData,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
