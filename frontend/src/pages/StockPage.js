import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StockInfo, TabsContainer, Tab } from '../styles/StockPageStyle';
import '../styles/MainVars.css';
import '../styles/MainStyle.css';
import { useWebSocket } from '../WebSocketProvider';

const StockPage = () => {
  const { stockId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('realtime');
  const [dailyData, setDailyData] = useState([]); // 일별 데이터
  // selectedStock를 배열로 관리하여 실시간 데이터를 저장 (fallback 및 socket 업데이트)
  const [selectedStock, setSelectedStock] = useState([]);
  const navigate = useNavigate();

  // 전역 WebSocketProvider에서 socket 및 업데이트 함수를 가져옴
  const { socket, updateStockData } = useWebSocket();

  // fallback 요청이 한 번만 시도되도록 하는 플래그
  const fallbackAttempted = useRef(false);

  // stockId가 바뀔 때 fallbackAttempted 초기화
  useEffect(() => {
    fallbackAttempted.current = false;
  }, [stockId]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?query=${searchTerm}`);
    }
  };

  // 일별 데이터를 불러오는 함수 (POST 후 GET)
  const fetchDailyDataFromAPI = async (stockId) => {
    try {
      await fetch(
        `https://${process.env.REACT_APP_STOCK_BACKEND_URL}/api/daily-price/${stockId}`,
        { method: 'POST' }
      );
      const dailyResponse = await fetch(
        `https://${process.env.REACT_APP_STOCK_BACKEND_URL}/api/daily-price/${stockId}`
      );
      if (!dailyResponse.ok) {
        throw new Error(`Daily 데이터 검색 실패 for stockId: ${stockId}`);
      }
      const data = await dailyResponse.json();
      return data;
    } catch (error) {
      console.error(`Error fetching daily data for stockId ${stockId}:`, error);
      return null;
    }
  };

  // fallback 함수: Redis에서 받은 데이터를 전체 배열로 파싱하여 반환
  const fetchRedisFallback = async (stockId) => {
    try {
      const response = await fetch(
        `https://${process.env.REACT_APP_STOCK_BACKEND_URL}/api/redis-data/${stockId}`
      );
      if (!response.ok) {
        throw new Error(
          `[ERROR] Redis 데이터 검색 실패 for stockId: ${stockId}`
        );
      }
      const data = await response.json();
      if (data.length > 0) {
        // 배열 전체를 파싱하여 반환
        return data.map((item) => JSON.parse(item));
      }
      return null;
    } catch (error) {
      console.error('[ERROR] /api/redis-data 오류 발생', error);
      return null;
    }
  };

  // 일별 데이터 로드
  useEffect(() => {
    const fetchDailyData = async () => {
      const data = await fetchDailyDataFromAPI(stockId);
      if (data) {
        setDailyData(data);
      }
    };
    fetchDailyData();
  }, [stockId]);

  // WebSocket 메시지 처리: 해당 stockId의 메시지를 받아서 selectedStock 배열에 추가 (최대 10개)
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.stockId === stockId) {
        setSelectedStock((prev) => [data, ...prev].slice(0, 10));
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, stockId]);

  // fallback: 만약 selectedStock가 비어 있거나 첫 번째 항목에 currentPrice가 없으면 fallback 요청을 한 번만 시도
  useEffect(() => {
    if (
      !fallbackAttempted.current &&
      (selectedStock.length === 0 || !selectedStock[0]?.currentPrice)
    ) {
      fallbackAttempted.current = true;
      fetchRedisFallback(stockId).then((redisData) => {
        if (redisData) {
          updateStockData(stockId, redisData);
          setSelectedStock(redisData);
        }
      });
    }
  }, [stockId, selectedStock, updateStockData]);

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

        {/* Stock Info */}
        <StockInfo>
          {dailyData && dailyData.length > 0 ? (
            <div className="stockName">{dailyData[0].stockName}</div>
          ) : null}
          {selectedStock && selectedStock.length > 0 ? (
            <>
              {/* StockInfo에서는 배열의 첫 번째 데이터를 사용 */}
              <div className="current">{selectedStock[0].currentPrice}원</div>
              <div className="change-section">
                <div className="label">어제보다</div>
                <div className="change">
                  {selectedStock[0].fluctuationPrice} (
                  {selectedStock[0].fluctuationRate}%){' '}
                  {(() => {
                    switch (selectedStock[0].fluctuationSign) {
                      case '1':
                        return '상한';
                      case '2':
                        return '상승';
                      case '3':
                        return '보합';
                      case '4':
                        return '하한';
                      case '5':
                        return '하락';
                      default:
                        return 'N/A';
                    }
                  })()}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="current">9999원</div>
              <div className="change-section">
                <div className="label">어제보다</div>
                <div className="change">+100</div>
              </div>
            </>
          )}
        </StockInfo>

        <TabsContainer>
          <Tab
            $active={activeTab === 'realtime'}
            onClick={() => handleTabClick('realtime')}
          >
            실시간 체결정보
          </Tab>
          <Tab
            $active={activeTab === 'daily'}
            onClick={() => handleTabClick('daily')}
          >
            일별 시세조회
          </Tab>
        </TabsContainer>

        {activeTab === 'realtime' && (
          <div className="main-content">
            <div className="stock-ranking">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>체결가</th>
                    <th>체결량(주)</th>
                    <th>등락</th>
                    <th>등락률</th>
                    <th>체결 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStock && selectedStock.length > 0 ? (
                    selectedStock.map((data, index) => (
                      <tr key={index}>
                        <td>{data.currentPrice || 'N/A'}</td>
                        <td>{data.transactionVolume || 'N/A'}</td>
                        <td
                          style={{
                            color:
                              parseFloat(data.fluctuationPrice) > 0
                                ? '#FF4726'
                                : '#2175F2',
                          }}
                        >
                          {parseFloat(data.fluctuationPrice) > 0
                            ? `+${data.fluctuationPrice}`
                            : data.fluctuationPrice || 'N/A'}
                        </td>
                        <td
                          style={{
                            color:
                              parseFloat(data.fluctuationRate) > 0
                                ? '#FF4726'
                                : '#2175F2',
                          }}
                        >
                          {data.fluctuationRate || 'N/A'}%
                        </td>
                        <td>
                          {data.tradingTime
                            ? `${data.tradingTime.slice(0, 2)}:${data.tradingTime.slice(2, 4)}:${data.tradingTime.slice(4)}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">데이터를 불러오는 중입니다...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="main-content">
            <div
              className="stock-ranking"
              style={{ maxHeight: '400px', overflowY: 'scroll' }}
            >
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>일자</th>
                    <th>종가</th>
                    <th>등락률(%)</th>
                    <th>거래량(주)</th>
                    <th>시가</th>
                    <th>고가</th>
                    <th>저가</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.date}</td>
                      <td>{data.close}</td>
                      <td
                        style={{
                          color:
                            data.changeRate > 0
                              ? 'red'
                              : data.changeRate < 0
                                ? 'blue'
                                : 'black',
                        }}
                      >
                        {data.changeRate}%
                      </td>
                      <td>{data.volume}</td>
                      <td>{data.open}</td>
                      <td>{data.high}</td>
                      <td>{data.low}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPage;
