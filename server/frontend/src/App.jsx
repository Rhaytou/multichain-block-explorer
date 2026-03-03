import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/blockchainexplorer" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
};
export default App;



