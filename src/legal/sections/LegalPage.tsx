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
          <a href="#survey">
            {"Survey, interviews & newsletter"}
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
              {"Controller: Bite — Sebastiano Operti (Bite is not yet a registered company), address as in the Impressum. Email: "}
              <a href="mailto:sebaoperti@gmail.com">
                sebaoperti@gmail.com
              </a>
              . A Data Protection Officer is not required at this stage (§ 38 BDSG); for any privacy question, write to the email above.
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
              <a href="mailto:sebaoperti@gmail.com">
                sebaoperti@gmail.com
              </a>
              . You may also lodge a complaint with a data protection supervisory authority, in particular in the EU country where you live or work (Art. 77 GDPR).
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
          {/* SURVEY, INTERVIEWS & NEWSLETTER */}
          <section className="lg-sec" id="survey" style={{ marginBottom: "56px" }}>
            <h2>
              {"Survey, interviews & newsletter"}
            </h2>
            <p style={{ color: "#8a7aa8", fontSize: "13px", margin: "0" }}>
              {"Information under Art. 13 GDPR · Effective 20 October 2026 · Deutsche Fassung unten"}
            </p>
            <h3>
              {"1. What this covers"}
            </h3>
            <p>
              {"This section covers the 60-second survey (stand.html, also used on a tablet at events such as the Aalener Industriemesse), the optional follow-up interview and the Bite newsletter, including the “Save me a seat” form on the home page. Bite is in an early, non-commercial feedback phase."}
            </p>
            <h3>
              {"2. Who is responsible"}
            </h3>
            <p>
              {"Sebastiano Operti, founder of Bite (no company registered yet), address as in the Impressum. Email: sebaoperti@gmail.com."}
            </p>
            <h3>
              {"3. The survey (anonymous)"}
            </h3>
            <p>
              {"The survey does not ask for your name. We store your answers (for example your group and age range, how often you eat alone and what you would pay per plate), the time, the language and whether you answered on the stand tablet or your own phone. Without an email address these answers cannot be linked to you and are used only, in aggregate, to develop Bite and for applications to start-up programmes (for example EXIST). The live results screen at the stand only shows totals and percentages, never emails."}
            </p>
            <h3>
              {"4. Interview (optional, with consent)"}
            </h3>
            <p>
              {"If you tick the interview box and enter your email, Sebastiano Operti may email you once or twice to arrange a 15-minute interview (in person or online) about how you eat. Legal basis: your consent, Art. 6(1)(a) GDPR. Your email is stored together with your survey answers and deleted once the interviews are done, at the latest 12 months after you gave it. Interview notes are kept without your name."}
            </p>
            <h3>
              {"5. Newsletter (optional, with consent and double opt-in)"}
            </h3>
            <p>
              {"If you tick the newsletter box (survey) or use “Save me a seat” (home page), we send you news about Bite by email, at most once a month: launch news, events and ways to take part. Legal basis: your consent, Art. 6(1)(a) GDPR and § 7(2) no. 2 UWG. You first receive an email with a confirmation link; nothing else is sent until you click it (double opt-in). To prove your consent we store the time of sign-up, the time of confirmation and the version of the consent text you saw. Unconfirmed sign-ups are deleted after 30 days. Every email has an unsubscribe link; after unsubscribing we keep only the fact that you withdrew, so we don't contact you again."}
            </p>
            <h3>
              {"6. Where the data is stored"}
            </h3>
            <p>
              {"Answers and emails are stored in a Google Sheet in Sebastiano Operti's Google account and the confirmation emails are sent through Gmail (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland). Google may process data in the USA; Google LLC is certified under the EU-U.S. Data Privacy Framework (EU adequacy decision of 10 July 2023, Art. 45 GDPR). When the survey runs on the stand tablet, answers are also kept on that device until they are uploaded and the device is cleared after the event. The website is hosted on GitHub Pages (GitHub Inc., USA, also certified under the Data Privacy Framework), which processes your IP address to deliver the pages (Art. 6(1)(f) GDPR)."}
            </p>
            <h3>
              {"7. Age"}
            </h3>
            <p>
              {"Please give your email only if you are at least 16 years old (Art. 8 GDPR)."}
            </p>
            <h3>
              {"8. Your rights"}
            </h3>
            <p>
              {"You can withdraw any consent at any time without giving a reason, by email to sebaoperti@gmail.com or with the unsubscribe link; this does not affect processing before the withdrawal (Art. 7(3) GDPR). You also have the rights of access, rectification, erasure, restriction, data portability and objection (Art. 15 to 21 GDPR), and the right to complain to a data protection supervisory authority (Art. 77 GDPR). Giving your email is voluntary; you can take the survey without it."}
            </p>
            <h2 style={{ marginTop: "36px" }} lang="de">
              {"Umfrage, Interviews & Newsletter"}
            </h2>
            <div lang="de">
            <h3>
              {"1. Worum es geht"}
            </h3>
            <p>
              {"Dieser Abschnitt gilt für die 60-Sekunden-Umfrage (stand.html, auch auf einem Tablet bei Veranstaltungen wie der Aalener Industriemesse), das optionale Folge-Interview und den Bite-Newsletter, einschließlich des Formulars „Save me a seat“ auf der Startseite. Bite befindet sich in einer frühen, nicht kommerziellen Feedback-Phase."}
            </p>
            <h3>
              {"2. Verantwortlicher"}
            </h3>
            <p>
              {"Sebastiano Operti, Gründer von Bite (noch keine Gesellschaft eingetragen), Anschrift wie im Impressum. E-Mail: sebaoperti@gmail.com."}
            </p>
            <h3>
              {"3. Die Umfrage (anonym)"}
            </h3>
            <p>
              {"Die Umfrage fragt nicht nach deinem Namen. Wir speichern deine Antworten (z. B. Gruppe und Altersgruppe, wie oft du allein isst, was du pro Teller zahlen würdest), den Zeitpunkt, die Sprache und ob du am Stand-Tablet oder am eigenen Handy geantwortet hast. Ohne E-Mail-Adresse lassen sich die Antworten dir nicht zuordnen; sie werden nur zusammengefasst ausgewertet, um Bite zu entwickeln und für Bewerbungen bei Gründungsprogrammen (z. B. EXIST). Der Live-Ergebnisbildschirm am Stand zeigt nur Summen und Prozente, nie E-Mails."}
            </p>
            <h3>
              {"4. Interview (optional, mit Einwilligung)"}
            </h3>
            <p>
              {"Wenn du den Interview-Haken setzt und deine E-Mail angibst, darf Sebastiano Operti dir ein- bis zweimal schreiben, um ein 15-minütiges Interview (vor Ort oder online) darüber zu vereinbaren, wie du isst. Rechtsgrundlage: deine Einwilligung, Art. 6 Abs. 1 lit. a DSGVO. Deine E-Mail wird zusammen mit deinen Antworten gespeichert und gelöscht, sobald die Interviews abgeschlossen sind, spätestens 12 Monate nach der Angabe. Interviewnotizen werden ohne Namen geführt."}
            </p>
            <h3>
              {"5. Newsletter (optional, mit Einwilligung und Double-Opt-in)"}
            </h3>
            <p>
              {"Wenn du den Newsletter-Haken setzt (Umfrage) oder „Save me a seat“ nutzt (Startseite), schicken wir dir höchstens einmal im Monat Neuigkeiten über Bite per E-Mail: Start, Veranstaltungen und Möglichkeiten mitzumachen. Rechtsgrundlage: deine Einwilligung, Art. 6 Abs. 1 lit. a DSGVO und § 7 Abs. 2 Nr. 2 UWG. Zuerst erhältst du eine E-Mail mit Bestätigungslink; erst nach dem Klick senden wir weitere E-Mails (Double-Opt-in). Zum Nachweis der Einwilligung speichern wir den Zeitpunkt der Anmeldung, den Zeitpunkt der Bestätigung und die Version des Einwilligungstextes. Nicht bestätigte Anmeldungen werden nach 30 Tagen gelöscht. Jede E-Mail enthält einen Abmeldelink; nach der Abmeldung speichern wir nur den Widerruf, damit wir dich nicht erneut kontaktieren."}
            </p>
            <h3>
              {"6. Wo die Daten gespeichert werden"}
            </h3>
            <p>
              {"Antworten und E-Mails werden in einer Google-Tabelle im Google-Konto von Sebastiano Operti gespeichert, die Bestätigungs-E-Mails werden über Gmail versendet (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Google kann Daten in den USA verarbeiten; die Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss der EU vom 10. Juli 2023, Art. 45 DSGVO). Läuft die Umfrage auf dem Stand-Tablet, bleiben die Antworten bis zum Hochladen auch auf dem Gerät; nach der Veranstaltung wird es geleert. Die Website wird über GitHub Pages bereitgestellt (GitHub Inc., USA, ebenfalls nach dem Data Privacy Framework zertifiziert), das deine IP-Adresse zur Auslieferung der Seiten verarbeitet (Art. 6 Abs. 1 lit. f DSGVO)."}
            </p>
            <h3>
              {"7. Alter"}
            </h3>
            <p>
              {"Bitte gib deine E-Mail nur an, wenn du mindestens 16 Jahre alt bist (Art. 8 DSGVO)."}
            </p>
            <h3>
              {"8. Deine Rechte"}
            </h3>
            <p>
              {"Du kannst jede Einwilligung jederzeit ohne Angabe von Gründen widerrufen, per E-Mail an sebaoperti@gmail.com oder über den Abmeldelink; die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt (Art. 7 Abs. 3 DSGVO). Außerdem hast du das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO). Die Angabe deiner E-Mail ist freiwillig; die Umfrage funktioniert auch ohne."}
            </p>
            </div>
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
