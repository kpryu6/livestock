import styled from 'styled-components';

export const Container = styled.div`
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;

  .left {
    display: flex;
    align-items: center;
    gap: 20px;

    .logo {
      display: flex;
      align-items: center;

      img {
        height: 40px;
      }
    }

    .nav {
      display: flex;
      gap: 20px;

      .button {
        font-size: 16px;
        color: #333;
        cursor: pointer;
      }
    }
  }

  .search {
    display: flex;
    align-items: center;
    background: #ffeef2;
    border-radius: 20px;
    padding: 8px 16px;

    input {
      border: none;
      outline: none;
      background: transparent;
      padding: 0 8px;
      font-size: 16px;
      width: 200px;
    }
  }
`;

export const StockInfo = styled.div`
  margin: 20px 0;
  display: flex;
  align-self: flex-start;
  margin-left: 350px;

  .stockName {
    font-size: 24px;
    font-weight: bold;
  }
  .current {
    margin-left: 20px;
    font-size: 32px;
    font-weight: bold;
  }

  .change-section {
    margin-left: 20px;
    display: flex;
    align-items: baseline;

    .label {
      font-size: 16px;
      margin-right: 10px;
    }

    .change {
      font-size: 20px;
      color: red;
      font-weight: bold;
    }
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f2f6fa; /* 배경색 추가 */
  border-radius: 40px; /* 둥근 모서리 */
  padding: 10px;
  margin: 20px 0;
  width: 100%; /* 테이블 가로 길이에 맞춤 */
  max-width: 1200px; /* 표와 동일한 최대 너비 */
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 약간의 그림자 추가 */
`;

export const Tab = styled.div`
  flex: 1; /* 각 버튼이 동일한 넓이를 가짐 */
  text-align: center; /* 텍스트 중앙 정렬 */
  padding: 12px 0;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background: ${(props) => (props.$active ? 'white' : 'transparent')};
  color: ${(props) => (props.$active ? '#ff5733' : '#888')};
  border-radius: 20px;
  box-shadow: ${(props) =>
    props.$active ? '0px 2px 4px rgba(0, 0, 0, 0.1)' : 'none'};
  margin: 0 10px;

  &:hover {
    color: #ff5733;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;

  th {
    background-color: #f4f4f4;
    border-bottom: 2px solid #ddd;
    padding: 12px;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
  }

  td {
    padding: 12px;
    text-align: center;
    font-size: 16px;
    color: ${(props) => (props.negative ? 'red' : '#333')};
    border: none; /* 데이터 부분의 선 제거 */
  }
`;

export const StockButtons = styled.div`
  display: flex;
  justify-content: center; /* 버튼들을 가운데 정렬 */
  gap: 15px; /* 버튼 간 간격 */
  margin: 20px 0;

  button {
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: #ff5733; /* 기본 배경색 */
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &.active {
      background-color: white; /* 활성화된 버튼 색상 */
      color: #ff5733; /* 활성화된 버튼 텍스트 색상 */
      border: 2px solid #ff5733; /* 활성화된 버튼 테두리 */
    }

    &:hover {
      background-color: #ff7744; /* 호버 시 밝은 색상 */
    }
  }
`;
