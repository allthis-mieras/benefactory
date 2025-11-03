
# **Mind the Gap**

*A small tool about big differences.*

---

## **1. Concept & Purpose**

**Mind the Gap** is a tiny web app that puts generosity into perspective.  
You enter your yearly income and the donations you make.  
The app calculates what percentage of your income you give —  
and shows what the same percentage would mean for people with far deeper pockets.

It’s not about guilt.  
It’s about scale, fairness, and a touch of dry humour.

---

## **2. Mission**

To make generosity visible.  
To remind people that small acts count — and that equality in giving would change everything.

> *"If we all gave in proportion to what we have, the gap would shrink fast."*

---

## **3. Core Features**

- Simple input flow (income + donations)  
- Automatic yearly conversion (monthly / quarterly / yearly)  
- Instant calculation of your **annual giving percentage**  
- Comparison with well-known billionaires  
- Shareable results (Twitter/X link, copy link)  
- Temporary, anonymous data storage via Supabase  

---

## **4. User Flow**

**Step 1 – Your income**  
> Enter your yearly income.  
> *(Gross or net, doesn’t matter — it’s just math.)*

**Step 2 – Your donations**  
> Add each charity you support:  
> - Name  
> - Amount  
> - Frequency (monthly / quarterly / yearly)  

Live summary shows your total yearly donations and percentage.

**Step 3 – Result**  
> You give **Y %** of your income.  
> If Jeff Bezos gave the same share, he’d donate **$37 million per month.**

**Step 4 – Share**  
> “You’re already doing more than most billionaires.”  
> → Tweet @JeffBezos  
> → Copy link  

---

## **5. Tone & Copy Principles**

- **Voice:** dry, human, and slightly ironic  
- **Audience:** everyday givers, not experts  
- **Goal:** spark reflection, not judgment  
- **Style:** short sentences, active voice, minimal adjectives  
- **Humour:** aimed up, never down  
- **Visual cue:** bold sans serif, clear signage feel (London Underground meets NYC Subway)  

---

## **6. Example Copy**

### **Hero section**
**Headline:**  
> **Mind the Gap**

**Subline:**  
> You give. You care.  
> But what if the rest kept pace?

**CTA:**  
> See what your share means  

**Footer note:**  
> A playful calculator that turns generosity into perspective.

---

### **Error messages**
- “That number seems… ambitious.”  
- “We can’t divide by zero — not even Bezos can.”  
- “Add at least one donation to see your share.”  

---

### **Social share example**
> “Hey @JeffBezos, I give 0.4% of my income to charity.  
> That would be $37 million a month for you. Just saying. #MindTheGap”

---

## **7. Tech Setup (POC)**

**Framework:** [Astro](https://astro.build)  
**Backend:** [Supabase](https://supabase.com) for temporary, anonymous storage.  
All data is deleted periodically and never linked to user identity or IP.  

**Suggested structure**
```
/src
 ├─ components/
 │   ├─ IncomeForm.astro
 │   ├─ DonationForm.astro
 │   ├─ ResultCard.astro
 │   └─ ShareButtons.astro
 ├─ pages/
 │   ├─ index.astro
 │   └─ about.astro
 ├─ styles/
 │   ├─ variables.scss  (OKLCH colors + type scale)
 │   └─ metro.scss      (bold signage aesthetic)
 └─ lib/
     └─ calculations.ts (percentage + billionaire comparison)
```

**Key dependencies**
- `@astrojs/tailwind` or SCSS setup with Utopia type scale  
- Optionally `chart.js` or `recharts` for visual comparison  
- `@supabase/supabase-js` for backend connection  

---

## **8. Data & Privacy**

All user inputs are stored anonymously in Supabase for short-term insight and debugging only.  
No personal data, no cookies, no tracking.  
Data is cleared automatically and can never be traced back to individual users.

> *Transparency by design — not an afterthought.*

---

## **9. Future Ideas**

- Leaderboard of average generosity by country or profession  
- Partner integrations with verified charities  
- Embeddable widget version (“Mind the Gap: Lite”)  
- Translation/localization layer  
- API for public datasets (aggregated, anonymized results)

---

## **10. License / Attribution**

Open-source under MIT (placeholder).  
Concept and copy © 2025 by Maarten Mieras.  
Inspired by real generosity and the absence of it.

---

> **Mind the Gap** — a quiet reminder that percentages tell louder stories than numbers.
