import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProducts, getZones, createOrder, verifyOrder, errorMessage } from "./api.js";

import { motion, AnimatePresence, MotionConfig, LayoutGroup, useScroll, useTransform } from "framer-motion";
import {
  STORE, ZONES as ZONES0, PRODUCTS as PRODUCTS0, CATS, REVIEWS, FAQ, COUPONS, FREE_SHIPPING_AT, naira, off,
} from "./data.js";

/* ---------- tiny icon set ---------- */
const I = ({ d, size = 20, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ICON = {
  search: "M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  bag: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  truck: ["M1 3h15v13H1z", "M16 8h4l3 3v5h-7z", "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"],
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z",
  x: "M18 6L6 18M6 6l12 12",
  menu: "M3 6h18M3 12h18M3 18h18",
  up: "M12 19V5M5 12l7-7 7 7",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
};

/* ---------- motion presets ---------- */
const ease = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };
const stagger = (s = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: s } } });

function Reveal({ children, className, as = "div" }) {
  const M = motion[as];
  return (
    <M className={className} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </M>
  );
}

const Stars = ({ r }) => (
  <span className="stars" role="img" aria-label={`${r} out of 5`}>
    {"★".repeat(Math.round(r))}{"☆".repeat(5 - Math.round(r))}
  </span>
);

