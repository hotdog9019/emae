export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');

:root {
  --bg:#080807; --surface:#111110; --surface2:#191917; --surface3:#222220;
  --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.13);
  --text:#f2ede6; --muted:rgba(242,237,230,0.42); --muted2:rgba(242,237,230,0.2);
  --gold:#c9a96e; --gold2:#e8ca90; --gold-glow:rgba(201,169,110,0.16);
  --red:#c0473b; --green:#4a8c5c;
  --ff-d:'Cormorant Garamond',serif; --ff-b:'Jost',sans-serif;
  --ease:cubic-bezier(0.22,1,0.36,1); --ease2:cubic-bezier(0.16,1,0.3,1);
  --r-sm:8px; --r-md:14px; --r-lg:22px; --r-xl:50px;
  --shadow:0 24px 60px rgba(0,0,0,0.7); --hdr-h:68px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:var(--ff-b);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E");opacity:.5;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:2px;}

/* HEADER */
.hdr{position:sticky;top:0;z-index:300;height:var(--hdr-h);padding:0 48px;display:flex;align-items:center;justify-content:space-between;background:rgba(8,8,7,0.82);backdrop-filter:blur(24px) saturate(160%);border-bottom:1px solid var(--border);transition:height .4s var(--ease),background .4s;}
.hdr.compact{height:58px;background:rgba(8,8,7,0.96);}
.brand{display:flex;flex-direction:column;gap:2px;user-select:none;}
.brand-name{font-family:var(--ff-d);font-size:26px;font-weight:600;letter-spacing:4px;text-transform:uppercase;line-height:1;color:var(--text);}
.brand-sub{font-size:8px;letter-spacing:5px;text-transform:uppercase;color:var(--gold);font-weight:400;}
.nav{display:flex;align-items:center;gap:4px;}
.nav-btn{position:relative;padding:8px 18px;font-family:var(--ff-b);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);font-weight:400;background:none;border:none;cursor:pointer;transition:color .3s;}
.nav-btn::after{content:'';position:absolute;bottom:5px;left:18px;right:18px;height:1px;background:var(--gold);transform:scaleX(0);transform-origin:center;transition:transform .35s var(--ease);}
.nav-btn:hover{color:var(--text);}.nav-btn:hover::after,.nav-btn.on::after{transform:scaleX(1);}.nav-btn.on{color:var(--gold);}
.hdr-right{display:flex;align-items:center;gap:10px;}
.ico-btn{width:40px;height:40px;border-radius:50%;border:1px solid var(--border2);background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;position:relative;transition:all .3s var(--ease);}
.ico-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-glow);transform:scale(1.06);}
.ico-btn .bdg{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--red);color:#fff;font-size:9px;font-weight:600;border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;}

/* HERO */
.hero{position:relative;height:calc(100vh - var(--hdr-h));min-height:520px;overflow:hidden;}
.slides-wrap{display:flex;height:100%;transition:transform .95s var(--ease2);}
.slide{min-width:100%;height:100%;position:relative;flex-shrink:0;overflow:hidden;}
.slide img{width:100%;height:100%;object-fit:cover;filter:brightness(.52) saturate(.75);transition:filter .6s,transform 8s linear;}
.slide.cur img{filter:brightness(.6) saturate(.9);transform:scale(1.04);}
.slide-fog{position:absolute;inset:0;background:linear-gradient(160deg,rgba(8,8,7,.05) 15%,rgba(8,8,7,.3) 55%,rgba(8,8,7,.95) 100%);}
.slide-body{position:absolute;left:80px;bottom:90px;right:380px;z-index:5;}
.slide-tag{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);font-weight:500;margin-bottom:18px;opacity:0;transform:translateY(12px);transition:all .6s var(--ease) .1s;}
.slide-h{font-family:var(--ff-d);font-size:clamp(42px,5.5vw,82px);font-weight:300;line-height:1.07;color:var(--text);margin-bottom:22px;opacity:0;transform:translateY(22px);transition:all .7s var(--ease) .28s;}
.slide-h em{font-style:italic;color:var(--gold2);}
.slide-p{font-size:13px;color:var(--muted);line-height:1.75;max-width:420px;opacity:0;transform:translateY(14px);transition:all .65s var(--ease) .44s;}
.slide-cta{margin-top:32px;opacity:0;transform:translateY(14px);transition:all .6s var(--ease) .58s;display:flex;gap:12px;flex-wrap:wrap;}
.slide.cur .slide-tag,.slide.cur .slide-h,.slide.cur .slide-p,.slide.cur .slide-cta{opacity:1;transform:none;}

