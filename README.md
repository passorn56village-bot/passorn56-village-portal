# Passorn 56 Village Portal

Frontend Starter สำหรับระบบสมาชิกหมู่บ้านภัสสร 56

## Technology

- Cloudflare Pages
- HTML / CSS / Vanilla JavaScript
- LINE Login
- Google Apps Script API
- Google Sheets
- Google Drive

## Deploy ครั้งแรก

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้เข้า GitHub Repository
2. ใน Cloudflare Pages ตั้งค่า:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: เว้นว่าง
   - Build output directory: `/`
3. กด Save and Deploy

## ทดสอบหน้าเว็บ

กดปุ่ม **ทดลองหน้า Dashboard** โดยยังไม่ต้องตั้งค่า LINE Login

## ตั้งค่า LINE Login ภายหลัง

แก้ไฟล์:

`assets/js/config.js`

ใส่:

- `line.channelId`
- `apiBaseUrl`

ห้ามใส่ LINE Channel Secret ใน Frontend

## สถาปัตยกรรม

Browser → Cloudflare Pages → Apps Script API → Google Sheets / Google Drive / LINE API

การแลก LINE authorization code เป็น access token ต้องทำที่ Apps Script Backend เท่านั้น
