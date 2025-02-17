import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/MainVars.css';
import '../styles/MainStyle.css';
import { useWebSocket } from '../WebSocketProvider'; // WebSocketProvider에서 가져오기

const SearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query');
  const hasLogged = useRef(false); // 최초 실행 여부 추적

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);

  const { stockData, isConnected, updateStockData, setInitialStockData } =
    useWebSocket();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?query=${searchTerm}`);
    }
  };

  const fetchStockData = async (stockId) => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_STOCK_BACKEND_URL}/api/get-popular/${stockId}`
      );
      if (!response.ok) {
        throw new Error(`[ERROR] 데이터 검색 실패 for stockId: ${stockId}`);
      }
      const data = await response.json();
      console.log('[LOG] /api/get-popular API 성공');
      return data;
    } catch (error) {
      console.error('[ERROR] /api/get-popular 오류 발생' + error);
      return null;
    }
  };

  useEffect(() => {
    const fetchStockIds = async () => {
      try {
        const response = await fetch(
          `http://${process.env.REACT_APP_STOCK_BACKEND_URL}/stocks/api/search/${query}`
        );
        if (!response.ok) {
          throw new Error('[ERROR] Stock IDs 검색 실패');
        }

        const stockIds = await response.json(); // 주어진 stockId 배열

        console.log('[LOG] /api/search/' + JSON.stringify(stockIds));
        // Backend로 subscriptionList 전달
        await fetch(
          `http://${process.env.REACT_APP_STOCK_BACKEND_URL}/subscriptions/update`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stockIds),
          }
        );

        setFilteredStocks(stockIds);

        // Fetch stock data for each stockId
        stockIds.forEach(async (stockId) => {
          const data = await fetchStockData(stockId);
          if (data) {
            setInitialStockData((prevData) => ({
              ...prevData,
              [stockId]: data,
            }));
          }
        });

        console.log('[LOG] /subscriptions/update 성공');
      } catch (error) {
        console.error('[ERROR] 검색 데이터 로드 실패:', error);
      }
    };

    if (query) {
      console.log(
        '[LOG,MONITORING] SearchResultPage Start at ' +
          new Date().toLocaleTimeString()
      );
      fetchStockIds();
    }
  }, [query]);

  const fetchRedisFallback = async (stockId) => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_STOCK_BACKEND_URL}/api/redis-data/${stockId}`
      );
      if (!response.ok) {
        throw new Error(
          `[ERROR] Redis 데이터 검색 실패 for stockId: ${stockId}`
        );
      }
      const data = await response.json();

      if (data.length > 0) {
        return JSON.parse(data[0]);
      }

      return null;
    } catch (error) {
      console.error('[ERROR] /api/redis-data 오류 발생' + error);
      return null;
    }
  };

  useEffect(() => {
    filteredStocks.forEach((stockId) => {
      if (!stockData[stockId]?.currentPrice) {
        fetchRedisFallback(stockId).then((redisData) => {
          if (redisData) {
            updateStockData(stockId, redisData);
          }
        });
      }
    });

    // 모든 종목에 대해 WebSocket 연결이 되고 데이터가 채워지면 로그 출력 (한 번만)
    if (!hasLogged.current) {
      const allSatisfied = filteredStocks.every(
        (stockId) => isConnected && stockData[stockId]?.currentPrice
      );
      if (allSatisfied && isConnected) {
        console.log(
          '[LOG,MONITORING] SearchResultPage End at ' +
            new Date().toLocaleTimeString()
        );
        hasLogged.current = true;
      }
    }
  }, [filteredStocks, stockData, isConnected, updateStockData]);

  return (
    <div className="_0-1-home">
      <div className="frame-45">
        {/* Header */}
        <div className="gnb">
          <div className="frame-11">
            <div className="frame-26">
              <img className="image-6" src="/image-60.png" alt="Logo" />
              <div className="frame-10">
                <div className="frame-9">
                  <div
                    className="gnb-button"
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer' }}
                  >
                    홈으로
                  </div>
                  <div
                    className="gnb-button"
                    onClick={() => navigate('/login')}
                    style={{ cursor: 'pointer' }}
                  >
                    로그인
                  </div>
                </div>
              </div>
            </div>
            <div className="search-bar">
              <div className="frame-1">
                <img
                  className="search-01"
                  src="/search-010.svg"
                  alt="Search Icon"
                  style={{ cursor: 'pointer' }}
                  onClick={handleSearch}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색하실 종목 이름을 입력해 주세요."
                  className="div2"
                />
              </div>
            </div>
          </div>
        </div>

        <img className="image-9" src="/image-90.png" alt="Main Graphic" />

        <div className="main-content">
          {/* 검색 결과 표시 */}
          <div className="stock-ranking">
            <div className="top-10">
              🔎 다음에 대한 검색 결과 표시 중: {query}
            </div>

            {filteredStocks.length === 0 ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>종목이름</th>
                    <th>거래량</th>
                    <th>현재가</th>
                    <th>등락가</th>
                    <th>등락률</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stockId) => {
                    const currentData =
                      stockData[stockId]?.currentPrice || null;

                    if (currentData === null) {
                      fetchRedisFallback(stockId).then((redisData) => {
                        if (redisData) {
                          updateStockData(stockId, redisData);
                        }
                      });
                    }

                    const allDataFetched = filteredStocks.every(
                      (stockId) => stockData[stockId]?.currentPrice
                    );

                    if (allDataFetched && !hasLogged.current && isConnected) {
                      console.log(
                        '[LOG,MONITORING] SearchResultPage End at ' +
                          new Date().toLocaleTimeString()
                      );
                      hasLogged.current = true;
                    }

                    return (
                      <tr
                        key={stockId}
                        onClick={() => navigate(`/stock/${stockId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{stockData[stockId]?.ranking || 'N/A'}</td>

                        <td>{stockData[stockId]?.stockName || 'N/A'}</td>
                        <td>{stockData[stockId]?.acmlvol || 'N/A'}</td>
                        <td>{currentData}</td>
                        <td
                          style={{
                            color:
                              stockData[stockId]?.fluctuationPrice > 0
                                ? '#FF4726'
                                : '#2175F2',
                          }}
                        >
                          {stockData[stockId]?.fluctuationPrice}
                        </td>
                        <td
                          style={{
                            color:
                              parseFloat(stockData[stockId]?.fluctuationRate) >
                              0
                                ? '#FF4726'
                                : '#2175F2',
                          }}
                        >
                          {stockData[stockId]?.fluctuationRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
