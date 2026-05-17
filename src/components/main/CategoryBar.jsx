function CategoryBar({ categories, activeCategory, onSelectCategory }) {
  return (
    <section className="category-bar" aria-label="시설 카테고리">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`category-button ${
            activeCategory === category.id ? "active" : ""
          }`}
          onClick={() => onSelectCategory(category.id)}
        >
          <span className="category-icon">{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </section>
  );
}

export default CategoryBar;
