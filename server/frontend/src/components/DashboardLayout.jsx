import { useState } from "react";
import './styles/dashboardlayout.css';
import SideBar from "./SideBar";
import BitcoinBlockExplorer from "./BitcoinBlockExplorer";
import EthereumBlockExplorer from "./EthereumBlockExplorer";

const Layout = ({ children }) => {
    const [active, setActive] = useState("bitcoin");

    return (
        <section id="dashboardlayout">
            {children}
            <section id='blockchain_dashboard'>
                <SideBar active={active} onSelect={setActive} />
                {active === "bitcoin"   && <BitcoinBlockExplorer />}
                {active === "ethereum"  && <EthereumBlockExplorer />}
            </section>
        </section>
    );
};

export default Layout;





