export const SLIDES = [
  { 
    tag:"Шеф рекомендует", 
    title:<>Борщ по<br/><em>домашнему</em></>, 
    desc:"Наваристый, рубиновый, со сметаной — каждая тарелка греет как воспоминание о детстве.", 
    img:"https://img.freepik.com/premium-photo/traditional-ukrainian-russian-borscht-dark-background-borscht-with-sour-cream-beetroot-borscht-with-parsley-high-quality-photo_311158-6777.jpg", 
    dish:"Борщ домашний", 
    price:"490", 
    weight:"380 мл" 
  },
  { 
    tag:"Сезонная подача", 
    title:<>Цезарь<br/><em>с курицей</em></>, 
    desc:"Хрустящая романо, нежное куриное филе, бекон и авторский соус — классика в безупречном исполнении.", 
    img:"https://img.freepik.com/premium-photo/caesar-salad-with-chicken-black-plate_210632-2728.jpg", 
    dish:"Цезарь с курицей", 
    price:"620", 
    weight:"280 г" 
  },
  { 
    tag:"Летняя коллекция", 
    title:<>Томатный<br/><em>микс-салат</em></>, 
    desc:"Свежие томаты, крымская фета, руккола и оливковое масло первого отжима — вкус средиземноморья.", 
    img:"https://etrocafe.ru/wp-content/uploads/2023/04/Salat-tom-yam-scaled.jpg", 
    dish:"Томатный микс", 
    price:"380", 
    weight:"220 г" 
  },
];

