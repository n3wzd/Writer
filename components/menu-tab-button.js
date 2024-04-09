export function MenuTabButton(menuVisible, toggleMenuVisible, arrowAngle) {
  return (
    <button className="layout-tab-button" onClick={toggleMenuVisible}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{
          transform: menuVisible
            ? `rotate(${arrowAngle}deg)`
            : `rotate(${arrowAngle + 180}deg)`,
        }}
      >
        <path fill="#777777" d="M7 10l6 6 6-6z"></path>
      </svg>
    </button>
  );
}
