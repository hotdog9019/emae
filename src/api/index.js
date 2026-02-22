import axios from "axios";
import { branchesData } from "./branches";

const api = axios.create({
  baseURL: "/api",
  timeout: 8000,
});

const getImageUrl = (dishId, dishName) => {
  return `https://loremflickr.com/800/600?lock=${dishId}`;
};

export const getDishes = async () => {
  try {
    const res = await api.get("/dishes");
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((d, i) => ({
      ...d,
      id: d.id ?? i + 1,
      image:
        d.image && d.image.trim()
          ? d.image
          : getImageUrl(d.id ?? i, d.name),
    }));
  } catch (err) {
    console.warn("getDishes fallback:", err.message);
    return Array.from({ length: 12 }).map((_, i) => ({
      id: 1000 + i,
      name: `Блюдо ${i + 1}`,
      description: "Вкусное и ароматное блюдо",
      ingredients: ["ингредиент A", "ингредиент B"],
      vegan: i % 5 === 0,
      halal: i % 6 === 0,
      glutenFree: i % 7 === 0,
      price: 350 + i * 50,
      image: getImageUrl(1000 + i, `Блюдо ${i + 1}`),
    }));
  }
};

export const getBranches = async () => {
  try {
    const res = await api.get("/branches");
    const data = Array.isArray(res.data) && res.data.length > 0 ? res.data : branchesData;
    console.log("getBranches result:", data);
    return data;
  } catch (err) {
    console.warn("getBranches fallback:", err.message);
    console.log("Using fallback branchesData:", branchesData);
    return branchesData;
  }
};

export const registerUser = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);
export const bookTable = (payload, token) =>
  api
    .post("/book", payload, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
    .then((r) => r.data);
