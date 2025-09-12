export default function ProfilePage() {
  return (
    <section className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Contact Block */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="bg-gray-900 text-white p-8">
                <div className="text-3xl font-black mb-4">ERYK ORŁOWSKI</div>
                <div className="text-xl">Warsaw, Poland</div>
              </div>
              <div className="bg-purple-600 text-white p-8">
                <div className="text-2xl font-black mb-4">REACH ME</div>
                <div className="text-lg">eof@offline.pl</div>
                <div className="text-lg">+48 535 555 066</div>
                <div className="text-lg">linkedin.com/in/eofek</div>
              </div>
            </div>
            <div className="bg-gray-100 p-8">
              <div className="text-2xl font-black mb-6">WHAT I DO</div>
              <div className="text-lg leading-relaxed">
                Design leader and builder with a unique career arc:<br/>
                • Pioneered usability in Poland (2003)<br/>
                • Built large-scale design systems at ING<br/>
                • Now building AI-powered systems
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy Block */}
        <div className="bg-black text-white p-12">
          <blockquote className="text-[3rem] md:text-[4rem] font-black text-center leading-tight">
            &quot;WHAT I DO TODAY,<br/>THE INDUSTRY DOES<br/>IN 5 YEARS.&quot;
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