/* Price card */
.price-card{position:absolute;right:64px;bottom:80px;z-index:10;background:rgba(17,17,16,0.82);backdrop-filter:blur(20px);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:220px;opacity:0;transform:translateX(20px) translateY(10px);transition:all .8s var(--ease) .55s;box-shadow:var(--shadow);}
.slide.cur .price-card{opacity:1;transform:none;}
.pc-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);}
.pc-name{font-family:var(--ff-d);font-size:22px;color:var(--text);margin:8px 0 4px;}
.pc-price{font-family:var(--ff-d);font-size:38px;font-weight:300;color:var(--gold);line-height:1;}
.pc-price sup{font-size:18px;vertical-align:super;}
.pc-desc{font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5;}
.pc-btn{margin-top:18px;width:100%;padding:13px;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;border-radius:var(--r-xl);color:#1a1206;font-family:var(--ff-b);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;cursor:pointer;transition:all .35s var(--ease);box-shadow:0 8px 24px rgba(201,169,110,.2);}
.pc-btn:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(201,169,110,.35);}

/* Slider controls */
.slider-ctrl{position:absolute;bottom:32px;left:80px;z-index:20;display:flex;align-items:center;gap:20px;}
.dots-row{display:flex;gap:8px;align-items:center;}
.dot-el{height:2px;background:rgba(255,255,255,.22);border:none;cursor:pointer;transition:all .45s var(--ease);padding:0;width:20px;}
.dot-el:hover:not(.on){background:rgba(255,255,255,.5);}.dot-el.on{width:44px;background:var(--gold);}
.arr-row{display:flex;gap:8px;}
.arr-btn{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);backdrop-filter:blur(8px);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s var(--ease);}
.arr-btn:hover{border-color:var(--gold);color:var(--gold);background:rgba(201,169,110,.1);transform:scale(1.08);}
.prog-bar{position:absolute;top:0;left:0;right:0;height:2px;z-index:20;background:rgba(255,255,255,.06);}
.prog-fill{height:100%;background:var(--gold);transition:width .1s linear;}
.slide-counter{position:absolute;top:28px;right:64px;z-index:20;font-family:var(--ff-d);font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;}
.slide-counter strong{color:var(--gold);font-size:22px;font-weight:300;}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--ff-b);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:500;cursor:pointer;border:none;transition:all .35s var(--ease);white-space:nowrap;}
.link-like{background:none;border:none;color:var(--gold);text-decoration:underline;cursor:pointer;padding:0;font-size:inherit}
.link-like:hover{color:var(--gold2);}
.btn-ghost{padding:11px 22px;border-radius:var(--r-xl);border:1px solid var(--border2);background:transparent;color:var(--muted);}
.btn-ghost:hover{border-color:var(--gold);color:var(--text);background:var(--gold-glow);transform:translateY(-1px);}
.btn-gold{padding:12px 26px;border-radius:var(--r-xl);background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1206;font-weight:600;box-shadow:0 8px 24px rgba(201,169,110,.2);}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(201,169,110,.32);}
.btn-outline-gold{padding:11px 22px;border-radius:var(--r-xl);border:1px solid var(--gold);background:transparent;color:var(--gold);}
.btn-outline-gold:hover{background:var(--gold);color:#1a1206;}
.btn-hero{padding:14px 30px;border-radius:var(--r-xl);font-size:10px;letter-spacing:2.5px;}
.btn-hero-ghost{padding:13px 28px;border-radius:var(--r-xl);border:1px solid rgba(255,255,255,.22);background:transparent;color:var(--text);font-size:10px;letter-spacing:2px;}
.btn-hero-ghost:hover{border-color:var(--gold);color:var(--gold);}

/* Social auth */
.social-row{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;padding:6px 0;}
.social-btn{width:52px;height:52px;border-radius:50%;border:1px solid var(--border2);background:rgba(0,0,0,.35);color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s var(--ease);box-shadow:0 10px 22px rgba(0,0,0,.25);}
.social-btn svg{display:block;}
.social-btn:hover:not(:disabled){border-color:var(--gold);background:var(--gold-glow);transform:translateY(-1px) scale(1.04);color:var(--gold2);}
.social-btn:disabled{opacity:.45;cursor:not-allowed;}
.social-popover{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);width:min(340px,92vw);background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r-md);padding:12px;box-shadow:0 24px 60px rgba(0,0,0,.75);z-index:20;animation:modalIn .35s var(--ease);}
.social-popover-title{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;text-align:center;}
.social-popover-body{display:flex;justify-content:center;min-height:44px;}