export const MENU = [
  {id:1,cat:"Супы",name:"Борщ домашний",price:490,weight:"380 мл",badge:"Хит",tags:["хит"],img:"https://img.freepik.com/premium-photo/traditional-ukrainian-russian-borscht-dark-background-borscht-with-sour-cream-beetroot-borscht-with-parsley-high-quality-photo_311158-6777.jpg",desc:"Классический рецепт с говяжьей грудинкой, свёклой и пышной сметаной.",ingr:"говядина, свёкла, капуста, картофель, морковь, лук, томат, сметана"},
  {id:2,cat:"Супы",name:"Том Ям",price:720,weight:"300 мл",badge:"Острый",tags:["spicy"],img:"https://thecity.m24.ru/b/d/SYketSiveYs4JPnUfurQC04VAx5tdWH8mYxfOS8Xp1Gj5pqKzWTJSFS-PsArI08gRZaK1yZktQXWesHOaOz7FWcJ5xZMng=AtxcAOsWo_4JY8dain5pfg.jpg",desc:"Тайский суп с кокосовым молоком, креветками и лемонграссом.",ingr:"кокосовое молоко, креветки, грибы шиитаке, лайм, лемонграсс"},
  {id:3,cat:"Супы",name:"Крем-суп из тыквы",price:420,weight:"280 мл",badge:"Вег",tags:["veg"],img:"https://kubnews.ru/upload/dev2fun.imagecompress/webp/resize_cache/iblock/55d/1200_800_2/uawathk0qtoryd0c2tyhxggd5ux72rt4.webp",desc:"Нежный тыквенный крем с имбирём, кокосовым молоком и семенами тыквы.",ingr:"тыква, кокосовое молоко, имбирь, куркума, семена тыквы"},
  {id:4,cat:"Салаты",name:"Цезарь с курицей",price:620,weight:"280 г",badge:"Хит",tags:["хит"],img:"https://img.freepik.com/premium-photo/caesar-salad-with-chicken-black-plate_210632-2728.jpg",desc:"Романо, куриное филе на гриле, пармезан, гренки, соус Caesar.",ingr:"романо, куриное филе, пармезан, хлеб, соус caesar, лимон"},
  {id:5,cat:"Салаты",name:"Греческий",price:440,weight:"240 г",badge:"",tags:["veg"],img:"https://img.freepik.com/premium-photo/greek-salad-product-studio-photo-dark-black-background-fresh-tomato-onion-salad-generative-ai-illustration_74760-1266.jpg",desc:"Томаты, огурцы, перец, маслины, фета и оливковое масло.",ingr:"томаты, огурцы, болгарский перец, фета, маслины, орегано"},
  {id:6,cat:"Салаты",name:"Томатный микс",price:380,weight:"220 г",badge:"Новинка",tags:["new","veg"],img:"https://etrocafe.ru/wp-content/uploads/2023/04/Salat-tom-yam-scaled.jpg",desc:"Ассорти томатов, крымская фета, руккола и масло первого отжима.",ingr:"черри, бычье сердце, руккола, фета, оливковое масло, базилик"},
  {id:7,cat:"Горячее",name:"Стейк рибай",price:2490,weight:"300 г",badge:"Premium",tags:["хит"],img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdpKrOA9lODx9hRr_rOtOEKPv88cQAJDNw4A&s",desc:"Мраморная говядина, розовая соль, тимьян, масло руколой.",ingr:"говядина рибай, тимьян, розмарин, сливочное масло, руккола"},
  {id:8,cat:"Горячее",name:"Лосось на гриле",price:1290,weight:"200 г",badge:"Новинка",tags:["new"],img:"https://img.freepik.com/premium-photo/delicious-grilled-salmon-restaurant-dark-background_252187-4753.jpg",desc:"Филе норвежского лосося, лимонный соус, спаржа, каперсы.",ingr:"лосось, лимон, спаржа, каперсы, укроп, оливковое масло"},
  {id:9,cat:"Горячее",name:"Паста Карбонара",price:680,weight:"280 г",badge:"",tags:[],img:"https://img.freepik.com/premium-photo/traditional-italian-pasta-carbonara-with-bacon-parmesan-egg-pepper-dark-background-top-view_166116-5396.jpg",desc:"Паста al dente, соус из желтков, пармезан, гуанчале.",ingr:"спагетти, желток, пармезан, гуанчале, чёрный перец"},
  {id:10,cat:"Десерты",name:"Тирамису",price:420,weight:"160 г",badge:"Хит",tags:["хит"],img:"https://img.inmyroom.ru/inmyroom/thumb/940x600/jpg:85/uploads/food_recipe/teaser/27/2766/jpg_1000_27663ec3-8ce9-4828-8c3b-6f22278ce737.jpg?sign=08f604f7fd9543e136a787c0080c6f129bb57b79cda99cf1fa98d617f0505eb6",desc:"Классика с маскарпоне, эспрессо и савоярди.",ingr:"маскарпоне, яйца, эспрессо, савоярди, какао"},
  {id:11,cat:"Десерты",name:"Шоколадный фондан",price:480,weight:"130 г",badge:"",tags:[],img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDhHs1enLQoDDpCNO_6K1aQ0XwbyIEPyFZCw&s",desc:"Тёплый бисквит с жидким шоколадным центром и ванильным мороженым.",ingr:"шоколад, масло, яйца, мука, мороженое"},
  {id:12,cat:"Напитки",name:"Авторский лимонад",price:280,weight:"400 мл",badge:"Новинка",tags:["new","veg"],img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTQKXKN1c2nSnmiMVLAU3AUSmhS0TIkIkZSA&s",desc:"Базилик, лимон, огурец, газированная вода.",ingr:"лимон, огурец, базилик, сироп, газированная вода"},
];

export const CATS = ["Все","Супы","Салаты","Горячее","Десерты","Напитки"];
export const API_BASE = "/api/v1";

export const CONTACT_INFO = {
  address: "г. Москва, ул. Тверская, 15",
  phone: "+7 (495) 123-45-67",
  email: "info@yomayo.ru",
  workHours: "Ежедневно с 12:00 до 00:00",
  kitchenHours: "Горячая кухня до 23:00",
  social: {
    instagram: "@yomayo_rest",
    telegram: "@yomayo_bot",
    vk: "yomayo"
  },
  coordinates: {
    lat: 55.7558,
    lng: 37.6176
  }
};