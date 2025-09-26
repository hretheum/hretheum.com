export default function ProfilePage() {
  return (
    <section className="bg-white pt-16 pb-0 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Contact Block */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-8">
              {/* Full-bleed on mobile: offset section padding */}
              <div className="bg-gray-900 text-white p-8 -mx-6 md:mx-0">
                <div className="text-3xl font-black mb-4">ERYK ORŁOWSKI</div>
                <div className="text-xl">Warsaw, Poland • EU CET Remote</div>
              </div>
              <div className="bg-purple-600 text-white p-8 -mx-6 md:mx-0">
                <div className="text-2xl font-black mb-4">REACH ME</div>
                <div className="text-lg">
                  <a
                    href="mailto:eof@offline.pl"
                    data-cta-id="contact_email"
                    data-cta-source="contact"
                    data-cta-variant="secondary"
                    className="underline decoration-transparent hover:decoration-current transition"
                  >
                    eof@offline.pl
                  </a>
                </div>
                <div className="text-lg">
                  <a
                    href="tel:+48535555066"
                    data-cta-id="contact_phone"
                    data-cta-source="contact"
                    data-cta-variant="secondary"
                    className="underline decoration-transparent hover:decoration-current transition"
                  >
                    +48 535 555 066
                  </a>
                </div>
                <div className="text-lg">
                  <a
                    href="https://linkedin.com/in/eofek"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cta-id="contact_linkedin"
                    data-cta-source="contact"
                    data-cta-variant="secondary"
                    className="underline decoration-transparent hover:decoration-current transition"
                  >
                    linkedin.com/in/eofek
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 p-8 -mx-6 md:mx-0 rounded-lg border border-gray-200">
              <div className="text-2xl font-black tracking-tight mb-4">WHAT I DO</div>
              <p className="text-base font-semibold text-neutral-700 mb-4">Design leadership that ships</p>
              <ul className="list-none grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[15px] leading-relaxed text-neutral-800">
                <li>Build and scale high‑performing product design teams (org design, hiring, coaching).</li>
                <li>Ship design systems and platform patterns across products and markets.</li>
                <li>Build AI‑powered workflows and decision support tied to product goals.</li>
                <li>Run an outcomes‑driven cadence: define, measure, iterate, ship.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Philosophy Block */}
        <div className="bg-black text-white p-12 -mx-6 md:mx-0">
          <blockquote className="text-[clamp(1.125rem,6vw,1.75rem)] md:text-[3rem] lg:text-[4rem] font-black text-center leading-tight break-words [text-wrap:balance]">
            WHAT I DO TODAY,<br/>THE INDUSTRY DOES<br/>IN 5 YEARS.
          </blockquote>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-purple-400">2003</div>
              <div className="text-lg">&quot;Why test with users?&quot;<br/>→ Now standard</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-400">2017</div>
              <div className="text-lg">&quot;Design systems will scale&quot;<br/>→ Now industry norm</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-400">2024</div>
              <div className="text-lg">&quot;Designers must code AI&quot;<br/>→ Already building it</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}