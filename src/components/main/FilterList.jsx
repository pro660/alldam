function FilterList({ sections }) {
  return (
    <div className="filter-list">
      {sections.map((section) => (
        <section className="filter-section" key={section.title}>
          <div className="filter-title">{section.title}</div>

          <div className="filter-content">
            <div className="filter-line" />

            <div className="filter-chip-grid">
              {Array.from({ length: section.count }).map((_, index) => (
                <button
                  key={`${section.title}-${index}`}
                  type="button"
                  className="filter-chip"
                  aria-label={`${section.title} 필터 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export default FilterList;
