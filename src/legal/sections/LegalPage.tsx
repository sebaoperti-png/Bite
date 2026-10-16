// Legal page: terms, privacy, cookies, community, GDPR, impressum, accessibility, modern slavery
import { asset } from "../asset";

export function LegalPage() {
  return (
    <>
      <header style={{ position: "sticky", top: "0", zIndex: "50", background: "rgba(250,248,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(107,33,217,0.1)" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="./" style={{ display: "flex", alignItems: "center", gap: "9px", color: "#160a2e" }}>
            <img src={asset("legal/logo.png")} alt="Bite" style={{ width: "32px", height: "32px", borderRadius: "9px", display: "block" }} />
            {" "}
            <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.04em" }}>
              Bite
            </span>
          </a>
          {" "}
          <a href="./" style={{ fontSize: "14px", fontWeight: "700", color: "#6b21d9" }}>
            ← Back to Bite
          </a>
        </div>
      </header>
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "44px 24px 90px", display: "grid", gridTemplateColumns: "230px 1fr", gap: "48px", alignItems: "start" }}>
        {/* TOC */}
        {" "}
        <nav className="lg-toc" style={{ position: "sticky", top: "100px" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", color: "#a091bd", padding: "0 12px 8px" }}>
            {"LEGAL & POLICIES"}
          </div>
          {" "}
          <a href="#terms">
            Terms of Service
          </a>
          {" "}
          <a href="#privacy">
            Privacy Policy
          </a>
          {" "}
          <a href="#cookies">
            Cookie Policy
          </a>
          {" "}
          <a href="#community">
            Community Guidelines
          </a>
          {" "}
          <a href="#gdpr">
            {"Your data & GDPR rights"}
          </a>
          {" "}
          <a href="#impressum">
            Impressum
          </a>
          {" "}
          <a href="#accessibility">
            Accessibility
          </a>
          {" "}
          <a href="#slavery">
            Modern Slavery Statement
          </a>
        </nav>
        {" "}
        <main>
          <div style={{ marginBottom: "38px" }}>
            <h1 style={{ fontSize: "38px", fontWeight: "900", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              {"Legal & policies"}
            </h1>
            {" "}
            <p style={{ fontSize: "15px", color: "#6b5a87", margin: "0" }}>
              Operated by
              {" "}
              <strong>
                Bite — Sebastiano Operti
              </strong>
              , Frankfurt am Main, Germany. Last updated 13 July 2026.
            </p>
            {" "}
            <div style={{ marginTop: "14px", background: "#fef6e7", border: "1px solid #f6dfb0", borderRadius: "12px", padding: "13px 16px", fontSize: "13.5px", color: "#7a5a12" }}>
              These documents are drafted to meet EU/German requirements (GDPR, DSGVO, DDG/TMG). Placeholders marked
              {" "}
              <strong>
                […]
              </strong>
              {" "}
              must be completed and reviewed by qualified legal counsel before go-live.
            </div>
          </div>
          {" "}
          {/* TERMS */}
          {" "}
          <section className="lg-sec" id="terms" style={{ marginBottom: "56px" }}>
            <h2>
              Terms of Service
            </h2>
            {" "}
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              Effective 13 July 2026
            </p>
            {" "}
            <h3>
              {"1. Who we are & what Bite is"}
            </h3>
            {" "}
            <p>
              Bite is an online marketplace operated by Bite GmbH ("Bite", "we", "us") that connects people who cook at home ("Hosts") with people who want to buy, share or learn to cook a meal ("Guests"). Bite provides the platform only.
              {" "}
              <strong>
                We are not the producer, seller, or supplier of any meal.
              </strong>
              {" "}
              Contracts for a meal are formed directly between the Host and the Guest.
            </p>
            {" "}
            <h3>
              {"2. Eligibility & accounts"}
            </h3>
            {" "}
            <p>
              You must be at least 18 years old and able to enter a binding contract to use Bite. You are responsible for the accuracy of your account information and for all activity under your account. Keep your credentials secure and notify us of any unauthorised use.
            </p>
            {" "}
            <h3>
              3. Host responsibilities
            </h3>
            {" "}
            <ul>
              <li>
                Prepare food in hygienic conditions and comply with all applicable food-safety, hygiene and labelling laws (incl. Regulation (EU) No 1169/2011 and the German LFGB).
              </li>
              {" "}
              <li>
                Accurately declare ingredients, the 14 major allergens, and dietary information for every listing.
              </li>
              {" "}
              <li>
                Hold any registrations, permits or insurance required for your activity, and declare and pay any taxes due on your earnings.
              </li>
              {" "}
              <li>
                Only list meals you are genuinely able and licensed to provide.
              </li>
            </ul>
            {" "}
            <h3>
              4. Guest responsibilities
            </h3>
            {" "}
            <p>
              Provide accurate information, communicate allergies or dietary needs to the Host before booking, attend or cancel bookings responsibly, and treat Hosts and their homes with respect.
            </p>
            {" "}
            <h3>
              {"5. Bookings, prices & payments"}
            </h3>
            {" "}
            <p>
              Prices are set by Hosts and shown inclusive of applicable taxes where required. All payments are processed in-app through our payment service provider;
              {" "}
              <strong>
                off-platform or cash payments are prohibited.
              </strong>
              {" "}
              A guest service fee may apply and is shown before you pay. Bite retains a platform commission from each booking; Hosts receive the remainder via automatic weekly payout.
            </p>
            {" "}
            <h3>
              {"6. Cancellations & refunds"}
            </h3>
            {" "}
            <ul>
              <li>
                <strong>
                  Host cancels:
                </strong>
                {" "}
                the Guest receives a full refund automatically.
              </li>
              {" "}
              <li>
                <strong>
                  {"Guest cancels > 24h before:"}
                </strong>
                {" "}
                full refund.
              </li>
              {" "}
              <li>
                <strong>
                  {"Guest cancels < 24h before:"}
                </strong>
                {" "}
                the service fee may be non-refundable.
              </li>
              {" "}
              <li>
                Because meals are perishable/personalised, the statutory right of withdrawal for distance contracts may not apply once preparation has begun (§ 312g (2) BGB).
              </li>
            </ul>
            {" "}
            <h3>
              {"7. Reviews & content"}
            </h3>
            {" "}
            <p>
              You grant Bite a non-exclusive, worldwide, royalty-free licence to host and display content you submit (listings, photos, reviews, messages) for the purpose of operating the service. Content must be truthful, lawful and your own. We may remove content that breaches these Terms or our Community Guidelines.
            </p>
            {" "}
            <h3>
              8. Prohibited conduct
            </h3>
            {" "}
            <p>
              No illegal, unsafe, fraudulent, discriminatory, harassing or off-platform activity; no misrepresentation of food, ingredients or identity; no circumvention of fees. Breach may lead to immediate suspension.
            </p>
            {" "}
            <h3>
              9. Liability
            </h3>
            {" "}
            <p>
              Bite is liable without limitation for intent and gross negligence and under the German Product Liability Act, and for injury to life, body or health. For slight negligence we are liable only for breach of a material contractual obligation, limited to foreseeable, typical damage. As Bite is an intermediary, it is not liable for the quality, safety or legality of meals provided by Hosts, which is the Host's responsibility.
            </p>
            {" "}
            <h3>
              {"10. Term, termination & changes"}
            </h3>
            {" "}
            <p>
              You may close your account at any time. We may suspend or terminate access for breach of these Terms. We may amend these Terms with reasonable notice; continued use after the effective date constitutes acceptance.
            </p>
            {" "}
            <h3>
              {"11. Governing law & disputes"}
            </h3>
            {" "}
            <p>
              These Terms are governed by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods. Mandatory consumer-protection provisions of your country of residence remain unaffected. The EU Online Dispute Resolution platform is available at
              {" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">
                ec.europa.eu/consumers/odr
              </a>
              . We are neither obliged nor willing to participate in dispute-resolution proceedings before a consumer arbitration board.
            </p>
          </section>
          {" "}
          {/* PRIVACY */}
          {" "}
          <section className="lg-sec" id="privacy" style={{ marginBottom: "56px" }}>
            <h2>
              Privacy Policy
            </h2>
            {" "}
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              {"In accordance with Art. 13 & 14 GDPR · Effective 13 July 2026"}
            </p>
            {" "}
            <h3>
              {"1. Controller & Data Protection Officer"}
            </h3>
            {" "}
            <p>
              {"Controller: Bite GmbH, [street & number], Frankfurt am Main, Germany. Email: "}
              <a href="mailto:privacy@bite.food">
                privacy@bite.food
              </a>
              . You can reach our Data Protection Officer at
              {" "}
              <a href="mailto:dpo@bite.food">
                dpo@bite.food
              </a>
              .
            </p>
            {" "}
            <h3>
              2. Categories of data we process
            </h3>
            {" "}
            <ul>
              <li>
                <strong>
                  {"Account & profile:"}
                </strong>
                {" "}
                name, email, phone, password, photo, role (host/guest), city.
              </li>
              {" "}
              <li>
                <strong>
                  Verification:
                </strong>
                {" "}
                ID documents and video-verification data for Hosts.
              </li>
              {" "}
              <li>
                <strong>
                  {"Listings & bookings:"}
                </strong>
                {" "}
                menus, allergens, prices, reservations, attendance.
              </li>
              {" "}
              <li>
                <strong>
                  Payments:
                </strong>
                {" "}
                processed by our payment provider; we store transaction metadata, not full card numbers.
              </li>
              {" "}
              <li>
                <strong>
                  Communications:
                </strong>
                {" "}
                in-app messages, support requests, reviews.
              </li>
              {" "}
              <li>
                <strong>
                  {"Technical & usage:"}
                </strong>
                {" "}
                device, IP, app interactions, cookies/identifiers.
              </li>
              {" "}
              <li>
                <strong>
                  Location:
                </strong>
                {" "}
                approximate location to show nearby meals (with your permission).
              </li>
            </ul>
            {" "}
            <h3>
              {"3. Purposes & legal bases"}
            </h3>
            {" "}
            <ul>
              <li>
                Providing the service and performing your contract —
                {" "}
                <strong>
                  Art. 6(1)(b) GDPR
                </strong>
                .
              </li>
              {" "}
              <li>
                Safety, fraud prevention, service improvement and analytics —
                {" "}
                <strong>
                  Art. 6(1)(f)
                </strong>
                {" "}
                (legitimate interests).
              </li>
              {" "}
              <li>
                Optional cookies, marketing and precise location —
                {" "}
                <strong>
                  Art. 6(1)(a)
                </strong>
                {" "}
                (consent).
              </li>
              {" "}
              <li>
                Legal, tax and accounting obligations —
                {" "}
                <strong>
                  Art. 6(1)(c)
                </strong>
                .
              </li>
            </ul>
            {" "}
            <h3>
              {"4. Recipients & processors"}
            </h3>
            {" "}
            <p>
              We share data only as needed with: our payment service provider, cloud hosting and infrastructure providers, communication/notification tools, and analytics providers — each bound by a data-processing agreement under Art. 28 GDPR. Between users, Hosts and Guests see the profile and booking information necessary to arrange a meal.
            </p>
            {" "}
            <h3>
              5. International transfers
            </h3>
            {" "}
            <p>
              Where a processor is outside the EU/EEA, transfers are safeguarded by an EU adequacy decision or the EU Standard Contractual Clauses with additional safeguards.
            </p>
            {" "}
            <h3>
              6. Retention
            </h3>
            {" "}
            <p>
              We keep personal data only as long as necessary for the purposes above: account data for the life of your account, and afterwards only as required by statutory retention periods (e.g. up to 10 years for invoices under German commercial and tax law). Verification documents are deleted once no longer required.
            </p>
            {" "}
            <h3>
              7. Your rights
            </h3>
            {" "}
            <p>
              You have the right to access (Art. 15), rectification (16), erasure (17), restriction (18), data portability (20) and objection (21), and to withdraw consent at any time (7(3)) without affecting prior processing. To exercise them, contact
              {" "}
              <a href="mailto:privacy@bite.food">
                privacy@bite.food
              </a>
              . You may also lodge a complaint with a supervisory authority — for us, the Hessian Commissioner for Data Protection and Freedom of Information (HBDI), Wiesbaden.
            </p>
            {" "}
            <h3>
              {"8. Automated decisions & children"}
            </h3>
            {" "}
            <p>
              We do not use solely automated decision-making with legal effect under Art. 22 GDPR. Bite is not directed at persons under 18 and we do not knowingly collect their data.
            </p>
            {" "}
            <h3>
              9. Changes
            </h3>
            {" "}
            <p>
              We will post any changes here and, for material changes, notify you in-app or by email.
            </p>
          </section>
          {" "}
          {/* COOKIES */}
          {" "}
          <section className="lg-sec" id="cookies" style={{ marginBottom: "56px" }}>
            <h2>
              Cookie Policy
            </h2>
            {" "}
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              {"Under the German TDDDG (§ 25) & GDPR · Effective 13 July 2026"}
            </p>
            {" "}
            <h3>
              1. What cookies are
            </h3>
            {" "}
            <p>
              Cookies and similar technologies (local storage, SDK identifiers) store small amounts of data on your device to make the service work and to understand how it is used.
            </p>
            {" "}
            <h3>
              2. Categories we use
            </h3>
            {" "}
            <ul>
              <li>
                <strong>
                  Strictly necessary
                </strong>
                {" "}
                — sign-in, security, load-balancing, saving your session and app state. Always active; no consent required.
              </li>
              {" "}
              <li>
                <strong>
                  Functional
                </strong>
                {" "}
                — remembering preferences such as city, language and filters.
              </li>
              {" "}
              <li>
                <strong>
                  Analytics
                </strong>
                {" "}
                — aggregated, privacy-respecting usage statistics to improve Bite.
              </li>
              {" "}
              <li>
                <strong>
                  Marketing
                </strong>
                {" "}
                — measuring campaigns and showing relevant offers.
              </li>
            </ul>
            {" "}
            <p>
              Functional, analytics and marketing cookies are only set with your consent.
            </p>
            {" "}
            <h3>
              3. Managing consent
            </h3>
            {" "}
            <p>
              You choose your preferences in the cookie banner on first visit and can change them anytime via
              {" "}
              <strong>
                Cookie settings
              </strong>
              {" "}
              in the footer, or by clearing cookies in your browser. Withdrawing consent does not affect the lawfulness of prior processing.
            </p>
          </section>
          {" "}
          {/* COMMUNITY */}
          {" "}
          <section className="lg-sec" id="community" style={{ marginBottom: "56px" }}>
            <h2>
              Community Guidelines
            </h2>
            {" "}
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              The house rules that keep Bite safe and warm
            </p>
            {" "}
            <ul>
              <li>
                <strong>
                  Be honest.
                </strong>
                {" "}
                List meals accurately, including ingredients and all 14 major allergens. Never misrepresent what you're serving.
              </li>
              {" "}
              <li>
                <strong>
                  Be safe.
                </strong>
                {" "}
                Follow food-hygiene best practice. Host group meals; never pressure anyone into an unsafe situation.
              </li>
              {" "}
              <li>
                <strong>
                  Be respectful.
                </strong>
                {" "}
                No discrimination, harassment or hate based on race, ethnicity, religion, gender, sexual orientation, disability or age.
              </li>
              {" "}
              <li>
                <strong>
                  Keep it on Bite.
                </strong>
                {" "}
                Communicate and pay only through the app so everyone is protected.
              </li>
              {" "}
              <li>
                <strong>
                  Protect privacy.
                </strong>
                {" "}
                Don't share another person's data or photos without consent.
              </li>
              {" "}
              <li>
                <strong>
                  Report concerns.
                </strong>
                {" "}
                Use in-app reporting or
                {" "}
                <a href="mailto:safety@bite.food">
                  safety@bite.food
                </a>
                . We review every report.
              </li>
            </ul>
            {" "}
            <p style={{ marginTop: "16px", fontWeight: "700", color: "#6b21d9" }}>
              One trust violation can lead to immediate and permanent suspension.
            </p>
          </section>
          {" "}
          {/* GDPR RIGHTS */}
          {" "}
          <section className="lg-sec" id="gdpr" style={{ marginBottom: "56px" }}>
            <h2>
              {"Your data & GDPR rights"}
            </h2>
            {" "}
            <p>
              You are in control of your personal data. Here's how to exercise your rights under the GDPR.
            </p>
            {" "}
            <h3>
              How to make a request
            </h3>
            {" "}
            <p>
              Email
              {" "}
              <a href="mailto:privacy@bite.food">
                privacy@bite.food
              </a>
              {" "}
              from your registered address, or use "Download my data" / "Delete my account" in the app settings. We may ask you to verify your identity to protect your account.
            </p>
            {" "}
            <h3>
              What you can request
            </h3>
            {" "}
            <ul>
              <li>
                {"A copy of the personal data we hold about you (data access & portability)."}
              </li>
              {" "}
              <li>
                Correction of inaccurate data.
              </li>
              {" "}
              <li>
                Deletion of your data ("right to be forgotten"), subject to statutory retention duties.
              </li>
              {" "}
              <li>
                Restriction of, or objection to, certain processing.
              </li>
              {" "}
              <li>
                Withdrawal of any consent you previously gave.
              </li>
            </ul>
            {" "}
            <h3>
              Our response time
            </h3>
            {" "}
            <p>
              We respond within one month of a verified request, extendable by two further months for complex requests, in which case we will inform you. Our service is free unless a request is manifestly unfounded or excessive.
            </p>
            {" "}
            <h3>
              Complaints
            </h3>
            {" "}
            <p>
              You may complain to your local data-protection authority. Our lead authority is the Hessian Commissioner for Data Protection and Freedom of Information (HBDI), Wiesbaden, Germany.
            </p>
          </section>
          {" "}
          {/* IMPRESSUM */}
          {" "}
          <section className="lg-sec" id="impressum" style={{ marginBottom: "56px" }}>
            <h2>
              Impressum
            </h2>
            {" "}
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              Information pursuant to § 5 DDG
            </p>
            {" "}
            <p style={{ marginTop: "14px" }}>
              <strong>
                Bite — Sebastiano Operti
              </strong>
              <br />
              {" [Street & number]"}
              <br />
              {" "}
              60311 Frankfurt am Main
              <br />
              {" "}
              Germany
              {" "}
            </p>
            {" "}
            <h3>
              Represented by
            </h3>
            {" "}
            <p>
              Sebastiano Operti, Founder
            </p>
            {" "}
            <h3>
              Contact
            </h3>
            {" "}
            <p>
              Email:
              {" "}
              <a href="mailto:sebaoperti@gmail.com">
                sebaoperti@gmail.com
              </a>
            </p>
            {" "}
            <h3>
              Register entry
            </h3>
            {" "}
            <p>
              Bite is an early-stage project and is not yet registered as a company. Register and VAT details will be added once it is.
            </p>
            {" "}
            <h3>
              Responsible for content pursuant to § 18 (2) MStV
            </h3>
            {" "}
            <p>
              Sebastiano Operti, address as above
            </p>
            {" "}
            <h3>
              EU dispute resolution
            </h3>
            {" "}
            <p>
              European Commission Online Dispute Resolution platform:
              {" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">
                ec.europa.eu/consumers/odr
              </a>
              . We are not obliged or willing to participate in dispute-resolution proceedings before a consumer arbitration board.
            </p>
          </section>
          {" "}
          {/* ACCESSIBILITY */}
          {" "}
          <section className="lg-sec" id="accessibility" style={{ marginBottom: "56px" }}>
            <h2>
              Accessibility Statement
            </h2>
            {" "}
            <p>
              Bite is committed to making our app and website usable by everyone, including people with disabilities.
            </p>
            {" "}
            <h3>
              Our standard
            </h3>
            {" "}
            <p>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and to align with the European Accessibility Act. We test with keyboard navigation, sufficient colour contrast, scalable text and screen-reader compatibility, and we work to improve continuously.
            </p>
            {" "}
            <h3>
              Feedback
            </h3>
            {" "}
            <p>
              If you encounter a barrier, please tell us at
              {" "}
              <a href="mailto:accessibility@bite.food">
                accessibility@bite.food
              </a>
              {" "}
              and we will respond promptly and work to resolve it.
            </p>
          </section>
          {" "}
          {/* MODERN SLAVERY */}
          {" "}
          <section className="lg-sec" id="slavery" style={{ marginBottom: "20px" }}>
            <h2>
              Modern Slavery Statement
            </h2>
            {" "}
            <p>
              Bite has zero tolerance for modern slavery, forced labour and human trafficking in our operations and supply chain.
            </p>
            {" "}
            <h3>
              Our commitment
            </h3>
            {" "}
            <p>
              We expect everyone we work with — employees, contractors and partners — to uphold the same standards. Our Community Guidelines and Terms prohibit exploitative or unlawful conduct, and we act on any credible report. As we grow, we will formalise supplier due-diligence and staff training.
            </p>
            {" "}
            <h3>
              Reporting concerns
            </h3>
            {" "}
            <p>
              Report any concern confidentially to
              {" "}
              <a href="mailto:ethics@bite.food">
                ethics@bite.food
              </a>
              .
            </p>
          </section>
          {" "}
          <p style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(107,33,217,0.1)", fontSize: "13px", color: "#8a7aa8" }}>
            © 2026 Bite GmbH · Frankfurt am Main, Germany. These policies are provided in good faith and should be reviewed by legal counsel for your final launch jurisdiction.
          </p>
        </main>
      </div>
    </>
  );
}
