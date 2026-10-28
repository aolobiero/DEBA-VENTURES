import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.DEBA_CONFIG;
const supabaseUrl = config?.SUPABASE_URL || config?.supabaseUrl;
const supabaseAnonKey = config?.SUPABASE_ANON_KEY || config?.supabaseAnonKey;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
const setStatus = (element, message, kind = "") => {
  element.textContent = message;
  element.dataset.state = kind;
};

const newsletterForm = document.querySelector("#newsletter-form");
const newsletterStatus = document.querySelector("#newsletter-status");
newsletterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = newsletterForm.querySelector("button");
  if (!supabase) {
    setStatus(newsletterStatus, "Subscription service is unavailable. Please try again later.", "error");
    return;
  }

  button.disabled = true;
  setStatus(newsletterStatus, "Subscribing...");
  const email = String(new FormData(newsletterForm).get("email") || "").trim().toLowerCase();

  try {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });
    if (error) {
      if (error.code === "23505") {
        throw new Error("This email is already subscribed.");
      }
      throw new Error(error.message || "We could not save your subscription.");
    }

    newsletterForm.reset();
    setStatus(newsletterStatus, "Thank you for subscribing!", "success");
  } catch (error) {
    setStatus(newsletterStatus, error.message || "We could not save your subscription. Please try again.", "error");
  } finally {
    button.disabled = false;
  }
});

const rfqForm = document.querySelector("#rfq-form");
const rfqStatus = document.querySelector("#rfq-status");
if (!hasSupabaseConfig) {
  rfqForm.querySelector("button").disabled = true;
  setStatus(rfqStatus, "Request service is unavailable. Please try again later.", "error");
}
rfqForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = rfqForm.querySelector("button");
  if (!supabase) {
    setStatus(rfqStatus, "Request service is unavailable. Please try again later.", "error");
    return;
  }

  button.disabled = true;
  setStatus(rfqStatus, "Submitting your request...");
  const values = Object.fromEntries(new FormData(rfqForm).entries());
  try {
    const { error } = await supabase.schema("public").from("client_requests").insert({
      full_name: values.full_name,
      email_address: values.email,
      company_name: values.company_name,
      phone: values.phone,
      subject: values.subject,
      message: values.message,
      supply_category: values.category
    });
    if (error) {
      throw new Error(error.message || "We could not submit your request.");
    }

    rfqForm.reset();
    setStatus(rfqStatus, "Request received. Our team will contact you shortly.", "success");
  } catch (error) {
    setStatus(rfqStatus, error.message || "We could not submit your request. Please try again.", "error");
  } finally {
    button.disabled = false;
  }
});

const themeToggle = document.querySelector(".theme-toggle");
const savedTheme = document.documentElement.dataset.theme || "light";
if (savedTheme === "dark") document.body.dataset.theme = "dark";
themeToggle.addEventListener("click", () => {
  const isDark = document.body.dataset.theme !== "dark";
  document.body.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeToggle.setAttribute("aria-pressed", String(isDark));
});
