<div align="center">

# ⚡ BOOKING SAAS PLATFORM

**High-Performance Multi-Tenant Booking Engine & API**

*Scalable MERN Architecture • Partial Indexing • Telegram Webhooks • Automated Email Workflows*

[Live Demo Frontend](https://your-vercel-link.vercel.app) • [API Endpoint Status](https://booking-saas-vc0e.onrender.com/health)

</div>

---

## 📐 System Architecture

GitHub автоматически рендерит эту схему взаимодействия сервисов:

```mermaid
graph TD
    Client[📱 React Client / SPA] -->|HTTPS / Axios| API[🚀 Express REST API]
    API -->|Mongoose ODM| DB[(🗄️ MongoDB Atlas)]
    API -->|Async SMTP| Mail[📧 Nodemailer / Email Service]
    API -->|Polling / Webhook| TG[🤖 Telegram Bot API]

    subgraph Auth & Security
        API -->|Bcrypt.js| Hash[Password Hashing]
        API -->|JWT Tokens| Session[Stateless Sessions & Recovery]
    end
