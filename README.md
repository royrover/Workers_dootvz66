# Workers_007

## การสร้าง Repository บน GitHub

1. ไปที่ [github.com/new](https://github.com/new)
2. ตั้งชื่อ repo ว่า `Workers_dootvz66`
3. เลือก **Private** (หรือ Public แล้วแต่ต้องการ)
4. **อย่า** ติ๊ก Initialize README
5. กด **Create repository**

รันคำสั่งนี้ในโฟลเดอร์ `Workers_dootvz66`:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<username>/Workers_dootvz66.git
git push -u origin main
```

แล้วอย่าลืมเพิ่ม Secret ใน repo ครับ:
**Settings → Secrets and variables → Actions → New repository secret**

- Name: `CLOUDFLARE_API_TOKEN`
- Value: (ใส่ token ของคุณ)

พอ push ขึ้นไปแล้ว GitHub Actions จะ deploy อัตโนมัติเลยครับ

---

Cloudflare Workers สำหรับ IPTV Proxy — มี 2 กลุ่ม คือ สายหลัก (NUTV) และ สายดูบอล (Dooball66)

---

## โครงสร้างไฟล์

```
Workers_dootvz66/
├── src/
│   ├── index.js        ← สายหลัก (NUTV)
│   └── db66.js         ← สายดูบอล (Dooball66)
├── wrangler.toml
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Workers ที่ Deploy

| Worker Name | สาย | env key |
|---|---|---|
| dootvz-worker-01 | สายหลัก | (default) |
| dootvz-worker-02 | สายหลัก | `dootvz-worker_02` |
| dootvz-worker-03 | สายหลัก | `dootvz-worker_03` |
| dootvz66-worker-01 | สายดูบอล | `dootvz66_01` |
| dootvz66-worker-02 | สายดูบอล | `dootvz66_02` |
| dootvz66-worker-03 | สายดูบอล | `dootvz66_03` |

---

## การตั้งค่าก่อน Deploy

### 1. สร้าง Cloudflare API Token
- ไปที่ https://dash.cloudflare.com/profile/api-tokens
- กด **Create Token**
- เลือก Permission: **Workers Scripts → Edit**
- เลือก Permission: **Account Analytics → Read**
- กด **Create Token** แล้ว copy token ที่ได้

### 2. เพิ่ม Secret ใน GitHub
ไปที่ **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | ใส่ token จากขั้นตอนที่ 1 |

---

## การ Deploy

Push code ขึ้น branch `main` แล้ว GitHub Actions จะ deploy อัตโนมัติทั้ง 6 workers ครับ

```bash
git add .
git commit -m "update"
git push origin main
```
