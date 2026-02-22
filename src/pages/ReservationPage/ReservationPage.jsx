import React, { useEffect, useState } from "react";
import { getBranches } from "../../api";
import BranchesMap from "../../components/BranchesMap";
import BookingModal from "../../components/BookingModal";
import "./ReservationPage.css";

export default function ReservationPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  return (
    <div className="container page">
      <header className="topbar">
        <h1>Резервирование столика</h1>
        <p className="subtitle">Выберите филиал и забронируйте свой идеальный столик</p>
      </header>

      <div className="reservation-layout">
        <div className="map-section">
          <BranchesMap 
            branches={branches} 
            onSelectBranch={(b) => setSelectedBranch(b)} 
          />
        </div>

        <aside className="branch-panel">
          <h3>Филиалы</h3>
          <div className="branch-list">
            {branches.map(b => (
              <div 
                key={b.id} 
                className={`branch-card ${selectedBranch?.id === b.id ? 'active' : ''}`}
                onClick={() => setSelectedBranch(b)}
              >
                <div className="branch-name">{b.name}</div>
                <div className="branch-theme">{b.theme}</div>
                <p className="branch-desc">{b.description}</p>
              </div>
            ))}
          </div>

          {selectedBranch && (
            <div className="booking-section">
              <h4>Забронировать в {selectedBranch.name}</h4>
              <button 
                className="btn btn-primary"
                onClick={() => setBooking(true)}
              >
                Забронировать столик
              </button>
            </div>
          )}
        </aside>
      </div>

      {booking && selectedBranch && (
        <BookingModal
          dish={{ id: 0, name: "Столик" }}
          branch={selectedBranch}
          branches={branches}
          onClose={() => setBooking(false)}
        />
      )}
    </div>
  );
}