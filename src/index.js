import React from 'react';
import ReactDOM from 'react-dom/client';
// import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// import App from './App';
import Landing from './Pages/Landing';
import Order from './Pages/Order';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path='/order' element={<Order/>}/>
    </Routes>
  </BrowserRouter>
);

