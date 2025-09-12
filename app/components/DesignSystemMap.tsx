// DesignSystemMap section component
// Displays an SVG generated from Mermaid located at /public/diagrams/design-system-map.svg
// Styling aligns with the site's visual language (clean white card, subtle border, violet accents)

export default function DesignSystemMap() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 text-center">
          Design System Map
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-10 text-center">
          From base tokens to semantic themes and implementation in components.
        </p>
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-purple-50 to-white p-4 border-b border-gray-200">
            <div className="h-2 w-24 rounded-full bg-purple-600 mx-auto" />
          </div>
          <div className="p-4 md:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/diagrams/design-system-map.svg"
              alt="Design System Map"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
