import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MarketAreaList from './pages/FE_Manager/MarketArea/components/MarketAreaList';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MarketAreaList />} />
        {/* You can add more routes here in the future */}
      </Routes>
    </Router>
  );
}

export default App;