function useCountdown() {
  const [left, setLeft] = useState(() => msToMidnight());
  useEffect(() => {
    const t = setInterval(() => setLeft(msToMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor(left / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}
function msToMidnight() {
  const n = new Date(); const e = new Date(n); e.setHours(24, 0, 0, 0); return e - n;
}

function useLocal(key, init) {
  const [v, setV] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(key)); return s ?? init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

const ANNOUNCE = [
  "Original gadgets, tested before dispatch",
  "Delivery to all 36 states + FCT",
  `Free delivery on orders above ${naira(FREE_SHIPPING_AT)}`,
  "Use code WELCOME10 for 10% off your first order",
];

/* ---------- App ---------- */
export default function App() {
  const [returnRef, setReturnRef] = useState(null); // Paystack reference from ?reference=
  const [payDialog, setPayDialog] = useState(false);
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const zonesQ = useQuery({ queryKey: ["zones"], queryFn: getZones });
  const verifyQ = useQuery({
    queryKey: ["verify", returnRef],
    queryFn: () => verifyOrder(returnRef),
    enabled: !!returnRef,
    retry: 2,
  });
  const apiProducts = productsQ.data?.length ? productsQ.data : null;
  const apiZones = zonesQ.data?.length ? zonesQ.data : null;
  const verifyStatus = String(verifyQ.data?.status ?? verifyQ.data?.order?.status ?? "").toLowerCase();
  const isPaid = ["paid", "shipped", "delivered"].includes(verifyStatus);
  const payment = !payDialog ? null
    : verifyQ.isPending ? { state: "checking", ref: returnRef }
    : verifyQ.isError ? { state: "failed", ref: returnRef, msg: errorMessage(verifyQ.error) }
    : isPaid ? { state: "paid", ref: returnRef }
    : { state: "failed", ref: returnRef, msg: "We could not confirm your payment yet." };
  const setPayment = () => setPayDialog(false);
  // Live data from the backend; the static data.js values are the fallback (and supply stock/badges).
  const PRODUCTS = useMemo(
    () => apiProducts ? apiProducts.map((p) => ({ stock: 99, ...PRODUCTS0.find((x) => x.id === p.id), ...p, image: p.image || PRODUCTS0.find((x) => x.id === p.id)?.image })) : PRODUCTS0,
    [apiProducts]
  );
  const ZONES = apiZones || ZONES0;
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("featured");
  const [savedOnly, setSavedOnly] = useState(false);
  const [cart, setCart] = useLocal("bs-cart", {});
  const [wish, setWish] = useLocal("bs-wish", []);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [zone, setZone] = useState("lagos");
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", address: "" });
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);
  const [cmsg, setCmsg] = useState(null);
  const [quick, setQuick] = useState(null);
  const [toast, setToast] = useState("");
  const [stuck, setStuck] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [ann, setAnn] = useState(0);
  const [focusSearch, setFocusSearch] = useState(false);
  const [faq, setFaq] = useState(0);
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  const [h, m, s] = useCountdown();
  const shopRef = useRef(null);

  useEffect(() => {
    // Returning from Paystack: the backend verifies the payment (see verifyQ above).
    const ref = new URLSearchParams(window.location.search).get("reference");
    if (ref) {
      window.history.replaceState({}, "", window.location.pathname);
      setReturnRef(ref);
      setPayDialog(true);
    }
  }, []);
  useEffect(() => {
    const on = () => { setStuck(window.scrollY > 40); setShowTop(window.scrollY > 700); };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { const t = setInterval(() => setAnn((a) => (a + 1) % ANNOUNCE.length), 3800); return () => clearInterval(t); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 1800); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    document.body.style.overflow = open || quick ? "hidden" : "";
    const esc = (e) => { if (e.key === "Escape") { setOpen(false); setQuick(null); } };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, quick]);

  const list = useMemo(() => {
    let r = PRODUCTS.filter(
      (p) =>
        (cat === "All" || p.cat === cat) &&
        (!savedOnly || wish.includes(p.id)) &&
        (p.name + p.desc + p.cat).toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "high") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "rated") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "deal") r = [...r].sort((a, b) => off(b) - off(a));
    return r;
  }, [cat, q, sort, savedOnly, wish]);

  const suggestions = q.trim().length > 0 && focusSearch
    ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4) : [];

  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
  const saved = lines.reduce((a, l) => a + l.qty * (l.was - l.price), 0);
  const discount = applied ? Math.round((subtotal * COUPONS[applied]) / 100) : 0;
  const z = ZONES.find((x) => x.id === zone);
  const freeShip = subtotal - discount >= FREE_SHIPPING_AT;
  const shipping = lines.length && !freeShip ? z.fee : 0;
  const total = subtotal - discount + shipping;
  const toFree = Math.max(0, FREE_SHIPPING_AT - (subtotal - discount));

  const add = (p, n = 1) => {
    if (p.stock === 0) return;
    setCart((c) => ({ ...c, [p.id]: Math.min(p.stock, (c[p.id] || 0) + n) }));
    setToast(`${p.name} added to cart`);
  };
  const setQty = (p, n) =>
    setCart((c) => { const x = { ...c }; if (n <= 0) delete x[p.id]; else x[p.id] = Math.min(p.stock, n); return x; });
  const toggleWish = (p) => {
    setWish((w) => (w.includes(p.id) ? w.filter((i) => i !== p.id) : [...w, p.id]));
    setToast(wish.includes(p.id) ? "Removed from saved" : "Saved to wishlist");
  };

  const applyCoupon = () => {
    const c = coupon.trim().toUpperCase();
    if (COUPONS[c]) { setApplied(c); setCmsg({ ok: true, t: `${COUPONS[c]}% discount applied` }); }
    else { setApplied(null); setCmsg({ ok: false, t: "That code is not valid" }); }
  };

  const goShop = (c) => {
    if (c) { setCat(c); setSavedOnly(false); }
    setMenu(false);
    shopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const ready = buyer.name.trim() && buyer.phone.trim() && buyer.address.trim();
  const emailOk = /^\S+@\S+\.\S+$/.test(buyer.email.trim());
  const payReady = ready && emailOk;

  const orderMessage = (ref) => [
      `New order for ${STORE.name}`, null, "",
      ...lines.map((l) => `${l.qty} x ${l.name} — ${naira(l.qty * l.price)}`), "",
      `Subtotal: ${naira(subtotal)}`,
      applied ? `Discount (${applied}): -${naira(discount)}` : null,
      `Delivery (${z.label}): ${shipping ? naira(shipping) : "FREE"}`,
      `Total: ${naira(total)}`, "",
      `Name: ${buyer.name}`, buyer.email.trim() ? `Email: ${buyer.email.trim()}` : null, `Phone: ${buyer.phone}`, `Address: ${buyer.address}`,
    ].filter((x) => x !== null).join("\n");
  const sendWhatsApp = (ref) =>
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(orderMessage(ref))}`, "_blank");
  const checkout = () => sendWhatsApp();

  const orderM = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => { window.location.href = order.authorization_url; },
    onError: (e) => setToast(errorMessage(e)),
  });
  const paying = orderM.isPending || orderM.isSuccess; // stays disabled while redirecting
  const payWithPaystack = () => {
    if (!payReady || paying) return;
    orderM.mutate({
      items: lines.map((l) => ({ product_id: l.id, qty: l.qty })),
      zone_id: zone,
      customer: { name: buyer.name.trim(), email: buyer.email.trim(), phone: buyer.phone.trim(), address: buyer.address.trim() },
    });
  };

  useEffect(() => { if (isPaid) setCart({}); }, [isPaid]); // eslint-disable-line react-hooks/exhaustive-deps

  const deal = [...PRODUCTS].sort((a, b) => off(b) - off(a))[0];
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const hot = PRODUCTS.filter((p) => p.badge).slice(0, 3);

  return (
    <MotionConfig reducedMotion="user">
      {/* announcement */}
      <div className="strip" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span key={ann} initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -22, opacity: 0 }} transition={{ duration: 0.35 }}>
            {ANNOUNCE[ann]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* header */}
      <header className={"bar" + (stuck ? " stuck" : "")}>
        <div className="bar-in">
          <button className="ibtn menu-btn" onClick={() => setMenu((v) => !v)} aria-label="Menu" aria-expanded={menu}>
            <I d={menu ? ICON.x : ICON.menu} />
          </button>
          <a className="brand" href="#top">
            <span className="logo">BS</span>
            <span><b>{STORE.name}</b><small>{STORE.cac} · Alaba, Lagos</small></span>
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#shop" onClick={(e) => { e.preventDefault(); goShop("All"); }}>Shop</a>
            <a href="#categories">Categories</a>
            <a href="#reviews">Reviews</a>
            <a href="#help">Delivery & FAQ</a>
          </nav>
          <div className="search">
            <I d={ICON.search} size={16} />
            <label className="sr" htmlFor="q">Search products</label>
            <input id="q" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocusSearch(true)} onBlur={() => setTimeout(() => setFocusSearch(false), 150)} placeholder="Search cases, lights, gimbals…" autoComplete="off" />
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div className="suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {suggestions.map((p) => (
                    <button key={p.id} onClick={() => { setQuick(p); setFocusSearch(false); }}>
                      <span>{p.name}</span><b>{naira(p.price)}</b>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="icons">
            <motion.button whileTap={{ scale: 0.92 }} className="ibtn" onClick={() => { setSavedOnly(true); setCat("All"); shopRef.current?.scrollIntoView({ behavior: "smooth" }); }} aria-label={`Saved items, ${wish.length}`}>
              <I d={ICON.heart} fill={wish.length ? "currentColor" : "none"} />
              {wish.length > 0 && <span className="badge">{wish.length}</span>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.92 }} className="ibtn dark" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
              <I d={ICON.bag} /> <span className="lbl">Cart</span>
              <motion.span key={count} className="badge" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>{count}</motion.span>
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav className="mnav" aria-label="Mobile" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
              <a href="#shop" onClick={() => setMenu(false)}>Shop</a>
              <a href="#categories" onClick={() => setMenu(false)}>Categories</a>
              <a href="#reviews" onClick={() => setMenu(false)}>Reviews</a>
              <a href="#help" onClick={() => setMenu(false)}>Delivery & FAQ</a>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="top" className="wrap">
        {/* hero */}
        <section className="hero" ref={heroRef}>
          <motion.div variants={stagger(0.1)} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="eyebrow">Alaba International Market, Lagos</motion.p>
            <motion.h1 variants={fadeUp}>Phone accessories for people who <em>make content.</em></motion.h1>
            <motion.p variants={fadeUp} className="lead">
              Lights, gimbals, cases and audio picked from our Alaba shop. Wholesale and retail, checked before it leaves the building.
            </motion.p>
            <motion.div variants={fadeUp} className="cta">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn pri" onClick={() => goShop("All")}>Shop now</motion.button>
              <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn wa" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer">
                <I d={ICON.chat} size={18} /> Chat on WhatsApp
              </motion.a>
            </motion.div>
            <motion.div variants={fadeUp} className="trust">
              <span><I d={ICON.check} size={14} /> Verified CAC business</span>
              <span><I d={ICON.check} size={14} /> Order confirmed on WhatsApp</span>
              <span><I d={ICON.check} size={14} /> 48-hour return window</span>
            </motion.div>
          </motion.div>

          <motion.div className="hero-art" style={{ y: artY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease }}>
            <motion.div className="blob" animate={{ rotate: [0, 6, -4, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
            {hot.map((p, i) => (
              <motion.button
                key={p.id}
                className={`float f${i + 1}`}
                onClick={() => setQuick(p)}
                style={{ background: "#fff", textAlign: "left", cursor: "pointer" }}
                animate={{ y: [0, i % 2 ? 10 : -10, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="mk">{p.mark}</span>
                <b>{p.name.length > 22 ? p.name.slice(0, 20) + "…" : p.name}</b>
                <small>{naira(p.price)}</small>
              </motion.button>
            ))}
            <motion.div className="deal-pill" initial={{ scale: 0 }} animate={{ scale: 1, rotate: -6 }} transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 14 }}>
              Up to {off(deal)}% off
            </motion.div>
          </motion.div>
        </section>

        {/* benefits */}
        <motion.div className="benefits" variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {[
            [ICON.truck, "Nationwide delivery", "All 36 states + FCT"],
            [ICON.shield, "Tested before dispatch", "Original products only"],
            [ICON.refresh, "48-hour returns", "Faulty or wrong item replaced"],
            [ICON.chat, "Real human support", "Reply on WhatsApp fast"],
          ].map(([ic, t, d]) => (
            <motion.div key={t} variants={fadeUp} className="benefit">
              <span className="ic"><I d={ic} /></span>
              <div><b>{t}</b><span>{d}</span></div>
            </motion.div>
          ))}
        </motion.div>

        {/* categories */}
        <section id="categories">
          <Reveal><p className="eyebrow">Browse</p><h2 className="sec-title">Shop by category</h2></Reveal>
          <motion.div className="cats" variants={stagger(0.07)} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {CATS.filter((c) => c !== "All").map((c, i) => {
              const n = PRODUCTS.filter((p) => p.cat === c).length;
              const tint = PRODUCTS.find((p) => p.cat === c).tint;
              return (
                <motion.button key={c} variants={fadeUp} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} className="cat-tile" style={{ background: tint }} onClick={() => goShop(c)}>
                  <span className="bgmark">{c.slice(0, 2).toUpperCase()}</span>
                  <b>{c}</b><span>{n} product{n > 1 ? "s" : ""}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </section>

        {/* flash sale */}
        <Reveal className="flash">
          <div>
            <h2>Today's flash deal</h2>
            <p>{deal.name} — {naira(deal.price)} <s style={{ opacity: 0.6 }}>{naira(deal.was)}</s></p>
            <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="btn" style={{ marginTop: ".8rem" }} onClick={() => add(deal)}>Add to cart</motion.button>
          </div>
          <div className="timer" aria-label="Time left">
            {[[h, "Hrs"], [m, "Min"], [s, "Sec"]].map(([v, l]) => (
              <div key={l}><b>{String(v).padStart(2, "0")}</b><small>{l}</small></div>
            ))}
          </div>
        </Reveal>

        {/* shop */}
        <section id="shop" ref={shopRef}>
          <div className="shop-head">
            <Reveal><p className="eyebrow">The catalogue</p><h2 className="sec-title">{savedOnly ? "Your saved items" : "All products"}</h2></Reveal>
          </div>
          <div className="tools">
            <LayoutGroup id="chips">
              <div className="chips" role="tablist">
                {CATS.map((c) => {
                  const on = cat === c && !savedOnly;
                  return (
                    <button key={c} role="tab" aria-selected={on} className={"chip" + (on ? " on" : "")} onClick={() => { setCat(c); setSavedOnly(false); }}>
                      {on && <motion.span layoutId="pill" className="pill" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                      <span>{c}</span>
                    </button>
                  );
                })}
                {savedOnly && <button className="chip on" onClick={() => setSavedOnly(false)}><span className="pill" /><span style={{ position: "relative" }}>Saved ✕</span></button>}
              </div>
            </LayoutGroup>
            <label className="sort">Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="deal">Biggest discount</option>
                <option value="rated">Top rated</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
          <p className="result-n" aria-live="polite">{list.length} product{list.length === 1 ? "" : "s"}</p>

          {list.length === 0 ? (
            <div className="empty">
              <p>{savedOnly ? "You haven't saved anything yet." : <>No products match “{q}”.</>}</p>
              <button className="btn" onClick={() => { setQ(""); setCat("All"); setSavedOnly(false); }}>Clear search and filters</button>
            </div>
          ) : (
            <motion.div className="grid" layout>
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <ProductCard key={p.id} p={p} i={i} qty={cart[p.id] || 0} saved={wish.includes(p.id)}
                    onAdd={() => add(p)} onQty={(n) => setQty(p, n)} onWish={() => toggleWish(p)} onQuick={() => setQuick(p)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* reviews */}
        <section id="reviews" style={{ marginTop: "3.5rem" }}>
          <Reveal><p className="eyebrow">Reviews</p><h2 className="sec-title">Customers across Nigeria</h2></Reveal>
          <motion.div className="reviews" variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {REVIEWS.map((r) => (
              <motion.figure key={r.name} variants={fadeUp} whileHover={{ y: -4 }} className="review" style={{ margin: 0 }}>
                <Stars r={r.rating} />
                <p>“{r.text}”</p>
                <small><b>{r.name}</b> · {r.city}</small>
              </motion.figure>
            ))}
          </motion.div>
        </section>

        {/* delivery + faq */}
        <section id="help" className="two">
          <Reveal className="panel">
            <h2>What delivery costs</h2>
            <p style={{ color: "var(--mute)", marginTop: 0 }}>Flat rate by region. Free above {naira(FREE_SHIPPING_AT)}.</p>
            <ul>{ZONES.map((x) => <li className="row" key={x.id}><span>{x.label}</span><b>{naira(x.fee)}</b></li>)}</ul>
          </Reveal>
          <Reveal className="panel">
            <h2>Questions</h2>
            {FAQ.map((f, i) => (
              <div className="faq-item" key={f.q}>
                <button className="faq-q" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>
                  {f.q}
                  <motion.span animate={{ rotate: faq === i ? 45 : 0 }}><I d={ICON.plus} size={18} /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {faq === i && (
                    <motion.div className="faq-a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}>
                      <p>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </Reveal>
        </section>

        {/* newsletter */}
        <Reveal className="news">
          <div><h2>Get 10% off your first order</h2><p>Join for new arrivals and deals. Use code WELCOME10 at checkout.</p></div>
          {subbed ? (
            <motion.p className="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>Thanks! Use code WELCOME10 at checkout.</motion.p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setSubbed(true); }}>
              <label className="sr" htmlFor="em">Email</label>
              <input id="em" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit">Join</button>
            </form>
          )}
        </Reveal>
      </main>

      <footer>
        <div className="foot">
          <div>
            <b>{STORE.name}</b>
            <p>{STORE.address}</p><p>{STORE.email}</p><p>{STORE.phone} · {STORE.cac}</p>
          </div>
          <div>
            <b>Shop</b>
            {CATS.filter((c) => c !== "All").map((c) => <a key={c} className="fl" href="#shop" onClick={(e) => { e.preventDefault(); goShop(c); }}>{c}</a>)}
          </div>
          <div>
            <b>Follow</b>
            <p>Instagram @bestsmartech_connections</p><p>TikTok @bestsmartech</p><p>X @bestsmartech</p>
          </div>
          <div>
            <b>We accept</b>
            <div className="pay"><span>Bank transfer</span><span>Paystack</span><span>Pay on WhatsApp</span></div>
          </div>
        </div>
        <div className="legal">© 2026 Best Smartech Connections · {STORE.cac}</div>
      </footer>

      {/* floating actions */}
      <div className="fab">
        <AnimatePresence>
          {showTop && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><I d={ICON.up} size={18} /></motion.button>
          )}
        </AnimatePresence>
        <motion.a initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }} whileHover={{ scale: 1.08 }} href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><I d={ICON.chat} size={24} /></motion.a>
      </div>

      {/* quick view */}
      <AnimatePresence>
        {quick && (
          <>
            <motion.div className="scrim" onClick={() => setQuick(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <div className="modal-wrap">
              <motion.div className="modal" role="dialog" aria-modal="true" aria-label={quick.name}
                initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
                <button className="xbtn" onClick={() => setQuick(null)} aria-label="Close"><I d={ICON.x} size={16} /></button>
                <div className="mimg" style={{ background: quick.image ? `center/cover url(${quick.image})` : quick.tint }}>{!quick.image && quick.mark}</div>
                <div className="mb">
                  <p className="eyebrow" style={{ margin: 0 }}>{quick.cat}</p>
                  <h3>{quick.name}</h3>
                  <p className="rate" style={{ margin: 0 }}><Stars r={quick.rating} />{quick.rating} ({quick.reviews} reviews)</p>
                  <div className="px">{naira(quick.price)}<s>{naira(quick.was)}</s></div>
                  <p style={{ margin: 0, color: "var(--mute)" }}>{quick.desc}</p>
                  <ul><li>Original, tested before dispatch</li><li>48-hour return window</li><li>Delivery to all 36 states + FCT</li></ul>
                  {quick.stock > 0 && quick.stock <= 5 && <p className="low">Only {quick.stock} left</p>}
                  <div style={{ display: "flex", gap: ".6rem", marginTop: "auto", flexWrap: "wrap" }}>
                    <button className="btn pri" style={{ flex: 1 }} disabled={quick.stock === 0} onClick={() => { add(quick); setQuick(null); setOpen(true); }}>
                      {quick.stock === 0 ? "Sold out" : "Add to cart"}
                    </button>
                    <button className="btn" onClick={() => toggleWish(quick)} aria-pressed={wish.includes(quick.id)}>
                      <I d={ICON.heart} size={18} fill={wish.includes(quick.id) ? "currentColor" : "none"} /> {wish.includes(quick.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* cart drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="drawer" role="dialog" aria-modal="true" aria-label="Cart"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 36 }}>
              <div className="dhead">
                <h2>Your cart ({count})</h2>
                <button className="xbtn" onClick={() => setOpen(false)} aria-label="Close cart"><I d={ICON.x} size={16} /></button>
              </div>

              {lines.length === 0 ? (
                <div className="empty">
                  <p>Your cart is empty.</p>
                  <button className="btn" onClick={() => { setOpen(false); goShop("All"); }}>Browse products</button>
                </div>
              ) : (
                <>
                  <div className="dbody">
                    <div className="ship">
                      {freeShip ? <b style={{ color: "var(--green)" }}>You've unlocked free delivery 🎉</b>
                        : <>Add <b>{naira(toFree)}</b> more for free delivery</>}
                      <div className="bar-track"><motion.div className="bar-fill" animate={{ width: `${Math.min(100, ((subtotal - discount) / FREE_SHIPPING_AT) * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} /></div>
                    </div>

                    <ul className="lines">
                      <AnimatePresence initial={false}>
                        {lines.map((l) => (
                          <motion.li key={l.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, x: 60, height: 0 }} transition={{ duration: 0.25 }}>
                            <span className="thumb" style={{ background: l.tint }}>{l.mark}</span>
                            <div>
                              <b>{l.name}</b>
                              <small>{naira(l.price)} each</small>
                              <div className="qty sm">
                                <button onClick={() => setQty(l, l.qty - 1)} aria-label="Remove one">−</button>
                                <span>{l.qty}</span>
                                <button onClick={() => setQty(l, l.qty + 1)} aria-label="Add one" disabled={l.qty >= l.stock}>+</button>
                              </div>
                              <button className="rm" onClick={() => setQty(l, 0)}>Remove</button>
                            </div>
                            <b>{naira(l.qty * l.price)}</b>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>

                    <div className="form">
                      <label>Delivery region
                        <select value={zone} onChange={(e) => setZone(e.target.value)}>
                          {ZONES.map((x) => <option key={x.id} value={x.id}>{x.label} — {naira(x.fee)}</option>)}
                        </select>
                      </label>
                      <label>Full name
                        <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} autoComplete="name" />
                      </label>
                      <label>Email (for your payment receipt)
                        <input type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} inputMode="email" autoComplete="email" />
                      </label>
                      <label>Phone number
                        <input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} inputMode="tel" autoComplete="tel" />
                      </label>
                      <label>Delivery address
                        <textarea rows="2" value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
                      </label>
                    </div>
                  </div>

                  <div className="dfoot">
                    <dl className="sum">
                      <div><dt>Subtotal</dt><dd>{naira(subtotal)}</dd></div>
                      {applied && <div className="save"><dt>Coupon {applied}</dt><dd>−{naira(discount)}</dd></div>}
                      <div><dt>Delivery</dt><dd>{shipping ? naira(shipping) : "Free"}</dd></div>
                      <div className="save"><dt>You save</dt><dd>{naira(saved + discount)}</dd></div>
                      <div className="tot"><dt>Total</dt><dd>{naira(total)}</dd></div>
                    </dl>
                    {(
                      <motion.button whileTap={payReady ? { scale: 0.98 } : {}} className="go pay-btn" disabled={!payReady || paying} onClick={payWithPaystack}>
                        {paying ? "Opening Paystack…" : payReady ? `Pay ${naira(total)} with Paystack` : "Fill in your details and email to pay"}
                      </motion.button>
                    )}
                    <motion.button whileTap={ready ? { scale: 0.98 } : {}} className="go alt" disabled={!ready} onClick={checkout}>
                      {ready ? "Send order on WhatsApp" : "Fill in your details to order"}
                    </motion.button>
                    <p className="note">Pay securely by card, bank transfer or USSD with Paystack, or order on WhatsApp and pay after we confirm.</p>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* payment result */}
      <AnimatePresence>
        {payment && (
          <motion.div className="scrim" style={{ display: "grid", placeItems: "center", zIndex: 90 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div role="dialog" aria-modal="true" style={{ background: "var(--bg, #fff)", color: "inherit", borderRadius: 16, padding: "1.5rem", maxWidth: 380, width: "90%", textAlign: "center" }}>
              <h3 style={{ marginTop: 0 }}>{payment.state === "checking" ? "Confirming your payment…" : payment.state === "paid" ? "Payment received 🎉" : "Payment not confirmed"}</h3>
              <p>{payment.state === "paid" ? "Thank you! We'll contact you on WhatsApp about delivery." : payment.state === "failed" ? payment.msg : "Please wait a moment."}</p>
              <p className="note">Reference: {payment.ref}</p>
              {payment.state !== "checking" && <button className="btn" onClick={() => setPayment(null)}>Close</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" key={toast} initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

/* ---------- Product card ---------- */
function ProductCard({ p, i, qty, saved, onAdd, onQty, onWish, onQuick }) {
  const out = p.stock === 0;
  return (
    <motion.article
      className="card" layout
      initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease, delay: Math.min(i, 8) * 0.04 }}
      whileHover="hover"
    >
      <button className="img" onClick={onQuick} aria-label={`Quick view ${p.name}`}>
        <motion.div className={"tile" + (p.image ? " photo" : "")} style={p.image ? { backgroundImage: `url(${p.image})` } : { background: p.tint }}
          variants={{ hover: { scale: 1.08 } }} transition={{ duration: 0.5, ease }}>
          {!p.image && <span>{p.mark}</span>}
        </motion.div>
        <i className="tag l">{p.cat}</i>
        {!out && <i className="tag r">-{off(p)}%</i>}
        {p.badge && !out && <i className="tag b">{p.badge}</i>}
        <motion.span className="quick" variants={{ hover: { opacity: 1, y: 0 } }} initial={{ opacity: 0, y: 10 }}>Quick view</motion.span>
        {out && <span className="soldout">Sold out</span>}
      </button>
      <motion.button className={"heart" + (saved ? " on" : "")} onClick={onWish} whileTap={{ scale: 1.3 }} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save item"}>
        <I d={ICON.heart} size={18} fill={saved ? "currentColor" : "none"} />
      </motion.button>
      <div className="body">
        <h3>{p.name}</h3>
        <p className="rate"><Stars r={p.rating} />{p.rating} ({p.reviews})</p>
        <p className="desc">{p.desc}</p>
        {!out && p.stock <= 5 && <p className="low">Only {p.stock} left</p>}
        <div className="buy">
          <div><b>{naira(p.price)}</b><s>{naira(p.was)}</s></div>
          {qty ? (
            <div className="qty">
              <button onClick={() => onQty(qty - 1)} aria-label="Remove one">−</button>
              <motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{qty}</motion.span>
              <button onClick={() => onQty(qty + 1)} aria-label="Add one" disabled={qty >= p.stock}>+</button>
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.92 }} className="add" disabled={out} onClick={onAdd}>{out ? "Sold out" : "Add"}</motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
