'use strict';

import http from "http"
import * as crypto from "crypto";
import { build } from "./build.js"

const PORT = 8081;
const WEBHOOK_SECRET = 'houchi_secret';

const verify_signature = (data, hash) => {
  try{
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(data)
      .digest("hex");
    let trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    let untrusted = Buffer.from(hash, 'ascii');
    return crypto.timingSafeEqual(trusted, untrusted);
  
  }catch(e){
    console.error("error: verify_sigunature")
    return false
  }
};

const handleWebhook = (req, res) => {
  let chunks = [];
  req.on("data", (data) => {
    chunks.push(data)
  })
  req.on("end", () => {
    const data = Buffer.concat(chunks).toString()
    const ok = verify_signature(data, req.headers["x-hub-signature-256"] ?? "")
    if(ok){
      const _ = build() // no wait
    }
    res.writeHead(200, {
	    "Content-Type": "application/json"
    });
    res.end(JSON.stringify({status: ok ? "ok" : "invalid"}));
  })
};

http
  .createServer(handleWebhook)
  .listen(PORT);