/* BOTTOM BAR */
.btm{background:rgba(8,8,7,.96);backdrop-filter:blur(20px);border-top:1px solid var(--border);padding:14px 48px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.btm-left{display:flex;align-items:center;gap:12px;}
.v-div{width:1px;height:28px;background:var(--border2);}

/* MENU PAGE */
.page{padding:80px 64px;max-width:1400px;margin:0 auto;}
.page-title{font-family:var(--ff-d);font-size:clamp(40px,5vw,64px);font-weight:300;color:var(--text);margin-bottom:8px;}
.page-title em{font-style:italic;color:var(--gold);}
.page-sub{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:48px;}
.cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:48px;}
.cat-tab{padding:10px 22px;border-radius:var(--r-xl);border:1px solid var(--border2);background:transparent;color:var(--muted);font-family:var(--ff-b);font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .3s var(--ease);}
.cat-tab:hover{color:var(--text);background:rgba(255,255,255,.04);}.cat-tab.on{border-color:var(--gold);color:var(--gold);background:var(--gold-glow);}
.menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;}
.menu-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;transition:all .4s var(--ease);}
.menu-card:hover{border-color:var(--border2);transform:translateY(-4px);box-shadow:0 24px 48px rgba(0,0,0,.5);}
.mc-img{position:relative;height:200px;overflow:hidden;cursor:pointer;}
.mc-img img{width:100%;height:100%;object-fit:cover;transition:transform .7s var(--ease),filter .5s;filter:brightness(.9) saturate(.85);}
.menu-card:hover .mc-img img{transform:scale(1.06);filter:brightness(1) saturate(1);}
.mc-badge{position:absolute;top:14px;left:14px;padding:5px 12px;border-radius:var(--r-xl);background:rgba(8,8,7,.75);backdrop-filter:blur(8px);border:1px solid var(--border2);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:500;}
.mc-body{padding:20px;}
.mc-name{font-family:var(--ff-d);font-size:20px;color:var(--text);margin-bottom:6px;}
.mc-desc{font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.mc-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.tag-chip{padding:3px 10px;border-radius:var(--r-xl);background:var(--surface3);color:var(--muted);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;}
.tag-chip.spicy{color:#c07040;}.tag-chip.veg{color:#4a8c5c;}.tag-chip.new{color:var(--gold);}
.mc-footer{display:flex;align-items:center;justify-content:space-between;}
.mc-price{font-family:var(--ff-d);font-size:26px;color:var(--gold);font-weight:300;}
.mc-price span{font-size:13px;}
.add-btn{display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:var(--r-xl);border:1px solid var(--gold);background:transparent;color:var(--gold);font-family:var(--ff-b);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;cursor:pointer;transition:all .3s var(--ease);}
.add-btn:hover,.add-btn.added{background:var(--gold);color:#1a1206;}

/* CART DRAWER */
.drawer-ov{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);animation:fadeIn .3s ease;}
.drawer{position:fixed;right:0;top:0;bottom:0;z-index:401;width:420px;max-width:100vw;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;animation:slideInR .45s var(--ease);box-shadow:-24px 0 60px rgba(0,0,0,.5);}
@keyframes slideInR{from{transform:translateX(100%)}to{transform:translateX(0)}}
.d-hdr{padding:28px 28px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.d-title{font-family:var(--ff-d);font-size:28px;color:var(--text);}
.d-close{width:34px;height:34px;border-radius:50%;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;transition:all .3s;}
.d-close:hover{border-color:var(--red);color:var(--red);transform:rotate(90deg);}
.d-items{flex:1;overflow-y:auto;padding:20px 28px;display:flex;flex-direction:column;gap:16px;}
.cart-item{display:flex;gap:14px;padding:16px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-md);transition:border-color .3s;}
.cart-item:hover{border-color:var(--border2);}
.ci-img{width:72px;height:72px;border-radius:var(--r-sm);overflow:hidden;flex-shrink:0;}
.ci-img img{width:100%;height:100%;object-fit:cover;}
.ci-info{flex:1;min-width:0;}
.ci-name{font-family:var(--ff-d);font-size:17px;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ci-price{font-size:13px;color:var(--gold);margin-bottom:10px;}
.ci-qty{display:flex;align-items:center;gap:10px;}
.qty-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--border2);background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all .25s;}
.qty-btn:hover{border-color:var(--gold);color:var(--gold);}
.qty-v{font-size:14px;font-weight:500;min-width:20px;text-align:center;}
.ci-del{align-self:flex-start;background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;transition:color .2s;padding:4px;}
.ci-del:hover{color:var(--red);}
.d-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:var(--muted);}
.d-empty-icon{font-size:52px;opacity:.25;}
.d-empty-txt{font-family:var(--ff-d);font-size:24px;}
.d-empty-sub{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;}
.d-foot{padding:24px 28px;border-top:1px solid var(--border);}
.d-total{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px;}
.d-total-label{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);}
.d-total-price{font-family:var(--ff-d);font-size:38px;color:var(--gold);font-weight:300;}

