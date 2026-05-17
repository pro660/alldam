import FilterList from "./FilterList";
import RegionSelector from "./RegionSelector";
import SearchBox from "./SearchBox";
import TerminalPanel from "./TerminalPanel";

function Sidebar({
  isOpen,
  onToggle,
  regions,
  activeRegion,
  onSelectRegion,
  isTerminalMode,
  filterSections,
  terminal,
}) {
  return (
    <section className={`left-drawer-wrap ${isOpen ? "open" : "closed"}`}>
      <aside className="left-drawer">
        <div className="drawer-content">
          <header className="drawer-header">
            <div className="profile-circle" />
            <span className="project-name">프로젝트명? or 로고</span>
          </header>

          <SearchBox />

          <RegionSelector
            regions={regions}
            activeRegion={activeRegion}
            onSelectRegion={onSelectRegion}
          />

          {isTerminalMode ? (
            <TerminalPanel {...terminal} />
          ) : (
            <FilterList sections={filterSections} />
          )}
        </div>
      </aside>

      <button
        type="button"
        className="drawer-toggle-button"
        onClick={onToggle}
        aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        {isOpen ? "<" : ">"}
      </button>
    </section>
  );
}

export default Sidebar;
