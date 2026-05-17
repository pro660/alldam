function SearchBox() {
  return (
    <div className="search-box">
      <input type="text" aria-label="검색어 입력" />
      <button type="button" aria-label="검색">
        검색
      </button>
      <button type="button" aria-label="현재 위치">
        현재
      </button>
    </div>
  );
}

export default SearchBox;