/* MODALS */
.modal-ov{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r-lg);width:100%;max-width:460px;box-shadow:var(--shadow);animation:modalIn .48s var(--ease);overflow:hidden;max-height:90vh;overflow-y:auto;}
@keyframes modalIn{from{opacity:0;transform:translateY(28px) scale(.97)}to{opacity:1;transform:none}}
.m-hdr{padding:28px 28px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);z-index:2;}
.m-ttl{font-family:var(--ff-d);font-size:28px;color:var(--text);display:flex;align-items:center;gap:12px;}
.m-ttl .ico{color:var(--gold);}
.m-x{width:34px;height:34px;border-radius:50%;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;transition:all .3s;}
.m-x:hover{border-color:var(--red);color:var(--red);transform:rotate(90deg);}
.m-body{padding:28px;}
.m-ftr{padding:18px 28px 26px;border-top:1px solid var(--border);text-align:center;}
.m-ftr p{font-size:12px;color:var(--muted);margin:6px 0;}
.m-ftr a{color:var(--gold);cursor:pointer;transition:color .2s;text-decoration:none;}
.m-ftr a:hover{color:var(--gold2);}
.fg{margin-bottom:20px;}
.fl{display:flex;align-items:center;gap:7px;margin-bottom:9px;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);font-weight:500;}
.fl svg{color:var(--gold);}
.fi{width:100%;padding:13px 16px;background:rgba(0,0,0,.45);border:1px solid var(--border2);border-radius:var(--r-sm);color:var(--text);font-family:var(--ff-b);font-size:14px;outline:none;transition:all .3s;appearance:none;}
.fi:focus{border-color:var(--gold);background:rgba(0,0,0,.65);box-shadow:0 0 0 3px rgba(201,169,110,.1);}
.fi::placeholder{color:var(--muted2);}
.fi-row{display:flex;gap:14px;}
.fi-row .fg{flex:1;}
.f-check{display:flex;align-items:flex-start;gap:10px;margin:14px 0;}
.f-check input{margin-top:3px;accent-color:var(--gold);cursor:pointer;}
.f-check label{font-size:11px;color:var(--muted);line-height:1.55;cursor:pointer;}
.f-check a{color:var(--gold);text-decoration:none;}
.submit{width:100%;padding:15px;margin-top:6px;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;border-radius:var(--r-xl);color:#1a1206;font-family:var(--ff-b);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .35s var(--ease);box-shadow:0 8px 24px rgba(201,169,110,.2);}
.submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 40px rgba(201,169,110,.35);}
.submit:disabled{opacity:.45;cursor:not-allowed;}

