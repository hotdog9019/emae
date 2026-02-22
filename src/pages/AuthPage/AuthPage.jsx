import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loginUser, registerUser } from "../../api";

export default function AuthPage() {
  const { mode } = useParams(); // "login" or "register"
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        const res = await registerUser(form);
        localStorage.setItem("user", JSON.stringify(res.user || { name: form.name, token: res.token }));
      } else {
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("user", JSON.stringify(res.user || { name: res.name || form.email, token: res.token }));
      }
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка");
    }
  };

  return (
    <div className="auth-page container">
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "register" ? "Регистрация" : "Вход"}</h2>
        {mode === "register" && (
          <input placeholder="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        )}
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <input placeholder="Пароль" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="btn" type="submit">{mode === "register" ? "Зарегистрироваться" : "Войти"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(mode === "register" ? "/auth/login" : "/auth/register")}>
            {mode === "register" ? "У меня есть аккаунт" : "Регистрация"}
          </button>
        </div>
      </form>
    </div>
  );
}