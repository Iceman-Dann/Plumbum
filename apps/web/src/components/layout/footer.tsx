export function Footer() {
  return (
    <footer className="bg-[#0F0F0D] text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">Investigating America's Infrastructure</h3>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              Plumbum is a civic journalism tool designed to make invisible infrastructure risks visible. 
              We aggregate public datasets, census data, and municipal records to estimate the likelihood 
              of lead service lines in residential properties.
            </p>
          </div>
          <div className="md:text-right flex flex-col md:items-end justify-center gap-4">
            <a href="#" className="underline underline-offset-4 hover:text-gray-300 transition-colors" data-testid="footer-link-methodology">Methodology & Data Sources</a>
            <a href="#" className="underline underline-offset-4 hover:text-gray-300 transition-colors" data-testid="footer-link-press">Press Inquiries</a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Plumbum Project. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
