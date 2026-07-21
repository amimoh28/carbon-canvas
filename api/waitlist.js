const DEFAULT_WAITLIST_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzh3SPNO03Xj2jwPxKIbDDRe6P_LdOYKxq5gu_malOHcNBxlcHU-MxLIsRcFVr5JxG09w/exec";

const ALLOWED_AGES = new Set([
  "Under 18",
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55+",
]);

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function json(response, status, payload) {
  response.status(status);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.send(JSON.stringify(payload));
}

function getClientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return request.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function upstreamLooksBroken(bodyText) {
  const normalized = bodyText.toLowerCase();
  return [
    "script function not found",
    "authorization is required",
    "access denied",
    "unable to open the file",
    "page not found",
    "exception:",
  ].some((phrase) => normalized.includes(phrase));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { ok: false, error: "method_not_allowed" });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return json(response, 429, {
      ok: false,
      error: "rate_limited",
      message: "Too many attempts. Please try again in 15 minutes.",
    });
  }

  const body = request.body && typeof request.body === "object" ? request.body : {};
  const name = clean(body.name, 100);
  const age = clean(body.age, 20);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const source = clean(body.source || "carboncanvas.live/waitlist", 120);
  const companyWebsite = clean(body.companyWebsite, 200);

  // Honeypot: bots receive a normal-looking response without reaching the sheet.
  if (companyWebsite) {
    return json(response, 200, { ok: true });
  }

  if (!name) {
    return json(response, 400, { ok: false, message: "Please add your name." });
  }
  if (!ALLOWED_AGES.has(age)) {
    return json(response, 400, { ok: false, message: "Please choose an age group." });
  }
  if (!email && !phone) {
    return json(response, 400, {
      ok: false,
      message: "Please add an email address or phone number.",
    });
  }
  if (email && !looksLikeEmail(email)) {
    return json(response, 400, {
      ok: false,
      message: "Please enter a valid email address.",
    });
  }

  const endpoint = process.env.WAITLIST_APPS_SCRIPT_URL || DEFAULT_WAITLIST_ENDPOINT;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const payload = new URLSearchParams({
      timestamp: new Date().toISOString(),
      name,
      age,
      email,
      phone,
      source,
      userAgent: clean(request.headers["user-agent"], 300),
    });

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: payload.toString(),
      redirect: "follow",
      signal: controller.signal,
    });

    const responseText = (await upstream.text()).trim();
    let upstreamJson = null;
    try {
      upstreamJson = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Older Apps Script deployments may return plain text. HTTP status and
      // known Google error pages are checked below.
    }

    if (
      !upstream.ok ||
      upstreamLooksBroken(responseText) ||
      (upstreamJson && upstreamJson.ok === false)
    ) {
      console.error("Waitlist upstream rejected submission", {
        status: upstream.status,
        response: responseText.slice(0, 500),
      });
      return json(response, 502, {
        ok: false,
        error: "upstream_failed",
        message: "We could not save your signup. Please try again shortly.",
      });
    }

    return json(response, 200, { ok: true });
  } catch (error) {
    console.error("Waitlist submission failed", error);
    return json(response, 502, {
      ok: false,
      error: "submission_failed",
      message: "We could not save your signup. Please try again shortly.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
