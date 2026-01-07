import './App.css';
import Home from './Pages/Home';
import Dashboard from './Pages/Dashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StockSearch from './Pages/Stock_Search';
import "./envTest";


function App() {
  return (
    <>

      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/stock_search' element={<StockSearch />} />
        </Routes>
      </BrowserRouter>



    </>
  );
}

export default App;
