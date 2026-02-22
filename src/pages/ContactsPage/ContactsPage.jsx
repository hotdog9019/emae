import React from "react";

export default function ContactsPage() {
  return (
    <div className="container page">
      <header className="topbar">
        <h1 id="contacts">Контакты</h1>
      </header>
      <section style={{ padding: 12 }}>
        <p>Телефон: +7 (495) 000-00-00</p>
        <p>Email: info@yomayo.example</p>
        <p>Адреса филиалов и режим работы — на странице "Карта филиалов".</p>
      </section>
    </div>
  );
}