import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage/HomePage";
import MenuPage from "./pages/MenuPage/MenuPage";
import ContactsPage from "./pages/ContactsPage/ContactsPage";
import ReservationPage from "./pages/ReservationPage/ReservationPage";
import MapPage from "./pages/MapPage/MapPage";
import CartPage from "./pages/CartPage/CartPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import { CartProvider } from "./state/CartContext";
import "./App.css";

export default function App() {
  return (
    <CartProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/auth/:mode" element={<AuthPage />} />
      </Routes>
    </CartProvider>
  );
}
