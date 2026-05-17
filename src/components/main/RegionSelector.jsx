function RegionSelector({ regions, activeRegion, onSelectRegion }) {
  return (
    <div className="region-row">
      {regions.map((region) => (
        <button
          key={region}
          type="button"
          className={activeRegion === region ? "active" : ""}
          onClick={() => onSelectRegion(region)}
        >
          {region}
        </button>
      ))}
    </div>
  );
}

export default RegionSelector;
