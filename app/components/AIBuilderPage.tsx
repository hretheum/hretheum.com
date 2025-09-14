export default function AIBuilderPage() {
  return (
    <section className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[clamp(2rem,9vw,2.75rem)] md:text-[6rem] font-black mb-8 leading-[1.02] tracking-tight break-words [text-wrap:balance] text-center">
          AI BUILDER
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-purple-400 mb-16 text-center">2022–NOW</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-purple-600 p-8 -mx-6 md:mx-0">
            <h3 className="text-3xl font-black mb-4">HIREVERSE.APP</h3>
            <p className="text-xl">AI that interviews recruiters</p>
          </div>
          
          <div className="bg-gray-800 p-8 -mx-6 md:mx-0">
            <h3 className="text-3xl font-black mb-4">RAG SYSTEM</h3>
            <p className="text-xl">n8n + Pinecone + TypeScript</p>
          </div>
          
          <div className="bg-purple-600 p-8 -mx-6 md:mx-0">
            <h3 className="text-3xl font-black mb-4">MCP SERVER</h3>
            <p className="text-xl">Notion ↔ Confluence</p>
          </div>
        </div>

        <div className="bg-white text-black p-12 text-center -mx-6 md:mx-0">
          <p className="uppercase text-2xl md:text-3xl lg:text-4xl font-black">
            ADVOCATES:<br/>
            SENIOR DESIGNERS SHOULD BUILD, NOT JUST COORDINATE.
          </p>
        </div>
      </div>
    </section>
  );
}