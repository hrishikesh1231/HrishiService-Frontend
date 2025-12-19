import React from 'react';
import ReactDOM from 'react-dom/client';
// import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// import App from './App';
import Landing from './Pages/Landing';
import Order from './Pages/Order';
import Admin from './Pages/Admin';
import AdminShopPanel from './Pages/AdminShopPanel';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path='/order' element={<Order/>}/>
      <Route path='/admin' element={<Admin/>}/>
      <Route path='/admin/me' element={<AdminShopPanel/>}/>
    </Routes>
  </BrowserRouter>
);

