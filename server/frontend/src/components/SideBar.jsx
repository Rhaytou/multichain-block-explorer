import './styles/sidebar.css';

function SideBar({ active, onSelect }) {
    return (
        <nav id="sidebar">
            <ul>
                <li>
                    <button
                        className={`sidebar-btn${active === "bitcoin" ? " sidebar-btn--active" : ""}`}
                        onClick={() => onSelect("bitcoin")}
                    >
                        bitcoin
                    </button>
                </li>
                <li>
                    <button
                        className={`sidebar-btn${active === "ethereum" ? " sidebar-btn--active" : ""}`}
                        onClick={() => onSelect("ethereum")}
                    >
                        ethereum
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export default SideBar;





