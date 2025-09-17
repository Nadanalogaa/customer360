# Retail Promo Automation – MVP Product & Tech Spec

## 0) One‑liner
A multi‑tenant SaaS for small retailers to auto‑create 5 branded promo images per month, auto‑generate a simple website from templates, and publish posts to Instagram & Facebook via connected accounts — all for ₹600/month per customer.

---

## 1) Core Value & Scope (MVP)
- **Plan**: ₹600/month/customer.
- **Deliverables per customer**:
  - Up to **5 AI‑assisted promo images** per billing month (carryover disabled in MVP).
  - **One basic website** (single domain or subdomain), selectable from template gallery; auto‑filled from onboarding form + uploaded photos.
  - **Social publishing** to Facebook Page & Instagram Business (image + caption + hashtags + scheduled time).
  - **Basic analytics**: posts count, reach/likes/comments (high level), website visits (basic pageview counter).

---

## 2) User Roles
- **Tenant Owner (customer)**: manage brand profile, upload assets, generate images, create website, connect social accounts, schedule posts, view analytics, manage billing.
- **Staff (optional)**: restricted to content tasks (no billing). Can upload assets, propose/generate images, draft posts, edit site sections, but cannot publish without approval if approvals are enabled.
- **Super Admin (your team)**: global access across all tenants; manage templates, limits/quotas, billing, support, incident actions.
- **Managed Operator (your team, per‑tenant)** *(new)*: when you run a customer’s account as a service, this role can fully act on behalf of that tenant (create/edit/publish posts, generate images, update site) but **cannot** see global admin pages. 
- **Client Approver** *(optional)*: can review/approve content and publishing, but cannot change billing or quotas.

### Permission Matrix (MVP)
| Capability | Tenant Owner | Staff | Managed Operator | Client Approver | Super Admin |
|---|---|---|---|---|---|
| Brand profile edit | ✅ | ✅ | ✅ | 🔎 view | ✅ |
| Upload assets | ✅ | ✅ | ✅ | 🔎 view | ✅ |
| Generate images (counts to tenant quota) | ✅ | ✅ | ✅ | 🔎 view | ✅ |
| Create/edit website | ✅ | ✅ | ✅ | 🔎 view | ✅ |
| Publish website | ✅ | ⛔ (or request) | ✅ | ✅ (approve) | ✅ |
| Create post drafts | ✅ | ✅ | ✅ | 🔎 view | ✅ |
| Schedule/publish posts | ✅ | ⛔ (or request) | ✅ | ✅ (approve) | ✅ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage billing/subscription | ✅ | ⛔ | ⛔ | ⛔ | ✅ |

---


## 2A) Operation Modes (Business Models)
- **Self‑Serve SaaS**: You sell the app. Customers (Tenant Owners) operate their own workspace. Your team is Super Admin only. Support is reactive.
- **Managed Service (Agency Mode)**: You maintain customers through your app. Assign a **Managed Operator** to each tenant. Operators can prepare assets, generate images, schedule/publish posts, and update website on behalf of the client. Optionally require **Client Approver** sign‑off before publishing (per‑tenant setting: `require_approval_for_publishing`).

### Approval Workflow (optional toggle)
1. Staff/Operator creates content → status `draft`.
2. Approver (Client Approver or Tenant Owner) reviews → `approved`.
3. Operator (or system) publishes/schedules → `queued` → `posted`.
4. All actions logged in `audit_logs` with actor + timestamp.

---

## 3) High‑level Modules
1. **Onboarding Wizard** (company name, category, colors, tagline, address, phone/WhatsApp, logo, sample photos).
2. **Brand & Assets**
   - Brand kit (primary/secondary colors, fonts, logo, brand voice/tone).
   - Media library (images, logos). Optional Cloud storage (e.g., Cloudinary/S3) with transformations.
3. **Image Studio**
   - Pick a **layout template** (4–5 presets in MVP).
   - AI assist for copy: headline, sub‑headline, CTA, hashtags.
   - Render to 1:1 and 4:5 variants; export JPEG/PNG; count toward monthly quota.
4. **Website Generator**
   - Choose template → auto‑populate sections (Hero, About, Products/Services, Gallery, Contact, Map).
   - Theme color/typography from brand kit.
   - Publish to subdomain (e.g., `shopname.yourdomain.com`).
5. **Social Connections**
   - Facebook Page + Instagram Business via OAuth.
   - Store page/account IDs and short‑lived tokens; refresh logic or long‑lived page tokens (server‑side).
6. **Scheduler & Publisher**
   - Queue posts (image + caption + hashtags). Immediate or scheduled.
   - Status tracking: draft → queued → posted → failed (with error message).
7. **Analytics (MVP)**
   - Social: likes/comments per post (last 30 days). 
   - Website: page views (simple counter + top referrers optional later).
8. **Billing & Quotas**
   - Track plan, renew date, and image‑credits (5/month). Block creation when exhausted.

---

## 4) Data Model (PostgreSQL, Drizzle‑friendly)
... (rest of document remains unchanged)