/* Reservation */
.date-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
.gs-wrap{display:flex;align-items:center;gap:12px;margin-top:6px;}
.gs-btn{width:36px;height:36px;border-radius:50%;border:1px solid var(--border2);background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all .25s;}
.gs-btn:hover{border-color:var(--gold);color:var(--gold);}
.gs-val{font-family:var(--ff-d);font-size:26px;color:var(--gold);min-width:32px;text-align:center;}
.gs-label{font-size:11px;color:var(--muted);}

/* Dish detail modal */
.dish-img{width:100%;height:260px;object-fit:cover;}
.dish-body{padding:28px;}
.dish-name{font-family:var(--ff-d);font-size:32px;color:var(--text);margin-bottom:10px;}
.dish-meta{display:flex;gap:16px;margin-bottom:16px;}
.dm-item{display:flex;flex-direction:column;gap:3px;}
.dm-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);}
.dm-val{font-family:var(--ff-d);font-size:18px;color:var(--gold);}
.dish-desc{font-size:13px;color:var(--muted);line-height:1.75;margin-bottom:18px;}
.dish-ingr{font-size:11px;color:var(--muted);margin-bottom:24px;}
.dish-ingr strong{color:var(--text);letter-spacing:.5px;}
.dish-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.dish-price{font-family:var(--ff-d);font-size:42px;font-weight:300;color:var(--gold);}
.dish-price sup{font-size:20px;vertical-align:super;}

/* TOAST */
.toast-wrap{position:fixed;bottom:28px;right:28px;z-index:9000;display:flex;flex-direction:column;gap:10px;pointer-events:none;}
.toast{padding:14px 20px;border-radius:var(--r-md);background:var(--surface2);border:1px solid var(--border2);color:var(--text);font-size:12px;box-shadow:0 16px 40px rgba(0,0,0,.6);display:flex;align-items:center;gap:10px;animation:toastIn .4s var(--ease);max-width:300px;}
.toast.ok{border-color:rgba(201,169,110,.32);}.toast.err{border-color:rgba(192,71,59,.35);}
@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

/* RESPONSIVE */
@media(max-width:900px){
  .hdr{padding:0 24px;}.nav{display:none;}
  .slide-body{left:24px;right:24px;bottom:90px;}.price-card{display:none;}
  .btm{padding:12px 20px;flex-wrap:wrap;}.page{padding:48px 24px;}
  .menu-grid{grid-template-columns:1fr 1fr;}.slider-ctrl{left:24px;}
  .slide-counter{right:24px;}
}
@media(max-width:540px){
  .menu-grid{grid-template-columns:1fr;}.fi-row{flex-direction:column;gap:0;}
  .btm-left{flex-wrap:wrap;gap:8px;}.v-div{display:none;}
  .social-btn{width:56px;height:56px;}
}
`;
